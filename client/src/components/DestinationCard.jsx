import { useState } from "react";

const DestinationCard = ({ dest, onSelect, onExplain, isSelected, delay }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(dest)}
      style={{
        background: "#FFFFFF",
        borderRadius: 20,
        overflow: "hidden",
        cursor: "pointer",
        border: isSelected ? "2.5px solid #5B3FF8" : "1.5px solid #EDE8E3",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: hovered ? "0 20px 40px rgba(91,63,248,0.12)" : "0 2px 8px rgba(0,0,0,0.04)",
        animationDelay: `${delay}ms`,
        animation: "fadeSlideUp 0.5s ease both",
      }}
    >
      <style>{`
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div style={{
        height: 140,
        background: dest.image_gradient || "linear-gradient(135deg, #5B3FF8, #A78BFA)",
        position: "relative",
        display: "flex",
        alignItems: "flex-end",
        padding: "16px 20px",
      }}>
        <div style={{
          position: "absolute", top: 16, right: 16,
          background: "rgba(255,255,255,0.25)", backdropFilter: "blur(8px)",
          borderRadius: 100, padding: "4px 10px",
          fontSize: 12, fontWeight: 700, color: "white",
          fontFamily: "'DM Sans', sans-serif",
          border: "1px solid rgba(255,255,255,0.4)",
        }}>
          {dest.match_score}% match
        </div>
        <div style={{ fontSize: 40 }}>{dest.emoji}</div>
        <div style={{ marginLeft: 12 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "white", fontFamily: "'Playfair Display', serif", lineHeight: 1.2 }}>
            {dest.name.split(",")[0]}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", fontFamily: "'DM Sans', sans-serif" }}>
            {dest.name.split(",")[1]?.trim()}
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 20px 20px" }}>
        <div style={{ fontStyle: "italic", color: "#6B5E8A", fontSize: 13, marginBottom: 12, fontFamily: "'Playfair Display', serif", lineHeight: 1.5 }}>
          "{dest.tagline}"
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {(dest.vibe_tags || []).slice(0, 4).map((tag) => (
            <span key={tag} style={{
              background: "#F0EDFF", color: "#5B3FF8", borderRadius: 100,
              padding: "3px 10px", fontSize: 11, fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
            }}>{tag}</span>
          ))}
        </div>

        <p style={{ fontSize: 13, color: "#5C5248", lineHeight: 1.6, margin: "0 0 14px", fontFamily: "'DM Sans', sans-serif" }}>
          {dest.micro_story}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
          {[
            { label: "Flight", value: dest.estimated_flight_price },
            { label: "Duration", value: dest.flight_hours },
            { label: "Best time", value: (dest.best_months || []).slice(0, 2).join("–") },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: "#FAF8F5", borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#A09080", fontFamily: "'DM Sans', sans-serif", marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#2D1B69", fontFamily: "'DM Sans', sans-serif" }}>{value || "—"}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#22C55E", marginBottom: 6, fontFamily: "'DM Sans', sans-serif", letterSpacing: 0.5 }}>
            ✓ WHY IT MATCHES
          </div>
          {(dest.match_reasons || []).slice(0, 2).map((r, i) => (
            <div key={i} style={{ fontSize: 12, color: "#4B5563", marginBottom: 3, fontFamily: "'DM Sans', sans-serif" }}>• {r}</div>
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B", marginBottom: 6, fontFamily: "'DM Sans', sans-serif", letterSpacing: 0.5 }}>
            ⚖ TRADE-OFFS
          </div>
          {(dest.trade_offs || []).slice(0, 2).map((t, i) => (
            <div key={i} style={{ fontSize: 12, color: "#6B7280", marginBottom: 3, fontFamily: "'DM Sans', sans-serif" }}>• {t}</div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(dest); }}
            style={{
              flex: 1, background: "#5B3FF8", color: "white", border: "none",
              borderRadius: 10, padding: "10px 0", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
            }}
          >
            Plan this trip →
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onExplain(dest); }}
            style={{
              background: "#F0EDFF", color: "#5B3FF8", border: "none",
              borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
            }}
            title="Explain recommendation"
          >
            💡
          </button>
        </div>
      </div>
    </div>
  );
};

export default DestinationCard;
