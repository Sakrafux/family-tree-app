import axios, { type AxiosInstance } from "axios";
import { createContext, type PropsWithChildren, useContext } from "react";

const ApiContext = createContext<AxiosInstance | undefined>(undefined);

export function ApiProvider({ children }: PropsWithChildren) {
    const api = axios.create({
        baseURL: import.meta.env.VITE_API_BASE_URL,
        headers: { "Content-Type": "application/json" },
    });

    api.interceptors.request.use(
        (config) => {
            console.log("Request to", config.url);
            return config;
        },
        (error) => Promise.reject(error),
    );

    api.interceptors.response.use(
        (response) => {
            console.log("Response to", response.config.url);
            return response;
        },
        (error) => Promise.reject(error),
    );

    return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
}

export function useApi() {
    const context = useContext(ApiContext);
    if (!context) {
        throw new Error("useApi must be used within a ApiProvider");
    }
    return context;
}
