/** Utilities to fetch data from EPA's Business Automation Platform (BAP) */

const jsforce = require("jsforce");
const express = require("express");
const log = require("../utilities/logger");
// ---
const { submissionPeriodOpen } = require("../config/formio");

/**
 * @typedef {'2022' | '2023' | '2024'} RebateYear
 */

/**
 * @typedef {'frf' | 'prf' | 'crf'} FormType
 */

/**
 * @typedef {Object} BapSamEntity
 * @property {{ type: "Data_Staging__c", url: string }} attributes
 * @property {string} Id
 * @property {string} ENTITY_COMBO_KEY__c
 * @property {string} UNIQUE_ENTITY_ID__c
 * @property {?string} ENTITY_EFT_INDICATOR__c
 * @property {string} ENTITY_STATUS__c
 * @property {?string} EXCLUSION_STATUS_FLAG__c
 * @property {?string} DEBT_SUBJECT_TO_OFFSET_FLAG__c
 * @property {string} LEGAL_BUSINESS_NAME__c
 * @property {string} PHYSICAL_ADDRESS_LINE_1__c
 * @property {?string} PHYSICAL_ADDRESS_LINE_2__c
 * @property {string} PHYSICAL_ADDRESS_CITY__c
 * @property {string} PHYSICAL_ADDRESS_PROVINCE_OR_STATE__c
 * @property {string} PHYSICAL_ADDRESS_ZIPPOSTAL_CODE__c
 * @property {string} PHYSICAL_ADDRESS_ZIP_CODE_4__c
 * @property {?string} ELEC_BUS_POC_EMAIL__c
 * @property {?string} ELEC_BUS_POC_NAME__c
 * @property {?string} ELEC_BUS_POC_TITLE__c
 * @property {?string} ALT_ELEC_BUS_POC_EMAIL__c
 * @property {?string} ALT_ELEC_BUS_POC_NAME__c
 * @property {?string} ALT_ELEC_BUS_POC_TITLE__c
 * @property {?string} GOVT_BUS_POC_EMAIL__c
 * @property {?string} GOVT_BUS_POC_NAME__c
 * @property {?string} GOVT_BUS_POC_TITLE__c
 * @property {?string} ALT_GOVT_BUS_POC_EMAIL__c
 * @property {?string} ALT_GOVT_BUS_POC_NAME__c
 * @property {?string} ALT_GOVT_BUS_POC_TITLE__c
 */

/**
 * @typedef {Object} BapFormSubmission
 * @property {{ type: "Order_Request__c", url: string }} attributes
 * @property {string} Id
 * @property {string} UEI_EFTI_Combo_Key__c
 * @property {string} CSB_Form_ID__c
 * @property {string} CSB_Modified_Full_String__c
 * @property {string} CSB_Review_Item_ID__c
 * @property {string} Parent_Rebate_ID__c
 * @property {'CSB Funding Request'
 *  | 'CSB Payment Request'
 *  | 'CSB Close Out Request'
 *  | 'CSB Funding Request 2023'
 *  | 'CSB Payment Request 2023'
 *  | 'CSB Close Out Request 2023'
 *  | 'CSB Funding Request 2024'
 *  | 'CSB Payment Request 2024'
 *  | 'CSB Close Out Request 2024'
 * } Record_Type_Name__c
 * @property {string | null} Rebate_Program_Year__c
 * @property {{
 *  attributes: { type: "Application__c", url: string }
 *  Id: string
 *  CSB_Funding_Request_Status__c: string
 *  CSB_Payment_Request_Status__c: string
 *  CSB_Closeout_Request_Status__c: string
 *  Reimbursement_Needed__c: boolean
 * }} Parent_CSB_Rebate__r
 */

/**
 * @typedef {Object} BapDataFor2022PRF
 * @property {{
 *  attributes: { type: "Order_Request__c", url: string }
 *  Id: string
 *  UEI_EFTI_Combo_Key__c: string
 *  CSB_NCES_ID__c: string
 *  Primary_Applicant__r: {
 *    attributes: { type: "Contact", url: string }
 *    Id: string
 *    Name: string
 *    Title: string
 *    Phone: string
 *    Email: string
 *  }
 *  Alternate_Applicant__r: {
 *    attributes: { type: "Contact", url: string }
 *    Id: string
 *    Name: string
 *    Title: string
 *    Phone: string
 *    Email: string
 *  } | null
 *  Applicant_Organization__r: {
 *    attributes: { type: "Account", url: string }
 *    Id: string
 *    Name: string
 *  }
 *  CSB_School_District__r: {
 *    attributes: { type: "Account", url: string }
 *    Id: string
 *    Name: string
 *  }
 *  Fleet_Name__c: string | null
 *  School_District_Prioritized__c: boolean
 *  Total_Rebate_Funds_Requested__c: number
 *  Total_Infrastructure_Funds__c: number
 * }[]} frf2022RecordQuery
 * @property {{
 *  attributes: { type: "Line_Item__c", url: string }
 *  Id: string
 *  Rebate_Item_num__c: number
 *  CSB_VIN__c: string
 *  CSB_Model_Year__c: string
 *  CSB_Fuel_Type__c: string
 *  CSB_Replacement_Fuel_Type__c: string
 *  CSB_Funds_Requested__c: number
 * }[]} frf2022BusRecordsQuery
 */

/**
 * @typedef {Object} BapDataFor2023PRF
 * @property {{
 *  attributes: { type: "Order_Request__c", url: string }
 *  Id: string
 *  CSB_Snapshot__r: {
 *    attributes: { type: "Data_Staging__c", url: string }
 *    Id: string
 *    JSON_Snapshot__c: string
 *  }
 *  Applicant_Organization__r: {
 *    attributes: { type: "Account", url: string }
 *    Id: string
 *    County__c: string
 *  }
 *  Primary_Applicant__r: {
 *    attributes: { type: "Contact", url: string }
 *    Id: string
 *    FirstName: string
 *    LastName: string
 *    Title: string
 *    Email: string
 *    Phone: string
 *  } | null
 *  Alternate_Applicant__r: {
 *    attributes: { type: "Contact", url: string }
 *    Id: string
 *    FirstName: string
 *    LastName: string
 *    Title: string
 *    Email: string
 *    Phone: string
 *  } | null
 *  CSB_School_District__r: {
 *    attributes: { type: "Account", url: string }
 *    Id: string
 *    Name: string
 *    BillingStreet: string
 *    BillingCity: string
 *    BillingState: string
 *    BillingPostalCode: string
 *  } | null
 *  School_District_Contact__r: {
 *    attributes: { type: "Contact", url: string }
 *    Id: string
 *    FirstName: string
 *    LastName: string
 *    Title: string
 *    Email: string
 *    Phone: string
 *  } | null
 *  CSB_NCES_ID__c: string
 *  Org_District_Prioritized__c: string
 *  Self_Certification_Category__c: string
 *  Prioritized_as_High_Need__c: boolean
 *  Prioritized_as_Tribal__c: boolean
 *  Prioritized_as_Rural__c: boolean
 * }[]} frf2023RecordQuery
 * @property {{
 *  attributes: { type: "Line_Item__c", url: string }
 *  Id: string
 *  Rebate_Item_num__c: number
 *  CSB_VIN__c: string
 *  CSB_Fuel_Type__c: string
 *  CSB_GVWR__c: number
 *  Old_Bus_Odometer_miles__c: number
 *  Old_Bus_NCES_District_ID__c: string
 *  CSB_Model__c: string
 *  CSB_Model_Year__c: string
 *  CSB_Manufacturer__c: string
 *  CSB_Manufacturer_if_Other__c: string | null
 *  CSB_Annual_Fuel_Consumption__c: number
 *  Annual_Mileage__c: number
 *  Old_Bus_Estimated_Remaining_Life__c: number
 *  Old_Bus_Annual_Idling_Hours__c: number
 *  New_Bus_Infra_Rebate_Requested__c: number
 *  New_Bus_Fuel_Type__c: string
 *  New_Bus_GVWR__c: number
 *  New_Bus_ADA_Compliant__c: boolean
 * }[]} frf2023BusRecordsQuery
 * @property {{
 *  attributes: { type: "Line_Item__c", url: string }
 *  Id: string
 *  Related_Line_Item__c: string
 *  Relationship_Type__c: 'Old Bus Private Fleet Owner (if changed)' | 'New Bus Owner'
 *  Contact__r: {
 *    attributes: { type: "Contact", url: string }
 *    Id: string
 *    FirstName: string
 *    LastName: string
 *    Title: string
 *    Email: string
 *    Phone: string
 *    Account: {
 *      attributes: { type: "Account", url: string }
 *      Id: string
 *      Name: string
 *      BillingStreet: string
 *      BillingCity: string
 *      BillingState: string
 *      BillingPostalCode: string
 *      County__c: string | null
 *    }
 *  }
 * }[]} frf2023BusRecordsContactsQueries
 */

