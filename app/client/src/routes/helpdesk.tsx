import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  type UseMutationResult,
  useQueryClient,
  useQuery,
  useMutation,
} from "@tanstack/react-query";
import { Form } from "@formio/react";
import clsx from "clsx";
import icon from "uswds/img/usa-icons-bg/search--white.svg";
import icons from "uswds/img/sprite.svg";
// ---
import {
  type RebateYear,
  type FormType,
  type BapSubmissionData,
  type FormioFRF2022Submission,
  type FormioPRF2022Submission,
  type FormioCRF2022Submission,
  type FormioFRF2023Submission,
  type FormioPRF2023Submission,
  // type FormioCRF2023Submission
} from "@/types";
import {
  serverUrl,
  messages,
  formioStatusMap,
  bapStatusMap,
  formioNameField,
  formioEmailField,
} from "@/config";
import {
  getData,
  postData,
  useContentData,
  useHelpdeskAccess,
  submissionNeedsEdits,
  submissionNeedsReimbursement,
} from "@/utilities";
import { Loading, LoadingButtonIcon } from "@/components/loading";
import { Message } from "@/components/message";
import { MarkdownContent } from "@/components/markdownContent";
import { TextWithTooltip } from "@/components/tooltip";
import { useDialogActions } from "@/contexts/dialog";
import {
  useRebateYearState,
  useRebateYearActions,
} from "@/contexts/rebateYear";

type Response = {
  rebateId: string | null;
  formSchema: { url: string; json: object } | null;
  formio:
    | (
        | FormioFRF2022Submission
        | FormioPRF2022Submission
        | FormioCRF2022Submission
        | FormioFRF2023Submission
        | FormioPRF2023Submission
      )
    | null;
  bap: BapSubmissionData | null;
};

type SubmissionAction = {
  _id: string; // MongoDB ObjectId string
  title: "Save Submission" | "CSB - Email Notification";
  form: string; // MongoDB ObjectId string
  submission: string; // MongoDB ObjectId string
  action: "save" | "email";
  handler: "before" | "after";
  method: "update";
  project: string; // MongoDB ObjectId string
  state: "complete";
  messages: {
    datetime: string; // ISO 8601 date time string
    info:
      | "Starting Action"
      | "Action Resolved (no longer blocking)"
      | "Sending message"
      | "Message Sent";
    data: Record<string, never>;
  }[];
  created: string; // ISO 8601 date time string
  modified: string; // ISO 8601 date time string
};

type DraftSubmission = {
  data: { [field: string]: unknown };
  metadata: { [field: string]: unknown };
  state: "draft";
};

/**
 * Formio action mapping (practically, just capitalizes "save" or "email").
 */
const formioActionMap = new Map<string, string>()
  .set("save", "Save")
  .set("email", "Email");

function formatDate(dateTimeString: string | null) {
  return dateTimeString ? new Date(dateTimeString).toLocaleDateString() : "";
}

function formatTime(dateTimeString: string | null) {
  return dateTimeString ? new Date(dateTimeString).toLocaleTimeString() : "";
}

