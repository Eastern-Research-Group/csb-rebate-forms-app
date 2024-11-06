export type RebateYear = "2022" | "2023" | "2024";

export type FormType = "frf" | "prf" | "crf";

export type Content = {
  siteAlert: string;
  helpdeskIntro: string;
  allRebatesIntro: string;
  allRebatesOutro: string;
  newFRFDialog: string;
  draftFRFIntro: string;
  submittedFRFIntro: string;
  draftPRFIntro: string;
  submittedPRFIntro: string;
  draftCRFIntro: string;
  submittedCRFIntro: string;
  newChangeIntro: string;
  submittedChangeIntro: string;
};

export type UserData = {
  mail: string;
  memberof: string;
  exp: number;
};

export type ConfigData = {
  rebateYear: RebateYear;
  submissionPeriodOpen: {
    2022: { frf: boolean; prf: boolean; crf: boolean };
    2023: { frf: boolean; prf: boolean; crf: boolean };
    2024: { frf: boolean; prf: boolean; crf: boolean };
  };
};

export type BapSamEntity = {
  attributes: { type: "Data_Staging__c"; url: string };
  Id: string;
  ENTITY_COMBO_KEY__c: string;
  UNIQUE_ENTITY_ID__c: string;
  ENTITY_EFT_INDICATOR__c: string | null;
  ENTITY_STATUS__c: "Active" | string | null;
  EXCLUSION_STATUS_FLAG__c: "D" | null;
  DEBT_SUBJECT_TO_OFFSET_FLAG__c: "Y" | "N" | null;
  LEGAL_BUSINESS_NAME__c: string;
  PHYSICAL_ADDRESS_LINE_1__c: string;
  PHYSICAL_ADDRESS_LINE_2__c: string | null;
  PHYSICAL_ADDRESS_CITY__c: string;
  PHYSICAL_ADDRESS_PROVINCE_OR_STATE__c: string;
  PHYSICAL_ADDRESS_ZIPPOSTAL_CODE__c: string;
  PHYSICAL_ADDRESS_ZIP_CODE_4__c: string;
  ELEC_BUS_POC_EMAIL__c: string | null;
  ELEC_BUS_POC_NAME__c: string | null;
  ELEC_BUS_POC_TITLE__c: string | null;
  ALT_ELEC_BUS_POC_EMAIL__c: string | null;
  ALT_ELEC_BUS_POC_NAME__c: string | null;
  ALT_ELEC_BUS_POC_TITLE__c: string | null;
  GOVT_BUS_POC_EMAIL__c: string | null;
  GOVT_BUS_POC_NAME__c: string | null;
  GOVT_BUS_POC_TITLE__c: string | null;
  ALT_GOVT_BUS_POC_EMAIL__c: string | null;
  ALT_GOVT_BUS_POC_NAME__c: string | null;
  ALT_GOVT_BUS_POC_TITLE__c: string | null;
};

export type BapSamData =
  | { results: false; entities: [] }
  | { results: true; entities: BapSamEntity[] };

export type BapFormSubmission = {
  attributes: { type: "Order_Request__c"; url: string };
  Id: string;
  UEI_EFTI_Combo_Key__c: string; // UEI + EFTI combo key
  CSB_Form_ID__c: string; // MongoDB ObjectId string
  CSB_Modified_Full_String__c: string; // ISO 8601 date time string
  CSB_Review_Item_ID__c: string; // CSB Rebate ID with form/version ID (9 digits)
  Parent_Rebate_ID__c: string; // CSB Rebate ID (6 digits)
  Record_Type_Name__c: /*
   * NOTE: 2022 submissions don't have a year in their record type name, but
   * we'll account for it here in case the BAP switches to using it in the future.
   */
  | "CSB Funding Request" // NOTE: 2022 submissions
    | "CSB Payment Request" // NOTE: 2022 submissions
    | "CSB Close Out Request" // NOTE: 2022 submissions
    | "CSB Funding Request 2022" // NOTE: not currently used
    | "CSB Payment Request 2022" // NOTE: not currently used
    | "CSB Close Out Request 2022" // NOTE: not currently used
    | "CSB Funding Request 2023"
    | "CSB Payment Request 2023"
    | "CSB Close Out Request 2023"
    | "CSB Funding Request 2024"
    | "CSB Payment Request 2024"
    | "CSB Close Out Request 2024";
  Rebate_Program_Year__c: null | RebateYear;
  Parent_CSB_Rebate__r: {
    CSB_Funding_Request_Status__c: string;
    CSB_Payment_Request_Status__c: string;
    CSB_Closeout_Request_Status__c: string;
    Reimbursement_Needed__c: boolean;
    attributes: { type: string; url: string };
  };
};

