import { render } from "preact";
import { ChatWidget } from "./components/ChatWidget";
import css from "./widget.css?inline";

const script = (document.currentScript ||
  document.querySelector("script[data-chatbot-key]")) as HTMLScriptElement;
const embedKey = script?.getAttribute("data-chatbot-key");
const apiBase = script?.src ? new URL(script.src).origin : window.location.origin;

if (embedKey) {
  const host = document.createElement("div");
  host.id = "ai-chatbot-embed";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" }); // Creating a shadow dom to seperatly manage dom from the original dom tree

  const style = document.createElement("style");
  style.textContent = css;
  shadow.appendChild(style); // Shadow will avoid leak or penetration of css across multiple dom trees

  const root = document.createElement("div");
  shadow.appendChild(root);

  render(
    <ChatWidget embedKey={embedKey} apiBase={apiBase} mode="widget" />,
    root,
  );
}