/**
 * @typedef {Object} BapDataFor2024PRF
 * @property {{
 *  attributes: { type: "Order_Request__c", url: string }
 *  Id: string
 *  CSB_Snapshot__r: {
 *    attributes: { type: "Data_Staging__c", url: string }
 *    Id: string
 *    JSON_Snapshot__c: string
 *  }
 *  Applicant_Organization__r: {
 *    attributes: { type: "Account", url: string }
 *    Id: string
 *    County__c: string
 *  }
 *  Primary_Applicant__r: {
 *    attributes: { type: "Contact", url: string }
 *    Id: string
 *    FirstName: string
 *    LastName: string
 *    Title: string
 *    Email: string
 *    Phone: string
 *  } | null
 *  Alternate_Applicant__r: {
 *    attributes: { type: "Contact", url: string }
 *    Id: string
 *    FirstName: string
 *    LastName: string
 *    Title: string
 *    Email: string
 *    Phone: string
 *  } | null
 *  CSB_School_District__r: {
 *    attributes: { type: "Account", url: string }
 *    Id: string
 *    Name: string
 *    BillingStreet: string
 *    BillingCity: string
 *    BillingState: string
 *    BillingPostalCode: string
 *  } | null
 *  School_District_Contact__r: {
 *    attributes: { type: "Contact", url: string }
 *    Id: string
 *    FirstName: string
 *    LastName: string
 *    Title: string
 *    Email: string
 *    Phone: string
 *  } | null
 *  CSB_NCES_ID__c: string
 *  Org_District_Prioritized__c: string
 *  Self_Certification_Category__c: string
 *  Prioritized_as_High_Need__c: boolean
 *  Prioritized_as_Tribal__c: boolean
 *  Prioritized_as_Rural__c: boolean
 * }[]} frf2024RecordQuery
 * @property {{
 *  attributes: { type: "Line_Item__c", url: string }
 *  Id: string
 *  Rebate_Item_num__c: number
 *  CSB_VIN__c: string
 *  CSB_Fuel_Type__c: string
 *  CSB_GVWR__c: number
 *  Old_Bus_Odometer_miles__c: number
 *  Old_Bus_NCES_District_ID__c: string
 *  CSB_Model__c: string
 *  CSB_Model_Year__c: string
 *  CSB_Manufacturer__c: string
 *  CSB_Manufacturer_if_Other__c: string | null
 *  CSB_Annual_Fuel_Consumption__c: number
 *  Old_Bus_Average_Annual_Mileage__c: number
 *  Old_Bus_Estimated_Remaining_Life__c: number
 *  Old_Bus_Annual_Idling_Hours__c: number
 *  New_Bus_Infra_Rebate_Requested__c: number
 *  New_Bus_Fuel_Type__c: string
 *  New_Bus_GVWR__c: number
 *  New_Bus_ADA_Compliant__c: boolean
 * }[]} frf2024BusRecordsQuery
 * @property {{
 *  attributes: { type: "Line_Item__c", url: string }
 *  Id: string
 *  Related_Line_Item__c: string
 *  Relationship_Type__c: 'Old Bus Private Fleet Owner (if changed)' | 'New Bus Owner'
 *  Contact__r: {
 *    attributes: { type: "Contact", url: string }
 *    Id: string
 *    FirstName: string
 *    LastName: string
 *    Title: string
 *    Email: string
 *    Phone: string
 *    Account: {
 *      attributes: { type: "Account", url: string }
 *      Id: string
 *      Name: string
 *      BillingStreet: string
 *      BillingCity: string
 *      BillingState: string
 *      BillingPostalCode: string
 *      County__c: string | null
 *    }
 *  }
 * }[]} frf2024BusRecordsContactsQueries
 */

/**
 * @typedef {Object} BapDataFor2022CRF
 * @property {{
 *  attributes: { type: "Order_Request__c", url: string }
 *  Id: string
 *  Fleet_Name__c: string
 *  Fleet_Street_Address__c: string
 *  Fleet_City__c: string
 *  Fleet_State__c: string
 *  Fleet_Zip__c: string
 *  Fleet_Contact_Name__c: string
 *  Fleet_Contact_Title__c: string
 *  Fleet_Contact_Phone__c: string
 *  Fleet_Contact_Email__c: string
 *  School_District_Contact__r: {
 *    attributes: { type: "Contact", url: string }
 *    Id: string
 *    FirstName: string
 *    LastName: string
 *  }
 * }[]} frf2022RecordQuery
 * @property {{
 *  attributes: { type: "Order_Request__c", url: string }
 *  Id: string
 *  UEI_EFTI_Combo_Key__c: string
 *  CSB_NCES_ID__c: string
 *  Primary_Applicant__r: {
 *    attributes: { type: "Contact", url: string }
 *    Id: string
 *    FirstName: string
 *    LastName: string
 *    Title: string
 *    Phone: string
 *    Email: string
 *  }
 *  Alternate_Applicant__r: {
 *    attributes: { type: "Contact", url: string }
 *    Id: string
 *    FirstName: string
 *    LastName: string
 *    Title: string
 *    Phone: string
 *    Email: string
 *  } | null
 *  Applicant_Organization__r: {
 *    attributes: { type: "Account", url: string }
 *    Id: string
 *    Name: string
 *  }
 *  CSB_School_District__r: {
 *    attributes: { type: "Account", url: string }
 *    Id: string
 *    Name: string
 *  }
 *  School_District_Prioritized__c: boolean
 *  Total_Rebate_Funds_Requested_PO__c: number
 *  Total_Bus_And_Infrastructure_Rebate__c: number
 *  Total_Infrastructure_Funds__c: number | null
 *  Num_Of_Buses_Requested_From_Application__c: number
 *  Total_Price_All_Buses__c: number
 *  Total_Bus_Rebate_Amount__c: number
 *  Total_All_Eligible_Infrastructure_Costs__c: number | null
 *  Total_Infrastructure_Rebate__c: number | null
 *  Total_Level_2_Charger_Costs__c: number | null
 *  Total_DC_Fast_Charger_Costs__c: number | null
 *  Total_Other_Infrastructure_Costs__c: number | null
 * }[]} prf2022RecordQuery
 * @property {{
 *  attributes: { type: "Line_Item__c", url: string }
 *  Id: string
 *  Rebate_Item_num__c: number
 *  CSB_VIN__c: string
 *  CSB_Model_Year__c: string
 *  CSB_Fuel_Type__c: string
 *  CSB_Manufacturer_if_Other__c: string | null
 *  Old_Bus_NCES_District_ID__c: string
 *  Old_Bus_Estimated_Remaining_Life__c: number
 *  Old_Bus_Exclude__c: boolean
 *  Related_Line_Item__r: {
 *    attributes: { type: "Line_Item__c", url: string }
 *    Id: string
 *    Vendor_Name__c: string
 *  }
 *  New_Bus_Fuel_Type__c: string
 *  New_Bus_Make__c: string
 *  New_Bus_Model__c: string
 *  New_Bus_Model_Year__c: string
 *  New_Bus_GVWR__c: number
 *  New_Bus_Rebate_Amount__c: number
 *  New_Bus_Purchase_Price__c: number
 * }[]} prf2022busRecordsQuery
 */

/**
 * @typedef {Object.<string, {
 *  dupeList: {
 *    Id: string
 *    dupeFound: {
 *      RecordTypeId: string
 *      FirstName: string
 *      LastName: string
 *      Title: string
 *      Phone: string
 *      Email: string
 *      AccountId: string
 *    },
 *    dupeConfRating: number
 *    dupeCount: number
 *  }[]
 * }>} BapDuplicates
 */

const {
  SERVER_URL,
  BAP_REST_API_VERSION,
  BAP_CLIENT_ID,
  BAP_CLIENT_SECRET,
  BAP_URL,
  BAP_USER,
  BAP_PASSWORD,
} = process.env;

/**
 * Sets up the BAP connection and stores it in the Express app's locals object.
 * @param {express.Request} req
 */
function setupConnection(req) {
  const bapConnection = new jsforce.Connection({
    version: BAP_REST_API_VERSION,
    oauth2: {
      clientId: BAP_CLIENT_ID,
      clientSecret: BAP_CLIENT_SECRET,
      loginUrl: BAP_URL,
      redirectUri: SERVER_URL,
    },
  });

  return bapConnection
    .loginByOAuth2(BAP_USER, BAP_PASSWORD)
    .then((userInfo) => {
      const logMessage = `Initializing BAP connection: ${userInfo.url}.`;
      log({ level: "info", message: logMessage, req });

      /** Store BAP connection in the Express app's locals object. */
      req.app.locals.bapConnection = bapConnection;
    })
    .catch((err) => {
      const logMessage = `Error initializing BAP connection.`;
      log({ level: "info", message: logMessage, req });

      throw err;
    });
}

/**
 * Uses cached JSforce connection to query the BAP for SAM.gov entities.
 *
 * @param {express.Request} req
 * @param {string} email
 * @returns {Promise<BapSamEntity[]>} collection of SAM.gov entity data
 */
