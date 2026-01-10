import { useState } from "react";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
} from "react-icons/fa";
import { MdScreenShare, MdCallEnd } from "react-icons/md";

export default function Controls({
  onVideo,
  onAudio,
  onScreen,
  onLeave,
}) {
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);

  const handleAudio = () => {
    setIsAudioOn((prev) => !prev);
    onAudio?.();
  };

  const handleVideo = () => {
    setIsVideoOn((prev) => !prev);
    onVideo?.();
  };

  return (
    <div className="fixed bottom-2 left-1/2 -translate-x-1/2 flex gap-5 bg-[#1E1E1E]/90 backdrop-blur-xl px-7 py-2 rounded-4xl shadow-xl border border-white/10">
      
      {/* Audio */}
      <button
        onClick={handleAudio}
        className={`btn btn-circle transition-all ${
          isAudioOn
            ? "bg-[#2A2A2A] hover:bg-[#333]"
            : "bg-red-600 hover:bg-red-700"
        }`}
      >
        {isAudioOn ? (
          <FaMicrophone className="text-white text-xl" />
        ) : (
          <FaMicrophoneSlash className="text-white text-xl" />
        )}
      </button>

      {/* Video */}
      <button
        onClick={handleVideo}
        className={`btn btn-circle transition-all ${
          isVideoOn
            ? "bg-[#2A2A2A] hover:bg-[#333]"
            : "bg-red-600 hover:bg-red-700"
        }`}
      >
        {isVideoOn ? (
          <FaVideo className="text-white text-xl" />
        ) : (
          <FaVideoSlash className="text-white text-xl" />
        )}
      </button>

      {/* Screen Share */}
      <button
        onClick={onScreen}
        className="btn btn-circle bg-[#2A2A2A] hover:bg-[#333] transition-all"
      >
        <MdScreenShare className="text-white text-2xl" />
      </button>

      {/* Leave */}
      <button
        onClick={onLeave}
        className="btn btn-circle bg-red-700 hover:bg-red-800 transition-all"
      >
        <MdCallEnd className="text-white text-2xl" />
      </button>
    </div>
  );
}
