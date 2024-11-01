const express = require("express");
const ObjectId = require("mongodb").ObjectId;
// ---
const {
  axiosFormio,
  formioProjectUrl,
  formUrl,
  formioExampleMongoId,
  formioExampleRebateId,
} = require("../config/formio");
const { ensureAuthenticated, ensureHelpdesk } = require("../middleware");
const { getBapFormSubmissionData } = require("../utilities/bap");
const { getRebateIdFieldName } = require("../utilities/formio");

/**
 * @typedef {'2022' | '2023' | '2024'} RebateYear
 */

/**
 * @typedef {'frf' | 'prf' | 'crf'} FormType
 */

const router = express.Router();

/** Confirm user is both authenticated and authorized with valid helpdesk roles. */
router.use(ensureAuthenticated);
router.use(ensureHelpdesk);

/** @type {Map<FormType, 'CSB Application' | 'CSB Payment Request' | 'CSB Close Out'} */
const formioFormNameMap = new Map()
  .set("frf", "CSB Application")
  .set("prf", "CSB Payment Request")
  .set("crf", "CSB Close Out");

/**
 * Fetches Formio form schema when provided a Formio form url.
 *
 * @param {{
 *  formioFormUrl: string
 *  req: express.Request
 * }} param
 */
function fetchFormioFormSchema({ formioFormUrl, req }) {
  return axiosFormio(req)
    .get(formioFormUrl)
    .then((axiosRes) => axiosRes.data)
    .then((schema) => ({ url: formioFormUrl, json: schema }))
    .catch((error) => {
      // NOTE: error is logged in axiosFormio response interceptor
      throw error;
    });
}

/**
 * Fetches Formio form submission data when provided a Formio submission url.
 *
 * @param {{
 *  formioSubmissionUrl: string
 *  id: 'rebateId' | 'mongoId'
 *  req: express.Request
 * }} param
 */
function fetchFormioSubmissionData({ formioSubmissionUrl, id, req }) {
  /**
   * NOTE:
   * If the provided id is 'rebateId', the provided formSubmissionUrl includes
   * the rebateId within it and we'll query Formio for all submissions that
   * include the rebateId field and its value (which should only be one
   * submission). In that case, the Formio query's response will be an array of
   * submission objects, so we'll return the first one.
   *
   * Else, if the provided id is 'mongoId', the provided formSubmissionUrl
   * includes the mongoId within it and we'll query Formio for the single
   * submission. In that case, the Formio query's response will be a single
   * submission object, so we'll return it.
   */
  return axiosFormio(req)
    .get(formioSubmissionUrl)
    .then((axiosRes) => axiosRes.data)
    .then((json) => {
      const result = id === "rebateId" ? json[0] : json;
      return result || null;
    })
    .catch((error) => {
      // NOTE: error is logged in axiosFormio response interceptor
      throw error;
    });
}

/**
 * Fetches BAP form submission data for a given rebate form.
 *
 * @param {{
 *  rebateYear: RebateYear
 *  formType: FormType
 *  rebateId: string | null
 *  mongoId: string | null
 *  req: express.Request
 * }} param
 */
function fetchBapSubmissionData({
  rebateYear,
  formType,
  rebateId,
  mongoId,
  req,
}) {
  return getBapFormSubmissionData({
    rebateYear,
    formType,
    rebateId,
    mongoId,
    req,
  }).then((json) => {
    if (!json) return null;

    const {
      UEI_EFTI_Combo_Key__c,
      CSB_Form_ID__c,
      CSB_Modified_Full_String__c,
      CSB_Review_Item_ID__c,
      Parent_Rebate_ID__c,
      Record_Type_Name__c,
      Parent_CSB_Rebate__r,
    } = json;

    const {
      CSB_Funding_Request_Status__c,
      CSB_Payment_Request_Status__c,
      CSB_Closeout_Request_Status__c,
      Reimbursement_Needed__c,
    } = Parent_CSB_Rebate__r ?? {};

    return {
      modified: CSB_Modified_Full_String__c, // ISO 8601 date time string
      comboKey: UEI_EFTI_Combo_Key__c, // UEI + EFTI combo key
      mongoId: CSB_Form_ID__c, // MongoDB Object ID
      rebateId: Parent_Rebate_ID__c, // CSB Rebate ID (6 digits)
      reviewItemId: CSB_Review_Item_ID__c, // CSB Rebate ID with form/version ID (9 digits)
      status: Record_Type_Name__c?.startsWith("CSB Funding Request")
        ? CSB_Funding_Request_Status__c
        : Record_Type_Name__c?.startsWith("CSB Payment Request")
          ? CSB_Payment_Request_Status__c
          : Record_Type_Name__c?.startsWith("CSB Close Out Request")
            ? CSB_Closeout_Request_Status__c
            : "",
      reimbursementNeeded: Reimbursement_Needed__c,
    };
  });
}

