import About from "@/pages/About.tsx";
import Home from "@/pages/Home.tsx";
import { Route, Routes } from "react-router-dom";
import NavBar from "@/components/NavBar.tsx";

function App() {
    return (
        <>
            <NavBar />

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
            </Routes>
        </>
    );
}

export default App;
