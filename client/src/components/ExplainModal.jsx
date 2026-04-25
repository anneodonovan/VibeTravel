import Spinner from "./Spinner";

const ExplainModal = ({ dest, explanation, onClose, loading }) => (
  <div
    style={{
      position: "fixed", inset: 0, background: "rgba(15,8,40,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 20,
      animation: "fadeIn 0.2s ease",
    }}
    onClick={onClose}
  >
    <style>{`@keyframes fadeIn { from { opacity:0; } to { opacity:1; } }`}</style>
    <div
      style={{
        background: "white", borderRadius: 24, padding: 32,
        maxWidth: 520, width: "100%",
        boxShadow: "0 40px 80px rgba(0,0,0,0.3)",
        animation: "slideUp 0.3s cubic-bezier(0.4,0,0.2,1)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <style>{`@keyframes slideUp { from { transform:translateY(30px); opacity:0; } to { transform:translateY(0); opacity:1; } }`}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#8B6FCB", fontFamily: "'DM Sans', sans-serif", letterSpacing: 1, marginBottom: 4 }}>
            💡 RECOMMENDATION EXPLAINED
          </div>
          <h2 style={{ margin: 0, fontSize: 22, fontFamily: "'Playfair Display', serif", color: "#2D1B69" }}>
            {dest?.name}
          </h2>
        </div>
        <button
          onClick={onClose}
          style={{ background: "#F5F0FF", border: "none", borderRadius: 50, width: 36, height: 36, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}
        >×</button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spinner />
          <div style={{ marginTop: 12, color: "#8B7D6B", fontFamily: "'DM Sans', sans-serif" }}>Thinking deeply...</div>
        </div>
      ) : explanation ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { label: "Primary match", value: explanation.primary_match, icon: "🎯" },
            { label: "Emotional fit", value: explanation.emotional_fit, icon: "💫" },
            { label: "Practical fit", value: explanation.practical_fit, icon: "✓" },
            { label: "Honest assessment", value: explanation.honest_assessment, icon: "⚖️" },
            { label: "Who loves it", value: explanation.who_loves_it, icon: "❤️" },
            { label: "Who might struggle", value: explanation.who_struggles, icon: "⚠️" },
          ].map(({ label, value, icon }) => (
            <div key={label} style={{ background: "#FAF8F5", borderRadius: 12, padding: "12px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#8B6FCB", fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>{icon} {label.toUpperCase()}</div>
              <div style={{ fontSize: 14, color: "#4B3F6B", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>{value}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  </div>
);

export default ExplainModal;