export type BapFormSubmissions = {
  2022: {
    frfs: BapFormSubmission[];
    prfs: BapFormSubmission[];
    crfs: BapFormSubmission[];
  };
  2023: {
    frfs: BapFormSubmission[];
    prfs: BapFormSubmission[];
    crfs: BapFormSubmission[];
  };
  2024: {
    frfs: BapFormSubmission[];
    prfs: BapFormSubmission[];
    crfs: BapFormSubmission[];
  };
};

export type BapSubmissionData = {
  modified: string | null; // ISO 8601 date time string
  comboKey: string | null; // UEI + EFTI combo key
  mongoId: string | null; // MongoDB Object ID
  rebateId: string | null; // CSB Rebate ID (6 digits)
  reviewItemId: string | null; // CSB Rebate ID with form/version ID (9 digits)
  status: string | null;
  reimbursementNeeded: boolean;
};

export type FormioSubmission = {
  [field: string]: unknown;
  _id: string; // MongoDB ObjectId string – submission ID
  form: string; // MongoDB ObjectId string – form ID
  state: "submitted" | "draft";
  modified: string; // ISO 8601 date time string
  metadata: {
    [field: string]: unknown;
  };
  data: {
    [field: string]: unknown;
  };
};

type FormioFRF2022Data = {
  [field: string]: unknown;
  // fields injected upon a new draft FRF submission creation:
  last_updated_by: string;
  hidden_current_user_email: string;
  hidden_current_user_title: string;
  hidden_current_user_name: string;
  bap_hidden_entity_combo_key: string;
  sam_hidden_applicant_email: string;
  sam_hidden_applicant_title: string;
  sam_hidden_applicant_name: string;
  sam_hidden_applicant_efti: string;
  sam_hidden_applicant_uei: string;
  sam_hidden_applicant_organization_name: string;
  sam_hidden_applicant_street_address_1: string;
  sam_hidden_applicant_street_address_2: string;
  sam_hidden_applicant_city: string;
  sam_hidden_applicant_state: string;
  sam_hidden_applicant_zip_code: string;
  // fields set by form definition (among others):
  applicantUEI: string;
  applicantEfti: string;
  applicantEfti_display: string;
  applicantOrganizationName: string;
  schoolDistrictName: string;
};

type FormioPRF2022Data = {
  [field: string]: unknown;
  // fields injected upon a new draft PRF submission creation:
  bap_hidden_entity_combo_key: string;
  hidden_application_form_modified: string; // ISO 8601 date time string,
  hidden_current_user_email: string;
  hidden_current_user_title: string;
  hidden_current_user_name: string;
  hidden_sam_uei: string;
  hidden_sam_efti: string;
  hidden_sam_elec_bus_poc_email: string | null;
  hidden_sam_alt_elec_bus_poc_email: string | null;
  hidden_sam_govt_bus_poc_email: string | null;
  hidden_sam_alt_govt_bus_poc_email: string | null;
  hidden_bap_rebate_id: string;
  hidden_bap_district_id: string;
  hidden_bap_primary_name: string;
  hidden_bap_primary_title: string;
  hidden_bap_primary_phone_number: string;
  hidden_bap_primary_email: string;
  hidden_bap_alternate_name: string;
  hidden_bap_alternate_title: string;
  hidden_bap_alternate_phone_number: string;
  hidden_bap_alternate_email: string;
  hidden_bap_org_name: string;
  hidden_bap_district_name: string;
  hidden_bap_fleet_name: string | null;
  hidden_bap_prioritized: boolean;
  hidden_bap_requested_funds: number;
  hidden_bap_infra_max_rebate: number;
  busInfo: {
    busNum: number;
    oldBusNcesDistrictId: string;
    oldBusVin: string;
    oldBusModelYear: string;
    oldBusFuelType: string;
    newBusFuelType: string;
    hidden_bap_max_rebate: number;
  }[];
  purchaseOrders: [];
  // fields set by form definition (among others):
  applicantName: string;
};

