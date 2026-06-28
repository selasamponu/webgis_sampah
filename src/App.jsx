import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Admin from "./pages/Admin";
import Courier from "./pages/Courier";
import Warga from "./pages/Warga";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/courier" element={<Courier />} />
        <Route path="/warga" element={<Warga />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;