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
  const isCaller = useRef(false);
  const pendingCandidates = useRef([]);

  useEffect(() => {
    console.log("🔵 Room mounted");

    const init = async () => {
      // 1️⃣ Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localVideoRef.current.srcObject = stream;

      // 2️⃣ Fetch ICE servers securely from backend
      const iceRes = await fetch(
        "https://live-meeting-intelligence-backend.onrender.com/api/ice"
      );
      const { iceServers } = await iceRes.json();


      // 3️⃣ Create PeerConnection
      peerRef.current = new RTCPeerConnection({ iceServers });

      // 4️⃣ Add local tracks
      stream.getTracks().forEach((track) => {
        peerRef.current.addTrack(track, stream);
      });

      // 5️⃣ Remote track handling
      peerRef.current.ontrack = (e) => {
        console.log("📺 Remote track received");
        remoteVideoRef.current.srcObject = e.streams[0];
      };

      // 6️⃣ ICE candidate handling
      peerRef.current.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("ice-candidate", {
            candidate: e.candidate,
            roomId,
          });
        }
      };

      // 7️⃣ Join room
      socket.emit("join-room", roomId);
    };

    init();

    // 🟢 SERVER DECIDES CALLER
    socket.on("ready", ({ callerId }) => {
      if (socket.id === callerId) {
        isCaller.current = true;
        console.log("☎️ I am CALLER → creating offer");
        createOffer();
      } else {
        console.log("📞 I am CALLEE → waiting for offer");
      }
    });

    const createOffer = async () => {
      const offer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(offer);
      socket.emit("offer", { offer, roomId });
    };

    socket.on("offer", async ({ offer }) => {
      console.log("📨 OFFER received");
      await peerRef.current.setRemoteDescription(offer);

      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);
      socket.emit("answer", { answer, roomId });

      // 🔥 Add queued ICE candidates
      pendingCandidates.current.forEach((c) =>
        peerRef.current.addIceCandidate(c)
      );
      pendingCandidates.current = [];
    });

    socket.on("answer", async ({ answer }) => {
      console.log("📨 ANSWER received");
      if (peerRef.current.signalingState !== "have-local-offer") return;

      await peerRef.current.setRemoteDescription(answer);

      // 🔥 Add queued ICE candidates
      pendingCandidates.current.forEach((c) =>
        peerRef.current.addIceCandidate(c)
      );
      pendingCandidates.current = [];
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      if (!peerRef.current.remoteDescription) {
        pendingCandidates.current.push(candidate);
      } else {
        await peerRef.current.addIceCandidate(candidate);
      }
    });

    return () => {
      console.log("🔴 Room unmounted");
      peerRef.current?.close();
      socket.off();
    };
  }, [roomId]);

  return (
    <div style={{ display: "flex", gap: 20, padding: 20 }}>
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        width="320"
      />
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        width="320"
      />
    </div>
  );
}
