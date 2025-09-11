import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "@/App";
import { ApiProvider } from "@/api/ApiProvider.tsx";
import { DataProviders } from "@/api/data/Providers.tsx";
import { BrowserRouter } from "react-router-dom";
import { LoadingProvider } from "@/components/Loading.tsx";

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
