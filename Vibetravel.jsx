import { useState, useRef, useEffect, useCallback } from "react";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

const SYSTEM_PROMPT = `You are VibeTravel, an elite AI travel discovery engine for Skyscanner. You understand traveller intent deeply — not just facts, but emotions, vibes, and hidden desires.

You have two main modes:

## MODE 1: INTENT PARSING + RECOMMENDATIONS
When given a natural language travel query or refinement, respond with ONLY valid JSON (no markdown, no backticks, no explanation) in this exact structure:

{
  "intent": {
    "hard_constraints": {
      "budget_range": "e.g. budget/mid-range/luxury or specific amount",
      "origin": "city/airport if mentioned, else null",
      "duration": "e.g. 1 week, weekend, null if not mentioned",
      "dates": "specific dates or time of year if mentioned, else null",
      "flight_max_hours": null
    },
    "soft_preferences": {
      "vibe": ["array of vibes e.g. relaxed, adventurous, cultural, romantic, party, nature, urban, coastal"],
      "climate": "warm/cold/mild/tropical/dry/null",
      "crowd_tolerance": "low/medium/high",
      "food_focus": ["e.g. street food, fine dining, local cuisine, vegan"],
      "sustainability": true/false/null,
      "safety_priority": "low/medium/high"
    },
    "emotional_drivers": ["e.g. escape, celebration, reset, curiosity, connection, adventure, healing, romance"],
    "traveller_type": "solo/couple/family/group/null",
    "summary": "one sentence poetic summary of what this traveller truly seeks"
  },
  "destinations": [
    {
      "id": "unique-id",
      "name": "City, Country",
      "tagline": "Short evocative tagline under 8 words",
      "micro_story": "2-3 sentence vivid narrative about the destination's soul, written poetically",
      "match_score": 92,
      "match_reasons": ["specific reason it matches their intent", "another specific reason"],
      "trade_offs": ["honest trade-off e.g. can be crowded in summer", "another trade-off"],
      "estimated_flight_price": "£X–£Y return",
      "flight_hours": "Xh direct / Xh with stop",
      "best_months": ["Month1", "Month2", "Month3"],
      "climate_summary": "Short climate description",
      "crowd_level": "low/medium/high",
      "safety_score": 8.5,
      "vibe_tags": ["tag1", "tag2", "tag3", "tag4"],
      "neighbourhoods": [
        {"name": "Neighbourhood Name", "description": "One sentence why it's great for this traveller"}
      ],
      "emoji": "single relevant emoji",
      "image_color": "a CSS hex color that evokes the destination's mood (avoid pure white/black)",
      "image_gradient": "CSS gradient string using 2-3 colors that capture the destination e.g. linear-gradient(135deg, #FF6B35, #F7C59F)"
    }
  ]
}

Always return 3-5 destinations. Make them genuinely diverse — different continents, price points, vibes. Be specific and opinionated. Capture the emotional truth of each place.

## MODE 2: TRIP PLANNING
When asked to plan a trip to a specific destination, respond with ONLY valid JSON:

{
  "destination": "City, Country",
  "optimal_dates": {
    "best_window": "Month range",
    "reasoning": "Why these dates work (weather + price)",
    "price_insight": "Price trend description"
  },
  "flights": [
    {
      "type": "Direct / 1 stop",
      "duration": "Xh Xm",
      "price_range": "£X–£Y",
      "airlines": ["Airline1", "Airline2"],
      "tip": "Booking tip"
    }
  ],
  "neighbourhoods": [
    {
      "name": "Name",
      "vibe": "Short vibe description",
      "best_for": "Who this suits",
      "stay_here_if": "Specific reason",
      "price_level": "budget/mid/luxury"
    }
  ],
  "itinerary": [
    {
      "day": 1,
      "theme": "Day theme",
      "morning": "Morning activity with specific detail",
      "afternoon": "Afternoon activity with specific detail",
      "evening": "Evening activity with specific detail",
      "tip": "Local insider tip"
    }
  ],
  "packing_note": "One essential thing to pack or know",
  "hidden_gem": "One truly off-the-beaten-path suggestion"
}

## MODE 3: EXPLANATION
When asked to explain why a specific destination was recommended, respond with ONLY valid JSON:
{
  "destination": "Name",
  "explanation": {
    "primary_match": "Main reason it matches their intent",
    "emotional_fit": "How it addresses their emotional drivers",
    "practical_fit": "How constraints align",
    "honest_assessment": "Balanced honest view",
    "who_loves_it": "Type of traveller who thrives here",
    "who_struggles": "Type of traveller who might not enjoy it"
  }
}

Always be honest, specific, and empowering. Never be generic.`;

