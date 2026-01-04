import { useEffect, useRef, useState } from "react";

export default function CameraPreview() {
  const videoRef = useRef(null);

const [isCameraOn, setIsCameraOn] = useState(false);

const toggleCamera = async () => {
    if (isCameraOn) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        setIsCameraOn(false);
    } else {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        videoRef.current.srcObject = stream;
        setIsCameraOn(true);
    }
};

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: false, audio: false })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      });
  }, []);

  return (
    <div className="rounded-xl overflow-hidden border border-slate-800">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-64 object-cover bg-black"
      />
      <button onClick={toggleCamera} className="w-full bg-slate-900/70 text-white py-2 hover:bg-slate-800 transition">
        Start Camera
      </button>
    </div>
  );
}
