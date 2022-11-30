import { useMemo, useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Formio, Form } from "@formio/react";
import { cloneDeep, isEqual } from "lodash";
import icons from "uswds/img/sprite.svg";
// ---
import { serverUrl, getData, postData } from "../config";
import { getUserInfo } from "../utilities";
import { Loading } from "components/loading";
import { Message } from "components/message";
import { MarkdownContent } from "components/markdownContent";
import { useContentState } from "contexts/content";
import { useUserState } from "contexts/user";
import { useCsbState } from "contexts/csb";
import { useBapState } from "contexts/bap";
import {
  usePageMessageState,
  usePageMessageDispatch,
} from "contexts/pageMessage";
import {
  FormioSubmissionData,
  FormioFetchedResponse,
  usePageFormioState,
  usePageFormioDispatch,
} from "contexts/pageFormio";

function PageMessage() {
  const { displayed, type, text } = usePageMessageState();
  if (!displayed) return null;
  return <Message type={type} text={text} />;
}

export function PaymentRequestForm() {
  const { epaUserData } = useUserState();
  const email = epaUserData.status !== "success" ? "" : epaUserData.data.mail;

  /**
   * NOTE: The child component only uses the email from the `user` context, but
   * the `epaUserData.data` object includes an `exp` field that changes whenever
   * the JWT is refreshed. Since the user verification process `verifyUser()`
   * gets called from the parent `ProtectedRoute` component, we need to memoize
   * the email address (which won't change) to prevent the child component from
   * needlessly re-rendering.
   */
  return useMemo(() => {
    return <PaymentRequestFormContent email={email} />;
  }, [email]);
}

