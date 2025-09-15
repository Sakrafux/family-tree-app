import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Route, Routes } from "react-router-dom";

import Header from "@/components/Header";
import Feedback from "@/pages/Feedback";
import Home from "@/pages/Home";

function App() {
    const { t, i18n } = useTranslation("common");

    useEffect(() => {
        document.title = t("page.title");
    }, [i18n.language, t]);

    return (
        <>
            <Header />

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/feedback" element={<Feedback />} />
            </Routes>
        </>
    );
}

export default App;
