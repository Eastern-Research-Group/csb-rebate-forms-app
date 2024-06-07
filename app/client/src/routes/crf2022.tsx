import { useEffect, useMemo, useRef } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { Dialog } from "@headlessui/react";
import { Formio, Form } from "@formio/react";
import s3 from "formiojs/providers/storage/s3";
import clsx from "clsx";
import { cloneDeep, isEqual } from "lodash";
import icons from "uswds/img/sprite.svg";
// ---
import { serverUrl, messages } from "@/config";
import {
  type FormioCRF2022Submission,
  getData,
  postData,
  useContentData,
  useConfigData,
  useBapSamData,
  useSubmissionsQueries,
  useSubmissions,
  submissionNeedsEdits,
  getUserInfo,
} from "@/utilities";
import { Loading } from "@/components/loading";
import { Message } from "@/components/message";
import { MarkdownContent } from "@/components/markdownContent";
import { useNotificationsActions } from "@/contexts/notifications";
import { useRebateYearState } from "@/contexts/rebateYear";

type ServerResponse =
  | {
      userAccess: false;
      formSchema: null;
      submission: null;
    }
  | {
      userAccess: true;
      formSchema: { url: string; json: object };
      submission: FormioCRF2022Submission;
    };

/** Custom hook to fetch and update Formio submission data */
function useFormioSubmissionQueryAndMutation(rebateId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.resetQueries({ queryKey: ["formio/2022/crf-submission"] });
  }, [queryClient]);

  const url = `${serverUrl}/api/formio/2022/crf-submission/${rebateId}`;

  const query = useQuery({
    queryKey: ["formio/2022/crf-submission", { id: rebateId }],
    queryFn: () => {
      return getData<ServerResponse>(url).then((res) => {
        const mongoId = res.submission?._id;
        const comboKey = res.submission?.data.bap_hidden_entity_combo_key;

        /**
         * Change the formUrl the File component's `uploadFile` uses, so the s3
         * upload PUT request is routed through the server app.
         *
         * https://github.com/formio/formio.js/blob/master/src/components/file/File.js#L760
         * https://github.com/formio/formio.js/blob/master/src/providers/storage/s3.js#L5
         * https://github.com/formio/formio.js/blob/master/src/providers/storage/xhr.js#L90
         */
        Formio.Providers.providers.storage.s3 = function (formio: {
          formUrl: string;
          [field: string]: unknown;
        }) {
          const s3Formio = cloneDeep(formio);
          s3Formio.formUrl = `${serverUrl}/api/formio/2022/s3/crf/${mongoId}/${comboKey}`;
          return s3(s3Formio);
        };

        return Promise.resolve(res);
      });
    },
    refetchOnWindowFocus: false,
  });

  const mutation = useMutation({
    mutationFn: (updatedSubmission: {
      mongoId: string;
      submission: {
        data: { [field: string]: unknown };
        metadata: { [field: string]: unknown };
        state: "submitted" | "draft";
      };
    }) => {
      return postData<FormioCRF2022Submission>(url, updatedSubmission);
    },
    onSuccess: (res) => {
      return queryClient.setQueryData<ServerResponse>(
        ["formio/2022/crf-submission", { id: rebateId }],
        (prevData) => {
          return prevData?.submission
            ? { ...prevData, submission: res }
            : prevData;
        },
      );
    },
  });

  return { query, mutation };
}

export function CRF2022() {
  const { email } = useOutletContext<{ email: string }>();
  /* ensure user verification (JWT refresh) doesn't cause form to re-render */
  return useMemo(() => {
    return <CloseOutRequestForm email={email} />;
  }, [email]);
}

