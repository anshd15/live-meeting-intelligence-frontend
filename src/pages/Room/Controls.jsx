export default function Controls({ onVideo, onAudio, onLeave }) {
  return (
    <div className="flex gap-4 mt-6">
      <button onClick={onVideo} className="btn btn-outline">
        Toggle Video
      </button>
      <button onClick={onAudio} className="btn btn-outline">
        Toggle Mic
      </button>
      <button onClick={onLeave} className="btn btn-error">
        Leave
      </button>
    </div>
  );
}
