import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import MeetingHistory from "../components/MeetingHistory";
import { useAuth } from "../auth/useAuth";
import { HiOutlinePlus } from "react-icons/hi2";
import { RiLogoutBoxLine } from "react-icons/ri";

export default function Dashboard() {
  const [code, setCode] = useState("");
  const { user, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const join = () => navigate(`/room/${code}`);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      sessionStorage.clear();
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/");
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!user) return null;

  const createRoom = () => {
    const roomId = Math.random().toString(36).substring(2, 8);
    navigate(`/lobby/${roomId}`);
  };

  return (
    <div className="min-h-screen w-screen text-white px-4 sm:px-6 py-6 sm:py-10">
      {/* Background */}
      <div className="absolute inset-0 -z-10 opacity-100 overflow-hidden">
        <img
          src="/image.png"
          draggable="false"
          className="w-full h-full object-cover blur-[4px]"
        />
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <img
            src={user.photoURL}
            alt="Profile"
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-slate-700"
          />

          <div className="text-center sm:text-left">
            <h1 className="text-xl text-black sm:text-3xl font-semibold">
              Welcome, {user.displayName}
            </h1>
            <p className="text-slate-900 text-sm sm:text-base">{user.email}</p>
          </div>

          <button
            onClick={handleLogout}
            className="
          sm:ml-auto
          w-full sm:w-auto
          px-5 py-2
          flex items-center justify-center gap-1
          rounded-xl bg-red-500 text-white font-medium
          border border-white/20

          hover:bg-red-700 hover:scale-105
          hover:border-white/40 hover:shadow-lg
          active:scale-95
          transition-all duration-300
        "
          >
            <RiLogoutBoxLine size={18} />
            Logout
          </button>
        </div>

        {/* Actions */}
        <div className="flex flex-col mt-6 gap-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            {/* Create Meeting */}
            <button
              onClick={createRoom}
              className="
            w-full sm:w-auto
            flex items-center justify-center gap-2
            px-6 py-3 rounded-xl
            bg-[#00189265] backdrop-blur-md
            border border-white/20

            transition-all duration-300
            hover:bg-[#0209297e] hover:border-white/40
            hover:shadow-lg hover:shadow-indigo-500/30
            active:scale-95
          "
            >
              <HiOutlinePlus size={22} />
              Create New Meeting
            </button>

            <div
              className="
            w-full sm:w-auto
            flex items-center gap-3
            px-4 py-2 rounded-xl
            bg-[#00189265] backdrop-blur-md
            border border-white/20

            transition-all duration-300
            hover:border-white/40 hover:bg-[#0209297e]
            hover:shadow-lg hover:shadow-indigo-500/30
          "
            >
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter meeting code"
                className="
              flex-1
              bg-transparent outline-none
              text-white placeholder:text-white
            "
              />

              <button
                disabled={!code}
                onClick={join}
                className="
              px-4 py-1 rounded-lg
              bg-white/10  text-white font-medium border border-white/20
              transition-all duration-200
              hover:bg-white/50
              active:scale-95
            "
              >
                Join
              </button>
            </div>
          </div>

          {/* History */}
          <MeetingHistory userId={user.uid} />
        </div>
      </div>
    </div>
  );
}
