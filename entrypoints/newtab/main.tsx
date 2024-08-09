import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "../../css/tailwind.css";

document.addEventListener("DOMContentLoaded", () => {
  const root = createRoot(document.getElementById("root"));
  root.render(<App />);
});
