import { StrictMode } from "react";
import { render } from "react-dom";
/*
  NOTE: regenerator-runtime is imported to avoid a bug with a GitHub Action
  workflow including regenerator-runtime in the build as an external dependency.
  For reference, the GitHub Action workflow's log message stated:
    "regenerator-runtime/runtime.js" is imported by
    "regenerator-runtime/runtime.js?commonjs-external", but could not be
    resolved – treating it as an external dependency.
*/
import "regenerator-runtime";
// ---
import { ErrorBoundary } from "@/components/errorBoundary";
import { Providers } from "@/components/providers";
import { App } from "@/components/app";
import "@/styles.css";

const container = document.getElementById("root") as HTMLElement;

export default function Index() {
  return (
    <StrictMode>
      <ErrorBoundary>
        <Providers>
          <App />
        </Providers>
      </ErrorBoundary>
    </StrictMode>
  );
}

render(<Index />, container);
