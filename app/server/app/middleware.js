const { resolve } = require("node:path");
const express = require("express");
const jwt = require("jsonwebtoken");
const ObjectId = require("mongodb").ObjectId;
// ---
const {
  createJWT,
  jwtAlgorithm,
  jwtCookieName,
} = require("./utilities/createJwt");
const log = require("./utilities/logger");
const { getBapComboKeys } = require("./utilities/bap");

const { CLIENT_URL, SERVER_URL, SERVER_BASE_PATH, JWT_PUBLIC_KEY } =
  process.env;

/**
 * Middleware to check for JWT, add user object to request, and create new JWT
 * to keep alive for 15 minutes from request. Default to rejectRequest function
 * if JWT is invalid, but allow for a custom override function on reject
 * (required for auto-redirect to SAML).
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 */
function ensureAuthenticated(req, res, next, rejectCallback = rejectRequest) {
  const token = req.cookies[jwtCookieName];

  /** If no JWT passed in token cookie, send Unauthorized response or redirect. */
  if (!token) {
    const logMessage = `No JWT cookie present in request.`;
    log({ level: "warn", message: logMessage, req });

    return rejectCallback(req, res);
  }

  jwt.verify(
    token,
    JWT_PUBLIC_KEY,
    { algorithms: [jwtAlgorithm] },
    function verifyCallback(err, decoded) {
      if (err) {
        const jwtExpired = err instanceof jwt.TokenExpiredError;

        /** Change log levels depending on JWT error received. */
        if (jwtExpired) {
          const logMessage = `JWT expired.`;
          log({ level: "warn", message: logMessage, req });
        } else if (err instanceof jwt.JsonWebTokenError) {
          const logMessage = `An invalid JWT was used.`;
          log({ level: "error", message: logMessage, req });
        } else {
          const logMessage = typeof err.toString === "function" ? err.toString() : err; // prettier-ignore
          log({ level: "error", message: logMessage, req });
        }

        /** If JWT has expired, user will see inactivity message instead of error. */
        return rejectCallback(req, res, jwtExpired);
      }

      /** Add user to the request object. */
      req.user = decoded;

      /** Create a new token to update expiration to 15 min from now. */
      const newToken = createJWT(decoded);

      /** Add JWT in cookie and proceed with request. */
      res.cookie(jwtCookieName, newToken, {
        httpOnly: true,
        overwrite: true,
        sameSite: "lax",
        secure: true,
      });

      next();
    },
  );
}

/**
 * Confirm user has either "csb_admin" or "csb_helpdesk" role.
 * Log message and send 401 Unauthorized if user does not have either role.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 */
function ensureHelpdesk(req, res, next) {
  const { mail, memberof } = req.user;
  const userRoles = memberof?.split(",") || [];

  if (!userRoles.includes("csb_admin") && !userRoles.includes("csb_helpdesk")) {
    const logMessage = `User with email ${mail} attempted to perform an admin/helpdesk action without correct privileges.`;
    log({ level: "error", message: logMessage, req });

    const errorStatus = 401;
    const errorMessage = `Unauthorized.`;
    return res.status(errorStatus).json({ message: errorMessage });
  }

  next();
}

/**
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {boolean} jwtExpired
 */
function rejectRequest(req, res, jwtExpired) {
  /** Clear token cookie if there was an error verifying (e.g. jwtExpired). */
  res.clearCookie(jwtCookieName);

  if (req.originalUrl.includes("/api")) {
    /** Send JSON Unauthorized message if request is for an API endpoint. */
    const errorStatus = 401;
    const errorMessage = `Unauthorized.`;
    return res.status(errorStatus).json({ message: errorMessage });
  }

  /**
   * For non-API requests (e.g. on logout), redirect to /welcome if token is
   * non-existent or invalid, and display the appropriate message (timeout or
   * authentication error).
   */
  const param = jwtExpired ? "info=timeout" : "error=auth";
  return res.redirect(`${CLIENT_URL || SERVER_URL}/welcome?${param}`);
}

/**
 * Auto-redirect to SAML login for any non-logged-in user on any route except
 * base "/" or "/welcome".
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 */
function protectClientRoutes(req, res, next) {
  const subPath = SERVER_BASE_PATH || "";
  const unprotectedRoutes = ["/", "/welcome", "/manifest.json"].map(
    (route) => `${subPath}${route}`,
  );

  if (!unprotectedRoutes.includes(req.path) && !req.path.includes("/static")) {
    return ensureAuthenticated(req, res, next, (req, res) => {
      /**
       * If ensureAuthenticated does not find valid JWT, this redirect will
       * occur so user is auto-redirected to SAML.
       */
      const url = req.originalUrl.replace(subPath, "");
      return res.redirect(`${SERVER_URL}/login?RelayState=${url}`);
    });
  }

  next();
}

/**
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 */
function checkClientRouteExists(req, res, next) {
  const subPath = SERVER_BASE_PATH || "";

  const clientRoutes = ["/", "/welcome", "/helpdesk", "/frf/new"].map(
    (route) => `${subPath}${route}`,
  );

  if (
    !clientRoutes.includes(req.path) &&
    !req.path.includes("/change/") &&
    !req.path.includes("/frf/") &&
    !req.path.includes("/prf/") &&
    !req.path.includes("/crf/")
  ) {
    const errorStatus = 404;
    return res
      .status(errorStatus)
      .sendFile(resolve(__dirname, "public/404.html"));
  }

  next();
}

/**
 * Fetch user's SAM.gov unique combo keys from the BAP and add "bapComboKeys"
 * to request object if successful.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 */
function fetchBapComboKeys(req, res, next) {
  const { mail } = req.user;

  getBapComboKeys(req, mail)
    .then((bapComboKeys) => {
      req.bapComboKeys = bapComboKeys;
      next();
    })
    .catch(() => {
      const errorStatus = 500;
      const errorMessage = `Error getting SAM.gov data from the BAP.`;
      return res.status(errorStatus).json({ message: errorMessage });
    });
}

/**
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 */
function verifyMongoObjectId(req, res, next) {
  const { id } = req.params;

  if (id && !ObjectId.isValid(id)) {
    const errorStatus = 400;
    const errorMessage = `MongoDB ObjectId validation error for: ${id}.`;
    return res.status(errorStatus).json({ message: errorMessage });
  }

  next();
}

module.exports = {
  ensureAuthenticated,
  ensureHelpdesk,
  protectClientRoutes,
  checkClientRouteExists,
  fetchBapComboKeys,
  verifyMongoObjectId,
};
