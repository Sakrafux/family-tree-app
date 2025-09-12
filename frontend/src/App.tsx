import { Route, Routes } from "react-router-dom";

import Header from "@/components/Header";
import Feedback from "@/pages/Feedback";
import Home from "@/pages/Home";

function App() {
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
