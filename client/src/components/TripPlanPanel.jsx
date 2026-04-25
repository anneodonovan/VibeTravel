import Spinner from "./Spinner";

const TripPlanPanel = ({ dest, plan, loading, onClose }) => (
  <div
    style={{
      position: "fixed", inset: 0, background: "rgba(15,8,40,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 20, overflowY: "auto",
    }}
    onClick={onClose}
  >
    <div
      style={{
        background: "white", borderRadius: 24,
        maxWidth: 640, width: "100%",
        boxShadow: "0 40px 80px rgba(0,0,0,0.3)",
        maxHeight: "90vh", overflowY: "auto",
        animation: "slideUp 0.3s cubic-bezier(0.4,0,0.2,1)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <style>{`@keyframes slideUp { from { transform:translateY(30px); opacity:0; } to { transform:translateY(0); opacity:1; } }`}</style>

      <div style={{
        position: "sticky", top: 0,
        background: dest?.image_gradient || "linear-gradient(135deg, #5B3FF8, #A78BFA)",
        padding: "24px 28px 20px", borderRadius: "24px 24px 0 0",
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", fontFamily: "'DM Sans', sans-serif", letterSpacing: 1, marginBottom: 4 }}>
            ✈ TRIP PLAN
          </div>
          <h2 style={{ margin: 0, fontSize: 26, fontFamily: "'Playfair Display', serif", color: "white" }}>
            {dest?.emoji} {dest?.name}
          </h2>
        </div>
        <button
          onClick={onClose}
          style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 50, width: 36, height: 36, cursor: "pointer", fontSize: 18, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}
        >×</button>
      </div>

      <div style={{ padding: "28px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spinner />
            <div style={{ marginTop: 12, color: "#8B7D6B", fontFamily: "'DM Sans', sans-serif" }}>Planning your perfect trip...</div>
          </div>
        ) : plan ? (
          <div>
            <section style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#5B3FF8", fontFamily: "'DM Sans', sans-serif", letterSpacing: 1, marginBottom: 12 }}>📅 OPTIMAL TRAVEL WINDOW</h3>
              <div style={{ background: "#F0EDFF", borderRadius: 14, padding: "16px 18px" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#2D1B69", fontFamily: "'Playfair Display', serif", marginBottom: 6 }}>
                  {plan.optimal_dates?.best_window}
                </div>
                <div style={{ fontSize: 13, color: "#6B5E8A", fontFamily: "'DM Sans', sans-serif", marginBottom: 6 }}>{plan.optimal_dates?.reasoning}</div>
                <div style={{ fontSize: 12, color: "#8B7FC8", fontFamily: "'DM Sans', sans-serif" }}>💰 {plan.optimal_dates?.price_insight}</div>
              </div>
            </section>

            <section style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#5B3FF8", fontFamily: "'DM Sans', sans-serif", letterSpacing: 1, marginBottom: 12 }}>✈ FLIGHT OPTIONS</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(plan.flights || []).map((f, i) => (
                  <div key={i} style={{ background: "#FAF8F5", borderRadius: 12, padding: "14px 16px", border: "1px solid #EDE8E3" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, color: "#2D1B69", fontFamily: "'DM Sans', sans-serif" }}>{f.type}</span>
                      <span style={{ fontWeight: 700, color: "#5B3FF8", fontFamily: "'DM Sans', sans-serif" }}>{f.price_range}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#6B7280", fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>
                      {f.duration} · {(f.airlines || []).join(", ")}
                    </div>
                    <div style={{ fontSize: 12, color: "#8B6FCB", fontFamily: "'DM Sans', sans-serif" }}>💡 {f.tip}</div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#5B3FF8", fontFamily: "'DM Sans', sans-serif", letterSpacing: 1, marginBottom: 12 }}>🏘 WHERE TO STAY</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(plan.neighbourhoods || []).map((n, i) => (
                  <div key={i} style={{ background: "#FAF8F5", borderRadius: 12, padding: "14px 16px", border: "1px solid #EDE8E3" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: "#2D1B69", fontFamily: "'DM Sans', sans-serif" }}>{n.name}</span>
                      <span style={{ background: "#E8F5E9", color: "#2E7D32", borderRadius: 100, padding: "2px 8px", fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{n.price_level}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "#6B5E8A", fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>{n.vibe}</div>
                    <div style={{ fontSize: 12, color: "#8B7D6B", fontFamily: "'DM Sans', sans-serif" }}>✓ Stay here if: {n.stay_here_if}</div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#5B3FF8", fontFamily: "'DM Sans', sans-serif", letterSpacing: 1, marginBottom: 12 }}>🗺 SAMPLE ITINERARY</h3>
              {(plan.itinerary || []).map((day) => (
                <div key={day.day} style={{ marginBottom: 16, background: "#FAF8F5", borderRadius: 14, overflow: "hidden", border: "1px solid #EDE8E3" }}>
                  <div style={{ background: "#5B3FF8", padding: "10px 16px" }}>
                    <span style={{ fontWeight: 700, color: "white", fontFamily: "'DM Sans', sans-serif" }}>Day {day.day}: </span>
                    <span style={{ color: "rgba(255,255,255,0.9)", fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>{day.theme}</span>
                  </div>
                  <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                    {["morning", "afternoon", "evening"].map((period) => (
                      <div key={period} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#8B6FCB", fontFamily: "'DM Sans', sans-serif", minWidth: 64, paddingTop: 1 }}>
                          {period === "morning" ? "🌅 AM" : period === "afternoon" ? "☀️ PM" : "🌙 EVE"}
                        </span>
                        <span style={{ fontSize: 13, color: "#4B3F6B", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>{day[period]}</span>
                      </div>
                    ))}
                    {day.tip && (
                      <div style={{ background: "#E8D5FF", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#6B35C8", fontFamily: "'DM Sans', sans-serif" }}>
                        💡 Local tip: {day.tip}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </section>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {plan.hidden_gem && (
                <div style={{ background: "linear-gradient(135deg, #1a1a2e, #16213e)", borderRadius: 14, padding: "16px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#A78BFA", fontFamily: "'DM Sans', sans-serif", marginBottom: 6 }}>🔮 HIDDEN GEM</div>
                  <div style={{ fontSize: 13, color: "#E2D9F3", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>{plan.hidden_gem}</div>
                </div>
              )}
              {plan.packing_note && (
                <div style={{ background: "#FFF8E7", borderRadius: 14, padding: "16px", border: "1px solid #FDE68A" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#D97706", fontFamily: "'DM Sans', sans-serif", marginBottom: 6 }}>🎒 PACK THIS</div>
                  <div style={{ fontSize: 13, color: "#78350F", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>{plan.packing_note}</div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  </div>
);

export default TripPlanPanel;