async function queryForSamEntities(req, email) {
  const logMessage = `Querying the BAP for SAM.gov entities for user with email: '${email}'.`;
  log({ level: "info", message: logMessage, req });

  /** @type {{ bapConnection: jsforce.Connection }} */
  const { bapConnection } = req.app.locals;

  // `SELECT
  //   Id,
  //   ENTITY_COMBO_KEY__c,
  //   UNIQUE_ENTITY_ID__c,
  //   ENTITY_EFT_INDICATOR__c,
  //   ENTITY_STATUS__c,
  //   EXCLUSION_STATUS_FLAG__c,
  //   DEBT_SUBJECT_TO_OFFSET_FLAG__c,
  //   LEGAL_BUSINESS_NAME__c,
  //   PHYSICAL_ADDRESS_LINE_1__c,
  //   PHYSICAL_ADDRESS_LINE_2__c,
  //   PHYSICAL_ADDRESS_CITY__c,
  //   PHYSICAL_ADDRESS_PROVINCE_OR_STATE__c,
  //   PHYSICAL_ADDRESS_ZIPPOSTAL_CODE__c,
  //   PHYSICAL_ADDRESS_ZIP_CODE_4__c,
  //   ELEC_BUS_POC_EMAIL__c,
  //   ELEC_BUS_POC_NAME__c,
  //   ELEC_BUS_POC_TITLE__c,
  //   ALT_ELEC_BUS_POC_EMAIL__c,
  //   ALT_ELEC_BUS_POC_NAME__c,
  //   ALT_ELEC_BUS_POC_TITLE__c,
  //   GOVT_BUS_POC_EMAIL__c,
  //   GOVT_BUS_POC_NAME__c,
  //   GOVT_BUS_POC_TITLE__c,
  //   ALT_GOVT_BUS_POC_EMAIL__c,
  //   ALT_GOVT_BUS_POC_NAME__c,
  //   ALT_GOVT_BUS_POC_TITLE__c
  // FROM
  //   Data_Staging__c
  // WHERE
  //   ALT_ELEC_BUS_POC_EMAIL__c = '${email}' OR
  //   GOVT_BUS_POC_EMAIL__c = '${email}' OR
  //   ALT_GOVT_BUS_POC_EMAIL__c = '${email}' OR
  //   ELEC_BUS_POC_EMAIL__c = '${email}'`

  return await bapConnection
    .sobject("Data_Staging__c")
    .find(
      {
        $or: [
          { ALT_ELEC_BUS_POC_EMAIL__c: email },
          { GOVT_BUS_POC_EMAIL__c: email },
          { ALT_GOVT_BUS_POC_EMAIL__c: email },
          { ELEC_BUS_POC_EMAIL__c: email },
        ],
      },
      {
        // "*": 1,
        Id: 1, // Salesforce record ID
        ENTITY_COMBO_KEY__c: 1,
        UNIQUE_ENTITY_ID__c: 1,
        ENTITY_EFT_INDICATOR__c: 1,
        ENTITY_STATUS__c: 1,
        EXCLUSION_STATUS_FLAG__c: 1,
        DEBT_SUBJECT_TO_OFFSET_FLAG__c: 1,
        LEGAL_BUSINESS_NAME__c: 1,
        PHYSICAL_ADDRESS_LINE_1__c: 1,
        PHYSICAL_ADDRESS_LINE_2__c: 1,
        PHYSICAL_ADDRESS_CITY__c: 1,
        PHYSICAL_ADDRESS_PROVINCE_OR_STATE__c: 1,
        PHYSICAL_ADDRESS_ZIPPOSTAL_CODE__c: 1,
        PHYSICAL_ADDRESS_ZIP_CODE_4__c: 1,
        ELEC_BUS_POC_EMAIL__c: 1,
        ELEC_BUS_POC_NAME__c: 1,
        ELEC_BUS_POC_TITLE__c: 1,
        ALT_ELEC_BUS_POC_EMAIL__c: 1,
        ALT_ELEC_BUS_POC_NAME__c: 1,
        ALT_ELEC_BUS_POC_TITLE__c: 1,
        GOVT_BUS_POC_EMAIL__c: 1,
        GOVT_BUS_POC_NAME__c: 1,
        GOVT_BUS_POC_TITLE__c: 1,
        ALT_GOVT_BUS_POC_EMAIL__c: 1,
        ALT_GOVT_BUS_POC_NAME__c: 1,
        ALT_GOVT_BUS_POC_TITLE__c: 1,
      },
    )
    .execute(async (err, records) => ((await err) ? err : records));
}

/**
 * Uses cached JSforce connection to query the BAP for a single form submission's
 * statuses and related metadata.
 *
 * @param {express.Request} req
 * @param {RebateYear} rebateYear
 * @param {FormType} formType
 * @param {string | null} rebateId
 * @param {string | null} mongoId
 * @returns {Promise<BapFormSubmission | null>} fields associated a form submission
 */
async function queryForBapFormSubmissionData(
  req,
  rebateYear,
  formType,
  rebateId,
  mongoId,
) {
  const loggedId = rebateId
    ? `rebateId: '${rebateId}'`
    : `mongoId: '${mongoId}'`;
  const logMessage =
    `Querying the BAP for ${formType.toUpperCase()} submission data ` +
    `associated with ${loggedId}.`;
  log({ level: "info", message: logMessage, req });

  /** @type {{ bapConnection: jsforce.Connection }} */
  const { bapConnection } = req.app.locals;

  const developerNameField = {
    2022: {
      frf: "CSB_Funding_Request",
      prf: "CSB_Payment_Request",
      crf: "CSB_Closeout_Request",
    },
    2023: {
      frf: "CSB_Funding_Request_2023",
      prf: "CSB_Payment_Request_2023",
      crf: "CSB_Closeout_Request_2023",
    },
    2024: {
      frf: "CSB_Funding_Request_2024",
      prf: "CSB_Payment_Request_2024",
      crf: "CSB_Closeout_Request_2024",
    },
  };

  const developerName = developerNameField[rebateYear][formType];

  if (!developerName) return null;

  // `SELECT
  //   Id
  // FROM
  //   RecordType
  // WHERE
  //   DeveloperName = '${developerName}' AND
  //   SObjectType = 'Order_Request__c'
  // LIMIT 1`

  const formRecordTypeIdQuery = await bapConnection
    .sobject("RecordType")
    .find(
      {
        DeveloperName: developerName,
        SObjectType: "Order_Request__c",
      },
      {
        // "*": 1,
        Id: 1, // Salesforce record ID
      },
    )
    .limit(1)
    .execute(async (err, records) => ((await err) ? err : records));

  if (formRecordTypeIdQuery.length === 0) return null;

  const formRecordTypeId = formRecordTypeIdQuery["0"].Id;

  // `SELECT
  //   Id,
  //   UEI_EFTI_Combo_Key__c,
  //   CSB_Form_ID__c,
  //   CSB_Modified_Full_String__c,
  //   CSB_Review_Item_ID__c,
  //   Parent_Rebate_ID__c,
  //   Record_Type_Name__c,
  //   Rebate_Program_Year__c,
  //   Parent_CSB_Rebate__r.Id,
  //   Parent_CSB_Rebate__r.CSB_Funding_Request_Status__c,
  //   Parent_CSB_Rebate__r.CSB_Payment_Request_Status__c,
  //   Parent_CSB_Rebate__r.CSB_Closeout_Request_Status__c,
  //   Parent_CSB_Rebate__r.Reimbursement_Needed__c
  // FROM
  //   Order_Request__c
  // WHERE
  //   RecordTypeId = '${formRecordTypeId}' AND
  //   CSB_Form_ID__c = '${mongoId}'
  //   Latest_Version__c = TRUE`

  const formRecordQuery = await bapConnection
    .sobject("Order_Request__c")
    .find(
      {
        RecordTypeId: formRecordTypeId,
        ...(mongoId && { CSB_Form_ID__c: mongoId }),
        ...(rebateId && { Parent_Rebate_ID__c: rebateId }),
        Latest_Version__c: true,
      },
      {
        // "*": 1,
        Id: 1, // Salesforce record ID
        UEI_EFTI_Combo_Key__c: 1,
        CSB_Form_ID__c: 1, // MongoDB ObjectId string
        CSB_Modified_Full_String__c: 1, // ISO 8601 date time string
        CSB_Review_Item_ID__c: 1, // CSB Rebate ID with form/version ID (9 digits)
        Parent_Rebate_ID__c: 1, // CSB Rebate ID (6 digits)
        Record_Type_Name__c: 1, // 'CSB Funding Request' | 'CSB Payment Request' | 'CSB Close Out Request' | same three forms with rebate year (.e.g., 'CSB Funding Request 2023')
        Rebate_Program_Year__c: 1, // '2022' | '2023' | '2024'
        "Parent_CSB_Rebate__r.Id": 1,
        "Parent_CSB_Rebate__r.CSB_Funding_Request_Status__c": 1,
        "Parent_CSB_Rebate__r.CSB_Payment_Request_Status__c": 1,
        "Parent_CSB_Rebate__r.CSB_Closeout_Request_Status__c": 1,
        "Parent_CSB_Rebate__r.Reimbursement_Needed__c": 1,
      },
    )
    .execute(async (err, records) => ((await err) ? err : records));

  return formRecordQuery[0];
}

/**
 * Uses cached JSforce connection to query the BAP for form submissions statuses
 * and related metadata.
 *
 * @param {express.Request} req
 * @returns {Promise<BapFormSubmission[]>} collection of fields associated with each form submission
 */
async function queryForBapFormSubmissionsStatuses(req) {
  /** @type {{ bapComboKeys: string[] }} */
  const { bapComboKeys } = req;

  const logMessage =
    `Querying the BAP for form submissions statuses associated with ` +
    `combokeys: '${bapComboKeys}'.`;
  log({ level: "info", message: logMessage, req });

  /** @type {{ bapConnection: jsforce.Connection }} */
  const { bapConnection } = req.app.locals;

  // `SELECT
  //   Id,
  //   Parent_Rebate_ID__c
  // FROM
  //   Order_Request__c
  // WHERE
  //   (${bapComboKeys
  //     .map((key) => `UEI_EFTI_Combo_Key__c = '${key}'`)
  //     .join(" OR ")}) AND
  //   Latest_Version__c = TRUE
  // ORDER BY
  //   CreatedDate DESC`

  const csbRebateIdsQuery = await bapConnection
    .sobject("Order_Request__c")
    .find(
      {
        UEI_EFTI_Combo_Key__c: { $in: bapComboKeys },
        Latest_Version__c: true,
      },
      {
        // "*": 1,
        Id: 1, // Salesforce record ID
        Parent_Rebate_ID__c: 1, // CSB Rebate ID (6 digits)
      },
    )
    .sort({ CreatedDate: -1 })
    .execute(async (err, records) => ((await err) ? err : records));

  const csbRebateIds = Array.isArray(csbRebateIdsQuery)
    ? csbRebateIdsQuery.map((item) => item.Parent_Rebate_ID__c)
    : [];

  if (csbRebateIds.length === 0) return [];

  // `SELECT
  //   Id,
  //   UEI_EFTI_Combo_Key__c,
  //   CSB_Form_ID__c,
  //   CSB_Modified_Full_String__c,
  //   CSB_Review_Item_ID__c,
  //   Parent_Rebate_ID__c,
  //   Record_Type_Name__c,
  //   Rebate_Program_Year__c,
  //   Parent_CSB_Rebate__r.Id,
  //   Parent_CSB_Rebate__r.CSB_Funding_Request_Status__c,
  //   Parent_CSB_Rebate__r.CSB_Payment_Request_Status__c,
  //   Parent_CSB_Rebate__r.CSB_Closeout_Request_Status__c,
  //   Parent_CSB_Rebate__r.Reimbursement_Needed__c
  // FROM
  //   Order_Request__c
  // WHERE
  //   (${csbRebateIds
  //     .map((id) => `Parent_CSB_Rebate__r.CSB_Rebate_ID__c = '${id}'`)
  //     .join(" OR ")}) AND
  //   Latest_Version__c = TRUE
  // ORDER BY
  //   CreatedDate DESC`

  const submissions = await bapConnection
    .sobject("Order_Request__c")
    .find(
      {
        "Parent_CSB_Rebate__r.CSB_Rebate_ID__c": { $in: csbRebateIds },
        Latest_Version__c: true,
      },
      {
        // "*": 1,
        Id: 1, // Salesforce record ID
        UEI_EFTI_Combo_Key__c: 1,
        CSB_Form_ID__c: 1, // MongoDB ObjectId string
        CSB_Modified_Full_String__c: 1, // ISO 8601 date time string
        CSB_Review_Item_ID__c: 1, // CSB Rebate ID with form/version ID (9 digits)
        Parent_Rebate_ID__c: 1, // CSB Rebate ID (6 digits)
        Record_Type_Name__c: 1, // 'CSB Funding Request' | 'CSB Payment Request' | 'CSB Close Out Request' | 'CSB Funding Request 2023' | 'CSB Payment Request 2023' | 'CSB Close Out Request 2023'
        Rebate_Program_Year__c: 1, // '2022' | '2023' | '2024'
        "Parent_CSB_Rebate__r.Id": 1,
        "Parent_CSB_Rebate__r.CSB_Funding_Request_Status__c": 1,
        "Parent_CSB_Rebate__r.CSB_Payment_Request_Status__c": 1,
        "Parent_CSB_Rebate__r.CSB_Closeout_Request_Status__c": 1,
        "Parent_CSB_Rebate__r.Reimbursement_Needed__c": 1,
      },
    )
    .sort({ CreatedDate: -1 })
    .execute(async (err, records) => ((await err) ? err : records));

  return submissions;
}

