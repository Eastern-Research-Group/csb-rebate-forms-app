import { Fragment, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import icons from "uswds/img/sprite.svg";
// ---
import {
  type RebateYear,
  type BapSamEntity,
  type FormioFRF2022Submission,
  type FormioFRF2023Submission,
} from "@/types";
import { serverUrl, messages } from "@/config";
import {
  postData,
  useContentData,
  useConfigData,
  useBapSamData,
  entityIsActive,
  entityHasExclusionStatus,
  entityHasDebtSubjectToOffset,
  getUserInfo,
} from "@/utilities";
import { Loading, LoadingButtonIcon } from "@/components/loading";
import { Message } from "@/components/message";
import { MarkdownContent } from "@/components/markdownContent";
import { TextWithTooltip } from "@/components/tooltip";
import { useRebateYearState } from "@/contexts/rebateYear";

/**
 * Creates the initial FRF submission data for a given rebate year
 */
function createInitialSubmissionData(options: {
  rebateYear: RebateYear;
  email: string;
  entity: BapSamEntity;
}) {
  const { rebateYear, email, entity } = options;

  const { title, name } = getUserInfo(email, entity);

  const {
    ENTITY_COMBO_KEY__c,
    UNIQUE_ENTITY_ID__c,
    ENTITY_EFT_INDICATOR__c,
    LEGAL_BUSINESS_NAME__c,
    PHYSICAL_ADDRESS_LINE_1__c,
    PHYSICAL_ADDRESS_LINE_2__c,
    PHYSICAL_ADDRESS_CITY__c,
    PHYSICAL_ADDRESS_PROVINCE_OR_STATE__c,
    PHYSICAL_ADDRESS_ZIPPOSTAL_CODE__c,
    ELEC_BUS_POC_EMAIL__c,
    ALT_ELEC_BUS_POC_EMAIL__c,
    GOVT_BUS_POC_EMAIL__c,
    ALT_GOVT_BUS_POC_EMAIL__c,
  } = entity;

  return rebateYear === "2022"
    ? {
        last_updated_by: email,
        hidden_current_user_email: email,
        hidden_current_user_title: title,
        hidden_current_user_name: name,
        bap_hidden_entity_combo_key: ENTITY_COMBO_KEY__c,
        sam_hidden_applicant_email: email,
        sam_hidden_applicant_title: title,
        sam_hidden_applicant_name: name,
        sam_hidden_applicant_efti: ENTITY_EFT_INDICATOR__c,
        sam_hidden_applicant_uei: UNIQUE_ENTITY_ID__c,
        sam_hidden_applicant_organization_name: LEGAL_BUSINESS_NAME__c,
        sam_hidden_applicant_street_address_1: PHYSICAL_ADDRESS_LINE_1__c,
        sam_hidden_applicant_street_address_2: PHYSICAL_ADDRESS_LINE_2__c,
        sam_hidden_applicant_city: PHYSICAL_ADDRESS_CITY__c,
        sam_hidden_applicant_state: PHYSICAL_ADDRESS_PROVINCE_OR_STATE__c,
        sam_hidden_applicant_zip_code: PHYSICAL_ADDRESS_ZIPPOSTAL_CODE__c,
      }
    : rebateYear === "2023" || rebateYear === "2024"
      ? {
          _user_email: email,
          _user_title: title,
          _user_name: name,
          _bap_entity_combo_key: ENTITY_COMBO_KEY__c,
          _bap_elec_bus_poc_email: ELEC_BUS_POC_EMAIL__c,
          _bap_alt_elec_bus_poc_email: ALT_ELEC_BUS_POC_EMAIL__c,
          _bap_govt_bus_poc_email: GOVT_BUS_POC_EMAIL__c,
          _bap_alt_govt_bus_poc_email: ALT_GOVT_BUS_POC_EMAIL__c,
          _bap_applicant_email: email,
          _bap_applicant_title: title,
          _bap_applicant_name: name,
          _bap_applicant_efti: ENTITY_EFT_INDICATOR__c,
          _bap_applicant_uei: UNIQUE_ENTITY_ID__c,
          _bap_applicant_organization_name: LEGAL_BUSINESS_NAME__c,
          _bap_applicant_street_address_1: PHYSICAL_ADDRESS_LINE_1__c,
          _bap_applicant_street_address_2: PHYSICAL_ADDRESS_LINE_2__c,
          _bap_applicant_city: PHYSICAL_ADDRESS_CITY__c,
          _bap_applicant_state: PHYSICAL_ADDRESS_PROVINCE_OR_STATE__c,
          _bap_applicant_zip: PHYSICAL_ADDRESS_ZIPPOSTAL_CODE__c,
        }
      : null;
}

export function FRFNew() {
  const navigate = useNavigate();
  const { email } = useOutletContext<{ email: string }>();

  const content = useContentData();
  const configData = useConfigData();
  const bapSamData = useBapSamData();
  const { rebateYear } = useRebateYearState();

  const [errorMessage, setErrorMessage] = useState<{
    displayed: boolean;
    text: string;
  }>({
    displayed: false,
    text: "",
  });

  /**
   * Stores when data is being posted to the server, so a loading indicator can
   * be rendered inside the new application button, and we can prevent double
   * submits/creations of new FRF submissions.
   */
  const [postingDataId, setPostingDataId] = useState("0");

  if (!configData || !bapSamData) {
    return <Loading />;
  }

  const frfSubmissionPeriodOpen =
    configData.submissionPeriodOpen[rebateYear].frf;

  const samEntities = bapSamData.entities.reduce(
    (object, entity) => {
      const isActive = entityIsActive(entity);
      const hasExclusionStatus = entityHasExclusionStatus(entity);
      const hasDebtSubjectToOffset = entityHasDebtSubjectToOffset(entity);

      const isEligible = !hasExclusionStatus && !hasDebtSubjectToOffset;

      if (isActive && isEligible) object.eligible.push(entity);
      if (isActive && !isEligible) object.ineligible.push(entity);

      return object;
    },
    {
      eligible: [] as BapSamEntity[],
      ineligible: [] as BapSamEntity[],
    },
  );

  const totalActiveSamEntities =
    samEntities.eligible.length + samEntities.ineligible.length;

  return (
    <Transition.Root show={true} as={Fragment}>
      <Dialog
        as="div"
        className={clsx("tw:relative tw:z-10")}
        onClose={(_value) => navigate("/")}
      >
        <Transition.Child
          as={Fragment}
          enter={clsx("tw:duration-300 tw:ease-out")}
          enterFrom={clsx("tw:opacity-0")}
          enterTo={clsx("tw:opacity-100")}
          leave={clsx("tw:duration-200 tw:ease-in")}
          leaveFrom={clsx("tw:opacity-100")}
          leaveTo={clsx("tw:opacity-0")}
        >
          <div
            className={clsx(
              "tw:fixed tw:inset-0 tw:bg-black/70 tw:transition-colors",
            )}
          />
        </Transition.Child>

        <div className={clsx("tw:fixed tw:inset-0 tw:z-10 tw:overflow-y-auto")}>
          <div
            className={clsx(
              "tw:flex tw:min-h-full tw:items-end tw:justify-center tw:p-4",
              "tw:sm:items-center",
            )}
          >
            <Transition.Child
              as={Fragment}
              enter={clsx("tw:duration-300 tw:ease-out")}
              enterFrom={clsx(
                "tw:translate-y-4 tw:opacity-0",
                "tw:sm:translate-y-0",
              )}
              enterTo={clsx("tw:translate-y-0 tw:opacity-100")}
              leave={clsx("tw:duration-200 tw:ease-in")}
              leaveFrom={clsx("tw:translate-y-0 tw:opacity-100")}
              leaveTo={clsx(
                "tw:translate-y-4 tw:opacity-0",
                "tw:sm:translate-y-0",
              )}
            >
              <Dialog.Panel
                className={clsx(
                  "tw:relative tw:transform tw:overflow-hidden tw:rounded-lg tw:bg-white tw:p-4 tw:shadow-xl tw:transition-all",
                  "tw:sm:w-full tw:sm:max-w-4xl tw:sm:p-6",
                )}
              >
                <div className="twpf">
                  <div
                    className={clsx(
                      "tw:absolute tw:right-0 tw:top-0 tw:pr-4 tw:pt-4",
                    )}
                  >
                    <button
                      className={clsx(
                        "tw:rounded-md tw:bg-white tw:text-gray-400 tw:transition-none",
                        "tw:hover:text-gray-700",
                        "tw:focus:text-gray-700",
                      )}
                      type="button"
                      onClick={(_ev) => navigate("/")}
                    >
                      <span className={clsx("tw:sr-only")}>Close</span>
                      <XMarkIcon
                        className={clsx("tw:size-6 tw:transition-none")}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </div>

                <div
                  className={clsx("tw:m-auto tw:max-w-3xl tw:p-4", "tw:sm:p-8")}
                >
                  {!frfSubmissionPeriodOpen ? (
                    <div className={clsx("tw:-mb-4")}>
                      <Message type="info" text={messages.frfClosed} />
                    </div>
                  ) : totalActiveSamEntities === 0 ? (
                    <div className={clsx("tw:-mb-4")}>
                      <Message
                        type="info"
                        text={messages.bapSamNoActiveEntities}
                      />
                    </div>
                  ) : (
                    <>
                      {content && (
                        <MarkdownContent
                          className={clsx("tw:mt-4", "tw:[&_h2]:text-center")}
                          children={content.newFRFDialog}
                          components={{
                            h2: (props) => (
                              <h2
                                className={clsx(
                                  "tw:text-xl",
                                  "tw:sm:text-2xl",
                                  "tw:md:text-3xl",
                                )}
                              >
                                {props.children}
                              </h2>
                            ),
                          }}
                        />
                      )}

                      {errorMessage.displayed && (
                        <Message type="error" text={errorMessage.text} />
                      )}

                      <div
                        className="usa-table-container--scrollable"
                        tabIndex={0}
                      >
                        <table
                          aria-label="SAM.gov Entities"
                          className="usa-table usa-table--stacked usa-table--borderless usa-table--striped width-full"
                        >
                          <thead>
                            <tr className="font-sans-2xs text-no-wrap">
                              <th scope="col">
                                <span className="usa-sr-only">Create</span>
                              </th>
                              <th scope="col">
                                <TextWithTooltip
                                  text="UEI"
                                  tooltip="Unique Entity ID from SAM.gov"
                                />
                              </th>
                              <th scope="col">
                                <TextWithTooltip
                                  text="EFT Indicator"
                                  tooltip="Electronic Funds Transfer Indicator listing the associated bank account from SAM.gov"
                                />
                              </th>
                              <th scope="col">
                                <TextWithTooltip
                                  text="Applicant"
                                  tooltip="Legal Business Name from SAM.gov for this UEI"
                                />
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {samEntities.eligible.map((entity) => {
                              const {
                                ENTITY_COMBO_KEY__c,
                                UNIQUE_ENTITY_ID__c,
                                ENTITY_EFT_INDICATOR__c,
                                LEGAL_BUSINESS_NAME__c,
                              } = entity;

                              return (
                                <tr key={ENTITY_COMBO_KEY__c}>
                                  <th
                                    scope="row"
                                    className="width-15 font-sans-2xs"
                                  >
                                    <button
                                      className="usa-button font-sans-2xs margin-right-0 padding-x-105 padding-y-1"
                                      onClick={(_ev) => {
                                        setErrorMessage({
                                          displayed: false,
                                          text: "",
                                        });

                                        // account for when data is posting to prevent double submits
                                        if (postingDataId !== "0") return;
                                        setPostingDataId(ENTITY_COMBO_KEY__c);

                                        const data =
                                          createInitialSubmissionData({
                                            rebateYear,
                                            email,
                                            entity,
                                          });

                                        postData<
                                          | FormioFRF2022Submission
                                          | FormioFRF2023Submission
                                        >(
                                          `${serverUrl}/api/formio/${rebateYear}/frf-submission/`,
                                          { data, state: "draft" },
                                        )
                                          .then((res) => {
                                            const url = `/frf/${rebateYear}/${res._id}`;
                                            navigate(url);
                                          })
                                          .catch((_err) => {
                                            setErrorMessage({
                                              displayed: true,
                                              text: "Error creating new rebate form application.",
                                            });
                                          })
                                          .finally(() => {
                                            setPostingDataId("0");
                                          });
                                      }}
                                    >
                                      <span className="usa-sr-only">
                                        New Application with UEI:{" "}
                                        {UNIQUE_ENTITY_ID__c} and EFTI:{" "}
                                        {ENTITY_EFT_INDICATOR__c}
                                      </span>
                                      <span className="display-flex flex-align-center">
                                        <svg
                                          className="usa-icon"
                                          aria-hidden="true"
                                          focusable="false"
                                          role="img"
                                        >
                                          <use
                                            href={`${icons}#arrow_forward`}
                                          />
                                        </svg>
                                        <span className="mobile-lg:display-none margin-left-1">
                                          New Application
                                        </span>
                                        {postingDataId ===
                                          ENTITY_COMBO_KEY__c && (
                                          <LoadingButtonIcon position="end" />
                                        )}
                                      </span>
                                    </button>
                                  </th>
                                  <td className="font-sans-2xs">
                                    {UNIQUE_ENTITY_ID__c}
                                  </td>
                                  <td className="font-sans-2xs">
                                    {ENTITY_EFT_INDICATOR__c || "0000"}
                                  </td>
                                  <td className="font-sans-2xs">
                                    {LEGAL_BUSINESS_NAME__c}
                                  </td>
                                </tr>
                              );
                            })}

                            {samEntities.ineligible.length > 0 && (
                              <>
                                <tr>
                                  <td
                                    colSpan={4}
                                    className="font-sans-2xs tw:!whitespace-normal"
                                  >
                                    <strong>
                                      Ineligible SAM.gov Entities:
                                    </strong>
                                    <br />
                                    The following SAM.gov entities are
                                    ineligible due to their exclusion status or
                                    a debt subject to offset. Please visit
                                    SAM.gov to resolve these issues.
                                  </td>
                                </tr>

                                {samEntities.ineligible.map((entity) => {
                                  const {
                                    ENTITY_COMBO_KEY__c,
                                    UNIQUE_ENTITY_ID__c,
                                    ENTITY_EFT_INDICATOR__c,
                                    LEGAL_BUSINESS_NAME__c,
                                  } = entity;

                                  return (
                                    <tr key={ENTITY_COMBO_KEY__c}>
                                      <th
                                        scope="row"
                                        className="width-15 font-sans-2xs"
                                      >
                                        <TextWithTooltip
                                          text=" "
                                          tooltip="Ineligible SAM.gov entity"
                                        />
                                      </th>
                                      <td className="font-sans-2xs">
                                        {UNIQUE_ENTITY_ID__c}
                                      </td>
                                      <td className="font-sans-2xs">
                                        {ENTITY_EFT_INDICATOR__c || "0000"}
                                      </td>
                                      <td className="font-sans-2xs">
                                        {LEGAL_BUSINESS_NAME__c}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
