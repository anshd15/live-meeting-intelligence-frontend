import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";

const socket = io("https://live-meeting-intelligence-backend.onrender.com", {
  transports: ["websocket"],
});

export default function Room() {
  const { roomId } = useParams();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingCandidates = useRef([]);

  useEffect(() => {
    console.log("🔵 Room mounted:", roomId);

    const init = async () => {
      console.log("🎥 Requesting media...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      console.log("✅ Local media acquired");
      localStreamRef.current = stream;
      localVideoRef.current.srcObject = stream;

      peerRef.current = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
        ],
      });

      console.log("🧠 RTCPeerConnection created");

      stream.getTracks().forEach(track =>
        peerRef.current.addTrack(track, stream)
      );
      console.log("➕ Local tracks added");

      peerRef.current.ontrack = e => {
        console.log("📺 Remote track received");
        remoteVideoRef.current.srcObject = e.streams[0];
      };

      peerRef.current.onicecandidate = e => {
        if (e.candidate) {
          console.log("❄ Sending ICE candidate");
          socket.emit("ice-candidate", {
            candidate: e.candidate,
            roomId,
          });
        }
      };

      console.log("🚪 Joining room:", roomId);
      socket.emit("join-room", roomId);
    };

    init();

    socket.on("ready", async () => {
      console.log("🟢 READY received → creating offer");

      const offer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(offer);

      console.log("📤 Sending OFFER");
      socket.emit("offer", { offer, roomId });
    });

    socket.on("offer", async ({ offer }) => {
      console.log("📨 OFFER received");

      await peerRef.current.setRemoteDescription(offer);
      console.log("📥 Remote description set (offer)");

      pendingCandidates.current.forEach(c => {
        console.log("❄ Applying buffered ICE");
        peerRef.current.addIceCandidate(c);
      });
      pendingCandidates.current = [];

      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);

      console.log("📤 Sending ANSWER");
      socket.emit("answer", { answer, roomId });
    });

    socket.on("answer", async ({ answer }) => {
      console.log("📨 ANSWER received");
      await peerRef.current.setRemoteDescription(answer);
      console.log("📥 Remote description set (answer)");
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      console.log("❄ ICE candidate received");

      if (!peerRef.current.remoteDescription) {
        console.log("⏳ Buffering ICE (no remote description yet)");
        pendingCandidates.current.push(candidate);
      } else {
        await peerRef.current.addIceCandidate(candidate);
        console.log("✅ ICE candidate added");
      }
    });

    return () => {
      console.log("🧹 Cleaning up Room");
      peerRef.current?.close();
      socket.off();
    };
  }, [roomId]);

  return (
    <div style={{ display: "flex", gap: 20, padding: 20 }}>
      <video ref={localVideoRef} autoPlay muted playsInline width="320" />
      <video ref={remoteVideoRef} autoPlay playsInline width="320" />
    </div>
  );
}
