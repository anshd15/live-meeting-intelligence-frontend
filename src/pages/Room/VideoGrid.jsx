export default function VideoGrid({ localRef, remoteRef }) {
  return (
    <div className="grid grid-cols-2 gap-6 max-w-5xl">
      <video
        ref={localRef}
        autoPlay
        muted
        playsInline
        className="rounded-xl bg-black"
      />
      <video
        ref={remoteRef}
        autoPlay
        playsInline
        className="rounded-xl bg-black"
      />
    </div>
  );
}
