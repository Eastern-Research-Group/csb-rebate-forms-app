import { Fragment } from "react";
import { Transition } from "@headlessui/react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { XCircleIcon } from "@heroicons/react/24/outline";
import { XMarkIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
// ---
import {
  useNotificationsState,
  useNotificationsActions,
} from "@/contexts/notifications";

export function Notifications() {
  const { displayed, type, body } = useNotificationsState();
  const { dismissNotification } = useNotificationsActions();

  return (
    <div className="twpf">
      <div
        aria-live="assertive"
        className={clsx(
          "tw:pointer-events-none tw:fixed tw:inset-0 tw:z-20 tw:flex tw:items-end tw:p-4",
          "tw:sm:items-start",
        )}
      >
        <div
          className={clsx(
            "tw:flex tw:w-full tw:flex-col tw:items-center tw:space-y-4",
            "tw:sm:items-end",
          )}
        >
          <Transition
            show={displayed}
            as={Fragment}
            enter={clsx(
              "tw:transform tw:transition tw:duration-300 tw:ease-out",
            )}
            enterFrom={clsx(
              "tw:translate-y-2 tw:opacity-0",
              "tw:sm:translate-y-0 tw:sm:translate-x-2",
            )}
            enterTo={clsx(
              "tw:translate-y-0 tw:opacity-100",
              "tw:sm:translate-x-0",
            )}
            leave={clsx("tw:transition tw:duration-100 tw:ease-in")}
            leaveFrom={clsx("tw:opacity-100")}
            leaveTo={clsx("tw:opacity-0")}
          >
            <div
              className={clsx(
                "tw:pointer-events-auto tw:w-full tw:max-w-sm tw:overflow-hidden tw:rounded-lg tw:bg-white tw:shadow-xl tw:ring-1 tw:ring-black/10",
              )}
            >
              <div className={clsx("tw:p-4")}>
                <div className={clsx("tw:flex tw:items-start")}>
                  <div className={clsx("tw:shrink-0")}>
                    {type === "info" ? (
                      <InformationCircleIcon
                        className={clsx("tw:size-6 tw:text-blue-400")}
                        aria-hidden="true"
                      />
                    ) : type === "success" ? (
                      <CheckCircleIcon
                        className={clsx("tw:size-6 tw:text-green-400")}
                        aria-hidden="true"
                      />
                    ) : type === "warning" ? (
                      <ExclamationTriangleIcon
                        className={clsx("tw:size-6 tw:text-yellow-400")}
                        aria-hidden="true"
                      />
                    ) : type === "error" ? (
                      <XCircleIcon
                        className={clsx("tw:size-6 tw:text-red-400")}
                        aria-hidden="true"
                      />
                    ) : null}
                  </div>

                  <div
                    className={clsx(
                      "tw:mx-3 tw:w-0 tw:flex-1 tw:pt-0.5",
                      "tw:[&_p]:!mb-0",
                    )}
                  >
                    {body}
                  </div>

                  <div className={clsx("tw:shrink-0")}>
                    <button
                      className={clsx(
                        "tw:inline-flex tw:rounded-md tw:bg-white tw:text-gray-400 tw:transition-none",
                        "tw:hover:text-gray-700",
                        "tw:focus:text-gray-700",
                      )}
                      type="button"
                      onClick={(_ev) => dismissNotification({ id: 0 })}
                    >
                      <span className={clsx("tw:sr-only")}>Close</span>
                      <XMarkIcon
                        className={clsx("tw:size-5 tw:transition-none")}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  );
}
