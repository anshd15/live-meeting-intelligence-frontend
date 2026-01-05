export default function VideoGrid({ localRef, remoteRef }) {
  return (
    <div className="flex gap-6">
      <video ref={localRef} autoPlay muted playsInline className="w-72 rounded" />
      <video ref={remoteRef} autoPlay playsInline className="w-72 rounded" />
    </div>
  );
}