type FormioCRF2022Data = {
  [field: string]: unknown;
  // fields injected upon a new draft CRF submission creation:
  bap_hidden_entity_combo_key: string;
  hidden_prf_modified: string; // ISO 8601 date time string
  hidden_current_user_email: string;
  hidden_current_user_title: string;
  hidden_current_user_name: string;
  hidden_bap_rebate_id: string;
  hidden_sam_uei: string;
  hidden_sam_efti: string;
  hidden_sam_elec_bus_poc_email: string | null;
  hidden_sam_alt_elec_bus_poc_email: string | null;
  hidden_sam_govt_bus_poc_email: string | null;
  hidden_sam_alt_govt_bus_poc_email: string | null;
  hidden_bap_district_id: string;
  hidden_bap_district_name: string;
  hidden_bap_primary_fname: string;
  hidden_bap_primary_lname: string;
  hidden_bap_primary_title: string;
  hidden_bap_primary_phone_number: string;
  hidden_bap_primary_email: string;
  hidden_bap_alternate_fname: string;
  hidden_bap_alternate_lname: string;
  hidden_bap_alternate_title: string;
  hidden_bap_alternate_phone_number: string;
  hidden_bap_alternate_email: string;
  hidden_bap_org_name: string;
  hidden_bap_fleet_name: string;
  hidden_bap_fleet_address: string;
  hidden_bap_fleet_city: string;
  hidden_bap_fleet_state: string;
  hidden_bap_fleet_zip: string;
  hidden_bap_fleet_contact_name: string;
  hidden_bap_fleet_contact_title: string;
  hidden_bap_fleet_phone: string;
  hidden_bap_fleet_email: string;
  hidden_bap_prioritized: boolean;
  hidden_bap_requested_funds: number;
  hidden_bap_received_funds: number;
  hidden_bap_prf_infra_max_rebate: number | null;
  hidden_bap_buses_requested_app: number;
  hidden_bap_total_bus_costs_prf: number;
  hidden_bap_total_bus_rebate_received: number;
  hidden_bap_total_infra_costs_prf: number | null;
  hidden_bap_total_infra_rebate_received: number | null;
  hidden_bap_total_infra_level2_charger: number | null;
  hidden_bap_total_infra_dc_fast_charger: number | null;
  hidden_bap_total_infra_other_costs: number | null;
  hidden_bap_district_contact_fname: string;
  hidden_bap_district_contact_lname: string;
  busInfo: {
    busNum: number;
    oldBusNcesDistrictId: string;
    oldBusVin: string;
    oldBusModelYear: string;
    oldBusFuelType: string;
    oldBusEstimatedRemainingLife: number;
    oldBusExclude: boolean;
    hidden_prf_oldBusExclude: boolean;
    newBusDealer: string;
    newBusFuelType: string;
    hidden_prf_newBusFuelType: string;
    newBusMake: string;
    hidden_prf_newBusMake: string;
    newBusMakeOther: string | null;
    hidden_prf_newBusMakeOther: string | null;
    newBusModel: string;
    hidden_prf_newBusModel: string;
    newBusModelYear: string;
    hidden_prf_newBusModelYear: string;
    newBusGvwr: number;
    hidden_prf_newBusGvwr: number;
    newBusPurchasePrice: number;
    hidden_prf_newBusPurchasePrice: number;
    hidden_prf_rebate: number;
  }[];
  // fields set by form definition (among others):
  signatureName: string;
};

type FormioFRF2023Data = {
  [field: string]: unknown;
  // fields injected upon a new draft FRF submission creation:
  _user_email: string;
  _user_title: string;
  _user_name: string;
  _bap_entity_combo_key: string;
  _bap_applicant_email: string;
  _bap_applicant_title: string;
  _bap_applicant_name: string;
  _bap_applicant_efti: string;
  _bap_applicant_uei: string;
  _bap_applicant_organization_name: string;
  _bap_applicant_street_address_1: string;
  _bap_applicant_street_address_2: string;
  _bap_applicant_city: string;
  _bap_applicant_state: string;
  _bap_applicant_zip: string;
  // fields set by form definition (among others):
  appInfo_uei: string;
  appInfo_efti: string;
  appInfo_orgName: string;
  _formio_schoolDistrictName: string;
};