/**
 * Uses cached JSforce connection to query the BAP for 2022 FRF submission data,
 * for use in a brand new 2022 PRF submission.
 *
 * @param {express.Request} req
 * @param {string} frfReviewItemId CSB Rebate ID with the form/version ID (9 digits)
 * @returns {Promise<BapDataFor2022PRF>} 2022 FRF submission fields
 */
async function queryBapFor2022PRFData(req, frfReviewItemId) {
  const logMessage =
    `Querying the BAP for 2022 FRF submission associated with ` +
    `FRF Review Item ID: '${frfReviewItemId}'.`;
  log({ level: "info", message: logMessage, req });

  /** @type {{ bapConnection: jsforce.Connection }} */
  const { bapConnection } = req.app.locals;

  // `SELECT
  //   Id
  // FROM
  //   RecordType
  // WHERE
  //   DeveloperName = 'CSB_Funding_Request' AND
  //   SObjectType = 'Order_Request__c'
  // LIMIT 1`

  const frf2022RecordTypeIdQuery = await bapConnection
    .sobject("RecordType")
    .find(
      {
        DeveloperName: "CSB_Funding_Request",
        SObjectType: "Order_Request__c",
      },
      {
        // "*": 1,
        Id: 1, // Salesforce record ID
      },
    )
    .limit(1)
    .execute(async (err, records) => ((await err) ? err : records));

  const frf2022RecordTypeId = frf2022RecordTypeIdQuery["0"].Id;

  // `SELECT
  //   Id,
  //   UEI_EFTI_Combo_Key__c,
  //   CSB_NCES_ID__c,
  //   Primary_Applicant__r.Id,
  //   Primary_Applicant__r.Name,
  //   Primary_Applicant__r.Title,
  //   Primary_Applicant__r.Phone,
  //   Primary_Applicant__r.Email,
  //   Alternate_Applicant__r.Id,
  //   Alternate_Applicant__r.Name,
  //   Alternate_Applicant__r.Title,
  //   Alternate_Applicant__r.Phone,
  //   Alternate_Applicant__r.Email,
  //   Applicant_Organization__r.Id,
  //   Applicant_Organization__r.Name,
  //   CSB_School_District__r.Id,
  //   CSB_School_District__r.Name,
  //   Fleet_Name__c,
  //   School_District_Prioritized__c,
  //   Total_Rebate_Funds_Requested__c,
  //   Total_Infrastructure_Funds__c
  // FROM
  //   Order_Request__c
  // WHERE
  //   RecordTypeId = '${frf2022RecordTypeId}' AND
  //   CSB_Review_Item_ID__c = '${frfReviewItemId}' AND
  //   Latest_Version__c = TRUE`

  const frf2022RecordQuery = await bapConnection
    .sobject("Order_Request__c")
    .find(
      {
        RecordTypeId: frf2022RecordTypeId,
        CSB_Review_Item_ID__c: frfReviewItemId,
        Latest_Version__c: true,
      },
      {
        // "*": 1,
        Id: 1, // Salesforce record ID
        UEI_EFTI_Combo_Key__c: 1,
        CSB_NCES_ID__c: 1,
        "Primary_Applicant__r.Id": 1,
        "Primary_Applicant__r.Name": 1,
        "Primary_Applicant__r.Title": 1,
        "Primary_Applicant__r.Phone": 1,
        "Primary_Applicant__r.Email": 1,
        "Alternate_Applicant__r.Id": 1,
        "Alternate_Applicant__r.Name": 1,
        "Alternate_Applicant__r.Title": 1,
        "Alternate_Applicant__r.Phone": 1,
        "Alternate_Applicant__r.Email": 1,
        "Applicant_Organization__r.Id": 1,
        "Applicant_Organization__r.Name": 1,
        "CSB_School_District__r.Id": 1,
        "CSB_School_District__r.Name": 1,
        Fleet_Name__c: 1,
        School_District_Prioritized__c: 1,
        Total_Rebate_Funds_Requested__c: 1,
        Total_Infrastructure_Funds__c: 1,
      },
    )
    .execute(async (err, records) => ((await err) ? err : records));

  const frf2022RecordId = frf2022RecordQuery["0"].Id;

  // `SELECT
  //   Id
  // FROM
  //   RecordType
  // WHERE
  //   DeveloperName = 'CSB_Rebate_Item' AND
  //   SObjectType = 'Line_Item__c'
  // LIMIT 1`

  const rebateItemRecordTypeIdQuery = await bapConnection
    .sobject("RecordType")
    .find(
      {
        DeveloperName: "CSB_Rebate_Item",
        SObjectType: "Line_Item__c",
      },
      {
        // "*": 1,
        Id: 1, // Salesforce record ID
      },
    )
    .limit(1)
    .execute(async (err, records) => ((await err) ? err : records));

  const rebateItemRecordTypeId = rebateItemRecordTypeIdQuery["0"].Id;

  // `SELECT
  //   Id,
  //   Rebate_Item_num__c,
  //   CSB_VIN__c,
  //   CSB_Model_Year__c,
  //   CSB_Fuel_Type__c,
  //   CSB_Replacement_Fuel_Type__c,
  //   CSB_Funds_Requested__c
  // FROM
  //   Line_Item__c
  // WHERE
  //   RecordTypeId = '${rebateItemRecordTypeId}' AND
  //   Related_Order_Request__c = '${frf2022RecordId}' AND
  //   CSB_Rebate_Item_Type__c = 'Old Bus'`

  const frf2022BusRecordsQuery = await bapConnection
    .sobject("Line_Item__c")
    .find(
      {
        RecordTypeId: rebateItemRecordTypeId,
        Related_Order_Request__c: frf2022RecordId,
        CSB_Rebate_Item_Type__c: "Old Bus",
      },
      {
        // "*": 1,
        Id: 1, // Salesforce record ID
        Rebate_Item_num__c: 1,
        CSB_VIN__c: 1,
        CSB_Model_Year__c: 1,
        CSB_Fuel_Type__c: 1,
        CSB_Replacement_Fuel_Type__c: 1,
        CSB_Funds_Requested__c: 1,
      },
    )
    .execute(async (err, records) => ((await err) ? err : records));

  return { frf2022RecordQuery, frf2022BusRecordsQuery };
}

/**
 * Uses cached JSforce connection to query the BAP for 2023 FRF submission data,
 * for use in a brand new 2023 PRF submission.
 *
 * @param {express.Request} req
 * @param {string} frfReviewItemId CSB Rebate ID with the form/version ID (9 digits)
 * @returns {Promise<BapDataFor2023PRF>} 2023 FRF submission fields
 */
