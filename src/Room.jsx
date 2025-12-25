import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";

const socket = io("https://live-meeting-intelligence-backend.onrender.com");

export default function Room() {
  const { roomId } = useParams();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);

  const [isReady, setIsReady] = useState(false);
  const isCaller = useRef(false);

  useEffect(() => {
    async function init() {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      localVideoRef.current.srcObject = stream;

      peerRef.current = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          {
            urls: "turn:global.relay.metered.ca:80",
            username: "TURN_USER",
            credential: "TURN_PASS"
          }
        ]
      });

      stream.getTracks().forEach(track =>
        peerRef.current.addTrack(track, stream)
      );

      peerRef.current.ontrack = e => {
        remoteVideoRef.current.srcObject = e.streams[0];
      };

      peerRef.current.onicecandidate = e => {
        if (e.candidate) {
          socket.emit("ice-candidate", e.candidate, roomId);
        }
      };

      setIsReady(true);
      socket.emit("join-room", roomId);
    }

    init();

    socket.on("room-info", count => {
      if (count === 1) {
        isCaller.current = true;
      }
    });

    socket.on("user-joined", async () => {
      if (!isReady || !isCaller.current) return;

      const offer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(offer);
      socket.emit("offer", offer, roomId);
    });

    socket.on("offer", async offer => {
      if (!peerRef.current) return;

      await peerRef.current.setRemoteDescription(offer);
      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);
      socket.emit("answer", answer, roomId);
    });

    socket.on("answer", async answer => {
      await peerRef.current.setRemoteDescription(answer);
    });

    socket.on("ice-candidate", async candidate => {
      if (peerRef.current) {
        await peerRef.current.addIceCandidate(candidate);
      }
    });

    return () => socket.disconnect();
  }, [roomId, isReady]);

  return (
    <div style={{ display: "flex", gap: 20, padding: 20 }}>
      <video ref={localVideoRef} autoPlay muted playsInline width="320" />
      <video ref={remoteVideoRef} autoPlay playsInline width="320" />
    </div>
  );
}
