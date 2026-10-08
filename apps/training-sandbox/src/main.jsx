import React from "react";
import { createRoot } from "react-dom/client";
import "./attempt-session.js";
import App from "../sample.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);