type FormioPRF2023Data = {
  [field: string]: unknown;
  // fields injected upon a new draft PRF submission creation:
  _application_form_modified: string;
  _bap_entity_combo_key: string;
  _bap_rebate_id: string;
  _user_email: string;
  _user_title: string;
  _user_name: string;
  _bap_applicant_email: string;
  _bap_applicant_title: string;
  _bap_applicant_name: string;
  _bap_applicant_efti: string;
  _bap_applicant_uei: string;
  _bap_applicant_organization_id: string;
  _bap_applicant_organization_name: string;
  _bap_applicant_street_address_1: string;
  _bap_applicant_street_address_2: string;
  _bap_applicant_county: string;
  _bap_applicant_city: string;
  _bap_applicant_state: string;
  _bap_applicant_zip: string;
  _bap_elec_bus_poc_email: string | null;
  _bap_alt_elec_bus_poc_email: string | null;
  _bap_govt_bus_poc_email: string | null;
  _bap_alt_govt_bus_poc_email: string | null;
  _bap_primary_id: string;
  _bap_primary_fname: string;
  _bap_primary_lname: string;
  _bap_primary_title: string;
  _bap_primary_email: string;
  _bap_primary_phone: string;
  _bap_alternate_id: string | null;
  _bap_alternate_fname: string | null;
  _bap_alternate_lname: string | null;
  _bap_alternate_title: string | null;
  _bap_alternate_email: string | null;
  _bap_alternate_phone: string | null;
  _bap_district_id: string;
  _bap_district_nces_id: string;
  _bap_district_name: string;
  _bap_district_address_1: string;
  _bap_district_address_2: string;
  _bap_district_city: string;
  _bap_district_state: string;
  _bap_district_zip: string;
  _bap_district_priority: string;
  _bap_district_priority_reason: {
    highNeed: boolean;
    tribal: boolean;
    rural: boolean;
  };
  _bap_district_self_certify: string;
  _bap_district_contact_id: string;
  _bap_district_contact_fname: string;
  _bap_district_contact_lname: string;
  _bap_district_contact_title: string;
  _bap_district_contact_email: string;
  _bap_district_contact_phone: string;
  org_organizations: {
    org_number: number;
    org_type: {
      existingBusOwner: boolean;
      newBusOwner: boolean;
      privateFleet: boolean;
    };
    _org_id: string;
    org_name: string;
    _org_contact_id: string;
    org_contact_fname: string;
    org_contact_lname: string;
    org_contact_title: string;
    org_contact_email: string;
    org_contact_phone: string;
    org_address_1: string;
    org_address_2: string;
    org_county: string;
    org_city: string;
    org_state: { name: string };
    org_zip: string;
  }[];
  bus_buses: {
    bus_busNumber: number;
    bus_existingOwner: {
      org_id: string;
      org_name: string;
      org_contact_id: string;
      org_contact_fname: string;
      org_contact_lname: string;
    };
    bus_existingVin: string;
    bus_existingFuelType: string;
    bus_existingGvwr: number;
    bus_existingOdometer: number;
    bus_existingModel: string;
    bus_existingModelYear: string;
    bus_existingNcesId: string;
    bus_existingManufacturer: string;
    bus_existingManufacturerOther: string | null;
    bus_existingAnnualFuelConsumption: number;
    bus_existingAnnualMileage: number;
    bus_existingRemainingLife: number;
    bus_existingIdlingHours: number;
    bus_newOwner: {
      org_id: string;
      org_name: string;
      org_contact_id: string;
      org_contact_fname: string;
      org_contact_lname: string;
    };
    bus_newFuelType: string;
    bus_newGvwr: number;
    _bus_maxRebate: number;
    _bus_newADAfromFRF: boolean;
  }[];
};

