import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";

const socket = io("https://live-meeting-intelligence-backend.onrender.com");

export default function Room() {
  const { roomId } = useParams();

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerRef = useRef();
  const isCaller = useRef(false);

  useEffect(() => {
    socket.emit("join-room", roomId);

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        localVideoRef.current.srcObject = stream;

        peerRef.current = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
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
      });

    socket.on("room-info", count => {
      if (count === 1) {
        isCaller.current = true;
      }
    });

    socket.on("user-joined", async () => {
      if (isCaller.current) {
        const offer = await peerRef.current.createOffer();
        await peerRef.current.setLocalDescription(offer);
        socket.emit("offer", offer, roomId);
      }
    });

    socket.on("offer", async offer => {
      if (!isCaller.current) {
        await peerRef.current.setRemoteDescription(offer);
        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);
        socket.emit("answer", answer, roomId);
      }
    });

    socket.on("answer", async answer => {
      await peerRef.current.setRemoteDescription(answer);
    });

    socket.on("ice-candidate", async candidate => {
      await peerRef.current.addIceCandidate(candidate);
    });

  }, []);

  return (
    <div style={{ display: "flex", gap: 20, padding: 20 }}>
      <video ref={localVideoRef} autoPlay muted playsInline width="320" />
      <video ref={remoteVideoRef} autoPlay playsInline width="320" />
    </div>
  );
}
