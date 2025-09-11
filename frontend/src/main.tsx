import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { ApiProvider } from "@/api/ApiProvider";
import { DataProviders } from "@/api/data/Providers";
import App from "@/App";
import { LoadingProvider } from "@/components/Loading";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <BrowserRouter>
            <LoadingProvider>
                <ApiProvider>
                    <DataProviders>
                        <App />
                    </DataProviders>
                </ApiProvider>
            </LoadingProvider>
        </BrowserRouter>
    </StrictMode>,
);
