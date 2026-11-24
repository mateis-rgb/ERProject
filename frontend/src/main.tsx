import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider, ThemeProvider } from "./context/AppContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ModulesProvider } from "./context/ModulesContext";
import { I18nProvider } from "./i18n/I18nContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { initFrontLogger } from "./services/frontLogger";
import "./index.css";

initFrontLogger();

const rootEl = document.getElementById("root");
if (rootEl === null) throw new Error("Root element not found");

ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
        <BrowserRouter>
            <I18nProvider>
                <ErrorBoundary>
                    <ThemeProvider>
                        <AuthProvider>
                            <NotificationProvider>
                                <ModulesProvider>
                                    <App />
                                </ModulesProvider>
                            </NotificationProvider>
                        </AuthProvider>
                    </ThemeProvider>
                </ErrorBoundary>
            </I18nProvider>
        </BrowserRouter>
    </React.StrictMode>
);