function ResultTableRow(props: {
  setFormDisplayed: Dispatch<SetStateAction<boolean>>;
  setActionsData: Dispatch<
    SetStateAction<{ fetched: boolean; results: SubmissionAction[] }>
  >;
  submissionMutation: UseMutationResult<
    Response["formio"],
    unknown,
    DraftSubmission,
    unknown
  >;
  formType: FormType;
  rebateId: string | null;
  formio:
    | FormioFRF2022Submission
    | FormioPRF2022Submission
    | FormioCRF2022Submission
    | FormioFRF2023Submission
    | FormioPRF2023Submission;
  bap: BapSubmissionData | null;
}) {
  const {
    setFormDisplayed,
    setActionsData,
    submissionMutation,
    formType,
    rebateId,
    formio,
    bap,
  } = props;

  const { displayDialog } = useDialogActions();
  const { rebateYear } = useRebateYearState();

  const formId = formio.form;
  const mongoId = formio._id;

  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.resetQueries({ queryKey: ["helpdesk/actions"] });
    queryClient.resetQueries({ queryKey: ["helpdesk/pdf"] });
  }, [queryClient]);

  const actionsUrl = `${serverUrl}/api/help/formio/actions/${formId}/${mongoId}`;
  const pdfUrl = `${serverUrl}/api/help/formio/pdf/${formId}/${mongoId}`;

  const actionsQuery = useQuery({
    queryKey: ["helpdesk/actions"],
    queryFn: () => getData<SubmissionAction[]>(actionsUrl),
    onSuccess: (res) => setActionsData({ fetched: true, results: res }),
    enabled: false,
  });

  const pdfQuery = useQuery({
    queryKey: ["helpdesk/pdf"],
    queryFn: () => getData<string>(pdfUrl),
    onSuccess: (res) => {
      const link = document.createElement("a");
      link.setAttribute("href", `data:application/pdf;base64,${res}`);
      link.setAttribute("download", `${formio._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    enabled: false,
  });

  const date = formatDate(formio.modified);
  const time = formatTime(formio.modified);

  const bapInternalStatus = bap?.status || "";
  const bapReimbursementNeeded = bap?.reimbursementNeeded || false;

  const bapStatus = bapStatusMap[rebateYear][formType].get(bapInternalStatus);
  const formioStatus = formioStatusMap.get(formio.state);

  const needsEdits = submissionNeedsEdits({ formio, bap });

  const crfNeedsReimbursement =
    formType === "crf" &&
    submissionNeedsReimbursement({
      status: bapInternalStatus,
      reimbursementNeeded: bapReimbursementNeeded,
    });

  const status = needsEdits
    ? "Edits Requested"
    : crfNeedsReimbursement
      ? "Reimbursement Needed"
      : bapStatus || formioStatus || "";

  const nameField = formioNameField[rebateYear][formType];
  const emailField = formioEmailField[rebateYear][formType];

  const name = (formio.data[nameField] as string) || "";
  const email = (formio.data[emailField] as string) || "";

  return (
    <tr>
      <th scope="row">
        <button
          className="usa-button font-sans-2xs margin-right-0 padding-x-105 padding-y-1"
          onClick={(_ev) => setFormDisplayed(true)}
        >
          <span className="display-flex flex-align-center">
            <svg
              className="usa-icon"
              aria-hidden="true"
              focusable="false"
              role="img"
            >
              <use href={`${icons}#visibility`} />
            </svg>
            <span className="margin-left-1">View</span>
          </span>
        </button>
      </th>
      <td>{rebateId || mongoId}</td>
      <td>
        {status}

        {!bap && status === "Submitted" && (
          <span className="margin-left-2">
            <button
              className="usa-button font-sans-2xs margin-right-0 padding-x-105 padding-y-1"
              onClick={(_ev) => {
                displayDialog({
                  dismissable: true,
                  heading: "Change Submission Status to Draft",
                  description: (
                    <>
                      <div className="usa-alert usa-alert--info" role="alert">
                        <div className="usa-alert__body">
                          <p className="usa-alert__text">
                            The BAP’s “Edits Requested” workflow is designed to
                            give users the ability to revise their submitted
                            form submissions.
                          </p>

                          <p>
                            <strong>
                              This helpdesk functionality is only intended to be
                              used when the BAP’s status change workflow is not
                              yet in place, and the form’s enrollment period is
                              still open.
                            </strong>
                          </p>
                        </div>
                      </div>

                      <p>Please select the button below only if:</p>

                      <ul>
                        <li>
                          The BAP’s status change workflow is not yet in place
                          for this form submission.
                        </li>
                        <li>The form’s enrollment period is still open.</li>
                      </ul>

                      <div
                        className="usa-alert usa-alert--warning"
                        role="alert"
                      >
                        <div className="usa-alert__body">
                          <p className="usa-alert__text">
                            <strong>Please note:</strong> Once a form’s
                            enrollment period has been closed, only submissions
                            with a BAP status of “Edits Requested” are editable,
                            even if the below button is selected.
                          </p>
                        </div>
                      </div>
                    </>
                  ),
                  confirmText: "Change Submission Status to Draft",
                  confirmedAction: () => {
                    const submission = {
                      metadata: { ...formio.metadata },
                      data: { ...formio.data },
                      state: "draft" as const,
                    };

                    submission.data[emailField] = "cleanschoolbus@epa.gov";
                    submission.metadata.csbHelpdesk ??= [];
                    (submission.metadata.csbHelpdesk as object[]).push({
                      previousUserEmail: email,
                      previousModified: formio.modified,
                      updateDatetime: new Date().toISOString(),
                    });

                    submissionMutation.mutate(submission);
                  },
                });
              }}
            >
              <span className="display-flex flex-align-center">
                <svg
                  className="usa-icon"
                  aria-hidden="true"
                  focusable="false"
                  role="img"
                >
                  <use href={`${icons}#undo`} />
                </svg>
                <span className="margin-left-1">Draft</span>
              </span>
            </button>
          </span>
        )}
      </td>
      <td>{name}</td>
      <td>{email}</td>
      <td>
        <span title={`${date} ${time}`}>{date}</span>
      </td>

      <td>
        <button
          className="usa-button font-sans-2xs margin-right-0 padding-x-105 padding-y-1"
          type="button"
          disabled={actionsQuery.isFetching || actionsQuery.isSuccess}
          onClick={(_ev) => actionsQuery.refetch()}
        >
          <span className="display-flex flex-align-center">
            <svg
              className="usa-icon"
              aria-hidden="true"
              focusable="false"
              role="img"
            >
              <use href={`${icons}#history`} />
            </svg>
            <span className="margin-left-1">Actions</span>
            {actionsQuery.isFetching && <LoadingButtonIcon position="end" />}
          </span>
        </button>
      </td>

      <td className={clsx("!tw-text-right")}>
        <button
          className="usa-button font-sans-2xs margin-right-0 padding-x-105 padding-y-1"
          type="button"
          disabled={pdfQuery.isFetching}
          onClick={(_ev) => pdfQuery.refetch()}
        >
          <span className="display-flex flex-align-center">
            <svg
              className="usa-icon"
              aria-hidden="true"
              focusable="false"
              role="img"
            >
              <use href={`${icons}#arrow_downward`} />
            </svg>
            <span className="margin-left-1">Download</span>
            {pdfQuery.isFetching && <LoadingButtonIcon position="end" />}
          </span>
        </button>
      </td>
    </tr>
  );
}

export function Helpdesk() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const content = useContentData();
  const helpdeskAccess = useHelpdeskAccess();
  const { rebateYear } = useRebateYearState();
  const { setRebateYear } = useRebateYearActions();

  const [formType, setFormType] = useState<FormType>("frf");
  const [searchText, setSearchText] = useState("");
  const [resultDisplayed, setResultDisplayed] = useState(false);
  const [formDisplayed, setFormDisplayed] = useState(false);
  const [actionsData, setActionsData] = useState<{
    fetched: boolean;
    results: SubmissionAction[];
  }>({ fetched: false, results: [] });

  useEffect(() => {
    queryClient.resetQueries({ queryKey: ["helpdesk/submission"] });
  }, [queryClient]);

  const submissionUrl = `${serverUrl}/api/help/formio/submission/${rebateYear}/${formType}/${searchText}`;

  const submissionQuery = useQuery({
    queryKey: ["helpdesk/submission"],
    queryFn: () => getData<Response>(submissionUrl),
    onSuccess: (_res) => setResultDisplayed(true),
    enabled: false,
  });

  const submissionMutation = useMutation({
    mutationFn: (submission: DraftSubmission) => {
      return postData<Response["formio"]>(submissionUrl, submission);
    },
    onSuccess: (res) => {
      queryClient.setQueryData<Response>(
        ["helpdesk/submission"],
        (prevData) => {
          return prevData?.formio
            ? { ...prevData, formio: { ...prevData.formio, submission: res } }
            : prevData;
        },
      );

      submissionQuery.refetch();
    },
  });

  const { rebateId, formSchema, formio, bap } = submissionQuery.data ?? {
    rebateId: null,
    formSchema: null,
    formio: null,
    bap: null,
  };

  if (helpdeskAccess === "pending") {
    return <Loading />;
  }

  if (helpdeskAccess === "failure") {
    navigate("/", { replace: true });
  }

  return (
    <>
      {content && (
        <MarkdownContent
          className="margin-top-4"
          children={content.helpdeskIntro}
        />
      )}

      <div className="margin-top-1 padding-2 border-1px border-base-lighter bg-base-lightest">
        <nav className="flex-align-center tablet:display-flex">
          <div className="tablet:margin-right-1">
            <label
              htmlFor="rebate-year"
              className="margin-right-1 font-sans-2xs"
            >
              Rebate Year:
            </label>
            <select
              id="rebate-year"
              className={clsx(
                "tw-rounded-md tw-border-0 tw-text-sm tw-font-bold tw-leading-4 tw-ring-1 tw-ring-inset tw-ring-gray-300",
              )}
              name="rebate-year"
              onChange={(ev) => {
                setRebateYear(ev.target.value as RebateYear);
                setResultDisplayed(false);
                queryClient.resetQueries({ queryKey: ["helpdesk/submission"] });
              }}
              defaultValue={rebateYear}
            >
              <option>2022</option>
              <option>2023</option>
              <option>2024</option>
            </select>
          </div>

          <div className="tablet:margin-left-1">
            <fieldset className="csb-helpdesk-form-inputs usa-fieldset tablet:display-flex">
              <div className="usa-radio">
                <input
                  id="form-type-frf"
                  className="usa-radio__input"
                  type="radio"
                  name="form-type"
                  value="frf"
                  checked={formType === "frf"}
                  onChange={(ev) => {
                    setFormType(ev.target.value as FormType);
                    setResultDisplayed(false);
                    queryClient.resetQueries({
                      queryKey: ["helpdesk/submission"],
                    });
                  }}
                />
                <label
                  className="usa-radio__label tablet:margin-top-0 font-sans-2xs"
                  htmlFor="form-type-frf"
                >
                  Application
                </label>
              </div>

              <div className="usa-radio tablet:margin-left-2">
                <input
                  id="form-type-prf"
                  className="usa-radio__input"
                  type="radio"
                  name="form-type"
                  value="prf"
                  checked={formType === "prf"}
                  onChange={(ev) => {
                    setFormType(ev.target.value as FormType);
                    setResultDisplayed(false);
                    queryClient.resetQueries({
                      queryKey: ["helpdesk/submission"],
                    });
                  }}
                />
                <label
                  className="usa-radio__label tablet:margin-top-0 font-sans-2xs"
                  htmlFor="form-type-prf"
                >
                  Payment Request
                </label>
              </div>

              <div className="usa-radio tablet:margin-left-2">
                <input
                  id="form-type-crf"
                  className="usa-radio__input"
                  type="radio"
                  name="form-type"
                  value="crf"
                  checked={formType === "crf"}
                  onChange={(ev) => {
                    setFormType(ev.target.value as FormType);
                    setResultDisplayed(false);
                    queryClient.resetQueries({
                      queryKey: ["helpdesk/submission"],
                    });
                  }}
                />
                <label
                  className="usa-radio__label tablet:margin-top-0 font-sans-2xs"
                  htmlFor="form-type-crf"
                >
                  Close Out
                </label>
              </div>
            </fieldset>
          </div>
        </nav>

        <div className="margin-top-2 tablet:margin-top-1">
          <form
            className="usa-search"
            role="search"
            onSubmit={(ev) => {
              ev.preventDefault();
              if (searchText === "") return;
              setFormDisplayed(false);
              setActionsData({ fetched: false, results: [] });
              submissionQuery.refetch();
            }}
          >
            <label className="usa-sr-only" htmlFor="search-submissions-by-id">
              Search submissions by ID
            </label>
            <input
              id="search-submissions-by-id"
              className="usa-input"
              type="search"
              name="search-submissions"
              value={searchText}
              onChange={(ev) => setSearchText(ev.target.value)}
            />
            <button className="usa-button" type="submit">
              <span className="usa-search__submit-text">Search</span>
              <img
                className="usa-search__submit-icon"
                src={icon}
                alt="Search"
              />
            </button>
          </form>
        </div>
      </div>

      {submissionQuery.isFetching ? (
        <Loading />
      ) : submissionQuery.isError ? (
        <Message type="error" text={messages.helpdeskSubmissionSearchError} />
      ) : submissionQuery.isSuccess && !!formio && resultDisplayed ? (
        <>
          <div className="usa-table-container--scrollable" tabIndex={0}>
            <table
              aria-label="Submission Search Results"
              className="usa-table usa-table--stacked usa-table--borderless usa-table--striped width-full"
            >
              <thead>
                <tr className="font-sans-2xs text-no-wrap">
                  <th scope="col">
                    <span className="usa-sr-only">Open</span>
                  </th>

                  {rebateId ? (
                    <th scope="col">
                      <TextWithTooltip
                        text="Rebate ID"
                        tooltip="Unique Clean School Bus Rebate ID"
                      />
                    </th>
                  ) : (
                    <th scope="col">
                      <TextWithTooltip
                        text="MongoDB Object ID"
                        tooltip="Formio submission's MongoDB Object ID"
                      />
                    </th>
                  )}

                  <th scope="col">
                    <TextWithTooltip
                      text="Form Status"
                      tooltip="Draft, Edits Requested, Submitted, Withdrawn, Selected, or Not Selected" // TODO: update to reflect other statuses
                    />
                  </th>

                  <th scope="col">
                    <TextWithTooltip
                      text="Applicant Name"
                      tooltip="Name of Applicant"
                    />
                  </th>

                  <th scope="col">
                    <TextWithTooltip
                      text="Updated By"
                      tooltip="Last person that updated this form"
                    />
                  </th>

                  <th scope="col">
                    <TextWithTooltip
                      text="Date Updated"
                      tooltip="Last date this form was updated"
                    />
                  </th>

                  <th scope="col">
                    <TextWithTooltip
                      text="Actions"
                      tooltip="View all actions from the last 30 days associated with this submission"
                    />
                  </th>

                  <th scope="col" className={clsx("tw-text-right")}>
                    <TextWithTooltip
                      text="Download PDF"
                      tooltip="Download a PDF of this submission"
                    />
                  </th>
                </tr>
              </thead>

              <tbody>
                <ResultTableRow
                  setFormDisplayed={setFormDisplayed}
                  setActionsData={setActionsData}
                  submissionMutation={submissionMutation}
                  formType={formType}
                  rebateId={rebateId}
                  formio={formio}
                  bap={bap}
                />
              </tbody>
            </table>
          </div>

          {actionsData.fetched && (
            <>
              {actionsData.results.length === 0 ? (
                <Message
                  type="info"
                  text={messages.helpdeskSubmissionNoActions}
                />
              ) : (
                <div className="usa-table-container--scrollable" tabIndex={0}>
                  <table
                    aria-label="Submission Actions"
                    className="usa-table usa-table--stacked usa-table--borderless usa-table--striped width-full"
                  >
                    <thead>
                      <tr className="font-sans-2xs text-no-wrap">
                        <th scope="col">Date</th>
                        <th scope="col">Time</th>
                        <th scope="col">Action</th>
                        <th scope="col">Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {actionsData.results.map((data) => {
                        const { _id, action, messages } = data;
                        const event = messages[messages.length - 1];
                        const { datetime, info } = event;
                        const date = new Date(datetime).toLocaleDateString();
                        const time = new Date(datetime).toLocaleTimeString();
                        return (
                          <tr key={_id}>
                            <th scope="row">{date}</th>
                            <td>{time}</td>
                            <td>{formioActionMap.get(action) || action}</td>
                            <td>{info}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {formDisplayed && !!formSchema && (
            <>
              <ul className="usa-icon-list">
                <li className="usa-icon-list__item">
                  <div className="usa-icon-list__icon text-primary">
                    <svg className="usa-icon" aria-hidden="true" role="img">
                      <use href={`${icons}#local_offer`} />
                    </svg>
                  </div>
                  <div className="usa-icon-list__content">
                    <strong>MongoDB Object ID:</strong> {formio._id}
                  </div>
                </li>

                {rebateId && (
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
                )}
              </ul>

              <Form
                form={formSchema.json}
                url={formSchema.url} // NOTE: used for file uploads
                submission={{
                  state: formio.state,
                  data: formio.data,
                }}
                options={{ readOnly: true }}
              />
            </>
          )}
        </>
      ) : null}
    </>
  );
}
