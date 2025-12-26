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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localVideoRef.current.srcObject = stream;

      peerRef.current = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },

          {
            urls: "turn:global.relay.metered.ca:80",
            username: import.meta.env.VITE_TURN_USERNAME,
            credential: import.meta.env.VITE_TURN_CREDENTIAL,
          },
          {
            urls: "turn:global.relay.metered.ca:443",
            username: import.meta.env.VITE_TURN_USERNAME,
            credential: import.meta.env.VITE_TURN_CREDENTIAL,
          },
          {
            urls: "turn:global.relay.metered.ca:80?transport=tcp",
            username: import.meta.env.VITE_TURN_USERNAME,
            credential: import.meta.env.VITE_TURN_CREDENTIAL,
          },
        ],
      });
      stream
        .getTracks()
        .forEach((track) => peerRef.current.addTrack(track, stream));

      peerRef.current.ontrack = (e) => {
        console.log("📺 Remote track received");
        remoteVideoRef.current.srcObject = e.streams[0];
      };

      peerRef.current.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("ice-candidate", {
            candidate: e.candidate,
            roomId,
          });
        }
      };

      socket.emit("join-room", roomId);
    };

    init();

    // 👇 SERVER TELLS WHO IS CALLER
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
    });

    socket.on("answer", async ({ answer }) => {
      console.log("📨 ANSWER received");
      if (peerRef.current.signalingState !== "have-local-offer") return;
      await peerRef.current.setRemoteDescription(answer);
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      if (!peerRef.current.remoteDescription) {
        pendingCandidates.current.push(candidate);
      } else {
        await peerRef.current.addIceCandidate(candidate);
      }
    });

    return () => {
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
