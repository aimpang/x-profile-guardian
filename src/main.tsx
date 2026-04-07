import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Suppress WebGL shader warnings from THREE.js (non-critical, cosmetic only)
const originalError = console.error;
console.error = (...args: any[]) => {
  const message = args[0]?.toString?.() || "";
  if (message.includes("THREE") && message.includes("WebGL")) {
    return; // Suppress THREE.js WebGL warnings
  }
  originalError(...args);
};

createRoot(document.getElementById("root")!).render(<App />);
