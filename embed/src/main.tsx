import { render } from "preact";
import { ChatWidget } from "./components/ChatWidget";
import "./widget.css";

// Dev mode: render with a test embed key
const params = new URLSearchParams(window.location.search);
const embedKey =
  params.get("key") || "ek_2cfb1f9cf467cd29a5ac873ee62a8127c7ad4e283ac288aa";
const apiBase = "http://localhost:3001";

render(
  <ChatWidget embedKey={embedKey} apiBase={apiBase} mode="widget" />,
  document.getElementById("app")!,
);
