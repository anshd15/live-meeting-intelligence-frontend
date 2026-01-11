import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useNavigate } from "react-router-dom";
import GoogleLoginButton from "../../components/GoogleLoginButton";
import { useAuth } from "../../auth/useAuth";

export default function Hero() {
  const titleRef = useRef(null);
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    gsap.from(titleRef.current.children, {
      y: 60,
      opacity: 0,
      stagger: 0.15,
      duration: 1,
      ease: "power4.out",
    });
  }, []);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [loading, isAuthenticated, navigate]);

  return (
    <section className="relative px-6 pt-32 pb-28 text-center overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute -top-48 -left-48 w-[32rem] h-[32rem] bg-cyan-500/35 rounded-full blur-3xl" />
      <div className="absolute top-24 -right-48 w-[32rem] h-[32rem] bg-indigo-500/20 rounded-full blur-3xl" />

      <div
        ref={titleRef}
        className="relative z-10 max-w-5xl mx-auto"
      >
        {/* Logo */}
        <img
          src="/logo.png"
          alt="SignalRoom Logo"
          className="mx-auto w-20 h-20 mb-6 drop-shadow-[0_0_30px_rgba(56,189,248,0.35)]"
        />

        {/* App Name */}
        <h2
          className="
            text-3xl sm:text-4xl font-semibold  tracking-wide mb-6 pb-3
            bg-gradient-to-r from-cyan-400 to-indigo-400
            bg-clip-text text-transparent
            drop-shadow-[0_0_25px_rgba(56,189,248,0.25)]
          "
        >
          SignalRoom
        </h2>

        {/* Hero Headline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight tracking-tight">
          <span className="block text-slate-100">
            Where Connections
          </span>
          <span className="block bg-gradient-to-r from-cyan-400 to-[#7600a8] bg-clip-text text-transparent">
            Stay Strong
          </span>
        </h1>

        {/* Subtext */}
        <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto">
          A real-time meeting platform built on WebRTC delivering
          low-latency, secure video calls that just work, anywhere.
        </p>

        {/* CTA */}
        {!loading && !isAuthenticated && (
          <div className="mt-12 flex justify-center">
            <GoogleLoginButton />
          </div>
        )}
      </div>
    </section>
  );
}
