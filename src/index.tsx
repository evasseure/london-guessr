import React from "react";

import { createRoot } from "react-dom/client";
import { App } from "./App";
import { Renderer } from "./Renderer";

const container = document.getElementById("app")!;
const root = createRoot(container);

if (window.location.pathname === "/render") root.render(<Renderer />);
else root.render(<App />);
