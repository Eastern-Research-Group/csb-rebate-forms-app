import { Fragment, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import icons from "uswds/img/sprite.svg";
// ---
import { serverUrl, messages, postData } from "../config";
import { getUserInfo } from "../utilities";
import { Loading } from "components/loading";
import { Message } from "components/message";
import { MarkdownContent } from "components/markdownContent";
import { TextWithTooltip } from "components/tooltip";
import { useContentData } from "components/app";
import { useUserState } from "contexts/user";
import { useCsbState } from "contexts/csb";
import { BapSamEntity, useBapState } from "contexts/bap";

type FormioSubmission = {
  [field: string]: unknown;
  _id: string; // MongoDB ObjectId string
  state: "submitted" | "draft";
  modified: string; // ISO 8601 date string
  data: { [field: string]: unknown };
  metadata: { [field: string]: unknown };
};

function createNewApplication(email: string, entity: BapSamEntity) {
  const { title, name } = getUserInfo(email, entity);

  return postData<FormioSubmission>(
    `${serverUrl}/api/formio-application-submission/`,
    {
      data: {
        last_updated_by: email,
        hidden_current_user_email: email,
        hidden_current_user_title: title,
        hidden_current_user_name: name,
        bap_hidden_entity_combo_key: entity.ENTITY_COMBO_KEY__c,
        sam_hidden_applicant_email: email,
        sam_hidden_applicant_title: title,
        sam_hidden_applicant_name: name,
        sam_hidden_applicant_efti: entity.ENTITY_EFT_INDICATOR__c,
        sam_hidden_applicant_uei: entity.UNIQUE_ENTITY_ID__c,
        sam_hidden_applicant_organization_name: entity.LEGAL_BUSINESS_NAME__c,
        sam_hidden_applicant_street_address_1: entity.PHYSICAL_ADDRESS_LINE_1__c, // prettier-ignore
        sam_hidden_applicant_street_address_2: entity.PHYSICAL_ADDRESS_LINE_2__c, // prettier-ignore
        sam_hidden_applicant_city: entity.PHYSICAL_ADDRESS_CITY__c,
        sam_hidden_applicant_state: entity.PHYSICAL_ADDRESS_PROVINCE_OR_STATE__c, // prettier-ignore
        sam_hidden_applicant_zip_code: entity.PHYSICAL_ADDRESS_ZIPPOSTAL_CODE__c, // prettier-ignore
      },
      state: "draft",
    }
  );
}

export function NewApplicationForm() {
  const navigate = useNavigate();

  const content = useContentData();
  const { epaUserData } = useUserState();
  const { csbData } = useCsbState();
  const { samEntities } = useBapState();

  const [message, setMessage] = useState<{
    displayed: boolean;
    type: "info" | "success" | "warning" | "error";
    text: string;
  }>({
    displayed: false,
    type: "info",
    text: "",
  });

  if (
    csbData.status !== "success" ||
    epaUserData.status !== "success" ||
    samEntities.status !== "success"
  ) {
    return <Loading />;
  }

  const email = epaUserData.data.mail;

  const activeSamEntities = samEntities.data.entities.filter((entity) => {
    return entity.ENTITY_STATUS__c === "Active";
  });

  return (
    <Transition.Root show={true} as={Fragment}>
      <Dialog
        as="div"
        className="tw-relative tw-z-10"
        onClose={(ev) => navigate("/")}
      >
        <Transition.Child
          as={Fragment}
          enter="tw-duration-300 tw-ease-out"
          enterFrom="tw-opacity-0"
          enterTo="tw-opacity-100"
          leave="tw-duration-200 tw-ease-in"
          leaveFrom="tw-opacity-100"
          leaveTo="tw-opacity-0"
        >
          <div className="tw-fixed tw-inset-0 tw-bg-black/70 tw-transition-colors" />
        </Transition.Child>

        <div className="tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto">
          <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center tw-p-4 sm:tw-items-center">
            <Transition.Child
              as={Fragment}
              enter="tw-duration-300 tw-ease-out"
              enterFrom="tw-translate-y-4 tw-opacity-0 sm:tw-translate-y-0"
              enterTo="tw-translate-y-0 tw-opacity-100"
              leave="tw-duration-200 tw-ease-in"
              leaveFrom="tw-translate-y-0 tw-opacity-100"
              leaveTo="tw-translate-y-4 tw-opacity-0 sm:tw-translate-y-0"
            >
              <Dialog.Panel className="tw-relative tw-transform tw-overflow-hidden tw-rounded-lg tw-bg-white tw-p-4 tw-shadow-xl tw-transition-all sm:tw-w-full sm:tw-max-w-4xl sm:tw-p-6">
                <div className="twpf">
                  <div className="tw-absolute tw-top-0 tw-right-0 tw-pt-4 tw-pr-4">
                    <button
                      type="button"
                      className="tw-rounded-md tw-bg-white tw-text-gray-400 tw-transition-none hover:tw-text-gray-700 focus:tw-text-gray-700"
                      onClick={(ev) => navigate("/")}
                    >
                      <span className="tw-sr-only">Close</span>
                      <XMarkIcon
                        className="tw-h-6 tw-w-6 tw-transition-none"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </div>

                <div className="tw-m-auto tw-max-w-3xl tw-p-4 sm:tw-p-8">
                  {!csbData.data.submissionPeriodOpen.application ? (
                    <div className="-tw-mb-4">
                      <Message
                        type="info"
                        text={messages.applicationFormClosed}
                      />
                    </div>
                  ) : activeSamEntities.length <= 0 ? (
                    <div className="-tw-mb-4">
                      <Message type="info" text={messages.bapNoSamResults} />
                    </div>
                  ) : (
                    <>
                      {content && (
                        <MarkdownContent
                          className="tw-mt-4 tw-text-center"
                          children={content.newApplicationDialog}
                          components={{
                            h2: (props) => (
                              <h2 className="tw-text-xl sm:tw-text-2xl md:tw-text-3xl">
                                {props.children}
                              </h2>
                            ),
                          }}
                        />
                      )}

                      {message.displayed && (
                        <Message type={message.type} text={message.text} />
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
                            {activeSamEntities.map((entity, index) => (
                              <tr key={index}>
                                <th scope="row" className="font-sans-2xs">
                                  <button
                                    className="usa-button font-sans-2xs margin-right-0 padding-x-105 padding-y-1"
                                    onClick={(ev) => {
                                      setMessage({
                                        displayed: true,
                                        type: "info",
                                        text: "Creating new rebate form application...",
                                      });

                                      createNewApplication(email, entity)
                                        .then((res) => {
                                          navigate(`/rebate/${res._id}`);
                                        })
                                        .catch((err) => {
                                          setMessage({
                                            displayed: true,
                                            type: "error",
                                            text: "Error creating new rebate form application.",
                                          });
                                        });
                                    }}
                                  >
                                    <span className="usa-sr-only">
                                      Create Form with UEI:{" "}
                                      {entity.UNIQUE_ENTITY_ID__c} and EFTI:{" "}
                                      {entity.ENTITY_EFT_INDICATOR__c}
                                    </span>
                                    <span className="display-flex flex-align-center">
                                      <svg
                                        className="usa-icon"
                                        aria-hidden="true"
                                        focusable="false"
                                        role="img"
                                      >
                                        <use href={`${icons}#arrow_forward`} />
                                      </svg>
                                      <span className="mobile-lg:display-none margin-left-1">
                                        New Form
                                      </span>
                                    </span>
                                  </button>
                                </th>
                                <td className="font-sans-2xs">
                                  {entity.UNIQUE_ENTITY_ID__c}
                                </td>
                                <td className="font-sans-2xs">
                                  {entity.ENTITY_EFT_INDICATOR__c || "0000"}
                                </td>
                                <td className="font-sans-2xs">
                                  {entity.LEGAL_BUSINESS_NAME__c}
                                </td>
                              </tr>
                            ))}
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