function CloseOutRequestForm(props: { email: string }) {
  const { email } = props;

  const navigate = useNavigate();
  const { id: rebateId } = useParams<"id">(); // CSB Rebate ID (6 digits)

  const content = useContentData();
  const configData = useConfigData();
  const bapSamData = useBapSamData();
  const {
    displaySuccessNotification,
    displayErrorNotification,
    dismissNotification,
  } = useNotificationsActions();
  const { rebateYear } = useRebateYearState();

  const submissionsQueries = useSubmissionsQueries("2022");
  const submissions = useSubmissions("2022");

  const { query, mutation } = useFormioSubmissionQueryAndMutation(rebateId);
  const { userAccess, formSchema, submission } = query.data ?? {};

  /**
   * Stores when data is being posted to the server, so a loading overlay can
   * be rendered over the form, preventing the user from losing input data when
   * the form is re-rendered with data returned from the server's successful
   * post response.
   */
  const dataIsPosting = useRef(false);

  /**
   * Stores when the form is being submitted, so it can be referenced in the
   * Form component's `onSubmit` event prop to prevent double submits.
   */
  const formIsBeingSubmitted = useRef(false);

  /**
   * Stores the form data's state right after the user clicks the Save, Submit,
   * or Next button. As soon as a post request to update the data succeeds, this
   * pending submission data is reset to an empty object. This pending data,
   * along with the submission data returned from the server is passed into the
   * Form component's `submission` prop.
   */
  const pendingSubmissionData = useRef<{ [field: string]: unknown }>({});

  /**
   * Stores the last succesfully submitted data, so it can be used in the Form
   * component's `onNextPage` event prop's "dirty check" which determines if
   * posting of updated data is needed (so we don't make needless requests if no
   * field data in the form has changed).
   */
  const lastSuccesfullySubmittedData = useRef<{ [field: string]: unknown }>({});

  if (!configData || !bapSamData) {
    return <Loading />;
  }

  if (submissionsQueries.some((query) => query.isFetching)) {
    return <Loading />;
  }

  if (submissionsQueries.some((query) => query.isError)) {
    return <Message type="error" text={messages.formSubmissionsError} />;
  }

  if (query.isInitialLoading) {
    return <Loading />;
  }

  if (query.isError || !userAccess || !formSchema || !submission) {
    return <Message type="error" text={messages.formSubmissionError} />;
  }

  const rebate = submissions.find((r) => r.rebateId === rebateId);

  const crfNeedsEdits = !rebate
    ? false
    : submissionNeedsEdits({
        formio: rebate.crf.formio,
        bap: rebate.crf.bap,
      });

  const crfSubmissionPeriodOpen =
    configData.submissionPeriodOpen[rebateYear].crf;

  const formIsReadOnly =
    (submission.state === "submitted" || !crfSubmissionPeriodOpen) &&
    !crfNeedsEdits;

  /** matched SAM.gov entity for the Close Out submission */
  const entity = bapSamData.entities.find((entity) => {
    const { ENTITY_COMBO_KEY__c } = entity;
    return ENTITY_COMBO_KEY__c === submission.data.bap_hidden_entity_combo_key;
  });

  if (!entity) {
    return <Message type="error" text={messages.formSubmissionError} />;
  }

  if (entity.ENTITY_STATUS__c !== "Active") {
    return <Message type="error" text={messages.bapSamEntityNotActive} />;
  }

  const { title, name } = getUserInfo(email, entity);

  return (
    <div className="margin-top-2">
      {content && (
        <MarkdownContent
          className="margin-top-4"
          children={
            submission.state === "draft"
              ? content.draftCRFIntro
              : submission.state === "submitted"
                ? content.submittedCRFIntro
                : ""
          }
        />
      )}

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

      <Dialog as="div" open={dataIsPosting.current} onClose={(_value) => {}}>
        <div className={clsx("tw-fixed tw-inset-0 tw-bg-black/30")} />
        <div className={clsx("tw-fixed tw-inset-0 tw-z-20")}>
          <div
            className={clsx(
              "tw-flex tw-min-h-full tw-items-center tw-justify-center",
            )}
          >
            <Dialog.Panel
              className={clsx(
                "tw-rounded-lg tw-bg-white tw-px-4 tw-pb-4 tw-shadow-xl",
              )}
            >
              <Loading />
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>

      <div className="csb-form">
        <Form
          form={formSchema.json}
          url={formSchema.url} // NOTE: used for file uploads
          submission={{
            data: {
              ...submission.data,
              last_updated_by: email,
              hidden_current_user_email: email,
              hidden_current_user_title: title,
              hidden_current_user_name: name,
              ...pendingSubmissionData.current,
            },
          }}
          options={{
            readOnly: formIsReadOnly,
            noAlerts: true,
          }}
          onSubmit={(onSubmitSubmission: {
            data: { [field: string]: unknown };
            metadata: { [field: string]: unknown };
            state: "submitted" | "draft";
          }) => {
            if (formIsReadOnly) return;

            // account for when form is being submitted to prevent double submits
            if (formIsBeingSubmitted.current) return;
            if (onSubmitSubmission.state === "submitted") {
              formIsBeingSubmitted.current = true;
            }

            const data = { ...onSubmitSubmission.data };

            const updatedSubmission = {
              mongoId: submission._id,
              submission: {
                ...onSubmitSubmission,
                data,
              },
            };

            dismissNotification({ id: 0 });
            dataIsPosting.current = true;
            pendingSubmissionData.current = data;

            mutation.mutate(updatedSubmission, {
              onSuccess: (res, _payload, _context) => {
                pendingSubmissionData.current = {};
                lastSuccesfullySubmittedData.current = cloneDeep(res.data);

                /** success notification id */
                const id = Date.now();

                displaySuccessNotification({
                  id,
                  body: (
                    <p
                      className={clsx(
                        "tw-text-sm tw-font-medium tw-text-gray-900",
                      )}
                    >
                      {onSubmitSubmission.state === "submitted" ? (
                        <>
                          Close Out <em>{rebateId}</em> submitted successfully.
                        </>
                      ) : (
                        <>Draft saved successfully.</>
                      )}
                    </p>
                  ),
                });

                if (onSubmitSubmission.state === "submitted") {
                  /**
                   * NOTE: we'll keep the success notification displayed and
                   * redirect the user to their dashboard
                   */
                  navigate("/");
                }

                if (onSubmitSubmission.state === "draft") {
                  setTimeout(() => dismissNotification({ id }), 5000);
                }
              },
              onError: (_error, _payload, _context) => {
                displayErrorNotification({
                  id: Date.now(),
                  body: (
                    <p
                      className={clsx(
                        "tw-text-sm tw-font-medium tw-text-gray-900",
                      )}
                    >
                      {onSubmitSubmission.state === "submitted" ? (
                        <>Error submitting Close Out form.</>
                      ) : (
                        <>Error saving draft.</>
                      )}
                    </p>
                  ),
                });
              },
              onSettled: (_data, _error, _payload, _context) => {
                dataIsPosting.current = false;
                formIsBeingSubmitted.current = false;
              },
            });
          }}
          onNextPage={(onNextPageParam: {
            page: number;
            submission: {
              data: { [field: string]: unknown };
              metadata: { [field: string]: unknown };
            };
          }) => {
            if (formIsReadOnly) return;

            const data = { ...onNextPageParam.submission.data };

            // "dirty check" – don't post an update if no changes have been made
            // to the form (ignoring current user fields)
            const currentData = { ...data };
            const submittedData = { ...lastSuccesfullySubmittedData.current };
            delete currentData.hidden_current_user_email;
            delete currentData.hidden_current_user_title;
            delete currentData.hidden_current_user_name;
            delete submittedData.hidden_current_user_email;
            delete submittedData.hidden_current_user_title;
            delete submittedData.hidden_current_user_name;
            if (isEqual(currentData, submittedData)) return;

            const updatedSubmission = {
              mongoId: submission._id,
              submission: {
                ...onNextPageParam.submission,
                data,
                state: "draft" as const,
              },
            };

            dismissNotification({ id: 0 });
            dataIsPosting.current = true;
            pendingSubmissionData.current = data;

            mutation.mutate(updatedSubmission, {
              onSuccess: (res, _payload, _context) => {
                pendingSubmissionData.current = {};
                lastSuccesfullySubmittedData.current = cloneDeep(res.data);

                /** success notification id */
                const id = Date.now();

                displaySuccessNotification({
                  id,
                  body: (
                    <p
                      className={clsx(
                        "tw-text-sm tw-font-medium tw-text-gray-900",
                      )}
                    >
                      Draft saved successfully.
                    </p>
                  ),
                });

                setTimeout(() => dismissNotification({ id }), 5000);
              },
              onError: (_error, _payload, _context) => {
                displayErrorNotification({
                  id: Date.now(),
                  body: (
                    <p
                      className={clsx(
                        "tw-text-sm tw-font-medium tw-text-gray-900",
                      )}
                    >
                      Error saving draft.
                    </p>
                  ),
                });
              },
              onSettled: (_data, _error, _payload, _context) => {
                dataIsPosting.current = false;
              },
            });
          }}
        />
      </div>
    </div>
  );
}
