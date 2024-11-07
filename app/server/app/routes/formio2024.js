const express = require("express");
// ---
const {
  ensureAuthenticated,
  storeBapComboKeys,
  verifyMongoObjectId,
} = require("../middleware");
const {
  searchNcesData,
  //
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
  // fetchCRFSubmissions,
  // createCRFSubmission,
  // fetchCRFSubmission,
  // updateCRFSubmission,
  //
  fetchChangeRequests,
  fetchChangeRequestSchema,
  createChangeRequest,
  fetchChangeRequest,
} = require("../utilities/formio");

const rebateYear = "2024";
const router = express.Router();

router.use(ensureAuthenticated);

// --- search 2024 NCES data with the provided NCES ID and return a match
router.get("/nces/:searchText?", (req, res) => {
  searchNcesData({ rebateYear, req, res });
});

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

// --- get user's 2024 FRF submissions from Formio
router.get("/frf-submissions", storeBapComboKeys, (req, res) => {
  fetchFRFSubmissions({ rebateYear, req, res });
});

// --- post a new 2024 FRF submission to Formio
router.post("/frf-submission", storeBapComboKeys, (req, res) => {
  createFRFSubmission({ rebateYear, req, res });
});

// --- get an existing 2024 FRF's schema and submission data from Formio
router.get(
  "/frf-submission/:mongoId",
  verifyMongoObjectId,
  storeBapComboKeys,
  (req, res) => {
    fetchFRFSubmission({ rebateYear, req, res });
  },
);

// --- post an update to an existing draft 2024 FRF submission to Formio
router.post(
  "/frf-submission/:mongoId",
  verifyMongoObjectId,
  storeBapComboKeys,
  (req, res) => {
    updateFRFSubmission({ rebateYear, req, res });
  },
);

// --- get user's 2024 PRF submissions from Formio
router.get("/prf-submissions", storeBapComboKeys, (req, res) => {
  fetchPRFSubmissions({ rebateYear, req, res });
});

// --- post a new 2024 PRF submission to Formio
router.post("/prf-submission", storeBapComboKeys, (req, res) => {
  createPRFSubmission({ rebateYear, req, res });
});

// --- get an existing 2024 PRF's schema and submission data from Formio
router.get("/prf-submission/:rebateId", storeBapComboKeys, (req, res) => {
  fetchPRFSubmission({ rebateYear, req, res });
});

// --- post an update to an existing draft 2024 PRF submission to Formio
router.post("/prf-submission/:rebateId", storeBapComboKeys, (req, res) => {
  updatePRFSubmission({ rebateYear, req, res });
});

// --- delete an existing 2024 PRF submission from Formio
router.post("/delete-prf-submission", storeBapComboKeys, (req, res) => {
  deletePRFSubmission({ rebateYear, req, res });
});

// --- get user's 2024 CRF submissions from Formio
router.get("/crf-submissions", storeBapComboKeys, (req, res) => {
  res.json([]); // TODO: replace with `fetchCRFSubmissions({ rebateYear, req, res })` when CRF is ready
});

// --- post a new 2024 CRF submission to Formio
// router.post("/crf-submission", storeBapComboKeys, (req, res) => {
//   createCRFSubmission({ rebateYear, req, res });
// });

// --- get an existing 2024 CRF's schema and submission data from Formio
// router.get("/crf-submission/:rebateId", storeBapComboKeys, (req, res) => {
//   fetchCRFSubmission({ rebateYear, req, res });
// });

// --- post an update to an existing draft 2024 CRF submission to Formio
// router.post("/crf-submission/:rebateId", storeBapComboKeys, (req, res) => {
//   updateCRFSubmission({ rebateYear, req, res });
// });

// --- get user's 2024 Change Request form submissions from Formio
router.get("/changes", storeBapComboKeys, (req, res) => {
  fetchChangeRequests({ rebateYear, req, res });
});

// --- get the 2024 Change Request form's schema from Formio
router.get("/change", storeBapComboKeys, (req, res) => {
  fetchChangeRequestSchema({ rebateYear, req, res });
});

// --- post a new 2024 Change Request form submission to Formio
router.post("/change", storeBapComboKeys, (req, res) => {
  createChangeRequest({ rebateYear, req, res });
});

// --- get an existing 2024 Change Request form's schema and submission data from Formio
router.get("/change/:mongoId", storeBapComboKeys, (req, res) => {
  fetchChangeRequest({ rebateYear, req, res });
});

module.exports = router;
