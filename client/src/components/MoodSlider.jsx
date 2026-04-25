const MoodSlider = ({ label, value, onChange, leftLabel, rightLabel }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
      <span style={{ fontSize: 12, color: "#8B7D6B", fontFamily: "'DM Sans', sans-serif" }}>{leftLabel}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#2D1B69", fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
      <span style={{ fontSize: 12, color: "#8B7D6B", fontFamily: "'DM Sans', sans-serif" }}>{rightLabel}</span>
    </div>
    <input
      type="range" min={0} max={100} value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ width: "100%", accentColor: "#5B3FF8", cursor: "pointer" }}
    />
  </div>
);

export default MoodSlider;
