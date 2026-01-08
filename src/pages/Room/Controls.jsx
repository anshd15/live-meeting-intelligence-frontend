export default function Controls({
  onVideo,
  onAudio,
  onScreen,
  onLeave,
}) {
  return (
    <div className="fixed bottom-6 flex gap-4 bg-slate-900 px-6 py-3 rounded-xl">
      <button onClick={onAudio} className="btn btn-circle">🎙</button>
      <button onClick={onVideo} className="btn btn-circle">📷</button>
      <button onClick={onScreen} className="btn btn-circle">🖥</button>
      <button onClick={onLeave} className="btn btn-error btn-circle">⛔</button>
    </div>
  );
}