async function queryBapFor2023PRFData(req, frfReviewItemId) {
  const logMessage =
    `Querying the BAP for 2023 FRF submission associated with ` +
    `FRF Review Item ID: '${frfReviewItemId}'.`;
  log({ level: "info", message: logMessage, req });

  /** @type {{ bapConnection: jsforce.Connection }} */
  const { bapConnection } = req.app.locals;

  // `SELECT
  //   Id
  // FROM
  //   RecordType
  // WHERE
  //   DeveloperName = 'CSB_Funding_Request_2023' AND
  //   SObjectType = 'Order_Request__c'
  // LIMIT 1`

  const frf2023RecordTypeIdQuery = await bapConnection
    .sobject("RecordType")
    .find(
      {
        DeveloperName: "CSB_Funding_Request_2023",
        SObjectType: "Order_Request__c",
      },
      {
        // "*": 1,
        Id: 1, // Salesforce record ID
      },
    )
    .limit(1)
    .execute(async (err, records) => ((await err) ? err : records));

  const frf2023RecordTypeId = frf2023RecordTypeIdQuery["0"].Id;

  // `SELECT
  //   Id,
  //   CSB_Snapshot__r.Id,
  //   CSB_Snapshot__r.JSON_Snapshot__c
  //   Applicant_Organization__r.Id
  //   Applicant_Organization__r.County__c
  //   Primary_Applicant__r.Id,
  //   Primary_Applicant__r.FirstName,
  //   Primary_Applicant__r.LastName,
  //   Primary_Applicant__r.Title,
  //   Primary_Applicant__r.Email,
  //   Primary_Applicant__r.Phone,
  //   Alternate_Applicant__r.Id,
  //   Alternate_Applicant__r.FirstName,
  //   Alternate_Applicant__r.LastName,
  //   Alternate_Applicant__r.Title,
  //   Alternate_Applicant__r.Email,
  //   Alternate_Applicant__r.Phone,
  //   CSB_School_District__r.Id,
  //   CSB_School_District__r.Name,
  //   CSB_School_District__r.BillingStreet,
  //   CSB_School_District__r.BillingCity,
  //   CSB_School_District__r.BillingState,
  //   CSB_School_District__r.BillingPostalCode,
  //   School_District_Contact__r.Id,
  //   School_District_Contact__r.FirstName,
  //   School_District_Contact__r.LastName,
  //   School_District_Contact__r.Title,
  //   School_District_Contact__r.Email,
  //   School_District_Contact__r.Phone,
  //   CSB_NCES_ID__c,
  //   Org_District_Prioritized__c,
  //   Self_Certification_Category__c,
  //   Prioritized_as_High_Need__c,
  //   Prioritized_as_Tribal__c,
  //   Prioritized_as_Rural__c
  // FROM
  //   Order_Request__c
  // WHERE
  //   RecordTypeId = '${frf2023RecordTypeId}' AND
  //   CSB_Review_Item_ID__c = '${frfReviewItemId}' AND
  //   Latest_Version__c = TRUE`

  const frf2023RecordQuery = await bapConnection
    .sobject("Order_Request__c")
    .find(
      {
        RecordTypeId: frf2023RecordTypeId,
        CSB_Review_Item_ID__c: frfReviewItemId,
        Latest_Version__c: true,
      },
      {
        // "*": 1,
        Id: 1, // Salesforce record ID
        "CSB_Snapshot__r.Id": 1,
        "CSB_Snapshot__r.JSON_Snapshot__c": 1,
        "Applicant_Organization__r.Id": 1,
        "Applicant_Organization__r.County__c": 1,
        "Primary_Applicant__r.Id": 1,
        "Primary_Applicant__r.FirstName": 1,
        "Primary_Applicant__r.LastName": 1,
        "Primary_Applicant__r.Title": 1,
        "Primary_Applicant__r.Email": 1,
        "Primary_Applicant__r.Phone": 1,
        "Alternate_Applicant__r.Id": 1,
        "Alternate_Applicant__r.FirstName": 1,
        "Alternate_Applicant__r.LastName": 1,
        "Alternate_Applicant__r.Title": 1,
        "Alternate_Applicant__r.Email": 1,
        "Alternate_Applicant__r.Phone": 1,
        "CSB_School_District__r.Id": 1,
        "CSB_School_District__r.Name": 1,
        "CSB_School_District__r.BillingStreet": 1,
        "CSB_School_District__r.BillingCity": 1,
        "CSB_School_District__r.BillingState": 1,
        "CSB_School_District__r.BillingPostalCode": 1,
        "School_District_Contact__r.Id": 1,
        "School_District_Contact__r.FirstName": 1,
        "School_District_Contact__r.LastName": 1,
        "School_District_Contact__r.Title": 1,
        "School_District_Contact__r.Email": 1,
        "School_District_Contact__r.Phone": 1,
        CSB_NCES_ID__c: 1,
        Org_District_Prioritized__c: 1,
        Self_Certification_Category__c: 1,
        Prioritized_as_High_Need__c: 1,
        Prioritized_as_Tribal__c: 1,
        Prioritized_as_Rural__c: 1,
      },
    )
    .execute(async (err, records) => ((await err) ? err : records));

  const frf2023RecordId = frf2023RecordQuery["0"].Id;

  // `SELECT
  //   Id
  // FROM
  //   RecordType
  // WHERE
  //   DeveloperName = 'CSB_Rebate_Item' AND
  //   SObjectType = 'Line_Item__c'
  // LIMIT 1`

  const rebateItemRecordTypeIdQuery = await bapConnection
    .sobject("RecordType")
    .find(
      {
        DeveloperName: "CSB_Rebate_Item",
        SObjectType: "Line_Item__c",
      },
      {
        // "*": 1,
        Id: 1, // Salesforce record ID
      },
    )
    .limit(1)
    .execute(async (err, records) => ((await err) ? err : records));

  const rebateItemRecordTypeId = rebateItemRecordTypeIdQuery["0"].Id;

  // `SELECT
  //   Id,
  //   Rebate_Item_num__c,
  //   CSB_VIN__c,
  //   CSB_Fuel_Type__c,
  //   CSB_GVWR__c,
  //   Old_Bus_Odometer_miles__c,
  //   Old_Bus_NCES_District_ID__c,
  //   CSB_Model__c,
  //   CSB_Model_Year__c,
  //   CSB_Manufacturer__c,
  //   CSB_Manufacturer_if_Other__c,
  //   CSB_Annual_Fuel_Consumption__c,
  //   Annual_Mileage__c,
  //   Old_Bus_Estimated_Remaining_Life__c,
  //   Old_Bus_Annual_Idling_Hours__c,
  //   New_Bus_Infra_Rebate_Requested__c,
  //   New_Bus_Fuel_Type__c,
  //   New_Bus_GVWR__c,
  //   New_Bus_ADA_Compliant__c
  // FROM
  //   Line_Item__c
  // WHERE
  //   RecordTypeId = '${rebateItemRecordTypeId}' AND
  //   Related_Order_Request__c = '${frf2023RecordId}' AND
  //   CSB_Rebate_Item_Type__c = 'Old Bus'`

  const frf2023BusRecordsQuery = await bapConnection
    .sobject("Line_Item__c")
    .find(
      {
        RecordTypeId: rebateItemRecordTypeId,
        Related_Order_Request__c: frf2023RecordId,
        CSB_Rebate_Item_Type__c: "Old Bus",
      },
      {
        // "*": 1,
        Id: 1, // Salesforce record ID
        Rebate_Item_num__c: 1,
        CSB_VIN__c: 1,
        CSB_Fuel_Type__c: 1,
        CSB_GVWR__c: 1,
        Old_Bus_Odometer_miles__c: 1,
        Old_Bus_NCES_District_ID__c: 1,
        CSB_Model__c: 1,
        CSB_Model_Year__c: 1,
        CSB_Manufacturer__c: 1,
        CSB_Manufacturer_if_Other__c: 1,
        CSB_Annual_Fuel_Consumption__c: 1,
        Annual_Mileage__c: 1,
        Old_Bus_Estimated_Remaining_Life__c: 1,
        Old_Bus_Annual_Idling_Hours__c: 1,
        New_Bus_Infra_Rebate_Requested__c: 1,
        New_Bus_Fuel_Type__c: 1,
        New_Bus_GVWR__c: 1,
        New_Bus_ADA_Compliant__c: 1,
      },
    )
    .execute(async (err, records) => ((await err) ? err : records));

  const frf2023BusRecordsContactsQueries = (
    await Promise.all(
      frf2023BusRecordsQuery.map(async (frf2023BusRecord) => {
        const frf2023BusRecordId = frf2023BusRecord.Id;

        // `SELECT
        //   Id,
        //   Related_Line_Item__c,
        //   Relationship_Type__c,
        //   Contact__r.Id,
        //   Contact__r.FirstName,
        //   Contact__r.LastName
        //   Contact__r.Title,
        //   Contact__r.Email,
        //   Contact__r.Phone,
        //   Contact__r.Account.Id,
        //   Contact__r.Account.Name,
        //   Contact__r.Account.BillingStreet,
        //   Contact__r.Account.BillingCity,
        //   Contact__r.Account.BillingState,
        //   Contact__r.Account.BillingPostalCode,
        //   Contact__r.Account.County__c,
        // FROM
        //   Line_Item__c
        // WHERE
        //   RecordTypeId = '${rebateItemRecordTypeId}' AND
        //   Related_Line_Item__c = '${frf2023BusRecordId}' AND
        //   CSB_Rebate_Item_Type__c = 'COF Relationship'`

        return await bapConnection
          .sobject("Line_Item__c")
          .find(
            {
              RecordTypeId: rebateItemRecordTypeId,
              Related_Line_Item__c: frf2023BusRecordId,
              CSB_Rebate_Item_Type__c: "COF Relationship",
            },
            {
              // "*": 1,
              Id: 1, // Salesforce record ID
              Related_Line_Item__c: 1,
              Relationship_Type__c: 1,
              "Contact__r.Id": 1,
              "Contact__r.FirstName": 1,
              "Contact__r.LastName": 1,
              "Contact__r.Title": 1,
              "Contact__r.Email": 1,
              "Contact__r.Phone": 1,
              "Contact__r.Account.Id": 1,
              "Contact__r.Account.Name": 1,
              "Contact__r.Account.BillingStreet": 1,
              "Contact__r.Account.BillingCity": 1,
              "Contact__r.Account.BillingState": 1,
              "Contact__r.Account.BillingPostalCode": 1,
              "Contact__r.Account.County__c": 1,
            },
          )
          .execute(async (err, records) => ((await err) ? err : records));
      }),
    )
  ).flat();

  return {
    frf2023RecordQuery,
    frf2023BusRecordsQuery,
    frf2023BusRecordsContactsQueries,
  };
}

/**
 * Uses cached JSforce connection to query the BAP for 2024 FRF submission data,
 * for use in a brand new 2024 PRF submission.
 *
 * @param {express.Request} req
 * @param {string} frfReviewItemId CSB Rebate ID with the form/version ID (9 digits)
 * @returns {Promise<BapDataFor2024PRF>} 2024 FRF submission fields
 */
