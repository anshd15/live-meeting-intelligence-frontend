import { useEffect, useState } from "react";
import socket from "../../socket";

export default function Lobby({ roomId, user }) {
  const [approved, setApproved] = useState(false);
  const [rejected, setRejected] = useState(false);

  useEffect(() => {
    socket.emit("request-join", { roomId, user });

    socket.on("join-approved", () => setApproved(true));
    socket.on("join-rejected", () => setRejected(true));

    return () => {
      socket.off("join-approved");
      socket.off("join-rejected");
    };
  }, []);

  if (approved) return null;

  return (
    <div className="h-screen flex items-center justify-center">
      {rejected ? (
        <p className="text-red-400">Join request rejected</p>
      ) : (
        <p className="text-slate-300">Waiting for host approval…</p>
      )}
    </div>
  );
}
