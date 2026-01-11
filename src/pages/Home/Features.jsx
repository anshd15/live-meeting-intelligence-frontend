export default function Features() {
  const features = [
    {
      title: "Peer-to-Peer Media",
      desc: "Direct video & audio streams with minimal latency.",
    },
    {
      title: "NAT Traversal",
      desc: "TURN & STUN ensure connectivity across networks.",
    },
    {
      title: "Low Latency",
      desc: "Optimized WebRTC pipelines for real-time presence.",
    },
    {
      title: "Mobile Friendly",
      desc: "Works reliably on mobile and unstable networks.",
    },
    {
      title: "Secure Rooms",
      desc: "Room-based joining with controlled access.",
    },
    {
      title: "Scalable Signaling",
      desc: "Socket-powered signaling built for growth.",
    },
  ];

  return (
    <section className="px-6 py-28 bg-slate-950/60">
      <h2 className="text-4xl font-bold text-center mb-16">Why SignalRoom</h2>

      <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((f, i) => (
          <div
            key={i}
            className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-8
                       hover:-translate-y-2 transition-all duration-300
                       hover:shadow-[0_0_40px_rgba(56,189,248,0.15)]"
          >
            <h3 className="text-xl font-semibold mb-3 text-slate-100">
              {f.title}
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Advanced Features */}
      <div className="max-w-4xl mx-auto mt-24">
        <h3 className="text-3xl font-bold text-center mb-10">Under the Hood</h3>

        <div className="space-y-4">
          {/* OAuth */}
          <div className="collapse collapse-arrow bg-slate-900/60 border border-slate-800 rounded-xl">
            <input type="checkbox" />
            <div className="collapse-title text-lg font-medium text-slate-100">
              Secure Authentication
            </div>
            <div className="collapse-content text-slate-400 text-sm leading-relaxed">
              SignalRoom uses Google OAuth via Firebase Authentication, ensuring
              secure, trusted, and seamless user sign-in.
            </div>
          </div>

          {/* TURN */}
          <div className="collapse collapse-arrow bg-slate-900/60 border border-slate-800 rounded-xl">
            <input type="checkbox" />
            <div className="collapse-title text-lg font-medium text-slate-100">
              Dedicated TURN Infrastructure
            </div>
            <div className="collapse-content text-slate-400 text-sm leading-relaxed">
              A TURN server deployed on a GCP virtual machine guarantees
              reliable media connectivity across NATs, firewalls, and restricted
              networks.
            </div>
          </div>

          {/* Firestore */}
          <div className="collapse collapse-arrow bg-slate-900/60 border border-slate-800 rounded-xl">
            <input type="checkbox" />
            <div className="collapse-title text-lg font-medium text-slate-100">
              Persistent Meeting History
            </div>
            <div className="collapse-content text-slate-400 text-sm leading-relaxed">
              User meeting metadata is securely stored and retrieved using
              Firebase Firestore, enabling history tracking across sessions.
            </div>
          </div>

          {/* Screen Sharing */}
          <div className="collapse collapse-arrow bg-slate-900/60 border border-slate-800 rounded-xl">
            <input type="checkbox" />
            <div className="collapse-title text-lg font-medium text-slate-100">
              Screen Sharing
            </div>
            <div className="collapse-content text-slate-400 text-sm leading-relaxed">
              Participants can share a browser tab, application window, or their
              entire screen with real-time synchronization.
            </div>
          </div>

          {/* Admit */}
          <div className="collapse collapse-arrow bg-slate-900/60 border border-slate-800 rounded-xl">
            <input type="checkbox" />
            <div className="collapse-title text-lg font-medium text-slate-100">
              Host Admit Control
            </div>
            <div className="collapse-content text-slate-400 text-sm leading-relaxed">
              New participants must be approved by the host before joining,
              adding an extra layer of meeting security.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
