import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';

function App() {
    return (
        <Router>
            <Routes>
                {/* ...otras rutas... */}
                <Route path="/login" element={<Login />} />
                {/* ...otras rutas... */}
            </Routes>
        </Router>
    );
}

export default App;