const express = require("express");
// ---
const {
  ensureAuthenticated,
  fetchBapComboKeys,
  verifyMongoObjectId,
} = require("../middleware");
const {
  uploadS3FileMetadata,
  downloadS3FileMetadata,
  //
  fetchFRFSubmissions,
  createFRFSubmission,
  fetchFRFSubmission,
  updateFRFSubmission,
  //
  fetchPRFSubmissions,
  createPRFSubmission,
  fetchPRFSubmission,
  updatePRFSubmission,
  deletePRFSubmission,
  //
  fetchCRFSubmissions,
  createCRFSubmission,
  fetchCRFSubmission,
  updateCRFSubmission,
} = require("../utilities/formio");

const rebateYear = "2022";
const router = express.Router();

router.use(ensureAuthenticated);

// --- download Formio S3 file metadata
router.get(
  "/s3/:formType/:mongoId/:comboKey/storage/s3",
  fetchBapComboKeys,
  (req, res) => {
    downloadS3FileMetadata({ rebateYear, req, res });
  },
);

// --- upload Formio S3 file metadata
router.post(
  "/s3/:formType/:mongoId/:comboKey/storage/s3",
  fetchBapComboKeys,
  (req, res) => {
    uploadS3FileMetadata({ rebateYear, req, res });
  },
);

// --- get user's 2022 FRF submissions from Formio
router.get("/frf-submissions", fetchBapComboKeys, (req, res) => {
  fetchFRFSubmissions({ rebateYear, req, res });
});

// --- post a new 2022 FRF submission to Formio
router.post("/frf-submission", fetchBapComboKeys, (req, res) => {
  createFRFSubmission({ rebateYear, req, res });
});

// --- get an existing 2022 FRF's schema and submission data from Formio
router.get(
  "/frf-submission/:mongoId",
  verifyMongoObjectId,
  fetchBapComboKeys,
  (req, res) => {
    fetchFRFSubmission({ rebateYear, req, res });
  },
);

// --- post an update to an existing draft 2022 FRF submission to Formio
router.post(
  "/frf-submission/:mongoId",
  verifyMongoObjectId,
  fetchBapComboKeys,
  (req, res) => {
    updateFRFSubmission({ rebateYear, req, res });
  },
);

// --- get user's 2022 PRF submissions from Formio
router.get("/prf-submissions", fetchBapComboKeys, (req, res) => {
  fetchPRFSubmissions({ rebateYear, req, res });
});

// --- post a new 2022 PRF submission to Formio
router.post("/prf-submission", fetchBapComboKeys, (req, res) => {
  createPRFSubmission({ rebateYear, req, res });
});

// --- get an existing 2022 PRF's schema and submission data from Formio
router.get("/prf-submission/:rebateId", fetchBapComboKeys, (req, res) => {
  fetchPRFSubmission({ rebateYear, req, res });
});

// --- post an update to an existing draft 2022 PRF submission to Formio
router.post("/prf-submission/:rebateId", fetchBapComboKeys, (req, res) => {
  updatePRFSubmission({ rebateYear, req, res });
});

// --- delete an existing 2022 PRF submission from Formio
router.post("/delete-prf-submission", fetchBapComboKeys, (req, res) => {
  deletePRFSubmission({ rebateYear, req, res });
});

// --- get user's 2022 CRF submissions from Formio
router.get("/crf-submissions", fetchBapComboKeys, (req, res) => {
  fetchCRFSubmissions({ rebateYear, req, res });
});

// --- post a new 2022 CRF submission to Formio
router.post("/crf-submission", fetchBapComboKeys, (req, res) => {
  createCRFSubmission({ rebateYear, req, res });
});

// --- get an existing 2022 CRF's schema and submission data from Formio
router.get("/crf-submission/:rebateId", fetchBapComboKeys, (req, res) => {
  fetchCRFSubmission({ rebateYear, req, res });
});

// --- post an update to an existing draft 2022 CRF submission to Formio
router.post("/crf-submission/:rebateId", fetchBapComboKeys, (req, res) => {
  updateCRFSubmission({ rebateYear, req, res });
});

module.exports = router;
