const express = require("express");
// ---
const {
  ensureAuthenticated,
  storeBapComboKeys,
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
  fetchChangeRequests,
  fetchChangeRequestSchema,
  createChangeRequest,
  fetchChangeRequest,
} = require("../utilities/formio");

const rebateYear = "2023";
const router = express.Router();

router.use(ensureAuthenticated);

// --- download Formio S3 file metadata
router.get(
  "/s3/:formType/:mongoId/:comboKey/storage/s3",
  storeBapComboKeys,
  (req, res) => {
    downloadS3FileMetadata({ rebateYear, req, res });
  },
);

// --- upload Formio S3 file metadata
router.post(
  "/s3/:formType/:mongoId/:comboKey/storage/s3",
  storeBapComboKeys,
  (req, res) => {
    uploadS3FileMetadata({ rebateYear, req, res });
  },
);

// --- get user's 2023 FRF submissions from Formio
router.get("/frf-submissions", storeBapComboKeys, (req, res) => {
  fetchFRFSubmissions({ rebateYear, req, res });
});

// --- post a new 2023 FRF submission to Formio
router.post("/frf-submission", storeBapComboKeys, (req, res) => {
  createFRFSubmission({ rebateYear, req, res });
});

// --- get an existing 2023 FRF's schema and submission data from Formio
router.get(
  "/frf-submission/:mongoId",
  verifyMongoObjectId,
  storeBapComboKeys,
  (req, res) => {
    fetchFRFSubmission({ rebateYear, req, res });
  },
);

// --- post an update to an existing draft 2023 FRF submission to Formio
router.post(
  "/frf-submission/:mongoId",
  verifyMongoObjectId,
  storeBapComboKeys,
  (req, res) => {
    updateFRFSubmission({ rebateYear, req, res });
  },
);

// --- get user's 2023 PRF submissions from Formio
router.get("/prf-submissions", storeBapComboKeys, (req, res) => {
  fetchPRFSubmissions({ rebateYear, req, res });
});

// --- post a new 2023 PRF submission to Formio
router.post("/prf-submission", storeBapComboKeys, (req, res) => {
  createPRFSubmission({ rebateYear, req, res });
});

// --- get an existing 2023 PRF's schema and submission data from Formio
router.get("/prf-submission/:rebateId", storeBapComboKeys, async (req, res) => {
  fetchPRFSubmission({ rebateYear, req, res });
});

// --- post an update to an existing draft 2023 PRF submission to Formio
router.post("/prf-submission/:rebateId", storeBapComboKeys, (req, res) => {
  updatePRFSubmission({ rebateYear, req, res });
});

// --- delete an existing 2023 PRF submission from Formio
router.post("/delete-prf-submission", storeBapComboKeys, (req, res) => {
  deletePRFSubmission({ rebateYear, req, res });
});

// --- get user's 2023 CRF submissions from Formio
router.get("/crf-submissions", storeBapComboKeys, (req, res) => {
  // TODO
  res.json([]);
});

// --- post a new 2023 CRF submission to Formio

// --- get an existing 2023 CRF's schema and submission data from Formio

// --- post an update to an existing draft 2023 CRF submission to Formio

// --- get user's 2023 Change Request form submissions from Formio
router.get("/changes", storeBapComboKeys, (req, res) => {
  fetchChangeRequests({ rebateYear, req, res });
});

// --- get the 2023 Change Request form's schema from Formio
router.get("/change", storeBapComboKeys, (req, res) => {
  fetchChangeRequestSchema({ rebateYear, req, res });
});

// --- post a new 2023 Change Request form submission to Formio
router.post("/change", storeBapComboKeys, (req, res) => {
  createChangeRequest({ rebateYear, req, res });
});

// --- get an existing 2023 Change Request form's schema and submission data from Formio
router.get("/change/:mongoId", storeBapComboKeys, async (req, res) => {
  fetchChangeRequest({ rebateYear, req, res });
});

module.exports = router;
