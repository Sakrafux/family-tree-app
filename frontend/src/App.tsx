import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Route, Routes, useLocation } from "react-router-dom";

import Header from "@/components/Header";
import Feedback from "@/pages/Feedback";
import Home from "@/pages/Home";
import Login from "@/pages/Login";

function App() {
    const { t, i18n } = useTranslation("common");
    const location = useLocation();

    useEffect(() => {
        document.title = t("page.title");
    }, [i18n.language, t]);

    return (
        <>
            <Header />

            <Routes>
                <Route path="/" element={<Home key={location.key} />} />
                <Route path="/feedback" element={<Feedback key={location.key} />} />
                <Route path="/login" element={<Login key={location.key} />} />
            </Routes>
        </>
    );
}

export default App;
