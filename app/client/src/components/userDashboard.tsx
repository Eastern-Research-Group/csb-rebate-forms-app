import { useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import bootstrap4 from "@formio/bootstrap/bootstrap4";
import { Formio } from "@formio/react";
import premium from "@formio/premium/lib/index.js";
import uswds from "@formio/uswds";
import icons from "uswds/img/sprite.svg";
// ---
import { serverUrl } from "@/config";
import {
  useHelpdeskAccess,
  useConfigQuery,
  useConfigData,
  useBapSamQuery,
  useBapSamData,
} from "@/utilities";
import { Loading } from "@/components/loading";
import { useDialogActions } from "@/contexts/dialog";

Formio.use(bootstrap4); /* eslint-disable-line react-hooks/rules-of-hooks */
Formio.use(premium); /* eslint-disable-line react-hooks/rules-of-hooks */
Formio.use(uswds); /* eslint-disable-line react-hooks/rules-of-hooks */

function DashboardIconText() {
  return (
    <span className="display-flex flex-align-center">
      <svg className="usa-icon" aria-hidden="true" focusable="false" role="img">
        <use href={`${icons}#list`} />
      </svg>
      <span className="margin-left-1 text-left">Dashboard</span>
    </span>
  );
}

function HelpdeskIconText() {
  return (
    <span className="display-flex flex-align-center">
      <svg className="usa-icon" aria-hidden="true" focusable="false" role="img">
        <use href={`${icons}#people`} />
      </svg>
      <span className="margin-left-1 text-left">Helpdesk</span>
    </span>
  );
}

function SignOutIconText() {
  return (
    <span className="display-flex flex-align-center">
      <span className="margin-right-1 text-right">Sign out</span>
      <svg className="usa-icon" aria-hidden="true" focusable="false" role="img">
        <use href={`${icons}#logout`} />
      </svg>
    </span>
  );
}

export function UserDashboard(props: { email: string }) {
  const { email } = props;

  const { pathname } = useLocation();
  const navigate = useNavigate();

  useConfigQuery();
  useBapSamQuery();

  const configData = useConfigData();
  const bapSamData = useBapSamData();

  const { displayDialog } = useDialogActions();
  const helpdeskAccess = useHelpdeskAccess();

  useEffect(() => {
    const { formioBaseUrl, formioProjectName } = configData ?? {};

    if (formioBaseUrl) {
      Formio.setBaseUrl(formioBaseUrl);
    }

    if (formioBaseUrl && formioProjectName) {
      Formio.setProjectUrl(`${formioBaseUrl}/${formioProjectName}`);
    }
  }, [configData]);

  const onSubmissionsPage = pathname === "/";
  const onHelpdeskPage = pathname === "/helpdesk";
  const onFormPage =
    pathname.startsWith("/frf") ||
    pathname.startsWith("/prf") ||
    pathname.startsWith("/crf") ||
    pathname.startsWith("/change");

  const btnClassNames =
    "usa-button margin-0 padding-x-2 padding-y-1 width-full font-sans-2xs";

  function confirmationNavigation(url: string) {
    displayDialog({
      dismissable: true,
      heading: "Are you sure you want to navigate away from this page?",
      description: (
        <p>
          If you haven’t saved the current form, any changes you’ve made will be
          lost.
        </p>
      ),
      confirmText: "Yes",
      dismissText: "Cancel",
      confirmedAction: () => navigate(url),
    });
  }

  if (!configData || !bapSamData || !email) {
    return <Loading />;
  }

  return (
    <div>
      <h1 className="margin-bottom-2">Clean School Bus Rebate Forms</h1>

      <ul className="margin-bottom-4">
        <li>
          <a
            href="https://www.epa.gov/cleanschoolbus/school-bus-rebates-clean-school-bus-program"
            target="_blank"
            rel="noopener noreferrer"
          >
            Clean School Bus Rebate Program
          </a>
        </li>
        <li>
          <a
            href="https://www.epa.gov/cleanschoolbus/online-rebate-application-information-clean-school-bus-program"
            target="_blank"
            rel="noopener noreferrer"
          >
            Online Rebate Application Information
          </a>
        </li>
      </ul>

      <div className="flex-justify border-bottom tablet:display-flex">
        <nav className="flex-align-center mobile-lg:display-flex">
          <div className="margin-bottom-1 mobile-lg:margin-right-1">
            {onSubmissionsPage ? (
              <button className={btnClassNames} disabled>
                <DashboardIconText />
              </button>
            ) : (
              <Link
                to="/"
                className={btnClassNames}
                onClick={(ev) => {
                  if (onFormPage) {
                    ev.preventDefault();
                    confirmationNavigation("/");
                  }
                }}
              >
                <DashboardIconText />
              </Link>
            )}
          </div>

          {helpdeskAccess === "success" && (
            <div className="margin-bottom-1 mobile-lg:margin-right-1">
              {onHelpdeskPage ? (
                <button className={btnClassNames} disabled>
                  <HelpdeskIconText />
                </button>
              ) : (
                <Link
                  to="/helpdesk"
                  className={btnClassNames}
                  onClick={(ev) => {
                    if (onFormPage) {
                      ev.preventDefault();
                      confirmationNavigation("/helpdesk");
                    }
                  }}
                >
                  <HelpdeskIconText />
                </Link>
              )}
            </div>
          )}
        </nav>

        <nav className="flex-align-center mobile-lg:display-flex tablet:flex-justify-end">
          <div className="margin-bottom-1">
            <span className="font-sans-xs">{email}</span>
          </div>

          <div className="margin-bottom-1 mobile-lg:margin-left-1">
            <a className={btnClassNames} href={`${serverUrl}/logout`}>
              <SignOutIconText />
            </a>
          </div>
        </nav>
      </div>

      <Outlet context={{ email }} />
    </div>
  );
}
