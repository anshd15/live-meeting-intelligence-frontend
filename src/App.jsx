import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import Dashboard from "./pages/Dashboard";
import Lobby from "./pages/Lobby/Lobby";
import Room from "./pages/Room";
import "./index.css";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/lobby/:roomId" element={<Lobby />} />
      <Route path="/room/:roomId" element={<Room />} />
    </Routes>
  );
}
