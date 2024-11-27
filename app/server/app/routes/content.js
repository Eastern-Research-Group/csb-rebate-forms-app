const { resolve } = require("node:path");
const { readFile } = require("node:fs/promises");
const express = require("express");
const axios = require("axios").default || require("axios"); // TODO: https://github.com/axios/axios/issues/5011
// ---
const { s3BucketUrl } = require("../config/s3");
const log = require("../utilities/logger");

const { NODE_ENV } = process.env;

const router = express.Router();

// --- get static content from S3
router.get("/", (req, res) => {
  /** NOTE: static content files found in `app/server/app/content/` directory. */
  const filenames = [
    "site-alert.md",
    "helpdesk-intro.md",
    "all-rebates-intro.md",
    "all-rebates-outro.md",
    "new-frf-dialog.md",
    "draft-frf-intro.md",
    "submitted-frf-intro.md",
    "draft-prf-intro.md",
    "submitted-prf-intro.md",
    "draft-crf-intro.md",
    "submitted-crf-intro.md",
    "new-change-intro.md",
    "submitted-change-intro.md",
  ];

  Promise.all(
    filenames.map((filename) => {
      const localFilePath = resolve(__dirname, "../content", filename);
      const s3FileUrl = `${s3BucketUrl}/content/${filename}`;

      /**
       * local development: read files directly from disk
       * Cloud.gov: fetch files from the public s3 bucket
       */
      return NODE_ENV === "development"
        ? readFile(localFilePath, "utf8")
        : axios.get(s3FileUrl).then((res) => res.data);
    }),
  )
    .then((data) => {
      const logMessage =
        NODE_ENV === "development"
          ? `Read ${filenames.length} content files from disk.`
          : `Fetched ${filenames.length} content files from S3 bucket.`;

      log({ level: "info", message: logMessage });

      return res.json({
        siteAlert: data[0],
        helpdeskIntro: data[1],
        allRebatesIntro: data[2],
        allRebatesOutro: data[3],
        newFRFDialog: data[4],
        draftFRFIntro: data[5],
        submittedFRFIntro: data[6],
        draftPRFIntro: data[7],
        submittedPRFIntro: data[8],
        draftCRFIntro: data[9],
        submittedCRFIntro: data[10],
        newChangeIntro: data[11],
        submittedChangeIntro: data[12],
      });
    })
    .catch((error) => {
      const errorStatus = error.response?.status || 500;
      const errorMethod = error.response?.config?.method?.toUpperCase();
      const errorUrl = error.response?.config?.url;

      const logMessage = `S3 Error: ${errorStatus} ${errorMethod} ${errorUrl}`;
      log({ level: "error", message: logMessage, req });

      const errorMessage = `Error getting static content from S3 bucket.`;
      return res.status(errorStatus).json({ message: errorMessage });
    });
});

module.exports = router;
