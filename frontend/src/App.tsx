import { Route, Routes } from "react-router-dom";

import Header from "@/components/Header";
import About from "@/pages/About";
import Home from "@/pages/Home";

function App() {
    return (
        <>
            <Header />

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
            </Routes>
        </>
    );
}

export default App;
