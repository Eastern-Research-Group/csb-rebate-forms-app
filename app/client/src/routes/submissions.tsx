import { Fragment, useState } from "react";
import {
  type LinkProps,
  Link,
  useNavigate,
  useOutletContext,
} from "react-router-dom";
import { ChevronUpIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import icons from "uswds/img/sprite.svg";
// ---
import {
  type RebateYear,
  type Rebate2022,
  type Rebate2023,
  type Rebate2024,
} from "@/types";
import {
  serverUrl,
  messages,
  formioStatusMap,
  bapStatusMap,
  statusIconMap,
} from "@/config";
import {
  postData,
  useContentData,
  useConfigData,
  useBapSamData,
  useChangeRequestsQuery,
  useChangeRequests,
  useSubmissionsQueries,
  useSubmissions,
  submissionNeedsEdits,
  submissionNeedsReimbursement,
  entityIsActive,
  getUserInfo,
} from "@/utilities";
import { Loading, LoadingButtonIcon } from "@/components/loading";
import { Message } from "@/components/message";
import { MarkdownContent } from "@/components/markdownContent";
import { TextWithTooltip } from "@/components/tooltip";
import { ChangeRequest2023Button } from "@/components/change2023New";
import { ChangeRequest2024Button } from "@/components/change2024New";
import { useNotificationsActions } from "@/contexts/notifications";
import {
  useRebateYearState,
  useRebateYearActions,
} from "@/contexts/rebateYear";

const defaultTableRowClassNames = "bg-base-lightest";
const highlightedTableRowClassNames = "bg-primary-lighter";

function FormLink(props: { type: "edit" | "view"; to: LinkProps["to"] }) {
  const { type, to } = props;
  const icon = type === "edit" ? "edit" : "visibility";
  const text = type === "edit" ? "Edit" : "View";

  return (
    <Link
      to={to}
      className={clsx(
        "usa-button",
        type === "view" && "usa-button--base",
        "font-sans-2xs margin-right-0 padding-x-105 padding-y-1",
      )}
    >
      <span className="display-flex flex-align-center">
        <svg
          className="usa-icon"
          aria-hidden="true"
          focusable="false"
          role="img"
        >
          <use href={`${icons}#${icon}`} />
        </svg>
        <span className="margin-left-1">{text}</span>
      </span>
    </Link>
  );
}

function NewApplicationIconText() {
  return (
    <span className="display-flex flex-align-center">
      <svg className="usa-icon" aria-hidden="true" focusable="false" role="img">
        <use href={`${icons}#add_circle`} />
      </svg>
      <span className="margin-left-1 text-left">New Application</span>
    </span>
  );
}

function SubmissionsTableHeader(props: { rebateYear: RebateYear }) {
  const { rebateYear } = props;

  return (
    <thead>
      <tr className="font-sans-2xs text-no-wrap text-bottom">
        <th scope="col">
          <span className="usa-sr-only">Open</span>
        </th>

        <th scope="col">
          <TextWithTooltip
            text="Rebate ID"
            tooltip="Unique Clean School Bus Rebate ID"
          />
        </th>

        <th scope="col">
          <TextWithTooltip
            text="Form Type"
            tooltip="Application, Payment Request, or Close Out form"
          />
          <br />
          <TextWithTooltip
            text="Form Status"
            tooltip="Draft, Edits Requested, Submitted, Withdrawn, Selected, or Not Selected" // TODO: update to reflect other statuses
          />
        </th>

        <th scope="col">
          <TextWithTooltip text="UEI" tooltip="Unique Entity ID from SAM.gov" />
          <br />
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
          <br />
          <TextWithTooltip
            text="School District"
            tooltip="School district represented by applicant"
          />
        </th>

        <th scope="col">
          <TextWithTooltip
            text="Updated By"
            tooltip="Last person that updated this form"
          />
          <br />
          <TextWithTooltip
            text="Date Updated"
            tooltip="Last date this form was updated"
          />
        </th>

        {rebateYear === "2023" || rebateYear === "2024" ? (
          <th scope="col" className={clsx("tw-text-right")}>
            <TextWithTooltip
              text="Change Request"
              tooltip="Submit a change request for an extension, to request edits, or to withdraw from the rebate program"
            />
          </th>
        ) : null}
      </tr>
    </thead>
  );
}

/* --- 2022 Submissions --- */

function FRF2022Submission(props: { rebate: Rebate2022 }) {
  const { rebate } = props;
  const { frf, prf, crf } = rebate;

  const configData = useConfigData();

  if (!configData) return null;

  const frfSubmissionPeriodOpen = configData.submissionPeriodOpen["2022"].frf;

  const {
    applicantUEI,
    applicantEfti,
    applicantEfti_display,
    applicantOrganizationName,
    schoolDistrictName,
    last_updated_by,
  } = frf.formio.data;

  const date = new Date(frf.formio.modified).toLocaleDateString();
  const time = new Date(frf.formio.modified).toLocaleTimeString();

  const frfNeedsEdits = submissionNeedsEdits({
    formio: frf.formio,
    bap: frf.bap,
  });

  const frfBapInternalStatus = frf.bap?.status || "";
  const frfFormioStatus = formioStatusMap.get(frf.formio.state);

  const frfStatus = frfNeedsEdits
    ? "Edits Requested"
    : bapStatusMap["2022"].frf.get(frfBapInternalStatus) ||
      frfFormioStatus ||
      "";

  const frfSelected = frfStatus === "Selected";
  const frfSelectedButNoPRF = frfSelected && !Boolean(prf.formio);

  const prfApproved = prf.bap?.status === "Accepted";
  const prfApprovedButNoCRF = prfApproved && !Boolean(crf.formio);

  const statusTableCellClassNames =
    frfFormioStatus === "Submitted" || !frfSubmissionPeriodOpen
      ? "text-italic"
      : "";

  const frfUrl = `/frf/2022/${frf.formio._id}`;

  /**
   * NOTE on the usage of `TextWithTooltip` below:
   * When a form is first initially created, and the user has not yet clicked
   * the "Next" or "Save" buttons, any fields that the Formio form definition
   * sets automatically (based on hidden fields we inject on form creation) will
   * not yet be part of the form submission data. As soon as the user clicks the
   * "Next" or "Save" buttons the first time, those fields will be set and
   * stored in the submission. Since we display some of those fields in the
   * table below, we need to check if their values exist, and if they don't (for
   * cases where the user has not yet advanced past the first screen of the
   * form...which we believe is a bit of an edge case, as most users will likely
   * do that after starting a new application), indicate to the user they need
   * to first save the form for the fields to be displayed.
   */
  return (
    <tr
      className={
        frfNeedsEdits || frfSelectedButNoPRF || prfApprovedButNoCRF
          ? highlightedTableRowClassNames
          : defaultTableRowClassNames
      }
    >
      <th scope="row" className={statusTableCellClassNames}>
        {frfNeedsEdits ? (
          <FormLink type="edit" to={frfUrl} />
        ) : frf.formio.state === "submitted" || !frfSubmissionPeriodOpen ? (
          <FormLink type="view" to={frfUrl} />
        ) : frf.formio.state === "draft" ? (
          <FormLink type="edit" to={frfUrl} />
        ) : null}
      </th>

      <td className={statusTableCellClassNames}>
        {frf.bap?.rebateId ? (
          <span title={`Application ID: ${frf.formio._id}`}>
            {frf.bap.rebateId}
          </span>
        ) : (
          <TextWithTooltip
            text=" "
            tooltip="Rebate ID should be displayed within 24hrs. after submitting a rebate form application"
          />
        )}
      </td>

      <td className={statusTableCellClassNames}>
        <span>Application</span>
        <br />
        <span className="display-flex flex-align-center font-sans-2xs">
          {frfStatus === "Needs Clarification" ? (
            <TextWithTooltip
              text={frfStatus}
              tooltip="Check your email for instructions on what needs clarification"
              iconClassNames="text-base-darkest"
            />
          ) : (
            <>
              <svg
                className={clsx("usa-icon", frfSelected && "text-primary")}
                aria-hidden="true"
                focusable="false"
                role="img"
              >
                <use href={`${icons}#${statusIconMap.get(frfStatus)}`} />
              </svg>
              <span className="margin-left-05">{frfStatus}</span>
            </>
          )}
        </span>
      </td>

      <td className={statusTableCellClassNames}>
        <>
          {Boolean(applicantUEI) ? (
            applicantUEI
          ) : (
            <TextWithTooltip
              text=" "
              tooltip="Please edit and save the form and the UEI will be displayed"
            />
          )}
          <br />
          {
            /* NOTE:
Initial version of the application form definition included the `applicantEfti`
field, which is configured via the form definition (in Formio) to set its value
based on the value of the `sam_hidden_applicant_efti` field, which we inject on
initial form submission. That value comes from the BAP (SAM.gov data), which
could be an empty string.

To handle the potentially empty string, the Formio form definition was updated
to include a new `applicantEfti_display` field that's configured in the form
definition to set it's value to the string '0000' if the `applicantEfti` field's
value is an empty string. This logic (again, built into the form definition)
works great for new form submissions that have taken place after the form
definition has been updated to include this `applicantEfti_display` field... */
            Boolean(applicantEfti_display) ? (
              applicantEfti_display
            ) : /* NOTE:
...but we need to handle old/existing submissions that were submitted before the
form definition was updated to include the new `applicantEfti_display` field,
and where the user has already advanced past the first screen (e.g. they've hit
the "Next" or "Save" buttons at least once).

At this point the form definition logic has already kicked in that sets the
`applicaitonEfti` field, but it's value _could_ be an empty string (it won't
necessairly be, but it could be). Since the `applicantEfti` field's value could
be an empty string (which is falsy in JavaScript), we need to check another
field's value that will also set at this point, and whose value will always be
truthy. We'll check the `applicantUEI` field's value, as it's value will always
be set for users that have advanced past the first screen (we could have just as
easily used another field, like the `applicantOrganizationName` field for the
same result). */
            Boolean(applicantUEI) ? (
              /* NOTE:
If the `applicantUEI` field's value is truthy, we know the user has advanced
past the first screen, so we'll render the value of the `applicantEfti` field,
and fall back to "0000", which will be used in cases where the `applicantEfti`
field's value is an empty string. */
              applicantEfti || "0000"
            ) : (
              /* NOTE:
At this point in the conditional logic, we know the user has not advanced past
the first screen, so we'll render the tooltip, indicating the user must edit and
save the form for the EFT indicator to be displayed. */
              <TextWithTooltip
                text=" "
                tooltip="Please edit and save the form and the EFT Indicator will be displayed"
              />
            )
          }
        </>
      </td>

      <td className={statusTableCellClassNames}>
        <>
          {Boolean(applicantOrganizationName) ? (
            applicantOrganizationName
          ) : (
            <TextWithTooltip
              text=" "
              tooltip="Please edit and save the form and the Applicant will be displayed"
            />
          )}
          <br />
          {Boolean(schoolDistrictName) ? (
            schoolDistrictName
          ) : (
            <TextWithTooltip
              text=" "
              tooltip="School District will be displayed after that field has been entered in the form"
            />
          )}
        </>
      </td>

      <td className={statusTableCellClassNames}>
        {last_updated_by}
        <br />
        <span title={`${date} ${time}`}>{date}</span>
      </td>
    </tr>
  );
}

function PRF2022Submission(props: { rebate: Rebate2022 }) {
  const { rebate } = props;
  const { frf, prf, crf } = rebate;

  const navigate = useNavigate();
  const { email } = useOutletContext<{ email: string }>();

  const configData = useConfigData();
  const bapSamData = useBapSamData();
  const { displayErrorNotification } = useNotificationsActions();

  /**
   * Stores when data is being posted to the server, so a loading indicator can
   * be rendered inside the "New Payment Request" button, and we can prevent
   * double submits/creations of new PRF submissions.
   */
  const [dataIsPosting, setDataIsPosting] = useState(false);

  if (!configData || !bapSamData) return null;

  /** matched SAM.gov entity for the FRF submission */
  const entity = bapSamData.entities.find((entity) => {
    const comboKey = frf.formio.data.bap_hidden_entity_combo_key;
    return entityIsActive(entity) && entity.ENTITY_COMBO_KEY__c === comboKey;
  });

  if (!entity) return null;

  const { title, name } = getUserInfo(email, entity);

  const prfSubmissionPeriodOpen = configData.submissionPeriodOpen["2022"].prf;

  const frfSelected = frf.bap?.status === "Accepted";
  const frfSelectedButNoPRF = frfSelected && !Boolean(prf.formio);

  if (frfSelectedButNoPRF) {
    return (
      <tr className={highlightedTableRowClassNames}>
        <th scope="row" colSpan={6}>
          <button
            className="usa-button font-sans-2xs margin-right-0 padding-x-105 padding-y-1"
            disabled={!prfSubmissionPeriodOpen}
            onClick={(_ev) => {
              if (!prfSubmissionPeriodOpen) return;
              if (!frf.bap) return;

              // account for when data is posting to prevent double submits
              if (dataIsPosting) return;
              setDataIsPosting(true);

              // create a new draft PRF submission
              postData(`${serverUrl}/api/formio/2022/prf-submission/`, {
                email,
                title,
                name,
                entity,
                comboKey: frf.bap.comboKey,
                rebateId: frf.bap.rebateId, // CSB Rebate ID (6 digits)
                frfReviewItemId: frf.bap.reviewItemId, // CSB Rebate ID with form/version ID (9 digits)
                frfModified: frf.bap.modified,
              })
                .then((_res) => {
                  navigate(`/prf/2022/${frf.bap?.rebateId}`);
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
                          Error creating Payment Request{" "}
                          <em>{frf.bap?.rebateId}</em>.
                        </p>
                        <p
                          className={clsx(
                            "tw-mt-1 tw-text-sm tw-text-gray-500",
                          )}
                        >
                          Please try again.
                        </p>
                      </>
                    ),
                  });
                })
                .finally(() => {
                  setDataIsPosting(false);
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
                <use href={`${icons}#add_circle`} />
              </svg>
              <span className="margin-left-1">New Payment Request</span>
              {dataIsPosting && <LoadingButtonIcon position="end" />}
            </span>
          </button>
        </th>
      </tr>
    );
  }

  // return if a Payment Request submission has not been created for this rebate
  if (!prf.formio) return null;

  const { hidden_current_user_email, hidden_bap_rebate_id } = prf.formio.data;

  const date = new Date(prf.formio.modified).toLocaleDateString();
  const time = new Date(prf.formio.modified).toLocaleTimeString();

  const frfNeedsEdits = submissionNeedsEdits({
    formio: frf.formio,
    bap: frf.bap,
  });

  const prfNeedsEdits = submissionNeedsEdits({
    formio: prf.formio,
    bap: prf.bap,
  });

  const prfBapInternalStatus = prf.bap?.status || "";
  const prfFormioStatus = formioStatusMap.get(prf.formio.state);

  const prfStatus = prfNeedsEdits
    ? "Edits Requested"
    : bapStatusMap["2022"].prf.get(prfBapInternalStatus) ||
      prfFormioStatus ||
      "";

  const prfApproved = prfStatus === "Funding Approved";
  const prfApprovedButNoCRF = prfApproved && !Boolean(crf.formio);

  const statusTableCellClassNames =
    prfFormioStatus === "Submitted" || !prfSubmissionPeriodOpen
      ? "text-italic"
      : "";

  const prfUrl = `/prf/2022/${hidden_bap_rebate_id}`;

  return (
    <tr
      className={
        prfNeedsEdits || prfApprovedButNoCRF
          ? highlightedTableRowClassNames
          : defaultTableRowClassNames
      }
    >
      <th scope="row" className={statusTableCellClassNames}>
        {frfNeedsEdits ? (
          <FormLink type="view" to={prfUrl} />
        ) : prfNeedsEdits ? (
          <FormLink type="edit" to={prfUrl} />
        ) : prf.formio.state === "submitted" || !prfSubmissionPeriodOpen ? (
          <FormLink type="view" to={prfUrl} />
        ) : prf.formio.state === "draft" ? (
          <FormLink type="edit" to={prfUrl} />
        ) : null}
      </th>

      <td className={statusTableCellClassNames}>&nbsp;</td>

      <td className={statusTableCellClassNames}>
        <span>Payment Request</span>
        <br />
        <span className="display-flex flex-align-center font-sans-2xs">
          {prfStatus === "Needs Clarification" ? (
            <TextWithTooltip
              text={prfStatus}
              tooltip="Check your email for instructions on what needs clarification"
              iconClassNames="text-base-darkest"
            />
          ) : (
            <>
              <svg
                className={clsx("usa-icon", prfApproved && "text-primary")}
                aria-hidden="true"
                focusable="false"
                role="img"
              >
                <use href={`${icons}#${statusIconMap.get(prfStatus)}`} />
              </svg>
              <span className="margin-left-05">{prfStatus}</span>
            </>
          )}
        </span>
      </td>

      <td className={statusTableCellClassNames}>&nbsp;</td>

      <td className={statusTableCellClassNames}>&nbsp;</td>

      <td className={statusTableCellClassNames}>
        {hidden_current_user_email}
        <br />
        <span title={`${date} ${time}`}>{date}</span>
      </td>
    </tr>
  );
}

function CRF2022Submission(props: { rebate: Rebate2022 }) {
  const { rebate } = props;
  const { frf, prf, crf } = rebate;

  const navigate = useNavigate();
  const { email } = useOutletContext<{ email: string }>();

  const configData = useConfigData();
  const bapSamData = useBapSamData();
  const { displayErrorNotification } = useNotificationsActions();

  /**
   * Stores when data is being posted to the server, so a loading indicator can
   * be rendered inside the "New Close Out" button, and we can prevent double
   * submits/creations of new Close Out form submissions.
   */
  const [dataIsPosting, setDataIsPosting] = useState(false);

  if (!configData || !bapSamData) return null;

  /** matched SAM.gov entity for the PRF submission */
  const entity = bapSamData.entities.find((entity) => {
    const comboKey = prf.formio?.data.bap_hidden_entity_combo_key;
    return entityIsActive(entity) && entity.ENTITY_COMBO_KEY__c === comboKey;
  });

  if (!entity) return null;

  const { title, name } = getUserInfo(email, entity);

  const crfSubmissionPeriodOpen = configData.submissionPeriodOpen["2022"].crf;

  const prfApproved = prf.bap?.status === "Accepted";
  const prfApprovedButNoCRF = prfApproved && !Boolean(crf.formio);

  if (prfApprovedButNoCRF) {
    return (
      <tr className={highlightedTableRowClassNames}>
        <th scope="row" colSpan={6}>
          <button
            className="usa-button font-sans-2xs margin-right-0 padding-x-105 padding-y-1"
            disabled={!crfSubmissionPeriodOpen}
            onClick={(_ev) => {
              if (!crfSubmissionPeriodOpen) return;
              if (!frf.bap || !prf.bap) return;

              // account for when data is posting to prevent double submits
              if (dataIsPosting) return;
              setDataIsPosting(true);

              // create a new draft CRF submission
              postData(`${serverUrl}/api/formio/2022/crf-submission/`, {
                email,
                title,
                name,
                entity,
                comboKey: prf.bap.comboKey,
                rebateId: prf.bap.rebateId, // CSB Rebate ID (6 digits)
                frfReviewItemId: frf.bap.reviewItemId, // CSB Rebate ID with form/version ID (9 digits)
                prfReviewItemId: prf.bap.reviewItemId, // CSB Rebate ID with form/version ID (9 digits)
                prfModified: prf.bap.modified,
              })
                .then((_res) => {
                  navigate(`/crf/2022/${prf.bap?.rebateId}`);
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
                          Error creating Close Out <em>{prf.bap?.rebateId}</em>.
                        </p>
                        <p
                          className={clsx(
                            "tw-mt-1 tw-text-sm tw-text-gray-500",
                          )}
                        >
                          Please try again.
                        </p>
                      </>
                    ),
                  });
                })
                .finally(() => {
                  setDataIsPosting(false);
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
                <use href={`${icons}#add_circle`} />
              </svg>
              <span className="margin-left-1">New Close Out</span>
              {dataIsPosting && <LoadingButtonIcon position="end" />}
            </span>
          </button>
        </th>
      </tr>
    );
  }

  // return if a Close Out submission has not been created for this rebate
  if (!crf.formio) return null;

  const { hidden_current_user_email, hidden_bap_rebate_id } = crf.formio.data;

  const date = new Date(crf.formio.modified).toLocaleDateString();
  const time = new Date(crf.formio.modified).toLocaleTimeString();

  const crfNeedsEdits = submissionNeedsEdits({
    formio: crf.formio,
    bap: crf.bap,
  });

  const crfBapInternalStatus = crf.bap?.status || "";
  const crfFormioStatus = formioStatusMap.get(crf.formio.state);
  const crfBapReimbursementNeeded = crf.bap?.reimbursementNeeded || false;

  const crfNeedsReimbursement = submissionNeedsReimbursement({
    status: crfBapInternalStatus,
    reimbursementNeeded: crfBapReimbursementNeeded,
  });

  const crfStatus = crfNeedsEdits
    ? "Edits Requested"
    : crfNeedsReimbursement
      ? "Reimbursement Needed"
      : bapStatusMap["2022"].crf.get(crfBapInternalStatus) ||
        crfFormioStatus ||
        "";

  const crfApproved = crfStatus === "Close Out Approved";

  const statusTableCellClassNames =
    crfFormioStatus === "Submitted" || !crfSubmissionPeriodOpen
      ? "text-italic"
      : "";

  const crfUrl = `/crf/2022/${hidden_bap_rebate_id}`;

  return (
    <tr
      className={
        crfNeedsEdits || prfApprovedButNoCRF
          ? highlightedTableRowClassNames
          : defaultTableRowClassNames
      }
    >
      <th scope="row" className={statusTableCellClassNames}>
        {crfNeedsEdits ? (
          <FormLink type="edit" to={crfUrl} />
        ) : crf.formio.state === "submitted" || !crfSubmissionPeriodOpen ? (
          <FormLink type="view" to={crfUrl} />
        ) : crf.formio.state === "draft" ? (
          <FormLink type="edit" to={crfUrl} />
        ) : null}
      </th>

      <td className={statusTableCellClassNames}>&nbsp;</td>

      <td className={statusTableCellClassNames}>
        <span>Close Out</span>
        <br />
        <span className="display-flex flex-align-center font-sans-2xs">
          {crfStatus === "Needs Clarification" ? (
            <TextWithTooltip
              text={crfStatus}
              tooltip="Check your email for instructions on what needs clarification"
              iconClassNames="text-base-darkest"
            />
          ) : crfStatus === "Reimbursement Needed" ? (
            <TextWithTooltip
              text={crfStatus}
              tooltip="Check your email for information on reimbursement needed"
              iconClassNames="text-base-darkest"
            />
          ) : (
            <>
              <svg
                className={clsx("usa-icon", crfApproved && "text-primary")}
                aria-hidden="true"
                focusable="false"
                role="img"
              >
                <use href={`${icons}#${statusIconMap.get(crfStatus)}`} />
              </svg>
              <span className="margin-left-05">{crfStatus}</span>
            </>
          )}
        </span>
      </td>

      <td className={statusTableCellClassNames}>&nbsp;</td>

      <td className={statusTableCellClassNames}>&nbsp;</td>

      <td className={statusTableCellClassNames}>
        {hidden_current_user_email}
        <br />
        <span title={`${date} ${time}`}>{date}</span>
      </td>
    </tr>
  );
}

function Submissions2022() {
  const content = useContentData();
  const submissionsQueries = useSubmissionsQueries("2022");
  const submissions = useSubmissions("2022");

  if (submissionsQueries.some((query) => query.isFetching)) {
    return <Loading />;
  }

  if (submissionsQueries.some((query) => query.isError)) {
    return <Message type="error" text={messages.formSubmissionsError} />;
  }

  if (submissions.length === 0) {
    return (
      <div className="margin-top-4">
        <Message type="info" text={messages.newApplication} />
      </div>
    );
  }

  return (
    <>
      {content && (
        <MarkdownContent
          className="margin-top-4"
          children={content.allRebatesIntro}
        />
      )}

      <div className="usa-table-container--scrollable" tabIndex={0}>
        <table
          aria-label="Your 2022 Rebate Forms"
          className="usa-table usa-table--stacked usa-table--borderless width-full"
        >
          <SubmissionsTableHeader rebateYear="2022" />
          <tbody className={clsx("[&_:is(th,td)]:tw-text-[15px]")}>
            {submissions.map((rebate, index) => {
              return rebate.rebateYear === "2022" ? (
                <Fragment key={rebate.rebateId}>
                  <FRF2022Submission rebate={rebate} />
                  <PRF2022Submission rebate={rebate} />
                  <CRF2022Submission rebate={rebate} />
                  {/* blank row after all submissions but the last one */}
                  {index !== submissions.length - 1 && (
                    <tr className={clsx("tw-bg-white")}>
                      <th
                        className={clsx("p-0", "tw-leading-none")}
                        scope="row"
                        colSpan={6}
                      >
                        &nbsp;
                      </th>
                    </tr>
                  )}
                </Fragment>
              ) : null;
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* --- 2023 Submissions --- */

function ChangeRequests2023() {
  const changeRequestsQuery = useChangeRequestsQuery("2023");
  const changeRequests = useChangeRequests("2023");

  if (changeRequestsQuery.isFetching) {
    return <Loading />;
  }

  if (!changeRequests || changeRequests.length === 0) return null;

  return (
    <details
      className={clsx(
        "tw-mt-4 tw-border tw-border-solid tw-border-blue-100 tw-bg-blue-50",
        "tw-group",
      )}
      open
    >
      <summary
        className={clsx(
          "tw-flex tw-cursor-pointer tw-items-center tw-justify-between tw-bg-blue-100 tw-p-2",
          "marker:tw-content-none",
        )}
      >
        <span
          className={clsx(
            "tw-px-1 tw-text-[15px] tw-font-semibold tw-text-slate-800",
          )}
        >
          Your Change Requests
        </span>
        <ChevronUpIcon
          className={clsx(
            "tw-h-5 tw-w-5 tw-rotate-90 tw-transform tw-text-slate-900 tw-duration-100",
            "group-open:tw-rotate-180",
          )}
          aria-hidden="true"
        />
      </summary>

      <div
        className={clsx(
          "usa-table-container--scrollable",
          "tw-m-0 tw-p-1",
          "[&_tr:last-of-type_:is(th,td)]:tw-border-b-0",
        )}
        tabIndex={0}
      >
        <table
          aria-label="Your 2023 Change Requests"
          className="usa-table usa-table--stacked usa-table--borderless width-full"
        >
          <thead>
            <tr className="font-sans-2xs text-no-wrap text-bottom">
              <th scope="col">
                <TextWithTooltip
                  text="Rebate ID"
                  tooltip="Unique Clean School Bus Rebate ID"
                />
              </th>

              <th scope="col">
                <TextWithTooltip
                  text="Form Type"
                  tooltip="Application, Payment Request, or Close Out form"
                />
              </th>

              <th scope="col">
                <TextWithTooltip
                  text="Request Type"
                  tooltip="Edit, Extension, or Withdrawl Request"
                />
              </th>

              <th scope="col">
                <TextWithTooltip
                  text="Submitted By"
                  tooltip="Person that submitted this request"
                />
              </th>

              <th scope="col" className={clsx("tw-text-right")}>
                <TextWithTooltip
                  text="Date"
                  tooltip="Date this request was submitted"
                />
              </th>
            </tr>
          </thead>
          <tbody className={clsx("[&_:is(th,td)]:tw-text-[15px]")}>
            {changeRequests.map((request, index) => {
              const { _id, modified, data } = request;
              const {
                _request_form,
                _bap_rebate_id,
                _mongo_id,
                _user_email,
                request_type,
              } = data;

              const date = new Date(modified).toLocaleDateString();
              const time = new Date(modified).toLocaleTimeString();

              const formType =
                _request_form === "frf"
                  ? "Application"
                  : _request_form === "prf"
                    ? "Payment Request"
                    : _request_form === "crf"
                      ? "Close Out"
                      : "";

              return (
                <Fragment key={index}>
                  <tr>
                    <th scope="row">
                      <Link to={`/change/2023/${_id}`}>
                        {_bap_rebate_id || _mongo_id}
                      </Link>
                    </th>

                    <th scope="row">
                      <span>{formType}</span>
                    </th>

                    <td>
                      <span>{request_type?.label}</span>
                    </td>

                    <td>{_user_email}</td>

                    <td className={clsx("min-[480px]:tw-text-right")}>
                      <span title={`${date} ${time}`}>{date}</span>
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function FRF2023Submission(props: { rebate: Rebate2023 }) {
  const { rebate } = props;
  const { frf, prf, crf } = rebate;

  const { email } = useOutletContext<{ email: string }>();

  const configData = useConfigData();
  const bapSamData = useBapSamData();

  if (!configData || !bapSamData) return null;

  /** matched SAM.gov entity for the FRF submission */
  const entity = bapSamData.entities.find((entity) => {
    const comboKey = frf.formio.data._bap_entity_combo_key;
    return entityIsActive(entity) && entity.ENTITY_COMBO_KEY__c === comboKey;
  });

  if (!entity) return null;

  const { title, name } = getUserInfo(email, entity);

  const frfSubmissionPeriodOpen = configData.submissionPeriodOpen["2023"].frf;

  const {
    _user_email,
    _bap_entity_combo_key,
    appInfo_uei,
    appInfo_efti,
    appInfo_orgName,
    _formio_schoolDistrictName,
  } = frf.formio.data;

  const date = new Date(frf.formio.modified).toLocaleDateString();
  const time = new Date(frf.formio.modified).toLocaleTimeString();

  const frfNeedsEdits = submissionNeedsEdits({
    formio: frf.formio,
    bap: frf.bap,
  });

  const frfBapInternalStatus = frf.bap?.status || "";
  const frfFormioStatus = formioStatusMap.get(frf.formio.state);

  const frfStatus = frfNeedsEdits
    ? "Edits Requested"
    : bapStatusMap["2023"].frf.get(frfBapInternalStatus) ||
      frfFormioStatus ||
      "";

  const frfSelected = frfStatus === "Selected";
  const frfSelectedButNoPRF = frfSelected && !Boolean(prf.formio);

  const prfApproved = prf.bap?.status === "Accepted";
  const prfApprovedButNoCRF = prfApproved && !Boolean(crf.formio);

  const statusTableCellClassNames =
    frfFormioStatus === "Submitted" || !frfSubmissionPeriodOpen
      ? "text-italic"
      : "";

  const frfUrl = `/frf/2023/${frf.formio._id}`;

  /**
   * NOTE on the usage of `TextWithTooltip` below:
   * When a form is first initially created, and the user has not yet clicked
   * the "Next" or "Save" buttons, any fields that the Formio form definition
   * sets automatically (based on hidden fields we inject on form creation) will
   * not yet be part of the form submission data. As soon as the user clicks the
   * "Next" or "Save" buttons the first time, those fields will be set and
   * stored in the submission. Since we display some of those fields in the
   * table below, we need to check if their values exist, and if they don't (for
   * cases where the user has not yet advanced past the first screen of the
   * form...which we believe is a bit of an edge case, as most users will likely
   * do that after starting a new application), indicate to the user they need
   * to first save the form for the fields to be displayed.
   */
  return (
    <tr
      className={
        frfNeedsEdits || frfSelectedButNoPRF || prfApprovedButNoCRF
          ? highlightedTableRowClassNames
          : defaultTableRowClassNames
      }
    >
      <th scope="row" className={statusTableCellClassNames}>
        {frfNeedsEdits ? (
          <FormLink type="edit" to={frfUrl} />
        ) : frf.formio.state === "submitted" || !frfSubmissionPeriodOpen ? (
          <FormLink type="view" to={frfUrl} />
        ) : frf.formio.state === "draft" ? (
          <FormLink type="edit" to={frfUrl} />
        ) : null}
      </th>

      <td className={statusTableCellClassNames}>
        {frf.bap?.rebateId ? (
          <span title={`Application ID: ${frf.formio._id}`}>
            {frf.bap.rebateId}
          </span>
        ) : (
          <TextWithTooltip
            text=" "
            tooltip="Rebate ID should be displayed within 24hrs. after submitting a rebate form application"
          />
        )}
      </td>

      <td className={statusTableCellClassNames}>
        <span>Application</span>
        <br />
        <span className="display-flex flex-align-center font-sans-2xs">
          {frfStatus === "Needs Clarification" ? (
            <TextWithTooltip
              text={frfStatus}
              tooltip="Check your email for instructions on what needs clarification"
              iconClassNames="text-base-darkest"
            />
          ) : (
            <>
              <svg
                className={clsx("usa-icon", frfSelected && "text-primary")}
                aria-hidden="true"
                focusable="false"
                role="img"
              >
                <use href={`${icons}#${statusIconMap.get(frfStatus)}`} />
              </svg>
              <span className="margin-left-05">{frfStatus}</span>
            </>
          )}
        </span>
      </td>

      <td className={statusTableCellClassNames}>
        <>
          {Boolean(appInfo_uei) ? (
            appInfo_uei
          ) : (
            <TextWithTooltip
              text=" "
              tooltip="Please edit and save the form and the UEI will be displayed"
            />
          )}
          <br />
          {/* NOTE:
Similar situation with the EFTI field as in the 2022 FRF... A user's EFTI value
from SAM.gov can be null. In a brand new 2023 FRF, we inject that value without
modification as the `_bap_applicant_efti` field. The intention was in the 2023
FRF schema/form definition, the `appInfo_efti` field would be set from the
`_bap_applicant_efti` field's value, but account for a null/empty string value,
in which case it would set the value of the field to "0000." Unfortunately, that
logic didn't make it into the 2023 FRF schema/form definition, so we need to
account for that situation here.

Similar to the 2022 FRF, if the `appInfo_uei` field's value has been set, we
know the user has advanced past the first screen (and therefore the form
definition's logic has kicked in, setting values from the initially injected
hidden fields), so we'll use the appInfo_efti value, but fall back to "0000" to
handle when it's value is an empty string. */}
          {Boolean(appInfo_uei) ? (
            appInfo_efti || "0000"
          ) : (
            <TextWithTooltip
              text=" "
              tooltip="Please edit and save the form and the EFT Indicator will be displayed"
            />
          )}
        </>
      </td>

      <td className={statusTableCellClassNames}>
        <>
          {Boolean(appInfo_orgName) ? (
            appInfo_orgName
          ) : (
            <TextWithTooltip
              text=" "
              tooltip="Please edit and save the form and the Applicant will be displayed"
            />
          )}
          <br />
          {Boolean(_formio_schoolDistrictName) ? (
            _formio_schoolDistrictName
          ) : (
            <TextWithTooltip
              text=" "
              tooltip="School District will be displayed after that field has been entered in the form"
            />
          )}
        </>
      </td>

      <td className={statusTableCellClassNames}>
        {_user_email}
        <br />
        <span title={`${date} ${time}`}>{date}</span>
      </td>

      <td className={clsx("!tw-text-right")}>
        <ChangeRequest2023Button
          data={{
            formType: "frf",
            comboKey: _bap_entity_combo_key,
            rebateId: frf.bap?.rebateId || null,
            mongoId: frf.formio._id,
            state: frf.formio.state,
            email,
            title,
            name,
          }}
        />
      </td>
    </tr>
  );
}

function PRF2023Submission(props: { rebate: Rebate2023 }) {
  const { rebate } = props;
  const { frf, prf, crf } = rebate;

  const navigate = useNavigate();
  const { email } = useOutletContext<{ email: string }>();

  const configData = useConfigData();
  const bapSamData = useBapSamData();
  const { displayErrorNotification } = useNotificationsActions();

  /**
   * Stores when data is being posted to the server, so a loading indicator can
   * be rendered inside the "New Payment Request" button, and we can prevent
   * double submits/creations of new PRF submissions.
   */
  const [dataIsPosting, setDataIsPosting] = useState(false);

  if (!configData || !bapSamData) return null;

  /** matched SAM.gov entity for the FRF submission */
  const entity = bapSamData.entities.find((entity) => {
    const comboKey = frf.formio.data._bap_entity_combo_key;
    return entityIsActive(entity) && entity.ENTITY_COMBO_KEY__c === comboKey;
  });

  if (!entity) return null;

  const { title, name } = getUserInfo(email, entity);

  const prfSubmissionPeriodOpen = configData.submissionPeriodOpen["2023"].prf;

  const frfSelected = frf.bap?.status === "Accepted";
  const frfSelectedButNoPRF = frfSelected && !Boolean(prf.formio);

  if (frfSelectedButNoPRF) {
    return (
      <tr className={highlightedTableRowClassNames}>
        <th scope="row" colSpan={7}>
          <button
            className="usa-button font-sans-2xs margin-right-0 padding-x-105 padding-y-1"
            disabled={!prfSubmissionPeriodOpen}
            onClick={(_ev) => {
              if (!prfSubmissionPeriodOpen) return;
              if (!frf.bap) return;

              // account for when data is posting to prevent double submits
              if (dataIsPosting) return;
              setDataIsPosting(true);

              // create a new draft PRF submission
              postData(`${serverUrl}/api/formio/2023/prf-submission/`, {
                email,
                title,
                name,
                entity,
                comboKey: frf.bap.comboKey,
                rebateId: frf.bap.rebateId, // CSB Rebate ID (6 digits)
                frfReviewItemId: frf.bap.reviewItemId, // CSB Rebate ID with form/version ID (9 digits)
                frfModified: frf.bap.modified,
              })
                .then((_res) => {
                  navigate(`/prf/2023/${frf.bap?.rebateId}`);
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
                          Error creating Payment Request{" "}
                          <em>{frf.bap?.rebateId}</em>.
                        </p>
                        <p
                          className={clsx(
                            "tw-mt-1 tw-text-sm tw-text-gray-500",
                          )}
                        >
                          Please try again.
                        </p>
                      </>
                    ),
                  });
                })
                .finally(() => {
                  setDataIsPosting(false);
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
                <use href={`${icons}#add_circle`} />
              </svg>
              <span className="margin-left-1">New Payment Request</span>
              {dataIsPosting && <LoadingButtonIcon position="end" />}
            </span>
          </button>
        </th>
      </tr>
    );
  }

  // return if a Payment Request submission has not been created for this rebate
  if (!prf.formio) return null;

  const { _user_email, _bap_entity_combo_key, _bap_rebate_id } =
    prf.formio.data;

  const date = new Date(prf.formio.modified).toLocaleDateString();
  const time = new Date(prf.formio.modified).toLocaleTimeString();

  const frfNeedsEdits = submissionNeedsEdits({
    formio: frf.formio,
    bap: frf.bap,
  });

  const prfNeedsEdits = submissionNeedsEdits({
    formio: prf.formio,
    bap: prf.bap,
  });

  const prfBapInternalStatus = prf.bap?.status || "";
  const prfFormioStatus = formioStatusMap.get(prf.formio.state);

  const prfStatus = prfNeedsEdits
    ? "Edits Requested"
    : bapStatusMap["2023"].prf.get(prfBapInternalStatus) ||
      prfFormioStatus ||
      "";

  const prfApproved = prfStatus === "Funding Approved";
  const prfApprovedButNoCRF = prfApproved && !Boolean(crf.formio);

  const statusTableCellClassNames =
    prf.formio.state === "submitted" || !prfSubmissionPeriodOpen
      ? "text-italic"
      : "";

  const prfUrl = `/prf/2023/${_bap_rebate_id}`;

  return (
    <tr
      className={
        prfNeedsEdits || prfApprovedButNoCRF
          ? highlightedTableRowClassNames
          : defaultTableRowClassNames
      }
    >
      <th scope="row" className={statusTableCellClassNames}>
        {frfNeedsEdits ? (
          <FormLink type="view" to={prfUrl} />
        ) : prfNeedsEdits ? (
          <FormLink type="edit" to={prfUrl} />
        ) : prf.formio.state === "submitted" || !prfSubmissionPeriodOpen ? (
          <FormLink type="view" to={prfUrl} />
        ) : prf.formio.state === "draft" ? (
          <FormLink type="edit" to={prfUrl} />
        ) : null}
      </th>

      <td className={statusTableCellClassNames}>&nbsp;</td>

      <td className={statusTableCellClassNames}>
        <span>Payment Request</span>
        <br />
        <span className="display-flex flex-align-center font-sans-2xs">
          {prfStatus === "Needs Clarification" ? (
            <TextWithTooltip
              text={prfStatus}
              tooltip="Check your email for instructions on what needs clarification"
              iconClassNames="text-base-darkest"
            />
          ) : (
            <>
              <svg
                className={clsx("usa-icon", prfApproved && "text-primary")}
                aria-hidden="true"
                focusable="false"
                role="img"
              >
                <use href={`${icons}#${statusIconMap.get(prfStatus)}`} />
              </svg>
              <span className="margin-left-05">{prfStatus}</span>
            </>
          )}
        </span>
      </td>

      <td className={statusTableCellClassNames}>&nbsp;</td>

      <td className={statusTableCellClassNames}>&nbsp;</td>

      <td className={statusTableCellClassNames}>
        {_user_email}
        <br />
        <span title={`${date} ${time}`}>{date}</span>
      </td>

      <td className={clsx("!tw-text-right")}>
        <ChangeRequest2023Button
          data={{
            formType: "prf",
            comboKey: _bap_entity_combo_key,
            rebateId: _bap_rebate_id,
            mongoId: prf.formio._id,
            state: prf.formio.state,
            email,
            title,
            name,
          }}
        />
      </td>
    </tr>
  );
}

// function CRF2023Submission(props: { rebate: Rebate2023 }) {
//   //
// }

function Submissions2023() {
  const content = useContentData();
  const changeRequestsQuery = useChangeRequestsQuery("2023");
  const submissionsQueries = useSubmissionsQueries("2023");
  const submissions = useSubmissions("2023");

  if (
    changeRequestsQuery.isInitialLoading ||
    submissionsQueries.some((query) => query.isFetching)
  ) {
    return <Loading />;
  }

  if (
    changeRequestsQuery.isError ||
    submissionsQueries.some((query) => query.isError)
  ) {
    return <Message type="error" text={messages.formSubmissionsError} />;
  }

  if (submissions.length === 0) {
    return (
      <div className="margin-top-4">
        <Message type="info" text={messages.newApplication} />
      </div>
    );
  }

  return (
    <>
      <ChangeRequests2023 />

      {content && (
        <MarkdownContent
          className="margin-top-4"
          children={content.allRebatesIntro}
        />
      )}

      <div className="usa-table-container--scrollable" tabIndex={0}>
        <table
          aria-label="Your 2023 Rebate Forms"
          className="usa-table usa-table--stacked usa-table--borderless width-full"
        >
          <SubmissionsTableHeader rebateYear="2023" />
          <tbody className={clsx("[&_:is(th,td)]:tw-text-[15px]")}>
            {submissions.map((rebate, index) => {
              return rebate.rebateYear === "2023" ? (
                <Fragment key={rebate.rebateId}>
                  <FRF2023Submission rebate={rebate} />
                  <PRF2023Submission rebate={rebate} />
                  {/* <CRF2023Submission rebate={rebate} /> */}
                  {/* blank row after all submissions but the last one */}
                  {index !== submissions.length - 1 && (
                    <tr className={clsx("tw-bg-white")}>
                      <th
                        className={clsx("p-0", "tw-leading-none")}
                        scope="row"
                        colSpan={7}
                      >
                        &nbsp;
                      </th>
                    </tr>
                  )}
                </Fragment>
              ) : null;
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* --- 2024 Submissions --- */

function ChangeRequests2024() {
  const changeRequestsQuery = useChangeRequestsQuery("2024");
  const changeRequests = useChangeRequests("2024");

  if (changeRequestsQuery.isFetching) {
    return <Loading />;
  }

  if (!changeRequests || changeRequests.length === 0) return null;

  return (
    <details
      className={clsx(
        "tw-mt-4 tw-border tw-border-solid tw-border-blue-100 tw-bg-blue-50",
        "tw-group",
      )}
      open
    >
      <summary
        className={clsx(
          "tw-flex tw-cursor-pointer tw-items-center tw-justify-between tw-bg-blue-100 tw-p-2",
          "marker:tw-content-none",
        )}
      >
        <span
          className={clsx(
            "tw-px-1 tw-text-[15px] tw-font-semibold tw-text-slate-800",
          )}
        >
          Your Change Requests
        </span>
        <ChevronUpIcon
          className={clsx(
            "tw-h-5 tw-w-5 tw-rotate-90 tw-transform tw-text-slate-900 tw-duration-100",
            "group-open:tw-rotate-180",
          )}
          aria-hidden="true"
        />
      </summary>

      <div
        className={clsx(
          "usa-table-container--scrollable",
          "tw-m-0 tw-p-1",
          "[&_tr:last-of-type_:is(th,td)]:tw-border-b-0",
        )}
        tabIndex={0}
      >
        <table
          aria-label="Your 2024 Change Requests"
          className="usa-table usa-table--stacked usa-table--borderless width-full"
        >
          <thead>
            <tr className="font-sans-2xs text-no-wrap text-bottom">
              <th scope="col">
                <TextWithTooltip
                  text="Rebate ID"
                  tooltip="Unique Clean School Bus Rebate ID"
                />
              </th>

              <th scope="col">
                <TextWithTooltip
                  text="Form Type"
                  tooltip="Application, Payment Request, or Close Out form"
                />
              </th>

              <th scope="col">
                <TextWithTooltip
                  text="Request Type"
                  tooltip="Edit, Extension, or Withdrawl Request"
                />
              </th>

              <th scope="col">
                <TextWithTooltip
                  text="Submitted By"
                  tooltip="Person that submitted this request"
                />
              </th>

              <th scope="col" className={clsx("tw-text-right")}>
                <TextWithTooltip
                  text="Date"
                  tooltip="Date this request was submitted"
                />
              </th>
            </tr>
          </thead>
          <tbody className={clsx("[&_:is(th,td)]:tw-text-[15px]")}>
            {changeRequests.map((request, index) => {
              const { _id, modified, data } = request;
              const {
                _request_form,
                _bap_rebate_id,
                _mongo_id,
                _user_email,
                request_type,
              } = data;

              const date = new Date(modified).toLocaleDateString();
              const time = new Date(modified).toLocaleTimeString();

              const formType =
                _request_form === "frf"
                  ? "Application"
                  : _request_form === "prf"
                    ? "Payment Request"
                    : _request_form === "crf"
                      ? "Close Out"
                      : "";

              return (
                <Fragment key={index}>
                  <tr>
                    <th scope="row">
                      <Link to={`/change/2024/${_id}`}>
                        {_bap_rebate_id || _mongo_id}
                      </Link>
                    </th>

                    <th scope="row">
                      <span>{formType}</span>
                    </th>

                    <td>
                      <span>{request_type?.label}</span>
                    </td>

                    <td>{_user_email}</td>

                    <td className={clsx("min-[480px]:tw-text-right")}>
                      <span title={`${date} ${time}`}>{date}</span>
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function FRF2024Submission(props: { rebate: Rebate2024 }) {
  const { rebate } = props;
  const { frf, prf, crf } = rebate;

  const { email } = useOutletContext<{ email: string }>();

  const configData = useConfigData();
  const bapSamData = useBapSamData();

  if (!configData || !bapSamData) return null;

  /** matched SAM.gov entity for the FRF submission */
  const entity = bapSamData.entities.find((entity) => {
    const comboKey = frf.formio.data._bap_entity_combo_key;
    return entityIsActive(entity) && entity.ENTITY_COMBO_KEY__c === comboKey;
  });

  if (!entity) return null;

  const { title, name } = getUserInfo(email, entity);

  const frfSubmissionPeriodOpen = configData.submissionPeriodOpen["2024"].frf;

  const {
    _user_email,
    _bap_entity_combo_key,
    appInfo_uei,
    appInfo_efti,
    appInfo_organization_name,
    _formio_schoolDistrictName,
  } = frf.formio.data;

  const date = new Date(frf.formio.modified).toLocaleDateString();
  const time = new Date(frf.formio.modified).toLocaleTimeString();

  const frfNeedsEdits = submissionNeedsEdits({
    formio: frf.formio,
    bap: frf.bap,
  });

  const frfBapInternalStatus = frf.bap?.status || "";
  const frfFormioStatus = formioStatusMap.get(frf.formio.state);

  const frfStatus = frfNeedsEdits
    ? "Edits Requested"
    : bapStatusMap["2024"].frf.get(frfBapInternalStatus) ||
      frfFormioStatus ||
      "";

  const frfSelected = frfStatus === "Selected";
  const frfSelectedButNoPRF = frfSelected && !Boolean(prf.formio);

  const prfApproved = prf.bap?.status === "Accepted";
  const prfApprovedButNoCRF = prfApproved && !Boolean(crf.formio);

  const statusTableCellClassNames =
    frfFormioStatus === "Submitted" || !frfSubmissionPeriodOpen
      ? "text-italic"
      : "";

  const frfUrl = `/frf/2024/${frf.formio._id}`;

  /**
   * NOTE on the usage of `TextWithTooltip` below:
   * When a form is first initially created, and the user has not yet clicked
   * the "Next" or "Save" buttons, any fields that the Formio form definition
   * sets automatically (based on hidden fields we inject on form creation) will
   * not yet be part of the form submission data. As soon as the user clicks the
   * "Next" or "Save" buttons the first time, those fields will be set and
   * stored in the submission. Since we display some of those fields in the
   * table below, we need to check if their values exist, and if they don't (for
   * cases where the user has not yet advanced past the first screen of the
   * form...which we believe is a bit of an edge case, as most users will likely
   * do that after starting a new application), indicate to the user they need
   * to first save the form for the fields to be displayed.
   */
  return (
    <tr
      className={
        frfNeedsEdits || frfSelectedButNoPRF || prfApprovedButNoCRF
          ? highlightedTableRowClassNames
          : defaultTableRowClassNames
      }
    >
      <th scope="row" className={statusTableCellClassNames}>
        {frfNeedsEdits ? (
          <FormLink type="edit" to={frfUrl} />
        ) : frf.formio.state === "submitted" || !frfSubmissionPeriodOpen ? (
          <FormLink type="view" to={frfUrl} />
        ) : frf.formio.state === "draft" ? (
          <FormLink type="edit" to={frfUrl} />
        ) : null}
      </th>

      <td className={statusTableCellClassNames}>
        {frf.bap?.rebateId ? (
          <span title={`Application ID: ${frf.formio._id}`}>
            {frf.bap.rebateId}
          </span>
        ) : (
          <TextWithTooltip
            text=" "
            tooltip="Rebate ID should be displayed within 24hrs. after submitting a rebate form application"
          />
        )}
      </td>

      <td className={statusTableCellClassNames}>
        <span>Application</span>
        <br />
        <span className="display-flex flex-align-center font-sans-2xs">
          {frfStatus === "Needs Clarification" ? (
            <TextWithTooltip
              text={frfStatus}
              tooltip="Check your email for instructions on what needs clarification"
              iconClassNames="text-base-darkest"
            />
          ) : (
            <>
              <svg
                className={clsx("usa-icon", frfSelected && "text-primary")}
                aria-hidden="true"
                focusable="false"
                role="img"
              >
                <use href={`${icons}#${statusIconMap.get(frfStatus)}`} />
              </svg>
              <span className="margin-left-05">{frfStatus}</span>
            </>
          )}
        </span>
      </td>

      <td className={statusTableCellClassNames}>
        <>
          {Boolean(appInfo_uei) ? (
            appInfo_uei
          ) : (
            <TextWithTooltip
              text=" "
              tooltip="Please edit and save the form and the UEI will be displayed"
            />
          )}
          <br />
          {Boolean(appInfo_efti) ? (
            appInfo_efti
          ) : (
            <TextWithTooltip
              text=" "
              tooltip="Please edit and save the form and the EFT Indicator will be displayed"
            />
          )}
        </>
      </td>

      <td className={statusTableCellClassNames}>
        <>
          {Boolean(appInfo_organization_name) ? (
            appInfo_organization_name
          ) : (
            <TextWithTooltip
              text=" "
              tooltip="Please edit and save the form and the Applicant will be displayed"
            />
          )}
          <br />
          {Boolean(_formio_schoolDistrictName) ? (
            _formio_schoolDistrictName
          ) : (
            <TextWithTooltip
              text=" "
              tooltip="School District will be displayed after that field has been entered in the form"
            />
          )}
        </>
      </td>

      <td className={statusTableCellClassNames}>
        {_user_email}
        <br />
        <span title={`${date} ${time}`}>{date}</span>
      </td>

      <td className={clsx("!tw-text-right")}>
        <ChangeRequest2024Button
          data={{
            formType: "frf",
            comboKey: _bap_entity_combo_key,
            rebateId: frf.bap?.rebateId || null,
            mongoId: frf.formio._id,
            state: frf.formio.state,
            email,
            title,
            name,
          }}
        />
      </td>
    </tr>
  );
}

// function PRF2024Submission(props: { rebate: Rebate2024 }) {
//   //
// }

// function CRF2024Submission(props: { rebate: Rebate2024 }) {
//   //
// }

function Submissions2024() {
  const content = useContentData();
  const changeRequestsQuery = useChangeRequestsQuery("2024");
  const submissionsQueries = useSubmissionsQueries("2024");
  const submissions = useSubmissions("2024");

  if (
    changeRequestsQuery.isInitialLoading ||
    submissionsQueries.some((query) => query.isFetching)
  ) {
    return <Loading />;
  }

  if (
    changeRequestsQuery.isError ||
    submissionsQueries.some((query) => query.isError)
  ) {
    return <Message type="error" text={messages.formSubmissionsError} />;
  }

  if (submissions.length === 0) {
    return (
      <div className="margin-top-4">
        <Message type="info" text={messages.newApplication} />
      </div>
    );
  }

  return (
    <>
      <ChangeRequests2024 />

      {content && (
        <MarkdownContent
          className="margin-top-4"
          children={content.allRebatesIntro}
        />
      )}

      <div className="usa-table-container--scrollable" tabIndex={0}>
        <table
          aria-label="Your 2024 Rebate Forms"
          className="usa-table usa-table--stacked usa-table--borderless width-full"
        >
          <SubmissionsTableHeader rebateYear="2024" />
          <tbody className={clsx("[&_:is(th,td)]:tw-text-[15px]")}>
            {submissions.map((rebate, index) => {
              return rebate.rebateYear === "2024" ? (
                <Fragment key={rebate.rebateId}>
                  <FRF2024Submission rebate={rebate} />
                  {/* <PRF2024Submission rebate={rebate} /> */}
                  {/* <CRF2024Submission rebate={rebate} /> */}
                  {/* blank row after all submissions but the last one */}
                  {index !== submissions.length - 1 && (
                    <tr className={clsx("tw-bg-white")}>
                      <th
                        className={clsx("p-0", "tw-leading-none")}
                        scope="row"
                        colSpan={7}
                      >
                        &nbsp;
                      </th>
                    </tr>
                  )}
                </Fragment>
              ) : null;
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* --- Submissions --- */

export function Submissions() {
  const content = useContentData();
  const configData = useConfigData();
  const bapSamData = useBapSamData();
  const { rebateYear } = useRebateYearState();
  const { setRebateYear } = useRebateYearActions();

  const frfSubmissionPeriodOpen = configData
    ? configData.submissionPeriodOpen[rebateYear].frf
    : false;

  const btnClassNames =
    "usa-button margin-0 padding-x-2 padding-y-1 width-full font-sans-2xs";

  if (!bapSamData) return null;

  return (
    <>
      {bapSamData.entities.some((entity) => !entityIsActive(entity)) && (
        <Message
          type="warning"
          text={messages.bapSamAtLeastOneEntityNotActive}
        />
      )}

      <div className="margin-top-1 padding-top-1 padding-x-1 border-1px border-base-lighter bg-base-lightest">
        <nav className="flex-align-center mobile-lg:display-flex mobile-lg:padding-x-1">
          <div className="margin-bottom-1 mobile-lg:margin-right-1">
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
              onChange={(ev) => setRebateYear(ev.target.value as RebateYear)}
              defaultValue={rebateYear}
            >
              <option>2022</option>
              <option>2023</option>
              <option>2024</option>
            </select>
          </div>

          <div className="margin-bottom-1 mobile-lg:margin-right-1">
            {!frfSubmissionPeriodOpen ? (
              <button className={btnClassNames} disabled>
                <NewApplicationIconText />
              </button>
            ) : (
              <Link to="/frf/new" className={btnClassNames}>
                <NewApplicationIconText />
              </Link>
            )}
          </div>
        </nav>
      </div>

      {rebateYear === "2022" && <Submissions2022 />}
      {rebateYear === "2023" && <Submissions2023 />}
      {rebateYear === "2024" && <Submissions2024 />}

      {content && (
        <MarkdownContent
          className="margin-top-4 padding-2 padding-bottom-0 border-1px border-base-lighter bg-base-lightest"
          children={content.allRebatesOutro}
        />
      )}
    </>
  );
}
