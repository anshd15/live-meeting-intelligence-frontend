import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { useWebRTC } from "./useWebRTC";
import VideoGrid from "./VideoGrid";
import Controls from "./Controls";

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // ✅ Redirect must be in effect
  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [loading, user, navigate]);

  // ✅ ALWAYS call the hook (no condition)
  const {
    localVideoRef,
    remoteVideoRef,
    status,
    toggleAudio,
    toggleVideo,
    cleanup,
  } = useWebRTC(roomId, user);

  if (loading || !user) {
    return (
      <div className="h-screen flex items-center justify-center text-white">
        Connecting…
      </div>
    );
  }

  const leave = () => {
    cleanup();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center">
      <h2 className="mb-2">Room: {roomId}</h2>
      <p className="mb-4">ICE state: {status}</p>

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
