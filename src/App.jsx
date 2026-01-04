import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import Room from "./pages/Room";
import "./index.css";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/room/:roomId" element={<Room />} />
    </Routes>
  );
}
