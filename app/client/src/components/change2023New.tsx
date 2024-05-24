import { Fragment, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Form } from "@formio/react";
import clsx from "clsx";
import icons from "uswds/img/sprite.svg";
// ---
import { serverUrl, messages } from "@/config";
import {
  type FormType,
  type FormioChange2023Submission,
  getData,
  postData,
  useContentData,
  useChangeRequestsQuery,
} from "@/utilities";
import { Loading } from "@/components/loading";
import { Message } from "@/components/message";
import { MarkdownContent } from "@/components/markdownContent";
import { useNotificationsActions } from "@/contexts/notifications";

type ChangeRequestData = {
  formType: FormType;
  comboKey: string;
  rebateId: string | null;
  mongoId: string;
  state: "draft" | "submitted";
  email: string;
  title: string;
  name: string;
};

type ServerResponse = { url: string; json: object };

/** Custom hook to fetch Formio schema */
function useFormioSchemaQuery() {
  const url = `${serverUrl}/api/formio/2023/change`;

  const query = useQuery({
    queryKey: ["formio/2023/change"],
    queryFn: () => getData<ServerResponse>(url),
    refetchOnWindowFocus: false,
  });

  return { query };
}

/** Custom hook to update Formio submission submission data */
function useFormioSubmissionMutation() {
  const url = `${serverUrl}/api/formio/2023/change/`;

  const mutation = useMutation({
    mutationFn: (submission: FormioChange2023Submission) => {
      return postData<FormioChange2023Submission>(url, submission);
    },
  });

  return { mutation };
}

export function ChangeRequest2023Button(props: { data: ChangeRequestData }) {
  const { data } = props;

  const [dialogShown, setDialogShown] = useState(false);

  function closeDialog() {
    setDialogShown(false);
  }

  return (
    <>
      <button
        className={clsx(
          "tw-cursor-pointer tw-border-0 tw-border-b-[1.5px] tw-border-transparent tw-bg-transparent tw-p-0 tw-text-sm tw-leading-tight",
          "hover:tw-border-b-slate-800",
          "focus:tw-border-b-slate-800",
        )}
        type="button"
        onClick={(_ev) => setDialogShown(true)}
      >
        <span className={clsx("tw-flex tw-items-center")}>
          <span className={clsx("tw-mr-1")}>Change</span>
          <svg
            className="usa-icon"
            aria-hidden="true"
            focusable="false"
            role="img"
          >
            <use href={`${icons}#launch`} />
          </svg>
        </span>
      </button>

      <ChangeRequest2023Dialog
        dialogShown={dialogShown}
        closeDialog={closeDialog}
        data={data}
      />
    </>
  );
}

