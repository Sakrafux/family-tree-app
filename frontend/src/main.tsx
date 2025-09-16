import "./index.css";
import "@/i18n";

import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { ApiProvider } from "@/api/ApiProvider";
import { DataProviders } from "@/api/data/Providers";
import { AuthProvider } from "@/api/security/AuthProvider";
import App from "@/App";
import { LoadingProvider } from "@/components/LoadingProvider";
import { ToastProvider } from "@/components/Toast/ToastProvider";

createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
        <ToastProvider>
            <LoadingProvider>
                <AuthProvider>
                    <ApiProvider>
                        <DataProviders>
                            <App />
                        </DataProviders>
                    </ApiProvider>
                </AuthProvider>
            </LoadingProvider>
        </ToastProvider>
    </BrowserRouter>,
);
