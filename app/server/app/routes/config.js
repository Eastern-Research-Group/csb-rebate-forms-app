const express = require("express");
// ---
const { submissionPeriodOpen } = require("../config/formio");
const { ensureAuthenticated } = require("../middleware");

const { CSB_REBATE_YEAR } = process.env;

const router = express.Router();

router.use(ensureAuthenticated);

// --- get CSB app specific configuration
router.get("/", (_req, res) => {
  // NOTE: fallback to current year if CSB_REBATE_YEAR is not set
  const date = new Date();
  const year = date.getFullYear().toString();

  return res.json({
    rebateYear: CSB_REBATE_YEAR || year,
    submissionPeriodOpen,
  });
});

module.exports = router;
