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
    const init = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;
      localVideoRef.current.srcObject = stream;

      peerRef.current = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          // ❗ replace with real TURN creds
          // {
          //   urls: "turn:your.turn.server:3478",
          //   username: "user",
          //   credential: "pass",
          // }
        ],
      });

      stream.getTracks().forEach(track =>
        peerRef.current.addTrack(track, stream)
      );

      peerRef.current.ontrack = e => {
        remoteVideoRef.current.srcObject = e.streams[0];
      };

      peerRef.current.onicecandidate = e => {
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

    socket.on("offer", async ({ offer }) => {
      await peerRef.current.setRemoteDescription(offer);

      // apply buffered ICE
      pendingCandidates.current.forEach(c =>
        peerRef.current.addIceCandidate(c)
      );
      pendingCandidates.current = [];

      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);

      socket.emit("answer", { answer, roomId });
    });

    socket.on("answer", async ({ answer }) => {
      await peerRef.current.setRemoteDescription(answer);
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      if (!peerRef.current.remoteDescription) {
        pendingCandidates.current.push(candidate);
      } else {
        await peerRef.current.addIceCandidate(candidate);
      }
    });

    socket.on("ready", async () => {
      const offer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(offer);

      socket.emit("offer", { offer, roomId });
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
