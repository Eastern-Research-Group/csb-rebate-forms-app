const {
  NODE_ENV,
  REACT_APP_SERVER_BASE_PATH,
  REACT_APP_CLOUD_SPACE,
  REACT_APP_FORMIO_BASE_URL,
  REACT_APP_FORMIO_PROJECT_URL,
} = process.env;

if (!REACT_APP_FORMIO_BASE_URL) {
  throw new Error(
    "Required REACT_APP_FORMIO_BASE_URL environment variable not found."
  );
}

if (!REACT_APP_FORMIO_PROJECT_URL) {
  throw new Error(
    "Required REACT_APP_FORMIO_PROJECT_URL environment variable not found."
  );
}

export const serverBasePath =
  NODE_ENV === "development" ? "" : REACT_APP_SERVER_BASE_PATH || "";

export const serverUrl =
  NODE_ENV === "development"
    ? "http://localhost:3001"
    : window.location.origin + serverBasePath;

export const cloudSpace =
  NODE_ENV === "development" ? "dev" : REACT_APP_CLOUD_SPACE || "";

export const formioBaseUrl = REACT_APP_FORMIO_BASE_URL;

export const formioProjectUrl = REACT_APP_FORMIO_PROJECT_URL;

export const messages = {
  auth: "Authentication error. Please log in again or contact support.",
  saml: "Error logging in. Please try again or contact support.",
  samFetch: "Error retrieving SAM.gov data. Please contact support.",
  samResults:
    "No SAM.gov records match your email. Only Government and Electronic Business SAM.gov Points of Contacts (and alternates) may edit and submit Clean School Bus Rebate Forms.",
  timeout:
    "For security reasons, you have been logged out due to 15 minutes of inactivity.",
  logout: "You have successfully logged out.",
};

/**
 * Returns a promise containing JSON fetched from a provided web service URL
 * or handles any other OK response returned from the server
 */
export async function fetchData(url: string, data?: object) {
  const options = !data
    ? {
        method: "GET",
        credentials: "include" as const,
      }
    : {
        method: "POST",
        credentials: "include" as const,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      };

  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(res.statusText);
    const contentType = res.headers.get("content-type");
    return contentType?.includes("application/json")
      ? await res.json()
      : Promise.resolve();
  } catch (error) {
    return await Promise.reject(error);
  }
}
