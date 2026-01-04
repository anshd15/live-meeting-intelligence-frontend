import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CameraPreview from "../../components/CameraPreview";
import Toast from "../../components/Toast";

export default function JoinRoom() {
  const [code, setCode] = useState("");
  const [toast, setToast] = useState("");
  const navigate = useNavigate();

  const join = () => navigate(`/room/${code}`);

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${code}`);
    setToast("Room link copied!");
    setTimeout(() => setToast(""), 2000);
  };

  return (
    <section className="px-6 py-20 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-10">
        Join a Meeting
      </h2>

      <div className="grid md:grid-cols-2 gap-10 items-center">
        <CameraPreview />

        <div className="space-y-4">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter room code"
            className="input input-bordered w-full text-black"
          />

          <div className="flex gap-3">
            <button
              disabled={!code}
              onClick={join}
              className="btn btn-primary flex-1"
            >
              Join
            </button>

            <button
              disabled={!code}
              onClick={copyLink}
              className="btn btn-outline"
            >
              Copy Link
            </button>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast} />}
    </section>
  );
}
