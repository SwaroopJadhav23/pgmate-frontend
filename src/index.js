import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import ErrorBoundary from "./Errors/ErrorBoundary";
import "./styles/colors.css";
import { CityFilterProvider } from "./context/CityFilterContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <AuthProvider>
      <CityFilterProvider>
        <App />
      </CityFilterProvider>
    </AuthProvider>
  </ErrorBoundary>
);
