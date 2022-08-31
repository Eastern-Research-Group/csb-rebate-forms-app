const express = require("express");
// ---
const {
  axiosFormio,
  formioProjectUrl,
  formioApplicationFormPath,
  formioCsbMetadata,
} = require("../config/formio");
const {
  ensureAuthenticated,
  ensureHelpdesk,
  verifyMongoObjectId,
} = require("../middleware");
const log = require("../utilities/logger");

const enrollmentClosed = process.env.CSB_ENROLLMENT_PERIOD !== "open";

const router = express.Router();

// confirm user is both authenticated and authorized with valid helpdesk roles
router.use(ensureAuthenticated);
router.use(ensureHelpdesk);

const applicationFormApiPath = `${formioProjectUrl}/${formioApplicationFormPath}`;

// --- get an existing application form's submission data from Forms.gov
router.get(
  "/application-form-submission/:id",
  verifyMongoObjectId,
  (req, res) => {
    const { id } = req.params;

    axiosFormio(req)
      .get(`${applicationFormApiPath}/submission/${id}`)
      .then((axiosRes) => axiosRes.data)
      .then((submission) => {
        axiosFormio(req)
          .get(`${formioProjectUrl}/form/${submission.form}`)
          .then((axiosRes) => axiosRes.data)
          .then((schema) => {
            return res.json({
              formSchema: {
                url: `${formioProjectUrl}/form/${submission.form}`,
                json: schema,
              },
              submissionData: submission,
            });
          });
      })
      .catch((error) => {
        const message = `Error getting Forms.gov application form submission ${id}`;
        return res.status(error?.response?.status || 500).json({ message });
      });
  }
);

// --- change a submitted Forms.gov application form's submission state back to draft
router.post(
  "/application-form-submission/:id",
  verifyMongoObjectId,
  (req, res) => {
    const { id } = req.params;
    const { mail } = req.user;

    if (enrollmentClosed) {
      const message = `CSB enrollment period is closed`;
      return res.status(400).json({ message });
    }

    axiosFormio(req)
      .get(`${applicationFormApiPath}/submission/${id}`)
      .then((axiosRes) => axiosRes.data)
      .then((existingSubmission) => {
        axiosFormio(req)
          .put(`${applicationFormApiPath}/submission/${id}`, {
            state: "draft",
            data: { ...existingSubmission.data, last_updated_by: mail },
            metadata: { ...existingSubmission.metadata, ...formioCsbMetadata },
          })
          .then((axiosRes) => axiosRes.data)
          .then((updatedSubmission) => {
            const message = `User with email ${mail} updated application form submission ${id} from submitted to draft.`;
            log({ level: "info", message, req });

            axiosFormio(req)
              .get(`${formioProjectUrl}/form/${updatedSubmission.form}`)
              .then((axiosRes) => axiosRes.data)
              .then((schema) => {
                return res.json({
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
        const message = `Error updating Forms.gov application form submission ${id}`;
        return res.status(error?.response?.status || 500).json({ message });
      });
  }
);

module.exports = router;
