const express = require("express");
// ---
const { ensureAuthenticated } = require("../middleware");
const log = require("../utilities/logger");

const router = express.Router();

router.use(ensureAuthenticated);

// --- Search the NCES data with the provided NCES ID and return a match
router.get("/{:searchText}", (req, res) => {
  const { searchText } = req.params;

  if (!searchText) {
    const logMessage = `No NCES ID passed to NCES data lookup.`;
    log({ level: "info", message: logMessage, req });

    return res.json({});
  }

  if (searchText.length !== 7) {
    const logMessage = `Invalid NCES ID '${searchText}' passed to NCES data lookup.`;
    log({ level: "info", message: logMessage, req });

    return res.json({});
  }

  const result = req.app.locals.nces[2023].find((item) => {
    return item["NCES ID"] === searchText;
  });

  const logMessage =
    `NCES data searched with NCES ID '${searchText}' resulting in ` +
    `${result ? "a match" : "no matches"}.`;
  log({ level: "info", message: logMessage, req });

  return res.json({ ...result });
});

module.exports = router;
