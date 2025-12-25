import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const createRoom = () => {
    const roomId = Math.random().toString(36).substring(2, 8);
    navigate(`/room/${roomId}`);
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Live Meeting</h2>
      <button onClick={createRoom}>Create Room</button>
    </div>
  );
}
