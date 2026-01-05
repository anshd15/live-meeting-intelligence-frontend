import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";

export default function Lobby() {
  const { roomId } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/");
      return;
    }

    const startPreview = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        streamRef.current = stream;
        videoRef.current.srcObject = stream;
      } catch (err) {
        console.error(err);
        setError("Camera or microphone permission denied");
      }
    };

    startPreview();

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [user, loading, navigate]);

  const toggleMic = () => {
    streamRef.current
      ?.getAudioTracks()
      .forEach((t) => (t.enabled = !micOn));
    setMicOn((v) => !v);
  };

  const toggleCam = () => {
    streamRef.current
      ?.getVideoTracks()
      .forEach((t) => (t.enabled = !camOn));
    setCamOn((v) => !v);
  };

  const startCall = () => {
    navigate(`/room/${roomId}`);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-6">
      <h1 className="text-2xl font-bold mb-6">
        Ready to join the meeting?
      </h1>

      {error ? (
        <p className="text-red-400">{error}</p>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-96 rounded-xl border border-slate-700 mb-6"
        />
      )}

      <div className="flex gap-4 mb-8">
        <button onClick={toggleMic} className="btn btn-outline">
          {micOn ? "Mic ON" : "Mic OFF"}
        </button>

        <button onClick={toggleCam} className="btn btn-outline">
          {camOn ? "Camera ON" : "Camera OFF"}
        </button>
      </div>

      <button
        onClick={startCall}
        className="btn btn-primary btn-lg px-12"
        disabled={!!error}
      >
        ▶️ Start Call
      </button>
    </div>
  );
}