async function queryBapFor2024PRFData(req, frfReviewItemId) {
  const logMessage =
    `Querying the BAP for 2024 FRF submission associated with ` +
    `FRF Review Item ID: '${frfReviewItemId}'.`;
  log({ level: "info", message: logMessage, req });

  /** @type {{ bapConnection: jsforce.Connection }} */
  const { bapConnection } = req.app.locals;

  // `SELECT
  //   Id
  // FROM
  //   RecordType
  // WHERE
  //   DeveloperName = 'CSB_Funding_Request_2024' AND
  //   SObjectType = 'Order_Request__c'
  // LIMIT 1`

  const frf2024RecordTypeIdQuery = await bapConnection
    .sobject("RecordType")
    .find(
      {
        DeveloperName: "CSB_Funding_Request_2024",
        SObjectType: "Order_Request__c",
      },
      {
        // "*": 1,
        Id: 1, // Salesforce record ID
      },
    )
    .limit(1)
    .execute(async (err, records) => ((await err) ? err : records));

  const frf2024RecordTypeId = frf2024RecordTypeIdQuery["0"].Id;

  // `SELECT
  //   Id,
  //   CSB_Snapshot__r.Id,
  //   CSB_Snapshot__r.JSON_Snapshot__c
  //   Applicant_Organization__r.Id
  //   Applicant_Organization__r.County__c
  //   Primary_Applicant__r.Id,
  //   Primary_Applicant__r.FirstName,
  //   Primary_Applicant__r.LastName,
  //   Primary_Applicant__r.Title,
  //   Primary_Applicant__r.Email,
  //   Primary_Applicant__r.Phone,
  //   Alternate_Applicant__r.Id,
  //   Alternate_Applicant__r.FirstName,
  //   Alternate_Applicant__r.LastName,
  //   Alternate_Applicant__r.Title,
  //   Alternate_Applicant__r.Email,
  //   Alternate_Applicant__r.Phone,
  //   CSB_School_District__r.Id,
  //   CSB_School_District__r.Name,
  //   CSB_School_District__r.BillingStreet,
  //   CSB_School_District__r.BillingCity,
  //   CSB_School_District__r.BillingState,
  //   CSB_School_District__r.BillingPostalCode,
  //   School_District_Contact__r.Id,
  //   School_District_Contact__r.FirstName,
  //   School_District_Contact__r.LastName,
  //   School_District_Contact__r.Title,
  //   School_District_Contact__r.Email,
  //   School_District_Contact__r.Phone,
  //   CSB_NCES_ID__c,
  //   Org_District_Prioritized__c,
  //   Self_Certification_Category__c,
  //   Prioritized_as_High_Need__c,
  //   Prioritized_as_Tribal__c,
  //   Prioritized_as_Rural__c
  // FROM
  //   Order_Request__c
  // WHERE
  //   RecordTypeId = '${frf2024RecordTypeId}' AND
  //   CSB_Review_Item_ID__c = '${frfReviewItemId}' AND
  //   Latest_Version__c = TRUE`

  const frf2024RecordQuery = await bapConnection
    .sobject("Order_Request__c")
    .find(
      {
        RecordTypeId: frf2024RecordTypeId,
        CSB_Review_Item_ID__c: frfReviewItemId,
        Latest_Version__c: true,
      },
      {
        // "*": 1,
        Id: 1, // Salesforce record ID
        "CSB_Snapshot__r.Id": 1,
        "CSB_Snapshot__r.JSON_Snapshot__c": 1,
        "Applicant_Organization__r.Id": 1,
        "Applicant_Organization__r.County__c": 1,
        "Primary_Applicant__r.Id": 1,
        "Primary_Applicant__r.FirstName": 1,
        "Primary_Applicant__r.LastName": 1,
        "Primary_Applicant__r.Title": 1,
        "Primary_Applicant__r.Email": 1,
        "Primary_Applicant__r.Phone": 1,
        "Alternate_Applicant__r.Id": 1,
        "Alternate_Applicant__r.FirstName": 1,
        "Alternate_Applicant__r.LastName": 1,
        "Alternate_Applicant__r.Title": 1,
        "Alternate_Applicant__r.Email": 1,
        "Alternate_Applicant__r.Phone": 1,
        "CSB_School_District__r.Id": 1,
        "CSB_School_District__r.Name": 1,
        "CSB_School_District__r.BillingStreet": 1,
        "CSB_School_District__r.BillingCity": 1,
        "CSB_School_District__r.BillingState": 1,
        "CSB_School_District__r.BillingPostalCode": 1,
        "School_District_Contact__r.Id": 1,
        "School_District_Contact__r.FirstName": 1,
        "School_District_Contact__r.LastName": 1,
        "School_District_Contact__r.Title": 1,
        "School_District_Contact__r.Email": 1,
        "School_District_Contact__r.Phone": 1,
        CSB_NCES_ID__c: 1,
        Org_District_Prioritized__c: 1,
        Self_Certification_Category__c: 1,
        Prioritized_as_High_Need__c: 1,
        Prioritized_as_Tribal__c: 1,
        Prioritized_as_Rural__c: 1,
      },
    )
    .execute(async (err, records) => ((await err) ? err : records));

  const frf2024RecordId = frf2024RecordQuery["0"].Id;

  // `SELECT
  //   Id
  // FROM
  //   RecordType
  // WHERE
  //   DeveloperName = 'CSB_Rebate_Item' AND
  //   SObjectType = 'Line_Item__c'
  // LIMIT 1`

  const rebateItemRecordTypeIdQuery = await bapConnection
    .sobject("RecordType")
    .find(
      {
        DeveloperName: "CSB_Rebate_Item",
        SObjectType: "Line_Item__c",
      },
      {
        // "*": 1,
        Id: 1, // Salesforce record ID
      },
    )
    .limit(1)
    .execute(async (err, records) => ((await err) ? err : records));

  const rebateItemRecordTypeId = rebateItemRecordTypeIdQuery["0"].Id;

  // `SELECT
  //   Id,
  //   Rebate_Item_num__c,
  //   CSB_VIN__c,
  //   CSB_Fuel_Type__c,
  //   CSB_GVWR__c,
  //   Old_Bus_Odometer_miles__c,
  //   Old_Bus_NCES_District_ID__c,
  //   CSB_Model__c,
  //   CSB_Model_Year__c,
  //   CSB_Manufacturer__c,
  //   CSB_Manufacturer_if_Other__c,
  //   CSB_Annual_Fuel_Consumption__c,
  //   Old_Bus_Average_Annual_Mileage__c,
  //   Old_Bus_Estimated_Remaining_Life__c,
  //   Old_Bus_Annual_Idling_Hours__c,
  //   New_Bus_Infra_Rebate_Requested__c,
  //   New_Bus_Fuel_Type__c,
  //   New_Bus_GVWR__c,
  //   New_Bus_ADA_Compliant__c
  // FROM
  //   Line_Item__c
  // WHERE
  //   RecordTypeId = '${rebateItemRecordTypeId}' AND
  //   Related_Order_Request__c = '${frf2024RecordId}' AND
  //   CSB_Rebate_Item_Type__c = 'Old Bus'`

  const frf2024BusRecordsQuery = await bapConnection
    .sobject("Line_Item__c")
    .find(
      {
        RecordTypeId: rebateItemRecordTypeId,
        Related_Order_Request__c: frf2024RecordId,
        CSB_Rebate_Item_Type__c: "Old Bus",
      },
      {
        // "*": 1,
        Id: 1, // Salesforce record ID
        Rebate_Item_num__c: 1,
        CSB_VIN__c: 1,
        CSB_Fuel_Type__c: 1,
        CSB_GVWR__c: 1,
        Old_Bus_Odometer_miles__c: 1,
        Old_Bus_NCES_District_ID__c: 1,
        CSB_Model__c: 1,
        CSB_Model_Year__c: 1,
        CSB_Manufacturer__c: 1,
        CSB_Manufacturer_if_Other__c: 1,
        CSB_Annual_Fuel_Consumption__c: 1,
        Old_Bus_Average_Annual_Mileage__c: 1,
        Old_Bus_Estimated_Remaining_Life__c: 1,
        Old_Bus_Annual_Idling_Hours__c: 1,
        New_Bus_Infra_Rebate_Requested__c: 1,
        New_Bus_Fuel_Type__c: 1,
        New_Bus_GVWR__c: 1,
        New_Bus_ADA_Compliant__c: 1,
      },
    )
    .execute(async (err, records) => ((await err) ? err : records));

  const frf2024BusRecordsContactsQueries = (
    await Promise.all(
      frf2024BusRecordsQuery.map(async (frf2024BusRecord) => {
        const frf2024BusRecordId = frf2024BusRecord.Id;

        // `SELECT
        //   Id,
        //   Related_Line_Item__c,
        //   Relationship_Type__c,
        //   Contact__r.Id,
        //   Contact__r.FirstName,
        //   Contact__r.LastName
        //   Contact__r.Title,
        //   Contact__r.Email,
        //   Contact__r.Phone,
        //   Contact__r.Account.Id,
        //   Contact__r.Account.Name,
        //   Contact__r.Account.BillingStreet,
        //   Contact__r.Account.BillingCity,
        //   Contact__r.Account.BillingState,
        //   Contact__r.Account.BillingPostalCode,
        //   Contact__r.Account.County__c,
        // FROM
        //   Line_Item__c
        // WHERE
        //   RecordTypeId = '${rebateItemRecordTypeId}' AND
        //   Related_Line_Item__c = '${frf2024BusRecordId}' AND
        //   CSB_Rebate_Item_Type__c = 'COF Relationship'`

        return await bapConnection
          .sobject("Line_Item__c")
          .find(
            {
              RecordTypeId: rebateItemRecordTypeId,
              Related_Line_Item__c: frf2024BusRecordId,
              CSB_Rebate_Item_Type__c: "COF Relationship",
            },
            {
              // "*": 1,
              Id: 1, // Salesforce record ID
              Related_Line_Item__c: 1,
              Relationship_Type__c: 1,
              "Contact__r.Id": 1,
              "Contact__r.FirstName": 1,
              "Contact__r.LastName": 1,
              "Contact__r.Title": 1,
              "Contact__r.Email": 1,
              "Contact__r.Phone": 1,
              "Contact__r.Account.Id": 1,
              "Contact__r.Account.Name": 1,
              "Contact__r.Account.BillingStreet": 1,
              "Contact__r.Account.BillingCity": 1,
              "Contact__r.Account.BillingState": 1,
              "Contact__r.Account.BillingPostalCode": 1,
              "Contact__r.Account.County__c": 1,
            },
          )
          .execute(async (err, records) => ((await err) ? err : records));
      }),
    )
  ).flat();

  return {
    frf2024RecordQuery,
    frf2024BusRecordsQuery,
    frf2024BusRecordsContactsQueries,
  };
}

