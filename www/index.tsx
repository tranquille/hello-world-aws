import { render } from "solid-js/web";
import { Router } from "@solidjs/router";
import App from "./app";
import { UserContextProvider } from "./user-store";

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got mispelled?"
  );
}

// rome-ignore lint/style/noNonNullAssertion:
render(
  () => (
    <Router>
      <UserContextProvider>
        <App />
      </UserContextProvider>
    </Router>
  ),
  root!
);
