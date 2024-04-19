const {
  MODE,
  VITE_SERVER_BASE_PATH,
  VITE_CLOUD_SPACE,
  VITE_FORMIO_BASE_URL,
  VITE_FORMIO_PROJECT_NAME,
} = import.meta.env;

if (!VITE_FORMIO_BASE_URL) {
  const message = `Required VITE_FORMIO_BASE_URL environment variable not found.`;
  throw new Error(message);
}

if (!VITE_FORMIO_PROJECT_NAME) {
  const message = `Required VITE_FORMIO_PROJECT_NAME environment variable not found.`;
  throw new Error(message);
}

// allows the app to be accessed from a sub directory of a server (e.g. /csb)
export const serverBasePath =
  MODE === "development" ? "" : VITE_SERVER_BASE_PATH || "";

export const serverUrl = window.location.origin + serverBasePath;

export const cloudSpace =
  MODE === "development" ? "dev" : VITE_CLOUD_SPACE || "";

export const formioBaseUrl = VITE_FORMIO_BASE_URL;

const formioProjectName = VITE_FORMIO_PROJECT_NAME;

export const formioProjectUrl = `${formioBaseUrl}/${formioProjectName}`;

export const messages = {
  genericError: "The application has encountered an unknown error.",
  authError: "Authentication error. Please log in again or contact support.",
  samlError: "Error logging in. Please try again or contact support.",
  bapSamFetchError: "Error loading SAM.gov data. Please contact support.",
  bapNoSamResults:
    "No SAM.gov accounts match your email. Only Government and Electronic Business SAM.gov Points of Contacts (and alternates) may edit and submit Clean School Bus Rebate Forms.",
  bapSamEntityNotActive:
    "Your SAM.gov account is currently not active. Activate your SAM.gov account to access this submission.",
  bapSamNoActiveEntities:
    "There are no active SAM.gov accounts associated with your email. Ensure you have at least one active SAM.gov account to create a new application.",
  bapSamAtLeastOneEntityNotActive:
    "At least one of your SAM.gov accounts is currently not active. Any submissions associated with that SAM.gov account will be inaccessible until the account is re-activated.",
  formSubmissionError:
    "The requested submission does not exist, or you do not have access. Please contact support if you believe this is a mistake.",
  formSubmissionsError: "Error loading form submissions.",
  formSchemaError: "Error loading form schema.",
  newApplication:
    "Please select the “New Application” button above to create your first rebate application.",
  helpdeskSubmissionSearchError:
    "Error loading form submission. Please confirm the form type and ID is correct and search again.",
  helpdeskSubmissionNoActions:
    "No actions from the last 30 days associated with this submission.",
  timeout:
    "For security reasons, you have been logged out due to 15 minutes of inactivity.",
  logout: "You have successfully logged out.",
  frfClosed: "The CSB Application form enrollment period is closed.",
  prfClosed: "The CSB Payment Request form enrollment period is closed.",
  crfClosed: "The CSB Close Out form enrollment period is closed.",
  prfWillBeDeleted:
    "A request to edit the Application form associated with this draft or submitted Payment Request form has been made, so this form has been set to read-only mode. Visit your dashboard to make edits to the associated Application form submission.",
};

/**
 * Formio status mapping for all form submissions (practically, just capitalizes
 * "draft" or "submitted", but follows same format as BAP status map).
 */
export const formioStatusMap = new Map<string, string>()
  .set("draft", "Draft")
  .set("submitted", "Submitted");

/**
 * BAP internal to external status mapping by year and form type.
 */
export const bapStatusMap = {
  2022: {
    frf: new Map<string, string>()
      .set("Needs Clarification", "Needs Clarification")
      .set("Withdrawn", "Withdrawn")
      .set("Coordinator Denied", "Not Selected")
      .set("Accepted", "Selected"),
    prf: new Map<string, string>()
      .set("Needs Clarification", "Needs Clarification")
      .set("Withdrawn", "Withdrawn")
      .set("Coordinator Denied", "Funding Not Approved")
      .set("Accepted", "Funding Approved"),
    crf: new Map<string, string>()
      .set("Needs Clarification", "Needs Clarification")
      .set("Reimbursement Needed", "Reimbursement Needed")
      .set("Branch Director Denied", "Close Out Not Approved")
      .set("Branch Director Approved", "Close Out Approved"),
  },
  2023: {
    frf: new Map<string, string>()
      .set("Needs Clarification", "Needs Clarification")
      .set("Withdrawn", "Withdrawn")
      .set("Coordinator Denied", "Not Selected")
      .set("Accepted", "Selected"),
    prf: new Map<string, string>()
      .set("Needs Clarification", "Needs Clarification")
      .set("Withdrawn", "Withdrawn")
      .set("Coordinator Denied", "Funding Denied")
      .set("Accepted", "Funding Approved"),
    crf: new Map<string, string>(),
  },
};

/**
 * Status icon mapping status to USWDS icon name.
 */
export const statusIconMap = new Map<string, string>()
  .set("Edits Requested", "priority_high") // !
  .set("Withdrawn", "close") // ✕
  .set("Not Selected", "cancel") // x inside a circle
  .set("Funding Not Approved", "cancel")
  .set("Close Out Not Approved", "cancel")
  .set("Funding Denied", "cancel")
  .set("Selected", "check_circle") // check inside a circle
  .set("Funding Approved", "check_circle")
  .set("Close Out Approved", "check_circle")
  .set("Draft", "more_horiz") // three horizontal dots
  .set("Submitted", "check") // check
  .set("", "remove"); // — (fallback, not used)

/**
 * Formio user name field by year and form type.
 */
export const formioNameField = {
  2022: {
    frf: "sam_hidden_applicant_name",
    prf: "applicantName",
    crf: "signatureName",
  },
  2023: {
    frf: "_bap_applicant_name",
    prf: "",
    crf: "",
  },
};

/**
 * Formio user email field by year and form type.
 */
export const formioEmailField = {
  2022: {
    frf: "last_updated_by",
    prf: "hidden_current_user_email",
    crf: "hidden_current_user_email",
  },
  2023: {
    frf: "_user_email",
    prf: "",
    crf: "",
  },
};
