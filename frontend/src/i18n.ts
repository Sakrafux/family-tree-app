import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpApi from "i18next-http-backend";
import { initReactI18next } from "react-i18next";

i18n.use(HttpApi)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        supportedLngs: ["en", "de"], // supported languages
        fallbackLng: "en",
        debug: true,
        interpolation: {
            escapeValue: false, // React already escapes by default
        },
        backend: {
            loadPath: "/locales/{{lng}}/translation.json", // where translation files live
        },
    });

export default i18n;
