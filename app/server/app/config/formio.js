const axios = require("axios");
const express = require("express");
// ---
const log = require("../utilities/logger");

const {
  CLOUD_SPACE,
  SERVER_URL,
  CSB_2022_FRF_OPEN,
  CSB_2022_PRF_OPEN,
  CSB_2022_CRF_OPEN,
  CSB_2023_FRF_OPEN,
  CSB_2023_PRF_OPEN,
  CSB_2023_CRF_OPEN,
  CSB_2024_FRF_OPEN,
  CSB_2024_PRF_OPEN,
  CSB_2024_CRF_OPEN,
  FORMIO_2022_FRF_SUBSTRING,
  FORMIO_2022_PRF_SUBSTRING,
  FORMIO_2022_CRF_SUBSTRING,
  FORMIO_2023_FRF_SUBSTRING,
  FORMIO_2023_PRF_SUBSTRING,
  FORMIO_2023_CRF_SUBSTRING,
  FORMIO_2024_FRF_SUBSTRING,
  FORMIO_2024_PRF_SUBSTRING,
  FORMIO_2024_CRF_SUBSTRING,
  FORMIO_2022_FRF_PATH,
  FORMIO_2022_PRF_PATH,
  FORMIO_2022_CRF_PATH,
  FORMIO_2023_FRF_PATH,
  FORMIO_2023_PRF_PATH,
  FORMIO_2023_CRF_PATH,
  FORMIO_2023_CHANGE_PATH,
  FORMIO_2024_FRF_PATH,
  FORMIO_2024_PRF_PATH,
  FORMIO_2024_CRF_PATH,
  FORMIO_2024_CHANGE_PATH,
  FORMIO_BASE_URL,
  FORMIO_PROJECT_NAME,
  FORMIO_API_KEY,
} = process.env;

const formioProjectUrl = `${FORMIO_BASE_URL}/${FORMIO_PROJECT_NAME}`;

/**
 * Stores form url for each form by rebate year.
 */
const formUrl = {
  2022: {
    frf: `${formioProjectUrl}/${FORMIO_2022_FRF_PATH}`,
    prf: `${formioProjectUrl}/${FORMIO_2022_PRF_PATH}`,
    crf: `${formioProjectUrl}/${FORMIO_2022_CRF_PATH}`,
    change: "", // NOTE: Change Request form was added in the 2023 rebate year
  },
  2023: {
    frf: `${formioProjectUrl}/${FORMIO_2023_FRF_PATH}`,
    prf: `${formioProjectUrl}/${FORMIO_2023_PRF_PATH}`,
    crf: `${formioProjectUrl}/${FORMIO_2023_CRF_PATH}`,
    change: `${formioProjectUrl}/${FORMIO_2023_CHANGE_PATH}`,
  },
  2024: {
    frf: `${formioProjectUrl}/${FORMIO_2024_FRF_PATH}`,
    prf: `${formioProjectUrl}/${FORMIO_2024_PRF_PATH}`,
    crf: `${formioProjectUrl}/${FORMIO_2024_CRF_PATH}`,
    change: `${formioProjectUrl}/${FORMIO_2024_CHANGE_PATH}`,
  },
};

/**
 * Stores intro text substring found within each form by rebate year.
 */
const formIntroSubstring = {
  2022: {
    frf: FORMIO_2022_FRF_SUBSTRING,
    prf: FORMIO_2022_PRF_SUBSTRING,
    crf: FORMIO_2022_CRF_SUBSTRING,
  },
  2023: {
    frf: FORMIO_2023_FRF_SUBSTRING,
    prf: FORMIO_2023_PRF_SUBSTRING,
    crf: FORMIO_2023_CRF_SUBSTRING,
  },
  2024: {
    frf: FORMIO_2024_FRF_SUBSTRING,
    prf: FORMIO_2024_PRF_SUBSTRING,
    crf: FORMIO_2024_CRF_SUBSTRING,
  },
};

/**
 * Stores whether the submission period is open for each form by rebate year.
 */
const submissionPeriodOpen = {
  2022: {
    frf: CSB_2022_FRF_OPEN === "true",
    prf: CSB_2022_PRF_OPEN === "true",
    crf: CSB_2022_CRF_OPEN === "true",
  },
  2023: {
    frf: CSB_2023_FRF_OPEN === "true",
    prf: CSB_2023_PRF_OPEN === "true",
    crf: CSB_2023_CRF_OPEN === "true",
  },
  2024: {
    frf: CSB_2024_FRF_OPEN === "true",
    prf: CSB_2024_PRF_OPEN === "true",
    crf: CSB_2024_CRF_OPEN === "true",
  },
};

/** @param {express.Request} req */
function axiosFormio(req) {
  const instance = axios.create();

  instance.interceptors.request.use((config) => {
    config.headers["x-token"] = FORMIO_API_KEY;
    config.headers["b3"] = req.headers["b3"] || "";
    config.headers["x-b3-traceid"] = req.headers["x-b3-traceid"] || "";
    config.headers["x-b3-spanid"] = req.headers["x-b3-spanid"] || "";
    config.headers["x-b3-parentspanid"] = req.headers["x-b3-parentspanid"] || ""; // prettier-ignore

    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const { config } = error;
      const { status } = error.response;

      const method = config.method.toUpperCase();
      const { url } = config;

      const logMessage =
        `Formio Error: ${status} ${method} ${url}. ` +
        `Response: ${JSON.stringify(error.response.data)}`;
      log({ level: "error", message: logMessage, req: config });

      return Promise.reject(error);
    },
  );

  return instance;
}

const formioCSBMetadata = {
  "csb-app-cloud-space": `env-${CLOUD_SPACE || "local"}`,
  "csb-app-cloud-origin": SERVER_URL || "localhost",
};

/** Example mongoId value used in OpenAPI docs (used by EPA API scan) */
const formioExampleMongoId = "000000000000000000000000";

/** Example rebateId value used in OpenAPI docs (used by EPA API scan) */
const formioExampleRebateId = "000000";

/** Example comboKey value used in OpenAPI docs (used by EPA API scan) */
const formioExampleComboKey = "0000000000000000";

/** JSON response for forms user doesn't have access to */
const formioNoUserAccess = {
  userAccess: false,
  formSchema: null,
  submission: null,
};

module.exports = {
  axiosFormio,
  formioProjectUrl,
  formUrl,
  formIntroSubstring,
  submissionPeriodOpen,
  formioCSBMetadata,
  formioExampleMongoId,
  formioExampleRebateId,
  formioExampleComboKey,
  formioNoUserAccess,
};
