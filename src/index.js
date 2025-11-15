// src/index.js
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
//import "./index.css"; // optional, create if you want basic styles

const root = createRoot(document.getElementById("root"));
root.render(<App />);
