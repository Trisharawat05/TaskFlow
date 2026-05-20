import React from "react";
import { createRoot } from "react-dom/client";
import TaskFlow from "./TaskFlow";

const root = createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <TaskFlow />
  </React.StrictMode>
);