type FormioCRF2023Data = {
  [field: string]: unknown;
  // fields injected upon a new draft CRF submission creation:
  _user_email: string;
  _user_title: string;
  _user_name: string;
  _bap_entity_combo_key: string;
  _bap_rebate_id: string;
};

type FormioChange2023Data = {
  [field: string]: unknown;
  // fields injected upon a new draft Change Request form submission creation:
  _request_form: FormType;
  _bap_entity_combo_key: string;
  _bap_rebate_id: string;
  _mongo_id: string;
  _user_email: string;
  _user_title: string;
  _user_name: string;
  // fields set by the form definition (among others):
  request_type: { label: string; value: string };
};

type FormioFRF2024Data = {
  [field: string]: unknown;
  // fields injected upon a new draft FRF submission creation:
  _user_email: string;
  _user_title: string;
  _user_name: string;
  _bap_entity_combo_key: string;
  _bap_applicant_email: string;
  _bap_applicant_title: string;
  _bap_applicant_name: string;
  _bap_applicant_efti: string;
  _bap_applicant_uei: string;
  _bap_applicant_organization_name: string;
  _bap_applicant_street_address_1: string;
  _bap_applicant_street_address_2: string;
  _bap_applicant_city: string;
  _bap_applicant_state: string;
  _bap_applicant_zip: string;
  // fields set by form definition (among others):
  appInfo_uei: string;
  appInfo_efti: string;
  appInfo_organization_name: string;
  _formio_schoolDistrictName: string;
};

type FormioPRF2024Data = {
  [field: string]: unknown;
  // fields injected upon a new draft PRF submission creation:
  _application_form_modified: string;
  _bap_entity_combo_key: string;
  _bap_rebate_id: string;
  _user_email: string;
  _user_title: string;
  _user_name: string;
  _bap_applicant_email: string;
  _bap_applicant_title: string;
  _bap_applicant_name: string;
  _bap_applicant_efti: string;
  _bap_applicant_uei: string;
  _bap_applicant_organization_id: string;
  _bap_applicant_organization_name: string;
  _bap_applicant_street_address_1: string;
  _bap_applicant_street_address_2: string;
  _bap_applicant_county: string;
  _bap_applicant_city: string;
  _bap_applicant_state: string;
  _bap_applicant_zip: string;
  _bap_elec_bus_poc_email: string | null;
  _bap_alt_elec_bus_poc_email: string | null;
  _bap_govt_bus_poc_email: string | null;
  _bap_alt_govt_bus_poc_email: string | null;
  _bap_primary_id: string;
  _bap_primary_fname: string;
  _bap_primary_lname: string;
  _bap_primary_title: string;
  _bap_primary_email: string;
  _bap_primary_phone: string;
  _bap_alternate_id: string | null;
  _bap_alternate_fname: string | null;
  _bap_alternate_lname: string | null;
  _bap_alternate_title: string | null;
  _bap_alternate_email: string | null;
  _bap_alternate_phone: string | null;
  _bap_district_id: string;
  _bap_district_nces_id: string;
  _bap_district_name: string;
  _bap_district_address_1: string;
  _bap_district_address_2: string;
  _bap_district_city: string;
  _bap_district_state: string;
  _bap_district_zip: string;
  _bap_district_priority: string;
  _bap_district_priority_reason: {
    highNeed: boolean;
    tribal: boolean;
    rural: boolean;
  };
  _bap_district_self_certify: string;
  _bap_district_contact_id: string;
  _bap_district_contact_fname: string;
  _bap_district_contact_lname: string;
  _bap_district_contact_title: string;
  _bap_district_contact_email: string;
  _bap_district_contact_phone: string;
  org_organizations: {
    org_number: number;
    org_type: {
      existingBusOwner: boolean;
      newBusOwner: boolean;
      privateFleet: boolean;
    };
    _org_id: string;
    org_name: string;
    _org_contact_id: string;
    org_contact_fname: string;
    org_contact_lname: string;
    org_contact_title: string;
    org_contact_email: string;
    org_contact_phone: string;
    org_address_1: string;
    org_address_2: string;
    org_county: string;
    org_city: string;
    org_state: { name: string };
    org_zip: string;
  }[];
  bus_buses: {
    bus_busNumber: number;
    bus_existingOwner: {
      org_id: string;
      org_name: string;
      org_contact_id: string;
      org_contact_fname: string;
      org_contact_lname: string;
    };
    bus_existingVin: string;
    bus_existingFuelType: string;
    bus_existingGvwr: number;
    bus_existingOdometer: number;
    bus_existingModel: string;
    bus_existingModelYear: string;
    bus_existingNcesId: string;
    bus_existingManufacturer: string;
    bus_existingManufacturerOther: string | null;
    bus_existingAnnualFuelConsumption: number;
    bus_existingAnnualMileage: number;
    bus_existingRemainingLife: number;
    bus_existingIdlingHours: number;
    bus_newOwner: {
      org_id: string;
      org_name: string;
      org_contact_id: string;
      org_contact_fname: string;
      org_contact_lname: string;
    };
    bus_newFuelType: string;
    bus_newGvwr: number;
    _bus_maxRebate: number;
    _bus_newADAfromFRF: boolean;
  }[];
};