// --- get an existing form's submission data from Formio and the BAP
router.get("/formio/submission/:rebateYear/:formType/:id", async (req, res) => {
  const { rebateYear, formType, id } = req.params;

  const result = {
    formSchema: null,
    formio: null,
    bap: null,
  };

  // NOTE: included to support EPA API scan
  if (id === formioExampleRebateId) {
    return res.json({});
  }

  const rebateId = id.length === 6 ? id : null;
  const mongoId = !rebateId ? id : null;

  /** NOTE: verifyMongoObjectId */
  if (mongoId && !ObjectId.isValid(mongoId)) {
    const errorStatus = 400;
    const errorMessage = `MongoDB ObjectId validation error for: '${mongoId}'.`;
    return res.status(errorStatus).json({ message: errorMessage });
  }

  const formName = formioFormNameMap.get(formType) || "CSB";
  const formioFormUrl = formUrl[rebateYear][formType];

  if (!formioFormUrl) {
    const errorStatus = 400;
    const errorMessage = `Formio form URL does not exist for ${rebateYear} ${formName} form.`;
    return res.status(errorStatus).json({ message: errorMessage });
  }

  result.formSchema = await fetchFormioFormSchema({ formioFormUrl, req });

  if (!result.formSchema) {
    const errorStatus = 400;
    const errorMessage = `Error getting Formio ${rebateYear} ${formName} form schema.`;
    return res.status(errorStatus).json({ message: errorMessage });
  }

  const rebateIdFieldName = getRebateIdFieldName({ rebateYear });
  const formioSubmissionUrl = rebateId
    ? `${formioFormUrl}/submission?data.${rebateIdFieldName}=${rebateId}`
    : `${formioFormUrl}/submission/${mongoId}`;

  /**
   * NOTE: FRF submissions don't include a CSB Rebate Id field, as it's created
   * by the BAP after they ETL the FRF submissions. So if the user searched for
   * an FRF submission with a CSB Rebate Id, we'll need to use the returned
   * MongoDB ObjectId from the upcoming BAP query's response and then attempt to
   * re-fetch the formio submission data using that mongoId.
   */
  result.formio =
    rebateId && formType === "frf"
      ? null
      : await fetchFormioSubmissionData({
          formioSubmissionUrl,
          id: rebateId ? "rebateId" : "mongoId",
          req,
        });

  result.bap = await fetchBapSubmissionData({
    rebateYear,
    formType,
    rebateId,
    mongoId,
    req,
  });

  /** NOTE: See previous note above setting of `result.formio` value */
  if (!result.formio && result.bap) {
    result.formio = await fetchFormioSubmissionData({
      formioSubmissionUrl: `${formioFormUrl}/submission/${result.bap.mongoId}`,
      id: "mongoId",
      req,
    });
  }

  if (!result.formio && !result.bap) {
    const errorStatus = 400;
    const errorMessage = `Error getting ${rebateYear} ${formName} form submission '${rebateId | mongoId}'.`;
    return res.status(errorStatus).json({ message: errorMessage });
  }

  return res.json(result);
});

// --- post an update to an existing form submission to Formio (change submission to 'draft')
router.post("/formio/submission/:rebateYear/:formType/:mongoId", (req, res) => {
  const { body } = req;
  const { rebateYear, formType, mongoId } = req.params;

  // NOTE: included to support EPA API scan
  if (mongoId === formioExampleMongoId) {
    return res.json({});
  }

  /** NOTE: verifyMongoObjectId */
  if (!ObjectId.isValid(mongoId)) {
    const errorStatus = 400;
    const errorMessage = `MongoDB ObjectId validation error for: '${mongoId}'.`;
    return res.status(errorStatus).json({ message: errorMessage });
  }

  const formName = formioFormNameMap.get(formType) || "CSB";
  const formioFormUrl = formUrl[rebateYear][formType];

  if (!formioFormUrl) {
    const errorStatus = 400;
    const errorMessage = `Formio form URL does not exist for ${rebateYear} ${formName}.`;
    return res.status(errorStatus).json({ message: errorMessage });
  }

  axiosFormio(req)
    .put(`${formioFormUrl}/submission/${mongoId}`, body)
    .then((axiosRes) => axiosRes.data)
    .then((submission) => res.json(submission))
    .catch((error) => {
      // NOTE: error is logged in axiosFormio response interceptor
      const errorStatus = error.response?.status || 500;
      const errorMessage = `Error updating Formio ${rebateYear} ${formName} form submission '${mongoId}' to 'Draft'.`;
      return res.status(errorStatus).json({ message: errorMessage });
    });
});

