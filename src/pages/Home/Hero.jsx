import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useNavigate } from "react-router-dom";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../firebase";

export default function Hero() {
  const titleRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    gsap.from(titleRef.current.children, {
      y: 80,
      opacity: 0,
      stagger: 0.15,
      duration: 1,
      ease: "power4.out",
    });
  }, []);

  const startMeeting = async () => {
    try {
      // 🔐 Google login ONLY on button click
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);

      // 🎥 Create room AFTER login
      const roomId = Math.random().toString(36).substring(2, 8);
      navigate(`/room/${roomId}`);
    } catch (err) {
      console.error(err);
      alert("Google login cancelled or failed");
    }
  };

  return (
    <section className="relative px-6 pt-28 pb-24 text-center">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-20 -right-40 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse delay-1000" />

      <div ref={titleRef} className="relative z-10 max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight">
          <span className="block">Seamless</span>
          <span className="block text-indigo-400">Live Meetings</span>
          <span className="block">Anywhere</span>
        </h1>

        <p className="mt-6 text-slate-300 text-lg">
          Secure, real-time video meetings powered by WebRTC.
        </p>

        <button
          onClick={startMeeting}
          className="btn btn-primary btn-lg mt-10 px-12 shadow-lg shadow-indigo-500/30"
        >
          🚀 Start New Meeting
        </button>
      </div>
    </section>
  );
}
