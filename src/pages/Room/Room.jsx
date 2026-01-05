import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { useWebRTC } from "./useWebRTC";
import VideoGrid from "./VideoGrid";
import Controls from "./Controls";

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) navigate("/");

  const {
    localVideoRef,
    remoteVideoRef,
    status,
    toggleAudio,
    toggleVideo,
    cleanup,
  } = useWebRTC(roomId, user);

  const leave = () => {
    cleanup();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center">
      <h2 className="mb-2">Room: {roomId}</h2>
      <p className="mb-4">ICE: {status}</p>

      <VideoGrid
        localRef={localVideoRef}
        remoteRef={remoteVideoRef}
      />

      <Controls
        onVideo={toggleVideo}
        onAudio={toggleAudio}
        onLeave={leave}
      />
    </div>
  );
}
