require("dotenv").config();

const { resolve } = require("node:path");
const { readFile } = require("node:fs/promises");
const express = require("express");
const axios = require("axios").default || require("axios"); // TODO: https://github.com/axios/axios/issues/5011
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const passport = require("passport");
// ---
const errorHandler = require("./utilities/errorHandler");
const log = require("./utilities/logger");
const samlStrategy = require("./config/samlStrategy");
const { s3BucketUrl } = require("./config/s3");
const { protectClientRoutes, checkClientRouteExists } = require("./middleware");
const routes = require("./routes");

const { NODE_ENV, PORT, CLIENT_URL, SERVER_BASE_PATH, JSON_PAYLOAD_LIMIT } =
  process.env;

const requiredEnvironmentVariables = [
  "SERVER_URL",
  "SAML_LOGIN_URL",
  "SAML_LOGOUT_URL",
  "SAML_ENTITY_ID",
  "SAML_IDP_CERT",
  "SAML_PUBLIC_KEY",
  "JWT_PRIVATE_KEY",
  "JWT_PUBLIC_KEY",
  "CSB_REBATE_YEAR",
  "CSB_2022_FRF_OPEN",
  "CSB_2022_PRF_OPEN",
  "CSB_2022_CRF_OPEN",
  "CSB_2023_FRF_OPEN",
  "CSB_2023_PRF_OPEN",
  "CSB_2023_CRF_OPEN",
  "CSB_2024_FRF_OPEN",
  "CSB_2024_PRF_OPEN",
  "CSB_2024_CRF_OPEN",
  "FORMIO_2022_FRF_SUBSTRING",
  "FORMIO_2022_PRF_SUBSTRING",
  "FORMIO_2022_CRF_SUBSTRING",
  "FORMIO_2023_FRF_SUBSTRING",
  "FORMIO_2023_PRF_SUBSTRING",
  // "FORMIO_2023_CRF_SUBSTRING",
  "FORMIO_2024_FRF_SUBSTRING",
  "FORMIO_2024_PRF_SUBSTRING",
  // "FORMIO_2024_CRF_SUBSTRING",
  "FORMIO_2022_FRF_PATH",
  "FORMIO_2022_PRF_PATH",
  "FORMIO_2022_CRF_PATH",
  "FORMIO_2023_FRF_PATH",
  "FORMIO_2023_PRF_PATH",
  "FORMIO_2023_CRF_PATH",
  "FORMIO_2023_CHANGE_PATH",
  "FORMIO_2024_FRF_PATH",
  "FORMIO_2024_PRF_PATH",
  "FORMIO_2024_CRF_PATH",
  "FORMIO_2024_CHANGE_PATH",
  "FORMIO_BASE_URL",
  "FORMIO_PROJECT_NAME",
  "FORMIO_API_KEY",
  "BAP_REST_API_VERSION",
  "BAP_CLIENT_ID",
  "BAP_CLIENT_SECRET",
  "BAP_URL",
  "BAP_USER",
  "BAP_PASSWORD",
  "S3_PUBLIC_BUCKET",
  "S3_PUBLIC_REGION",
];

requiredEnvironmentVariables.forEach((variable) => {
  if (!process.env[variable]) {
    const logMessage = `Required environment variable ${variable} not found.`;
    log({ level: "error", message: logMessage });

    process.exitCode = 1;
  }
});

/**
 * Fetch NCES JSON data from S3 bucket or read from local file system.
 */
function fetchNcesData() {
  /** NOTE: static content files found in `app/server/app/content/` directory. */
  const filenames = ["nces-2023.json", "nces-2024.json"];

  return Promise.all(
    filenames.map((filename) => {
      const localFilePath = resolve(__dirname, "./content", filename);
      const s3FileUrl = `${s3BucketUrl}/content/${filename}`;

      /**
       * local development: read files directly from disk
       * Cloud.gov: fetch files from the public s3 bucket
       */
      return NODE_ENV === "development"
        ? readFile(localFilePath, "utf8").then((string) => JSON.parse(string))
        : axios.get(s3FileUrl).then((res) => res.data);
    }),
  )
    .then((data) => {
      const logMessage =
        NODE_ENV === "development"
          ? `Read ${filenames.length} NCES files from disk.`
          : `Fetched ${filenames.length} NCES files from S3 bucket.`;

      log({ level: "info", message: logMessage });

      return {
        2023: data[0],
        2024: data[1],
      };
    })
    .catch((error) => {
      const errorStatus = error.response?.status || 500;
      const errorMethod = error.response?.config?.method?.toUpperCase();
      const errorUrl = error.response?.config?.url;

      const logMessage = `S3 Error: ${errorStatus} ${errorMethod} ${errorUrl}`;
      log({ level: "error", message: logMessage });

      process.exitCode = 1;
    });
}

fetchNcesData().then((ncesData) => {
  const app = express();
  const port = PORT || 3001;

  /** Store NCES JSON data in the Express app's locals object. */
  app.locals.nces = ncesData;

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(helmet.hsts({ maxAge: 31536000 }));

  /** Instruct web browsers to disable caching. */
  app.use((_req, res, next) => {
    res.setHeader("Surrogate-Control", "no-store");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate"); // prettier-ignore
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  });

  app.disable("x-powered-by");

  /**
   * Enable CORS and logging with morgan for local development only.
   * NOTE: process.env.NODE_ENV set to "development" below to match value defined
   * in create-react-app when client app is run locally via `npm start`
   */
  if (NODE_ENV === "development") {
    app.use(cors({ origin: CLIENT_URL, credentials: true }));
    app.use(morgan("dev"));
  }

  app.use(express.json({ limit: JSON_PAYLOAD_LIMIT || "5mb" }));
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true }));

  app.use(passport.initialize());
  passport.use("saml", samlStrategy);

  /**
   * If SERVER_BASE_PATH is provided, serve routes and static files from there
   * (e.g. /csb).
   */
  const basePath = `${SERVER_BASE_PATH || ""}/`;
  app.use(basePath, routes);

  /**
   * Use regex to add trailing slash on static requests
   * (required when using sub path).
   */
  const pathRegex = new RegExp(`^\\${SERVER_BASE_PATH || ""}$`);
  app.all(pathRegex, (_req, res) => res.redirect(`${basePath}`));

  /**
   * Serve client app's static built files.
   * NOTE: client app's `build` directory contents copied into server app's
   * `public` directory in CI/CD step.
   */
  app.use(basePath, express.static(resolve(__dirname, "public")));

  /** Ensure that requested client route exists (otherwise send 404). */
  app.use(checkClientRouteExists);

  /** Ensure user is authenticated on all client-side routes except / and /welcome */
  app.use(protectClientRoutes);

  /** Serve client-side routes. */
  app.get(/(.*)/, (_req, res) => {
    res.sendFile(resolve(__dirname, "public/index.html"));
  });

  app.use(errorHandler);

  app.listen(port, () => {
    const logMessage = `Server listening on port ${port}`;
    log({ level: "info", message: logMessage });
  });
});
