import { render } from "preact";
import { ChatWidget } from "./components/ChatWidget";
import { resolveIdentity } from "./identity";
import "./widget.css";

const pathParts = window.location.pathname.split("/");
const embedKey = pathParts[pathParts.length - 1];
const apiBase = window.location.origin;
const providedIdentifier = new URLSearchParams(window.location.search).get(
  "identifier",
);

if (embedKey) {
  const identity = resolveIdentity(embedKey, providedIdentifier);
  const app = document.getElementById("app");
  if (app) {
    render(
      <ChatWidget
        embedKey={embedKey}
        apiBase={apiBase}
        mode="iframe"
        identity={identity}
      />,
      app,
    );
  }
}
