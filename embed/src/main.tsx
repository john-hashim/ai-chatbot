import { render } from "preact";
import { ChatWidget } from "./components/ChatWidget";
import "./widget.css";

// Dev mode: render with a test embed key
const params = new URLSearchParams(window.location.search);
const embedKey =
  params.get("key") || "ek_2c7dd050c64d904a7d5abcadb1012365548a7066455ab1bb";
const apiBase = "http://localhost:3001";

render(
  <ChatWidget embedKey={embedKey} apiBase={apiBase} mode="widget" />,
  document.getElementById("app")!,
);