type FormioCRF2024Data = {
  [field: string]: unknown;
  // fields injected upon a new draft CRF submission creation:
  _user_email: string;
  _user_title: string;
  _user_name: string;
  _bap_entity_combo_key: string;
  _bap_rebate_id: string;
};

type FormioChange2024Data = {
  [field: string]: unknown;
  // fields injected upon a new draft Change Request form submission creation:
  _request_form: FormType;
  _bap_entity_combo_key: string;
  _bap_rebate_id: string;
  _mongo_id: string;
  _user_email: string;
  _user_title: string;
  _user_name: string;
  // fields set by the form definition (among others):
  request_type: { label: string; value: string };
};

export type FormioSchemaAndSubmission<Submission> =
  | {
      userAccess: false;
      formSchema: null;
      submission: null;
    }
  | {
      userAccess: true;
      formSchema: { url: string; json: object };
      submission: Submission;
    };

export type FormioFRF2022Submission = FormioSubmission & {
  data: FormioFRF2022Data;
};

export type FormioPRF2022Submission = FormioSubmission & {
  data: FormioPRF2022Data;
};

export type FormioCRF2022Submission = FormioSubmission & {
  data: FormioCRF2022Data;
};

export type FormioFRF2023Submission = FormioSubmission & {
  data: FormioFRF2023Data;
};

export type FormioPRF2023Submission = FormioSubmission & {
  data: FormioPRF2023Data;
};

export type FormioCRF2023Submission = FormioSubmission & {
  data: FormioCRF2023Data;
};

export type FormioChange2023Submission = FormioSubmission & {
  data: FormioChange2023Data;
};

export type FormioFRF2024Submission = FormioSubmission & {
  data: FormioFRF2024Data;
};

export type FormioPRF2024Submission = FormioSubmission & {
  data: FormioPRF2024Data;
};

export type FormioCRF2024Submission = FormioSubmission & {
  data: FormioCRF2024Data;
};

export type FormioChange2024Submission = FormioSubmission & {
  data: FormioChange2024Data;
};

export type Rebate2022 = {
  rebateYear: "2022";
  frf: {
    formio: FormioFRF2022Submission;
    bap: BapSubmissionData | null;
  };
  prf: {
    formio: FormioPRF2022Submission | null;
    bap: BapSubmissionData | null;
  };
  crf: {
    formio: FormioCRF2022Submission | null;
    bap: BapSubmissionData | null;
  };
};

export type Rebate2023 = {
  rebateYear: "2023";
  frf: {
    formio: FormioFRF2023Submission;
    bap: BapSubmissionData | null;
  };
  prf: {
    formio: FormioPRF2023Submission | null;
    bap: BapSubmissionData | null;
  };
  crf: {
    formio: FormioCRF2023Submission | null;
    bap: BapSubmissionData | null;
  };
};

export type Rebate2024 = {
  rebateYear: "2024";
  frf: {
    formio: FormioFRF2024Submission;
    bap: BapSubmissionData | null;
  };
  prf: {
    formio: FormioPRF2024Submission | null;
    bap: BapSubmissionData | null;
  };
  crf: {
    formio: FormioCRF2024Submission | null;
    bap: BapSubmissionData | null;
  };
};
