import { Fragment, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
// ---
import { useDialogState, useDialogDispatch } from "contexts/dialog";

export function ConfirmationDialog() {
  const {
    dialogShown,
    dismissable,
    heading,
    description,
    confirmText,
    dismissText,
    confirmedAction,
    dismissedAction,
  } = useDialogState();
  const dialogDispatch = useDialogDispatch();

  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <Transition.Root show={dialogShown} as={Fragment}>
      <Dialog
        as="div"
        className="tw-relative tw-z-10"
        initialFocus={cancelRef}
        open={dialogShown}
        onClose={(ev) => {
          dismissable && dismissedAction && dismissedAction();
          dismissable && dialogDispatch({ type: "RESET_DIALOG" });
        }}
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
              <Dialog.Panel className="tw-relative tw-transform tw-overflow-hidden tw-rounded-lg tw-bg-white tw-p-4 tw-shadow-xl tw-transition-all sm:tw-w-full sm:tw-max-w-md sm:tw-p-6">
                {dismissable && dismissText && (
                  <div className="twpf">
                    <div className="tw-absolute tw-top-0 tw-right-0 tw-pt-4 tw-pr-4">
                      <button
                        type="button"
                        className="tw-rounded-md tw-bg-white tw-text-gray-400 tw-transition-none hover:tw-text-gray-700 focus:tw-text-gray-700"
                        onClick={(ev) => {
                          dismissedAction && dismissedAction();
                          dialogDispatch({ type: "RESET_DIALOG" });
                        }}
                      >
                        <span className="tw-sr-only">Close</span>
                        <XMarkIcon
                          className="tw-h-6 tw-w-6 tw-transition-none"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </div>
                )}

                <div className="tw-m-4">
                  <h2 className="tw-text-xl">{heading}</h2>

                  <div className="usa-prose">{description}</div>

                  <div className="tw-mt-4">
                    <ul className="usa-button-group">
                      <li className="usa-button-group__item">
                        <button
                          className="usa-button"
                          onClick={(ev) => {
                            confirmedAction();
                            dialogDispatch({ type: "RESET_DIALOG" });
                          }}
                        >
                          {confirmText}
                        </button>
                      </li>

                      {dismissable && dismissText && (
                        <li className="usa-button-group__item">
                          <button
                            className="usa-button"
                            onClick={(ev) => {
                              dismissedAction && dismissedAction();
                              dialogDispatch({ type: "RESET_DIALOG" });
                            }}
                            ref={cancelRef}
                          >
                            {dismissText}
                          </button>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
