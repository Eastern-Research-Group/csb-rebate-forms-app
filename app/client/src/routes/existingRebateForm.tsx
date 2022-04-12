import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Form } from "@formio/react";
// ---
import { serverUrl, fetchData } from "../config";
import Loading from "components/loading";
import Message, { useMessageState } from "components/message";
import MarkdownContent from "components/markdownContent";
import { useUserState } from "contexts/user";
import { useContentState } from "contexts/content";

type FormioSubmission = {
  // NOTE: more fields are in a form.io submission,
  // but we're only concerned with the fields below
  data: object;
  state: "submitted" | "draft";
  // (other fields...)
};

type FormioOnNextPageParams = {
  page: number;
  submission: FormioSubmission;
};

type SubmissionsState =
  | {
      status: "idle";
      data: {
        userAccess: false;
        formSchema: null;
        submissionData: null;
      };
    }
  | {
      status: "pending";
      data: {
        userAccess: false;
        formSchema: null;
        submissionData: null;
      };
    }
  | {
      status: "success";
      data:
        | {
            userAccess: true;
            formSchema: { url: string; json: object };
            submissionData: {
              _id: string;
              data: object;
              state: "submitted" | "draft";
            };
          }
        | {
            userAccess: false;
            formSchema: null;
            submissionData: null;
          };
    }
  | {
      status: "failure";
      data: {
        userAccess: false;
        formSchema: null;
        submissionData: null;
      };
    };

export default function ExistingRebateForm() {
  const navigate = useNavigate();
  const { id } = useParams<"id">();
  const { epaUserData } = useUserState();
  const { content } = useContentState();

  const [rebateFormSubmission, setRebateFormSubmission] =
    useState<SubmissionsState>({
      status: "idle",
      data: {
        userAccess: false,
        formSchema: null,
        submissionData: null,
      },
    });

  useEffect(() => {
    setRebateFormSubmission({
      status: "pending",
      data: {
        userAccess: false,
        formSchema: null,
        submissionData: null,
      },
    });

    fetchData(`${serverUrl}/api/rebate-form-submission/${id}`)
      .then((res) => {
        setRebateFormSubmission({
          status: "success",
          data: res,
        });
      })
      .catch((err) => {
        setRebateFormSubmission({
          status: "failure",
          data: {
            userAccess: false,
            formSchema: null,
            submissionData: null,
          },
        });
      });
  }, [id]);

  const {
    message,
    displayInfoMessage,
    displaySuccessMessage,
    displayErrorMessage,
    resetMessage,
  } = useMessageState();

  // NOTE: Provided to the <Form /> component's submission prop. Initially
  // empty, it'll be set once the user attemts to submit the form (both
  // succesfully and unsuccesfully) – that way when the form re-renders after
  // the submission attempt, the fields the user filled out will not be lost
  const [savedSubmission, setSavedSubmission] = useState<{ data: object }>({
    data: {},
  });

  if (rebateFormSubmission.status === "idle") {
    return null;
  }

  if (rebateFormSubmission.status === "pending") {
    return <Loading />;
  }

  const { userAccess, formSchema, submissionData } = rebateFormSubmission.data;

  if (
    rebateFormSubmission.status === "failure" ||
    !userAccess ||
    !formSchema ||
    !submissionData
  ) {
    return (
      <Message
        type="error"
        text="The requested submission does not exist, or you do not have access. Please contact support if you believe this is a mistake."
      />
    );
  }

  if (epaUserData.status !== "success") {
    return <Loading />;
  }

  return (
    <div className="margin-top-2">
      {content.status === "success" && (
        <MarkdownContent
          className="margin-top-4"
          children={
            submissionData.state === "draft"
              ? content.data.existingDraftRebateFormIntro
              : submissionData.state === "submitted"
              ? content.data.existingSubmittedRebateFormIntro
              : ""
          }
        />
      )}

      {message.displayed && <Message type={message.type} text={message.text} />}

      <h3>Application ID: {submissionData._id}</h3>

      <div className="csb-form">
        <Form
          form={formSchema.json}
          url={formSchema.url} // NOTE: used for file uploads
          submission={{
            data: {
              ...submissionData.data,
              last_updated_by: epaUserData.data.mail,
              ...savedSubmission.data,
            },
          }}
          options={{
            readOnly: submissionData.state === "submitted" ? true : false,
            noAlerts: true,
          }}
          onSubmit={(submission: FormioSubmission) => {
            setSavedSubmission(submission);

            if (submission.state === "submitted") {
              displayInfoMessage("Submitting form...");
            }

            if (submission.state === "draft") {
              displayInfoMessage("Saving form...");
            }

            fetchData(
              `${serverUrl}/api/rebate-form-submission/${submissionData._id}`,
              {
                ...submission,
                data: { ...submission.data, ncesDataSource: "" },
              }
            )
              .then((res) => {
                if (submission.state === "submitted") {
                  displaySuccessMessage("Form succesfully submitted.");
                  setTimeout(() => navigate("/"), 5000);
                  return;
                }

                if (submission.state === "draft") {
                  displaySuccessMessage("Draft succesfully saved.");
                  setTimeout(() => resetMessage(), 5000);
                }
              })
              .catch((err) => {
                displayErrorMessage("Error submitting rebate form.");
              });
          }}
          onNextPage={({ page, submission }: FormioOnNextPageParams) => {
            if (submissionData.state !== "draft") return;

            setSavedSubmission(submission);

            if (submission.state === "submitted") {
              displayInfoMessage("Submitting form...");
            }

            if (submission.state === "draft") {
              displayInfoMessage("Saving form...");
            }

            fetchData(
              `${serverUrl}/api/rebate-form-submission/${submissionData._id}`,
              {
                ...submission,
                data: { ...submission.data, ncesDataSource: "" },
                state: "draft",
              }
            )
              .then((res) => {
                displaySuccessMessage("Draft succesfully saved.");
                setTimeout(() => resetMessage(), 5000);
              })
              .catch((err) => {
                displayErrorMessage("Error saving draft rebate form.");
              });
          }}
        />
      </div>

      {message.displayed && <Message type={message.type} text={message.text} />}
    </div>
  );
}
