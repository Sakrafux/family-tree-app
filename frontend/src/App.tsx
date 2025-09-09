import About from "@/pages/About.tsx";
import Home from "@/pages/Home.tsx";
import { Route, Routes } from "react-router-dom";
import Header from "@/components/Header.tsx";

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