function PaymentRequestFormContent({ email }: { email: string }) {
  const navigate = useNavigate();
  const { rebateId } = useParams<"rebateId">(); // CSB Rebate ID (6 digits)

  const { content } = useContentState();
  const { csbData } = useCsbState();
  const { samEntities } = useBapState();
  const { formio } = usePageFormioState();
  const pageMessageDispatch = usePageMessageDispatch();
  const pageFormioDispatch = usePageFormioDispatch();

  // reset page message state since it's used across pages
  useEffect(() => {
    pageMessageDispatch({ type: "RESET_MESSAGE" });
  }, [pageMessageDispatch]);

  // reset page formio state since it's used across pages
  useEffect(() => {
    pageFormioDispatch({ type: "RESET_FORMIO_DATA" });
  }, [pageFormioDispatch]);

  // create ref to store when form is being submitted, so it can be referenced
  // in the Form component's `onSubmit` event prop, to prevent double submits
  const formIsBeingSubmitted = useRef(false);

  // set when form submission data is initially fetched, and then re-set each
  // time a successful update of the submission data is posted to forms.gov
  const [storedSubmissionData, setStoredSubmissionData] =
    useState<FormioSubmissionData>({});

  // create ref to storedSubmissionData, so the latest value can be referenced
  // in the Form component's `onNextPage` event prop
  const storedSubmissionDataRef = useRef<FormioSubmissionData>({});

  // initially empty, but will be set once the user attemts to submit the form
  // (both successfully and unsuccessfully). passed to the to the <Form />
  // component's submission prop, so the fields the user filled out will not be
  // lost if a submission update fails, so the user can attempt submitting again
  const [pendingSubmissionData, setPendingSubmissionData] =
    useState<FormioSubmissionData>({});

  useEffect(() => {
    pageFormioDispatch({ type: "FETCH_FORMIO_DATA_REQUEST" });

    getData(`${serverUrl}/api/formio-payment-request-submission/${rebateId}`)
      .then((res: FormioFetchedResponse) => {
        // set up s3 re-route to wrapper app
        const s3Provider = Formio.Providers.providers.storage.s3;
        Formio.Providers.providers.storage.s3 = function (formio: any) {
          const s3Formio = cloneDeep(formio);
          const mongoId = res.submission?._id;
          const comboKey = res.submission?.data.bap_hidden_entity_combo_key;
          s3Formio.formUrl = `${serverUrl}/api/s3/payment-request/${mongoId}/${comboKey}`;
          return s3Provider(s3Formio);
        };

        const data = { ...res.submission?.data };

        setStoredSubmissionData((_prevData) => {
          storedSubmissionDataRef.current = cloneDeep(data);
          return data;
        });

        pageFormioDispatch({
          type: "FETCH_FORMIO_DATA_SUCCESS",
          payload: { data: res },
        });
      })
      .catch((err) => {
        pageFormioDispatch({ type: "FETCH_FORMIO_DATA_FAILURE" });
      });
  }, [rebateId, pageFormioDispatch]);

  if (formio.status === "idle") {
    return null;
  }

  if (formio.status === "pending") {
    return <Loading />;
  }

  const { userAccess, formSchema, submission } = formio.data;

  if (
    formio.status === "failure" ||
    !userAccess ||
    !formSchema ||
    !submission
  ) {
    return (
      <Message
        type="error"
        text="The requested submission does not exist, or you do not have access. Please contact support if you believe this is a mistake."
      />
    );
  }

  if (
    email === "" ||
    csbData.status !== "success" ||
    samEntities.status !== "success"
  ) {
    return <Loading />;
  }

  const formIsReadOnly = submission.state === "submitted";

  const entityComboKey = storedSubmissionData.bap_hidden_entity_combo_key;
  const entity = samEntities.data.entities.find((entity) => {
    return (
      entity.ENTITY_STATUS__c === "Active" &&
      entity.ENTITY_COMBO_KEY__c === entityComboKey
    );
  });

  // TODO: do we need to account for when ENTITY_STATUS__c does not equal "Active" (e.g. its expired)?
  if (!entity) return null;

  const {
    UNIQUE_ENTITY_ID__c,
    ENTITY_EFT_INDICATOR__c,
    ELEC_BUS_POC_EMAIL__c,
    ALT_ELEC_BUS_POC_EMAIL__c,
    GOVT_BUS_POC_EMAIL__c,
    ALT_GOVT_BUS_POC_EMAIL__c,
  } = entity;

  const { title, name } = getUserInfo(email, entity);

  return (
    <div className="margin-top-2">
      {content.status === "success" && (
        <MarkdownContent
          className="margin-top-4"
          children={
            submission.state === "draft"
              ? content.data?.draftPaymentRequestIntro || ""
              : submission.state === "submitted"
              ? content.data?.submittedPaymentRequestIntro || ""
              : ""
          }
        />
      )}

      <PageMessage />

      <ul className="usa-icon-list">
        <li className="usa-icon-list__item">
          <div className="usa-icon-list__icon text-primary">
            <svg className="usa-icon" aria-hidden="true" role="img">
              <use href={`${icons}#local_offer`} />
            </svg>
          </div>
          <div className="usa-icon-list__content">
            <strong>Rebate ID:</strong> {rebateId}
          </div>
        </li>
      </ul>

      <div className="csb-form">
        <Form
          form={formSchema.json}
          url={formSchema.url} // NOTE: used for file uploads
          submission={{
            data: {
              ...storedSubmissionData,
              last_updated_by: email,
              hidden_current_user_email: email,
              hidden_current_user_title: title,
              hidden_current_user_name: name,
              hidden_sam_uei: UNIQUE_ENTITY_ID__c,
              hidden_sam_efti: ENTITY_EFT_INDICATOR__c || "0000",
              hidden_sam_elec_bus_poc_email: ELEC_BUS_POC_EMAIL__c,
              hidden_sam_alt_elec_bus_poc_email: ALT_ELEC_BUS_POC_EMAIL__c,
              hidden_sam_govt_bus_poc_email: GOVT_BUS_POC_EMAIL__c,
              hidden_sam_alt_govt_bus_poc_email: ALT_GOVT_BUS_POC_EMAIL__c,
              ...pendingSubmissionData,
            },
          }}
          options={{
            readOnly: formIsReadOnly,
            noAlerts: true,
          }}
          onSubmit={(onSubmitSubmission: {
            state: "submitted" | "draft";
            data: FormioSubmissionData;
            metadata: unknown;
          }) => {
            if (formIsReadOnly) return;

            // account for when form is being submitted to prevent double submits
            if (formIsBeingSubmitted.current) return;
            if (onSubmitSubmission.state === "submitted") {
              formIsBeingSubmitted.current = true;
            }

            const data = { ...onSubmitSubmission.data };

            if (onSubmitSubmission.state === "submitted") {
              pageMessageDispatch({
                type: "DISPLAY_MESSAGE",
                payload: { type: "info", text: "Submitting form..." },
              });
            }

            if (onSubmitSubmission.state === "draft") {
              pageMessageDispatch({
                type: "DISPLAY_MESSAGE",
                payload: { type: "info", text: "Saving form..." },
              });
            }

            setPendingSubmissionData(data);

            postData(
              `${serverUrl}/api/formio-payment-request-submission/${rebateId}`,
              {
                mongoId: formio.data.submission?._id,
                submission: { ...onSubmitSubmission, data },
              }
            )
              .then((res) => {
                setStoredSubmissionData((_prevData) => {
                  storedSubmissionDataRef.current = cloneDeep(res.data);
                  return res.data;
                });

                setPendingSubmissionData({});

                if (onSubmitSubmission.state === "submitted") {
                  pageMessageDispatch({
                    type: "DISPLAY_MESSAGE",
                    payload: {
                      type: "success",
                      text: "Form successfully submitted.",
                    },
                  });

                  setTimeout(() => {
                    pageMessageDispatch({ type: "RESET_MESSAGE" });
                    navigate("/");
                  }, 5000);
                  return;
                }

                if (onSubmitSubmission.state === "draft") {
                  pageMessageDispatch({
                    type: "DISPLAY_MESSAGE",
                    payload: {
                      type: "success",
                      text: "Draft successfully saved.",
                    },
                  });

                  setTimeout(() => {
                    pageMessageDispatch({ type: "RESET_MESSAGE" });
                  }, 5000);
                }
              })
              .catch((err) => {
                formIsBeingSubmitted.current = false;

                pageMessageDispatch({
                  type: "DISPLAY_MESSAGE",
                  payload: {
                    type: "error",
                    text: "Error submitting Payment Request form.",
                  },
                });
              });
          }}
          onNextPage={(onNextPageParam: {
            page: number;
            submission: {
              data: FormioSubmissionData;
              metadata: unknown;
            };
          }) => {
            if (formIsReadOnly) return;

            const data = { ...onNextPageParam.submission.data };

            // don't post an update if no changes have been made to the form
            // (ignoring current user fields)
            const dataToCheck = { ...data };
            delete dataToCheck.hidden_current_user_email;
            delete dataToCheck.hidden_current_user_title;
            delete dataToCheck.hidden_current_user_name;
            const storedDataToCheck = { ...storedSubmissionDataRef.current };
            delete storedDataToCheck.hidden_current_user_email;
            delete storedDataToCheck.hidden_current_user_title;
            delete storedDataToCheck.hidden_current_user_name;
            if (isEqual(dataToCheck, storedDataToCheck)) return;

            pageMessageDispatch({
              type: "DISPLAY_MESSAGE",
              payload: { type: "info", text: "Saving form..." },
            });

            setPendingSubmissionData(data);

            postData(
              `${serverUrl}/api/formio-payment-request-submission/${rebateId}`,
              {
                mongoId: formio.data.submission?._id,
                submission: {
                  ...onNextPageParam.submission,
                  data,
                  state: "draft",
                },
              }
            )
              .then((res) => {
                setStoredSubmissionData((_prevData) => {
                  storedSubmissionDataRef.current = cloneDeep(res.data);
                  return res.data;
                });

                setPendingSubmissionData({});

                pageMessageDispatch({
                  type: "DISPLAY_MESSAGE",
                  payload: {
                    type: "success",
                    text: "Draft successfully saved.",
                  },
                });

                setTimeout(() => {
                  pageMessageDispatch({ type: "RESET_MESSAGE" });
                }, 5000);
              })
              .catch((err) => {
                pageMessageDispatch({
                  type: "DISPLAY_MESSAGE",
                  payload: {
                    type: "error",
                    text: "Error saving draft Payment Request form.",
                  },
                });
              });
          }}
        />
      </div>

      <PageMessage />
    </div>
  );
}
