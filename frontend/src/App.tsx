import About from "@/pages/About.tsx";
import Home from "@/pages/Home.tsx";
import { Link, Route, Routes } from "react-router-dom";

function App() {
    return (
        <div>
            <nav>
                <Link to="/">Home</Link> | <Link to="/about">About</Link>
            </nav>

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
            </Routes>
        </div>
    );
}

export default App;
