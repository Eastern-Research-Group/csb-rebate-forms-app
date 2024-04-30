import { Fragment, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
   * NOTE: For some reason select inputs from the Formio form won't receive
   * click events if the Dialog.Panel component is used (strangely, they still
   * receive keyboard events), so a div is used instead. The downside is we lose
   * the triggering of the Dialog component's `onClose` event when a user clicks
   * outside the panel.
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
              {/* <Dialog.Panel */}
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
  const formSchema = query.data;

  /**
   * Stores when the form is being submitted, so it can be referenced in the
   * Form component's `onSubmit` event prop to prevent double submits.
   */
  const formIsBeingSubmitted = useRef(false);

  if (query.isInitialLoading) {
    return <Loading />;
  }

  if (query.isError || !formSchema) {
    return <Message type="error" text={messages.formSchemaError} />;
  }

  return (
    <>
      {content && <MarkdownContent children={content.newChangeIntro} />}

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
            },
          }}
          options={{
            noAlerts: true,
          }}
          onSubmit={(onSubmitSubmission: {
            data: { [field: string]: unknown };
            metadata: { [field: string]: unknown };
            state: "submitted";
          }) => {
            // account for when form is being submitted to prevent double submits
            if (formIsBeingSubmitted.current) return;
            formIsBeingSubmitted.current = true;

            dismissNotification({ id: 0 });

            postData<FormioChange2023Submission>(
              `${serverUrl}/api/formio/2023/change/`,
              onSubmitSubmission,
            )
              .then((res) => {
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
              })
              .catch((_err) => {
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
              })
              .finally(() => {
                formIsBeingSubmitted.current = false;
              });
          }}
        />
      </div>
    </>
  );
}
