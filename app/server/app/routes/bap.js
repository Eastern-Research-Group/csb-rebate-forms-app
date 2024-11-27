const express = require("express");
// ---
const { ensureAuthenticated, fetchBapComboKeys } = require("../middleware");
const {
  // checkForBapDuplicates,
  getSamEntities,
  getBapFormSubmissionsStatuses,
} = require("../utilities/bap");
const { checkUserData } = require("../utilities/user");
const log = require("../utilities/logger");

const router = express.Router();

router.use(ensureAuthenticated);

// --- check for duplicate contacts or organizations in the BAP.
// router.post("/duplicates", (req, res) => {
//   return checkForBapDuplicates(req)
//     .then((duplicates) => res.json(duplicates))
//     .catch((_error) => {
//       // NOTE: logged in bap verifyBapConnection
//       const errorStatus = 500;
//       const errorMessage = `Error checking duplicates from the BAP.`;
//       return res.status(errorStatus).json({ message: errorMessage });
//     });
// });

// --- get user's SAM.gov data from the BAP
router.get("/sam", (req, res) => {
  const { mail } = req.user;

  const { adminOrHelpdeskUser } = checkUserData({ req });

  if (!mail) {
    const logMessage = `User with no email address attempted to fetch SAM.gov records.`;
    log({ level: "error", message: logMessage, req });

    return res.json({
      results: false,
      entities: [],
    });
  }

  getSamEntities(req, mail)
    .then((entities) => {
      /**
       * NOTE: allow admin or helpdesk users access to the app, even without
       * SAM.gov data.
       */
      if (!adminOrHelpdeskUser && entities?.length === 0) {
        const logMessage =
          `User with email '${mail}' attempted to use app ` +
          `without any associated SAM.gov records.`;
        log({ level: "error", message: logMessage, req });

        return res.json({
          results: false,
          entities: [],
        });
      }

      return res.json({
        results: true,
        entities,
      });
    })
    .catch((error) => {
      const errorStatus = 500;
      const errorMessage = `Error getting SAM.gov data from the BAP.`;

      log({ level: "error", message: errorMessage, req, otherInfo: error });

      return res.status(errorStatus).json({ message: errorMessage });
    });
});

// --- get user's form submissions statuses from the BAP
router.get("/submissions", fetchBapComboKeys, (req, res) => {
  const { mail } = req.user;

  const { adminOrHelpdeskUser, noBapComboKeys } = checkUserData({ req });

  if (noBapComboKeys) {
    if (adminOrHelpdeskUser) {
      return res.json([]);
    }

    const logMessage =
      `User with email '${mail}' attempted to fetch form submissions ` +
      `from the BAP without any SAM.gov combo keys.`;
    log({ level: "error", message: logMessage, req });

    const errorStatus = 401;
    const errorMessage = `Unauthorized.`;
    return res.status(errorStatus).json({ message: errorMessage });
  }

  return getBapFormSubmissionsStatuses(req)
    .then((submissions) => res.json(submissions))
    .catch((error) => {
      const errorStatus = 500;
      const errorMessage = `Error getting form submissions statuses from the BAP.`;

      log({ level: "error", message: errorMessage, req, otherInfo: error });

      return res.status(errorStatus).json({ message: errorMessage });
    });
});

module.exports = router;
