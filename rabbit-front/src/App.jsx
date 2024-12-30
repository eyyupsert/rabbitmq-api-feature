import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Feature from "./pages/Feature";
import Produce from "./pages/Produce";
import Consume from "./pages/Consume";

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/feature" element={<Feature />} />
                <Route path="/produce" element={<Produce />} />
                <Route path="/consume" element={<Consume />} />
            </Routes>
        </Router>
    );
};

export default App;