/**
 * Uses cached JSforce connection to query the BAP for 2022 FRF submission data
 * and 2022 PRF submission data, for use in a brand new 2022 CRF submission.
 *
 * @param {express.Request} req
 * @param {string} frfReviewItemId CSB Rebate ID with the form/version ID (9 digits)
 * @param {string} prfReviewItemId CSB Rebate ID with the form/version ID (9 digits)
 * @returns {Promise<BapDataFor2022CRF>} 2022 FRF and 2022 PRF submission fields
 */
async function queryBapFor2022CRFData(req, frfReviewItemId, prfReviewItemId) {
  const logMessage =
    `Querying the BAP for 2022 FRF submission associated with ` +
    `FRF Review Item ID: '${frfReviewItemId}' ` +
    `and 2022 PRF submission associated with ` +
    `PRF Review Item ID: '${prfReviewItemId}'.`;
  log({ level: "info", message: logMessage, req });

  /** @type {{ bapConnection: jsforce.Connection }} */
  const { bapConnection } = req.app.locals;

  // `SELECT
  //   Id
  // FROM
  //   RecordType
  // WHERE
  //   DeveloperName = 'CSB_Funding_Request' AND
  //   SObjectType = 'Order_Request__c'
  // LIMIT 1`

  const frf2022RecordTypeIdQuery = await bapConnection
    .sobject("RecordType")
    .find(
      {
        DeveloperName: "CSB_Funding_Request",
        SObjectType: "Order_Request__c",
      },
      {
        // "*": 1,
        Id: 1, // Salesforce record ID
      },
    )
    .limit(1)
    .execute(async (err, records) => ((await err) ? err : records));

  const frf2022RecordTypeId = frf2022RecordTypeIdQuery["0"].Id;

  // `SELECT
  //   Id,
  //   Fleet_Name__c,
  //   Fleet_Street_Address__c,
  //   Fleet_City__c,
  //   Fleet_State__c,
  //   Fleet_Zip__c,
  //   Fleet_Contact_Name__c,
  //   Fleet_Contact_Title__c,
  //   Fleet_Contact_Phone__c,
  //   Fleet_Contact_Email__c,
  //   School_District_Contact__r.Id,
  //   School_District_Contact__r.FirstName,
  //   School_District_Contact__r.LastName
  // FROM
  //   Order_Request__c
  // WHERE
  //   RecordTypeId = '${frf2022RecordTypeId}' AND
  //   CSB_Review_Item_ID__c = '${frfReviewItemId}' AND
  //   Latest_Version__c = TRUE`

  const frf2022RecordQuery = await bapConnection
    .sobject("Order_Request__c")
    .find(
      {
        RecordTypeId: frf2022RecordTypeId,
        CSB_Review_Item_ID__c: frfReviewItemId,
        Latest_Version__c: true,
      },
      {
        // "*": 1,
        Id: 1, // Salesforce record ID
        Fleet_Name__c: 1,
        Fleet_Street_Address__c: 1,
        Fleet_City__c: 1,
        Fleet_State__c: 1,
        Fleet_Zip__c: 1,
        Fleet_Contact_Name__c: 1,
        Fleet_Contact_Title__c: 1,
        Fleet_Contact_Phone__c: 1,
        Fleet_Contact_Email__c: 1,
        "School_District_Contact__r.Id": 1,
        "School_District_Contact__r.FirstName": 1,
        "School_District_Contact__r.LastName": 1,
      },
    )
    .execute(async (err, records) => ((await err) ? err : records));

  // `SELECT
  //   Id
  // FROM
  //   RecordType
  // WHERE
  //   DeveloperName = 'CSB_Payment_Request' AND
  //   SObjectType = 'Order_Request__c'
  // LIMIT 1`

  const prf2022RecordTypeIdQuery = await bapConnection
    .sobject("RecordType")
    .find(
      {
        DeveloperName: "CSB_Payment_Request",
        SObjectType: "Order_Request__c",
      },
      {
        // "*": 1,
        Id: 1, // Salesforce record ID
      },
    )
    .limit(1)
    .execute(async (err, records) => ((await err) ? err : records));

  const prf2022RecordTypeId = prf2022RecordTypeIdQuery["0"].Id;

  // `SELECT
  //   Id,
  //   UEI_EFTI_Combo_Key__c,
  //   CSB_NCES_ID__c,
  //   Primary_Applicant__r.Id,
  //   Primary_Applicant__r.FirstName,
  //   Primary_Applicant__r.LastName,
  //   Primary_Applicant__r.Title,
  //   Primary_Applicant__r.Phone,
  //   Primary_Applicant__r.Email,
  //   Alternate_Applicant__r.Id,
  //   Alternate_Applicant__r.FirstName,
  //   Alternate_Applicant__r.LastName,
  //   Alternate_Applicant__r.Title,
  //   Alternate_Applicant__r.Phone,
  //   Alternate_Applicant__r.Email,
  //   Applicant_Organization__r.Id,
  //   Applicant_Organization__r.Name,
  //   CSB_School_District__r.Id,
  //   CSB_School_District__r.Name,
  //   School_District_Prioritized__c,
  //   Total_Rebate_Funds_Requested_PO__c,
  //   Total_Bus_And_Infrastructure_Rebate__c,
  //   Total_Infrastructure_Funds__c,
  //   Num_Of_Buses_Requested_From_Application__c,
  //   Total_Price_All_Buses__c,
  //   Total_Bus_Rebate_Amount__c,
  //   Total_All_Eligible_Infrastructure_Costs__c,
  //   Total_Infrastructure_Rebate__c,
  //   Total_Level_2_Charger_Costs__c,
  //   Total_DC_Fast_Charger_Costs__c,
  //   Total_Other_Infrastructure_Costs__c
  // FROM
  //   Order_Request__c
  // WHERE
  //   RecordTypeId = '${prf2022RecordTypeId}' AND
  //   CSB_Review_Item_ID__c = '${prfReviewItemId}' AND
  //   Latest_Version__c = TRUE`

  const prf2022RecordQuery = await bapConnection
    .sobject("Order_Request__c")
    .find(
      {
        RecordTypeId: prf2022RecordTypeId,
        CSB_Review_Item_ID__c: prfReviewItemId,
        Latest_Version__c: true,
      },
      {
        // "*": 1,
        Id: 1, // Salesforce record ID
        UEI_EFTI_Combo_Key__c: 1,
        CSB_NCES_ID__c: 1,
        "Primary_Applicant__r.Id": 1,
        "Primary_Applicant__r.FirstName": 1,
        "Primary_Applicant__r.LastName": 1,
        "Primary_Applicant__r.Title": 1,
        "Primary_Applicant__r.Phone": 1,
        "Primary_Applicant__r.Email": 1,
        "Alternate_Applicant__r.Id": 1,
        "Alternate_Applicant__r.FirstName": 1,
        "Alternate_Applicant__r.LastName": 1,
        "Alternate_Applicant__r.Title": 1,
        "Alternate_Applicant__r.Phone": 1,
        "Alternate_Applicant__r.Email": 1,
        "Applicant_Organization__r.Id": 1,
        "Applicant_Organization__r.Name": 1,
        "CSB_School_District__r.Id": 1,
        "CSB_School_District__r.Name": 1,
        School_District_Prioritized__c: 1,
        Total_Rebate_Funds_Requested_PO__c: 1,
        Total_Bus_And_Infrastructure_Rebate__c: 1,
        Total_Infrastructure_Funds__c: 1,
        Num_Of_Buses_Requested_From_Application__c: 1,
        Total_Price_All_Buses__c: 1,
        Total_Bus_Rebate_Amount__c: 1,
        Total_All_Eligible_Infrastructure_Costs__c: 1,
        Total_Infrastructure_Rebate__c: 1,
        Total_Level_2_Charger_Costs__c: 1,
        Total_DC_Fast_Charger_Costs__c: 1,
        Total_Other_Infrastructure_Costs__c: 1,
      },
    )
    .execute(async (err, records) => ((await err) ? err : records));

  const prf2022RecordId = prf2022RecordQuery["0"].Id;

  // `SELECT
  //   Id
  // FROM
  //   RecordType
  // WHERE
  //   DeveloperName = 'CSB_Rebate_Item' AND
  //   SObjectType = 'Line_Item__c'
  // LIMIT 1`

  const rebateItemRecordTypeIdQuery = await bapConnection
    .sobject("RecordType")
    .find(
      {
        DeveloperName: "CSB_Rebate_Item",
        SObjectType: "Line_Item__c",
      },
      {
        // "*": 1,
        Id: 1, // Salesforce record ID
      },
    )
    .limit(1)
    .execute(async (err, records) => ((await err) ? err : records));

  const rebateItemRecordTypeId = rebateItemRecordTypeIdQuery["0"].Id;

  // `SELECT
  //   Id,
  //   Rebate_Item_num__c,
  //   CSB_VIN__c,
  //   CSB_Model_Year__c,
  //   CSB_Fuel_Type__c,
  //   CSB_Manufacturer_if_Other__c,
  //   Old_Bus_NCES_District_ID__c,
  //   Old_Bus_Estimated_Remaining_Life__c,
  //   Old_Bus_Exclude__c,
  //   Related_Line_Item__r.Id,
  //   Related_Line_Item__r.Vendor_Name__c,
  //   New_Bus_Fuel_Type__c,
  //   New_Bus_Make__c,
  //   New_Bus_Model__c,
  //   New_Bus_Model_Year__c,
  //   New_Bus_GVWR__c,
  //   New_Bus_Rebate_Amount__c,
  //   New_Bus_Purchase_Price__c
  // FROM
  //   Line_Item__c
  // WHERE
  //   RecordTypeId = '${rebateItemRecordTypeId}' AND
  //   Related_Order_Request__c = '${prf2022RecordId}' AND
  //   CSB_Rebate_Item_Type__c = 'New Bus'`

  const prf2022busRecordsQuery = await bapConnection
    .sobject("Line_Item__c")
    .find(
      {
        RecordTypeId: rebateItemRecordTypeId,
        Related_Order_Request__c: prf2022RecordId,
        CSB_Rebate_Item_Type__c: "New Bus",
      },
      {
        // "*": 1,
        Id: 1, // Salesforce record ID
        Rebate_Item_num__c: 1,
        CSB_VIN__c: 1,
        CSB_Model_Year__c: 1,
        CSB_Fuel_Type__c: 1,
        CSB_Manufacturer_if_Other__c: 1,
        Old_Bus_NCES_District_ID__c: 1,
        Old_Bus_Estimated_Remaining_Life__c: 1,
        Old_Bus_Exclude__c: 1,
        "Related_Line_Item__r.Id": 1,
        "Related_Line_Item__r.Vendor_Name__c": 1,
        New_Bus_Fuel_Type__c: 1,
        New_Bus_Make__c: 1,
        New_Bus_Model__c: 1,
        New_Bus_Model_Year__c: 1,
        New_Bus_GVWR__c: 1,
        New_Bus_Rebate_Amount__c: 1,
        New_Bus_Purchase_Price__c: 1,
      },
    )
    .execute(async (err, records) => ((await err) ? err : records));

  return { frf2022RecordQuery, prf2022RecordQuery, prf2022busRecordsQuery };
}