function ChangeRequest2023Dialog(props: {
  dialogShown: boolean;
  closeDialog: () => void;
  data: ChangeRequestData;
}) {
  const { dialogShown, closeDialog, data } = props;

  /*
   * NOTE: Formio form Combobox inputs won't receive click events if the
   * Dialog.Panel component is used (they still receive keyboard events), so a
   * div is used instead. The downside is we lose the triggering of the Dialog
   * component's `onClose` event when a user clicks outside the panel.
   */

  return (
    <Transition.Root show={dialogShown} as={Fragment}>
      <Dialog
        as="div"
        className={clsx("tw-relative tw-z-10")}
        open={dialogShown}
        onClose={(_value) => closeDialog()}
      >
        <Transition.Child
          as={Fragment}
          enter={clsx("tw-duration-300 tw-ease-out")}
          enterFrom={clsx("tw-opacity-0")}
          enterTo={clsx("tw-opacity-100")}
          leave={clsx("tw-duration-200 tw-ease-in")}
          leaveFrom={clsx("tw-opacity-100")}
          leaveTo={clsx("tw-opacity-0")}
        >
          <div
            className={clsx(
              "tw-fixed tw-inset-0 tw-bg-black/70 tw-transition-colors",
            )}
          />
        </Transition.Child>

        <div className={clsx("tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto")}>
          <div
            className={clsx(
              "tw-flex tw-min-h-full tw-items-center tw-justify-center tw-p-4",
            )}
          >
            <Transition.Child
              as={Fragment}
              enter={clsx("tw-duration-300 tw-ease-out")}
              enterFrom={clsx("tw-translate-y-0 tw-opacity-0")}
              enterTo={clsx("tw-translate-y-0 tw-opacity-100")}
              leave={clsx("tw-duration-200 tw-ease-in")}
              leaveFrom={clsx("tw-translate-y-0 tw-opacity-100")}
              leaveTo={clsx("tw-translate-y-0 tw-opacity-0")}
            >
              {/* <Dialog.Panel> */}
              <div
                className={clsx(
                  "tw-relative tw-transform tw-overflow-hidden tw-rounded-lg tw-bg-white tw-p-4 tw-shadow-xl tw-transition-all",
                  "sm:tw-w-full sm:tw-max-w-7xl sm:tw-p-6",
                )}
              >
                <div className="twpf">
                  <div
                    className={clsx(
                      "tw-absolute tw-right-0 tw-top-0 tw-pr-4 tw-pt-4",
                    )}
                  >
                    <button
                      className={clsx(
                        "tw-rounded-md tw-bg-white tw-text-gray-400 tw-transition-none",
                        "hover:tw-text-gray-700",
                        "focus:tw-text-gray-700",
                      )}
                      type="button"
                      onClick={(_ev) => closeDialog()}
                    >
                      <span className={clsx("tw-sr-only")}>Close</span>
                      <XMarkIcon
                        className={clsx("tw-h-6 tw-w-6 tw-transition-none")}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </div>

                <div className={clsx("tw-m-auto tw-max-w-6xl tw-p-4")}>
                  <ChangeRequest2023Form
                    data={data}
                    closeDialog={closeDialog}
                  />
                </div>
              </div>
              {/* </Dialog.Panel> */}
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

function ChangeRequest2023Form(props: {
  data: ChangeRequestData;
  closeDialog: () => void;
}) {
  const { data, closeDialog } = props;
  const { formType, comboKey, rebateId, mongoId, state, email, title, name } =
    data;

  const content = useContentData();
  const {
    displaySuccessNotification,
    displayErrorNotification,
    dismissNotification,
  } = useNotificationsActions();

  const changeRequestsQuery = useChangeRequestsQuery("2023");

  const { query } = useFormioSchemaQuery();
  const { mutation } = useFormioSubmissionMutation();

  const formSchema = query.data;

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
   * Stores the form data's state right after the user clicks the Submit button.
   * As soon as a post request to submit the data succeeds, this pending
   * submission data is reset to an empty object. This pending data is passed
   * into the Form component's `submission` prop.
   */
  const pendingSubmissionData = useRef<{ [field: string]: unknown }>({});

  if (query.isInitialLoading) {
    return <Loading />;
  }

  if (query.isError || !formSchema) {
    return <Message type="error" text={messages.formSchemaError} />;
  }

  return (
    <>
      {content && <MarkdownContent children={content.newChangeIntro} />}

      <Dialog as="div" open={dataIsPosting.current} onClose={(_value) => {}}>
        <div className={clsx("tw-fixed tw-inset-0 tw-z-20 tw-bg-black/30")} />
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
              _request_form: formType,
              _bap_entity_combo_key: comboKey,
              _bap_rebate_id: rebateId,
              _mongo_id: mongoId,
              _formio_state: state,
              _user_email: email,
              _user_title: title,
              _user_name: name,
              ...pendingSubmissionData.current,
            },
          }}
          options={{
            noAlerts: true,
          }}
          onSubmit={(onSubmitSubmission: FormioChange2023Submission) => {
            // account for when form is being submitted to prevent double submits
            if (formIsBeingSubmitted.current) return;
            formIsBeingSubmitted.current = true;

            const data = { ...onSubmitSubmission.data };

            dismissNotification({ id: 0 });
            dataIsPosting.current = true;
            pendingSubmissionData.current = data;

            mutation.mutate(onSubmitSubmission, {
              onSuccess: (res, _payload, _context) => {
                pendingSubmissionData.current = {};

                displaySuccessNotification({
                  id: Date.now(),
                  body: (
                    <p
                      className={clsx(
                        "tw-text-sm tw-font-medium tw-text-gray-900",
                      )}
                    >
                      Change Request <em>{res._id}</em> submitted successfully.
                    </p>
                  ),
                });

                closeDialog();
                changeRequestsQuery.refetch();
              },
              onError: (_error, _payload, _context) => {
                displayErrorNotification({
                  id: Date.now(),
                  body: (
                    <>
                      <p
                        className={clsx(
                          "tw-text-sm tw-font-medium tw-text-gray-900",
                        )}
                      >
                        Error creating Change Request for{" "}
                        <em>
                          {formType.toUpperCase()} {rebateId}
                        </em>
                        .
                      </p>
                      <p
                        className={clsx("tw-mt-1 tw-text-sm tw-text-gray-500")}
                      >
                        Please try again.
                      </p>
                    </>
                  ),
                });
              },
              onSettled: (_data, _error, _payload, _context) => {
                dataIsPosting.current = false;
                formIsBeingSubmitted.current = false;
              },
            });
          }}
        />
      </div>
    </>
  );
}
