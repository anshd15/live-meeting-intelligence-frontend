export default function Features() {
  const features = [
    "Peer-to-peer video & audio",
    "TURN & STUN NAT traversal",
    "Low-latency WebRTC streams",
    "Works on mobile networks",
    "Room-based secure joining",
    "Scalable signaling server",
  ];

  return (
    <section className="px-6 py-24 bg-slate-950/60">
      <h2 className="text-4xl font-bold text-center mb-14">
        Why This Works
      </h2>

      <div className="max-w-6xl mx-auto grid sm:grid-cols-2 gap-8">
        {features.map((f, i) => (
          <div
            key={i}
            className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 hover:-translate-y-2 transition-all hover:shadow-indigo-500/20 hover:shadow-xl"
          >
            ✔ {f}
          </div>
        ))}
      </div>
    </section>
  );
}