// ─── Mock data for visual richness ────────────────────────────────────────────
const MOOD_PRESETS = [
  { label: "I need to escape everything", icon: "🌊" },
  { label: "Romantic city break, 5 days", icon: "❤️" },
  { label: "Adventure on a budget", icon: "🎒" },
  { label: "Solo trip, good food + culture", icon: "🍜" },
  { label: "Family holiday, not too hot", icon: "👨‍👩‍👧" },
  { label: "Digital nomad, great wifi + cafés", icon: "💻" },
];

const callAI = async (messages, onChunk) => {
  const response = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages,
    }),
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  const data = await response.json();
  const text = data.content?.[0]?.text || "";
  return text;
};

const parseJSON = (text) => {
  try {
    const clean = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Could not parse response");
  }
};

// ─── Components ───────────────────────────────────────────────────────────────
const Spinner = () => (
  <div style={{ display: "inline-block", width: 20, height: 20 }}>
    <svg viewBox="0 0 24 24" style={{ animation: "spin 1s linear infinite", width: "100%", height: "100%" }}>
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
    </svg>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

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

      {/* Hero gradient */}
      <div style={{
        height: 140,
        background: dest.image_gradient || `linear-gradient(135deg, #5B3FF8, #A78BFA)`,
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
          {(dest.vibe_tags || []).slice(0, 4).map(tag => (
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

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
          {[
            { label: "Flight", value: dest.estimated_flight_price },
            { label: "Duration", value: dest.flight_hours },
            { label: "Best time", value: (dest.best_months || []).slice(0,2).join("–") },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: "#FAF8F5", borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#A09080", fontFamily: "'DM Sans', sans-serif", marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#2D1B69", fontFamily: "'DM Sans', sans-serif" }}>{value || "—"}</div>
            </div>
          ))}
        </div>

        {/* Match reasons */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#22C55E", marginBottom: 6, fontFamily: "'DM Sans', sans-serif", letterSpacing: 0.5 }}>
            ✓ WHY IT MATCHES
          </div>
          {(dest.match_reasons || []).slice(0, 2).map((r, i) => (
            <div key={i} style={{ fontSize: 12, color: "#4B5563", marginBottom: 3, fontFamily: "'DM Sans', sans-serif" }}>
              • {r}
            </div>
          ))}
        </div>

        {/* Trade-offs */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B", marginBottom: 6, fontFamily: "'DM Sans', sans-serif", letterSpacing: 0.5 }}>
            ⚖ TRADE-OFFS
          </div>
          {(dest.trade_offs || []).slice(0, 2).map((t, i) => (
            <div key={i} style={{ fontSize: 12, color: "#6B7280", marginBottom: 3, fontFamily: "'DM Sans', sans-serif" }}>
              • {t}
            </div>
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
        {(intent.emotional_drivers || []).map(d => (
          <span key={d} style={{ background: "#E8D5FF", color: "#6B35C8", borderRadius: 100, padding: "2px 10px", fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
            {d}
          </span>
        ))}
        {(intent.soft_preferences?.vibe || []).map(v => (
          <span key={v} style={{ background: "#DBEAFE", color: "#1D4ED8", borderRadius: 100, padding: "2px 10px", fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
            {v}
          </span>
        ))}
      </div>
    </div>
  );
};

const ExplainModal = ({ dest, explanation, onClose, loading }) => (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(15,8,40,0.7)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000, padding: 20,
    animation: "fadeIn 0.2s ease",
  }}>
    <style>{`@keyframes fadeIn { from { opacity:0; } to { opacity:1; } }`}</style>
    <div style={{
      background: "white", borderRadius: 24, padding: 32,
      maxWidth: 520, width: "100%",
      boxShadow: "0 40px 80px rgba(0,0,0,0.3)",
      animation: "slideUp 0.3s cubic-bezier(0.4,0,0.2,1)",
    }}>
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
        <button onClick={onClose} style={{ background: "#F5F0FF", border: "none", borderRadius: 50, width: 36, height: 36, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
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

const TripPlanPanel = ({ dest, plan, loading, onClose }) => (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(15,8,40,0.7)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000, padding: 20, overflowY: "auto",
  }}>
    <div style={{
      background: "white", borderRadius: 24,
      maxWidth: 640, width: "100%",
      boxShadow: "0 40px 80px rgba(0,0,0,0.3)",
      maxHeight: "90vh", overflowY: "auto",
      animation: "slideUp 0.3s cubic-bezier(0.4,0,0.2,1)",
    }}>
      <div style={{
        position: "sticky", top: 0, background: dest?.image_gradient || "linear-gradient(135deg, #5B3FF8, #A78BFA)",
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
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 50, width: 36, height: 36, cursor: "pointer", fontSize: 18, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
      </div>

      <div style={{ padding: "28px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spinner />
            <div style={{ marginTop: 12, color: "#8B7D6B", fontFamily: "'DM Sans', sans-serif" }}>Planning your perfect trip...</div>
          </div>
        ) : plan ? (
          <div>
            {/* Optimal dates */}
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

            {/* Flights */}
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

            {/* Neighbourhoods */}
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

            {/* Itinerary */}
            <section style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#5B3FF8", fontFamily: "'DM Sans', sans-serif", letterSpacing: 1, marginBottom: 12 }}>🗺 SAMPLE ITINERARY</h3>
              {(plan.itinerary || []).map((day) => (
                <div key={day.day} style={{ marginBottom: 16, background: "#FAF8F5", borderRadius: 14, overflow: "hidden", border: "1px solid #EDE8E3" }}>
                  <div style={{ background: "#5B3FF8", padding: "10px 16px" }}>
                    <span style={{ fontWeight: 700, color: "white", fontFamily: "'DM Sans', sans-serif" }}>Day {day.day}: </span>
                    <span style={{ color: "rgba(255,255,255,0.9)", fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>{day.theme}</span>
                  </div>
                  <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                    {["morning", "afternoon", "evening"].map(period => (
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

            {/* Gems */}
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

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function VibeTravel() {
  const [query, setQuery] = useState("");
  const [conversationHistory, setConversationHistory] = useState([]);
  const [intent, setIntent] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [selectedDest, setSelectedDest] = useState(null);
  const [explaining, setExplaining] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [tripPlan, setTripPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [explainLoading, setExplainLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSliders, setShowSliders] = useState(false);
  const [sliders, setSliders] = useState({ energy: 50, spontaneity: 50, social: 50 });
  const [refinementQuery, setRefinementQuery] = useState("");
  const inputRef = useRef(null);

  const handleSearch = useCallback(async (searchQuery, isRefinement = false) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);

    const sliderContext = showSliders
      ? ` (mood calibration — energy: ${sliders.energy}%, spontaneity: ${sliders.spontaneity}%, social preference: ${sliders.social}%)`
      : "";

    const userMessage = isRefinement
      ? `Refine the previous recommendations: "${searchQuery}"${sliderContext}`
      : `Find travel destinations for: "${searchQuery}"${sliderContext}`;

    const newHistory = [...conversationHistory, { role: "user", content: userMessage }];

    try {
      const text = await callAI(newHistory);
      const parsed = parseJSON(text);

      setConversationHistory([...newHistory, { role: "assistant", content: text }]);

      if (parsed.intent) setIntent(parsed.intent);
      if (parsed.destinations) setDestinations(parsed.destinations);
      if (isRefinement) setRefinementQuery("");
    } catch (e) {
      setError("Something went wrong. Please try a different query.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [conversationHistory, showSliders, sliders]);

  const handleExplain = useCallback(async (dest) => {
    setExplaining(dest);
    setExplanation(null);
    setExplainLoading(true);

    const intentContext = intent ? `The user's intent: ${intent.summary}. Emotional drivers: ${(intent.emotional_drivers || []).join(", ")}.` : "";
    const msg = `Explain why ${dest.name} was recommended. ${intentContext} Use MODE 3.`;

    try {
      const text = await callAI([...conversationHistory, { role: "user", content: msg }]);
      const parsed = parseJSON(text);
      setExplanation(parsed.explanation);
    } catch (e) {
      setExplanation({ primary_match: "Could not load explanation.", emotional_fit: "", practical_fit: "", honest_assessment: "", who_loves_it: "", who_struggles: "" });
    } finally {
      setExplainLoading(false);
    }
  }, [conversationHistory, intent]);

  const handlePlanTrip = useCallback(async (dest) => {
    setSelectedDest(dest);
    setTripPlan(null);
    setPlanLoading(true);

    const intentContext = intent ? ` Traveller intent: ${intent.summary}.` : "";
    const msg = `Plan a trip to ${dest.name}.${intentContext} Use MODE 2.`;

    try {
      const text = await callAI([...conversationHistory, { role: "user", content: msg }]);
      const parsed = parseJSON(text);
      setTripPlan(parsed);
    } catch (e) {
      setTripPlan({ error: "Could not generate plan." });
    } finally {
      setPlanLoading(false);
    }
  }, [conversationHistory, intent]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0F0A2E 0%, #1A0E4A 40%, #0D1B3E 100%)",
      fontFamily: "'DM Sans', sans-serif",
      color: "#F0ECFF",
    }}>
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* Stars background */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        {Array.from({ length: 60 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: Math.random() > 0.8 ? 3 : 2,
            height: Math.random() > 0.8 ? 3 : 2,
            borderRadius: "50%",
            background: "white",
            opacity: Math.random() * 0.6 + 0.1,
            animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
          }} />
        ))}
        <style>{`@keyframes twinkle { 0%,100% { opacity:0.1; } 50% { opacity:0.6; } }`}</style>
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "0 20px 80px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", paddingTop: 60, paddingBottom: 40 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "rgba(255,255,255,0.08)", borderRadius: 100,
            padding: "6px 16px 6px 12px", marginBottom: 20,
            border: "1px solid rgba(255,255,255,0.15)",
          }}>
            <div style={{ background: "#5B3FF8", borderRadius: 50, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✦</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)", letterSpacing: 0.5 }}>SKYSCANNER VIBETRAVEL</span>
          </div>

          <h1 style={{
            fontSize: "clamp(36px, 6vw, 64px)",
            fontFamily: "'Playfair Display', serif",
            fontWeight: 400,
            margin: "0 0 16px",
            lineHeight: 1.15,
            background: "linear-gradient(135deg, #FFFFFF 30%, #A78BFA 70%, #60A5FA 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Where does your<br />heart want to go?
          </h1>

          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.55)", maxWidth: 440, margin: "0 auto 40px", lineHeight: 1.6, fontWeight: 300 }}>
            Describe your dream trip in your own words. We'll understand what you truly need.
          </p>

          {/* Search bar */}
          <div style={{
            background: "rgba(255,255,255,0.95)",
            borderRadius: 20, padding: "6px 6px 6px 24px",
            display: "flex", alignItems: "center", gap: 12,
            boxShadow: "0 20px 60px rgba(91,63,248,0.3)",
            border: "1px solid rgba(255,255,255,0.5)",
          }}>
            <span style={{ fontSize: 20 }}>🔍</span>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
              placeholder="e.g. 'A warm romantic escape under €1500, not too touristy…'"
              style={{
                flex: 1, border: "none", background: "transparent",
                fontSize: 16, color: "#2D1B69", outline: "none",
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
            <button
              onClick={() => handleSearch(query)}
              disabled={loading || !query.trim()}
              style={{
                background: loading ? "#C4B5FD" : "linear-gradient(135deg, #5B3FF8, #8B5CF6)",
                color: "white", border: "none", borderRadius: 14,
                padding: "12px 24px", fontSize: 15, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 8,
                transition: "all 0.2s", whiteSpace: "nowrap",
              }}
            >
              {loading ? <><Spinner /> Finding...</> : "Discover →"}
            </button>
          </div>

          {/* Mood toggle */}
          <button
            onClick={() => setShowSliders(!showSliders)}
            style={{
              marginTop: 16, background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)", borderRadius: 100,
              color: "rgba(255,255,255,0.8)", padding: "8px 20px",
              fontSize: 13, cursor: "pointer", transition: "all 0.2s",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {showSliders ? "▲ Hide" : "▼ Calibrate"} mood sliders
          </button>

          {/* Sliders */}
          {showSliders && (
            <div style={{
              background: "rgba(255,255,255,0.08)", borderRadius: 16,
              padding: "20px 24px", marginTop: 16, border: "1px solid rgba(255,255,255,0.15)",
              animation: "fadeSlideUp 0.3s ease",
              textAlign: "left",
            }}>
              <MoodSlider label="Energy" value={sliders.energy} onChange={v => setSliders(s => ({ ...s, energy: v }))} leftLabel="Chilled" rightLabel="High energy" />
              <MoodSlider label="Spontaneity" value={sliders.spontaneity} onChange={v => setSliders(s => ({ ...s, spontaneity: v }))} leftLabel="Planned" rightLabel="Spontaneous" />
              <MoodSlider label="Social" value={sliders.social} onChange={v => setSliders(s => ({ ...s, social: v }))} leftLabel="Solitude" rightLabel="Social" />
            </div>
          )}

          {/* Preset chips */}
          {destinations.length === 0 && (
            <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
              {MOOD_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => { setQuery(p.label); handleSearch(p.label); }}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 100, padding: "8px 16px",
                    color: "rgba(255,255,255,0.8)", fontSize: 13,
                    cursor: "pointer", transition: "all 0.2s",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "#FEE2E2", borderRadius: 12, padding: "14px 18px", marginBottom: 24, color: "#DC2626", fontFamily: "'DM Sans', sans-serif" }}>
            ⚠️ {error}
          </div>
        )}

        {/* Intent badge */}
        {intent && <IntentBadge intent={intent} />}

        {/* Results */}
        {destinations.length > 0 && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontFamily: "'Playfair Display', serif", color: "white" }}>
                {destinations.length} destinations found
              </h2>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontFamily: "'DM Sans', sans-serif" }}>
                Ranked by match score
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20, marginBottom: 32 }}>
              {destinations.map((dest, i) => (
                <DestinationCard
                  key={dest.id || dest.name}
                  dest={dest}
                  onSelect={handlePlanTrip}
                  onExplain={handleExplain}
                  isSelected={selectedDest?.name === dest.name}
                  delay={i * 80}
                />
              ))}
            </div>

            {/* Refinement bar */}
            <div style={{
              background: "rgba(255,255,255,0.06)", borderRadius: 16,
              padding: "20px 24px", border: "1px solid rgba(255,255,255,0.12)",
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 12, fontFamily: "'DM Sans', sans-serif", letterSpacing: 0.5 }}>
                💬 REFINE YOUR SEARCH
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  value={refinementQuery}
                  onChange={(e) => setRefinementQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch(refinementQuery, true)}
                  placeholder="e.g. 'Make it cheaper' · 'More nature' · 'Better for solo travel'"
                  style={{
                    flex: 1, background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12,
                    padding: "10px 16px", color: "white", fontSize: 14,
                    outline: "none", fontFamily: "'DM Sans', sans-serif",
                  }}
                />
                <button
                  onClick={() => handleSearch(refinementQuery, true)}
                  disabled={loading || !refinementQuery.trim()}
                  style={{
                    background: "#5B3FF8", color: "white", border: "none",
                    borderRadius: 12, padding: "10px 20px", fontSize: 14,
                    fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {loading ? <Spinner /> : "Refine →"}
                </button>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                {["Make it cheaper", "Less humid", "More adventure", "Quieter crowds", "Better food scene"].map(s => (
                  <button key={s} onClick={() => handleSearch(s, true)} style={{
                    background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 100, padding: "5px 12px", color: "rgba(255,255,255,0.7)",
                    fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  }}>{s}</button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {explaining && (
        <ExplainModal
          dest={explaining}
          explanation={explanation}
          loading={explainLoading}
          onClose={() => { setExplaining(null); setExplanation(null); }}
        />
      )}

      {selectedDest && (
        <TripPlanPanel
          dest={selectedDest}
          plan={tripPlan}
          loading={planLoading}
          onClose={() => { setSelectedDest(null); setTripPlan(null); }}
        />
      )}
    </div>
  );
}