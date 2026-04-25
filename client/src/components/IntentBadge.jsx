const IntentBadge = ({ intent }) => {
  if (!intent) return null;
  return (
    <div style={{
      background: "linear-gradient(135deg, #F0EDFF, #E8F4FD)",
      borderRadius: 16, padding: "16px 20px",
      border: "1px solid #D4C8F0", marginBottom: 24,
      animation: "fadeSlideUp 0.4s ease both",
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#8B6FCB", marginBottom: 8, fontFamily: "'DM Sans', sans-serif", letterSpacing: 1 }}>
        ✦ YOUR TRAVEL INTENT
      </div>
      <div style={{ fontSize: 14, color: "#2D1B69", fontStyle: "italic", fontFamily: "'Playfair Display', serif", marginBottom: 10, lineHeight: 1.5 }}>
        "{intent.summary}"
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {(intent.emotional_drivers || []).map((d) => (
          <span key={d} style={{ background: "#E8D5FF", color: "#6B35C8", borderRadius: 100, padding: "2px 10px", fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
            {d}
          </span>
        ))}
        {(intent.soft_preferences?.vibe || []).map((v) => (
          <span key={v} style={{ background: "#DBEAFE", color: "#1D4ED8", borderRadius: 100, padding: "2px 10px", fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
            {v}
          </span>
        ))}
      </div>
    </div>
  );
};

export default IntentBadge;
