const express = require("express");
// ---
const {
  axiosFormio,
  formioProjectUrl,
  formioFormId,
  formioCsbMetadata,
} = require("../config/formio");
const {
  ensureAuthenticated,
  ensureHelpdesk,
  verifyMongoObjectId,
} = require("../middleware");
const logger = require("../utilities/logger");

const log = logger.logger;

const router = express.Router();

// Confirm user is both authenticated and authorized with valid helpdesk roles
router.use(ensureAuthenticated);
router.use(ensureHelpdesk);

// --- get an existing rebate form's submission data from Forms.gov
router.get("/rebate-form-submission/:id", verifyMongoObjectId, (req, res) => {
  const id = req.params.id;

  axiosFormio
    .get(`${formioProjectUrl}/${formioFormId}/submission/${id}`)
    .then((axiosRes) => axiosRes.data)
    .then((submission) => {
      axiosFormio
        .get(`${formioProjectUrl}/form/${submission.form}`)
        .then((axiosRes) => axiosRes.data)
        .then((schema) => {
          res.json({
            formSchema: {
              url: `${formioProjectUrl}/form/${submission.form}`,
              json: schema,
            },
            submissionData: submission,
          });
        });
    })
    .catch((error) => {
      res.status(error?.response?.status || 500).json({
        message: `Error getting Forms.gov rebate form submission ${id}`,
      });
    });
});

// --- change a submitted Forms.gov rebate form's submission back to 'draft'
router.post("/rebate-form-submission/:id", verifyMongoObjectId, (req, res) => {
  const id = req.params.id;
  const userEmail = req.user.mail;
  const formioSubmissionUrl = `${formioProjectUrl}/${formioFormId}/submission/${id}`;

  axiosFormio
    .get(formioSubmissionUrl)
    .then((axiosRes) => axiosRes.data)
    .then((existingSubmission) => {
      axiosFormio
        .put(formioSubmissionUrl, {
          state: "draft",
          data: { ...existingSubmission.data, last_updated_by: userEmail },
          metadata: { ...existingSubmission.metadata, ...formioCsbMetadata },
        })
        .then((axiosRes) => axiosRes.data)
        .then((updatedSubmission) => {
          log.info(
            `User with email ${userEmail} updated rebate form submission ${id} from submitted to draft.`
          );

          axiosFormio
            .get(`${formioProjectUrl}/form/${updatedSubmission.form}`)
            .then((axiosRes) => axiosRes.data)
            .then((schema) => {
              res.json({
                formSchema: {
                  url: `${formioProjectUrl}/form/${updatedSubmission.form}`,
                  json: schema,
                },
                submissionData: updatedSubmission,
              });
            });
        });
    })
    .catch((error) => {
      res.status(error?.response?.status || 500).json({
        message: `Error updating Forms.gov rebate form submission ${id}`,
      });
    });
});

module.exports = router;