/**
 * Uses cached JSforce connection to query the BAP for duplicate contacts or
 * organizations.
 *
 * @param {express.Request} req
 * @returns {Promise<BapDuplicates>}
 */
async function queryBapForDuplicates(req) {
  const { body } = req;

  const logMessage = `Querying the BAP for duplicates.`;
  log({ level: "info", message: logMessage, req });

  /** @type {{ bapConnection: jsforce.Connection }} */
  const { bapConnection } = req.app.locals;

  const url = "/v2/recordMatcher/";

  return bapConnection.apex.post(url, body, (_err, res) => res);
}

/**
 * Verifies the BAP connection has been setup, then calls the provided callback
 * function with the provided arguments.
 *
 * @param {express.Request} req
 * @param {Object} fn callback function name and arguments to call after BAP connection has been verified
 * @param {function} fn.name name of the callback function
 * @param {any[]} fn.args arguments to pass to the callback function
 */
function verifyBapConnection(req, { name, args }) {
  /** @type {{ bapConnection: jsforce.Connection }} */
  const { bapConnection } = req.app.locals;

  function callback() {
    return name(...args).catch((err) => {
      const logMessage = `BAP Error: ${err}.`;
      log({ level: "error", message: logMessage, req, otherInfo: err });

      // TODO: Handle the following error:
      // Error: Unable to refresh session due to: No refresh token found in the connection.

      if (err?.includes("No refresh token found in the connection.")) {
        log({ level: "info", message: "Re-establishing BAP connection.", req });

        // Re-establish the BAP connection.
      }

      throw err;
    });
  }

  if (!bapConnection) {
    const logMessage = `BAP connection has not yet been initialized.`;
    log({ level: "info", message: logMessage, req });

    return setupConnection(req).then(() => callback());
  }

  return callback();
}

/**
 * Fetches SAM.gov entities associated with a provided user.
 *
 * @param {express.Request} req
 * @param {string} email
 * @returns {ReturnType<queryForSamEntities>}
 */
function getSamEntities(req, email) {
  return verifyBapConnection(req, {
    name: queryForSamEntities,
    args: [req, email],
  });
}

/**
 * Fetches SAM.gov entity combo keys associated with a provided user.
 *
 * @param {express.Request} req
 * @param {string} email
 */
function getBapComboKeys(req, email) {
  return getSamEntities(req, email)
    .then((entities) => entities.map((entity) => entity.ENTITY_COMBO_KEY__c))
    .catch((err) => {
      throw err;
    });
}

/**
 * Fetches data associated with a provided form submission.
 *
 * @param {Object} param
 * @param {RebateYear} param.rebateYear
 * @param {FormType} param.formType
 * @param {string | null} param.rebateId
 * @param {string | null} param.mongoId
 * @param {express.Request} param.req
 * @returns {ReturnType<queryForBapFormSubmissionData>}
 */
function getBapFormSubmissionData({
  rebateYear,
  formType,
  rebateId,
  mongoId,
  req,
}) {
  return verifyBapConnection(req, {
    name: queryForBapFormSubmissionData,
    args: [req, rebateYear, formType, rebateId, mongoId],
  });
}

/**
 * Fetches form submissions statuses associated with a provided set of combo keys.
 *
 * @param {express.Request} req
 * @returns {ReturnType<queryForBapFormSubmissionsStatuses>}
 */
function getBapFormSubmissionsStatuses(req) {
  return verifyBapConnection(req, {
    name: queryForBapFormSubmissionsStatuses,
    args: [req],
  });
}

/**
 * Fetches 2022 FRF submission data associated with a FRF Review Item ID.
 *
 * @param {express.Request} req
 * @param {string} frfReviewItemId
 * @returns {ReturnType<queryBapFor2022PRFData>}
 */
function getBapDataFor2022PRF(req, frfReviewItemId) {
  return verifyBapConnection(req, {
    name: queryBapFor2022PRFData,
    args: [req, frfReviewItemId],
  });
}

/**
 * Fetches 2023 FRF submission data associated with a FRF Review Item ID.
 *
 * @param {express.Request} req
 * @param {string} frfReviewItemId
 * @returns {ReturnType<queryBapFor2023PRFData>}
 */
function getBapDataFor2023PRF(req, frfReviewItemId) {
  return verifyBapConnection(req, {
    name: queryBapFor2023PRFData,
    args: [req, frfReviewItemId],
  });
}

/**
 * Fetches 2024 FRF submission data associated with a FRF Review Item ID.
 *
 * @param {express.Request} req
 * @param {string} frfReviewItemId
 * @returns {ReturnType<queryBapFor2024PRFData>}
 */
function getBapDataFor2024PRF(req, frfReviewItemId) {
  return verifyBapConnection(req, {
    name: queryBapFor2024PRFData,
    args: [req, frfReviewItemId],
  });
}

/**
 * Fetches 2022 FRF submission data and 2022 PRF submission data associated with
 * a FRF Review Item ID and a PRF Review Item ID.
 *
 * @param {express.Request} req
 * @param {string} frfReviewItemId
 * @param {string} prfReviewItemId
 * @returns {ReturnType<queryBapFor2022CRFData>}
 */
function getBapDataFor2022CRF(req, frfReviewItemId, prfReviewItemId) {
  return verifyBapConnection(req, {
    name: queryBapFor2022CRFData,
    args: [req, frfReviewItemId, prfReviewItemId],
  });
}

/**
 * Checks for duplicate contacts or organizations in the BAP.
 *
 * @param {express.Request} req
 * @returns {ReturnType<queryBapForDuplicates>}
 */
function checkForBapDuplicates(req) {
  return verifyBapConnection(req, {
    name: queryBapForDuplicates,
    args: [req],
  });
}

/**
 * Returns a resolved or rejected promise, depending on if the given form's
 * submission period is open (as set via environment variables), and if the form
 * submission has the status of "Edits Requested" or not (as stored in and
 * returned from the BAP).
 *
 * @param {Object} param
 * @param {RebateYear} param.rebateYear
 * @param {FormType} param.formType
 * @param {string} param.mongoId
 * @param {string} param.comboKey
 * @param {express.Request} param.req
 */
function checkFormSubmissionPeriodAndBapStatus({
  rebateYear,
  formType,
  mongoId,
  comboKey,
  req,
}) {
  /** Form submission period is open, so continue. */
  if (submissionPeriodOpen[rebateYear][formType]) {
    return Promise.resolve();
  }

  /** Form submission period is closed, so only continue if edits are requested. */
  return getBapFormSubmissionsStatuses(req, [comboKey]).then((submissions) => {
    const submission = submissions.find((s) => s.CSB_Form_ID__c === mongoId);

    const statusField =
      formType === "frf"
        ? "CSB_Funding_Request_Status__c"
        : formType === "prf"
          ? "CSB_Payment_Request_Status__c"
          : formType === "crf"
            ? "CSB_Closeout_Request_Status__c"
            : null;

    return submission?.Parent_CSB_Rebate__r?.[statusField] === "Edits Requested"
      ? Promise.resolve()
      : Promise.reject();
  });
}

module.exports = {
  getSamEntities,
  getBapComboKeys,
  getBapFormSubmissionData,
  getBapFormSubmissionsStatuses,
  getBapDataFor2022PRF,
  getBapDataFor2023PRF,
  getBapDataFor2024PRF,
  getBapDataFor2022CRF,
  checkForBapDuplicates,
  checkFormSubmissionPeriodAndBapStatus,
};