// --- get all actions associated with a form's submission from Formio
router.get("/formio/actions/:formId/:mongoId", (req, res) => {
  const { formId, mongoId } = req.params;

  // NOTE: included to support EPA API scan
  if (mongoId === formioExampleMongoId) {
    return res.json({});
  }

  /** NOTE: verifyMongoObjectId */
  if (!ObjectId.isValid(formId)) {
    const errorStatus = 400;
    const errorMessage = `MongoDB ObjectId validation error for: '${formId}'.`;
    return res.status(errorStatus).json({ message: errorMessage });
  }

  /** NOTE: verifyMongoObjectId */
  if (!ObjectId.isValid(mongoId)) {
    const errorStatus = 400;
    const errorMessage = `MongoDB ObjectId validation error for: '${mongoId}'.`;
    return res.status(errorStatus).json({ message: errorMessage });
  }

  const submissionActionsUrl =
    `${formioProjectUrl}/action` +
    `?form=${formId}` +
    `&submission=${mongoId}` +
    `&sort=-modified` +
    `&limit=1000000`;

  axiosFormio(req)
    .get(submissionActionsUrl)
    .then((axiosRes) => axiosRes.data)
    .then((actions) => res.json(actions))
    .catch((error) => {
      // NOTE: error is logged in axiosFormio response interceptor
      const errorStatus = error.response?.status || 500;
      const errorMessage = `Error getting Formio submission actions.`;
      return res.status(errorStatus).json({ message: errorMessage });
    });
});

// --- get a PDF of an existing form's submission from Formio
router.get("/formio/pdf/:formId/:mongoId", (req, res) => {
  const { formId, mongoId } = req.params;

  // NOTE: included to support EPA API scan
  if (mongoId === formioExampleMongoId) {
    return res.json({});
  }

  /** NOTE: verifyMongoObjectId */
  if (!ObjectId.isValid(formId)) {
    const errorStatus = 400;
    const errorMessage = `MongoDB ObjectId validation error for: '${formId}'.`;
    return res.status(errorStatus).json({ message: errorMessage });
  }

  /** NOTE: verifyMongoObjectId */
  if (!ObjectId.isValid(mongoId)) {
    const errorStatus = 400;
    const errorMessage = `MongoDB ObjectId validation error for: '${mongoId}'.`;
    return res.status(errorStatus).json({ message: errorMessage });
  }

  axiosFormio(req)
    .get(formioProjectUrl)
    .then((axiosRes) => axiosRes.data)
    .then((project) => {
      const headers = {
        "x-allow": `GET:/project/${project._id}/form/${formId}/submission/${mongoId}/download`,
        "x-expire": 3600,
      };

      axiosFormio(req)
        .get(`${formioProjectUrl}/token`, { headers })
        .then((axiosRes) => axiosRes.data)
        .then((json) => {
          const url = `${formioProjectUrl}/form/${formId}/submission/${mongoId}/download?token=${json.key}`;

          axiosFormio(req)
            .get(url, { responseType: "arraybuffer" })
            .then((axiosRes) => axiosRes.data)
            .then((fileData) => {
              const base64String = Buffer.from(fileData).toString("base64");
              res.attachment(`${mongoId}.pdf`);
              res.type("application/pdf");
              res.send(base64String);
            })
            .catch((error) => {
              // NOTE: error is logged in axiosFormio response interceptor
              const errorStatus = error.response?.status || 500;
              const errorMessage = `Error getting Formio submission PDF.`;
              return res.status(errorStatus).json({ message: errorMessage });
            });
        })
        .catch((error) => {
          // NOTE: error is logged in axiosFormio response interceptor
          const errorStatus = error.response?.status || 500;
          const errorMessage = `Error getting Formio download token.`;
          return res.status(errorStatus).json({ message: errorMessage });
        });
    })
    .catch((error) => {
      // NOTE: error is logged in axiosFormio response interceptor
      const errorStatus = error.response?.status || 500;
      const errorMessage = `Error getting Formio project data.`;
      return res.status(errorStatus).json({ message: errorMessage });
    });
});

module.exports = router;
