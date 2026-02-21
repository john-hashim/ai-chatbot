import { render } from "preact";
import { ChatWidget } from "./components/ChatWidget";
import "./widget.css";

const pathParts = window.location.pathname.split("/");
const embedKey = pathParts[pathParts.length - 1];
const apiBase = window.location.origin;

if (embedKey) {
  const app = document.getElementById("app");
  if (app) {
    render(
      <ChatWidget embedKey={embedKey} apiBase={apiBase} mode="iframe" />,
      app,
    );
  }
}
