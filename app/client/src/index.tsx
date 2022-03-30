import { StrictMode } from "react";
import { render } from "react-dom";
import reportWebVitals from "./reportWebVitals";
// ---
import { UserProvider } from "contexts/user";
import { ContentProvider } from "contexts/content";
import { FormsProvider } from "contexts/forms";
import { DialogProvider } from "contexts/dialog";
import ErrorBoundary from "components/errorBoundary";
import App from "components/app";
import "./styles.css";

const rootElement = document.getElementById("root");

render(
  <StrictMode>
    <ErrorBoundary>
      <UserProvider>
        <ContentProvider>
          <FormsProvider>
            <DialogProvider>
              <App />
            </DialogProvider>
          </FormsProvider>
        </ContentProvider>
      </UserProvider>
    </ErrorBoundary>
  </StrictMode>,
  rootElement
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
