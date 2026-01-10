import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { BiVideoPlus } from "react-icons/bi";
import { IoArrowBack } from "react-icons/io5";

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
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !micOn));
    setMicOn((v) => !v);
  };

  const toggleCam = () => {
    streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !camOn));
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
    <div className="h-[90vh] w-screen flex items-center justify-center relative min-h-screen text-white  flex-col  px-6">
      <div className="absolute inset-0 -z-10 opacity-80 overflow-hidden">
        <img
          src="/image.png"
          draggable="false"
          className="w-full h-full object-cover blur-[0px]"
        />
      </div>
      <div className="flex flex-col items-center justify-center p-5 rounded-4xl bg-[#00000082]">
        <div className="flex items-center justify-center mb-6 gap-4 ">
          <button className="cursor-pointer hover:scale-125 transition-all duration-500 "><IoArrowBack onClick={() => navigate("/dashboard")} size={30} /></button>
        <h1 className="text-2xl font-semibold "> Ready to join the meeting?</h1>
        </div>

        {error ? (
          <p className="text-red-400">{error}</p>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-96 rounded-2xl mb-6 -scale-x-100"
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
          <BiVideoPlus size={28} /> Start Call
        </button>
      </div>
    </div>
  );
}
