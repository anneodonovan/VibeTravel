import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { callAI, parseJSON } from "./api";
import { MOOD_PRESETS } from "./constants";
import Spinner from "./components/Spinner";
import MoodSlider from "./components/MoodSlider";
import DestinationCard from "./components/DestinationCard";
import IntentBadge from "./components/IntentBadge";
import ExplainModal from "./components/ExplainModal";
import TripPlanPanel from "./components/TripPlanPanel";

// Generate stars once, not on every render
const useStars = (count) =>
  useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: Math.random() > 0.8 ? 3 : 2,
        opacity: Math.random() * 0.6 + 0.1,
        duration: `${2 + Math.random() * 3}s`,
        delay: `${Math.random() * 3}s`,
      })),
    [count]
  );

export default function App() {
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
  const stars = useStars(60);

  const handleSearch = useCallback(
    async (searchQuery, isRefinement = false) => {
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
    },
    [conversationHistory, showSliders, sliders]
  );

  const handleExplain = useCallback(
    async (dest) => {
      setExplaining(dest);
      setExplanation(null);
      setExplainLoading(true);

      const intentContext = intent
        ? `The user's intent: ${intent.summary}. Emotional drivers: ${(intent.emotional_drivers || []).join(", ")}.`
        : "";
      const msg = `Explain why ${dest.name} was recommended. ${intentContext} Use MODE 3.`;

      try {
        const text = await callAI([...conversationHistory, { role: "user", content: msg }]);
        const parsed = parseJSON(text);
        setExplanation(parsed.explanation);
      } catch {
        setExplanation({
          primary_match: "Could not load explanation.",
          emotional_fit: "", practical_fit: "",
          honest_assessment: "", who_loves_it: "", who_struggles: "",
        });
      } finally {
        setExplainLoading(false);
      }
    },
    [conversationHistory, intent]
  );

  const handlePlanTrip = useCallback(
    async (dest) => {
      setSelectedDest(dest);
      setTripPlan(null);
      setPlanLoading(true);

      const intentContext = intent ? ` Traveller intent: ${intent.summary}.` : "";
      const msg = `Plan a trip to ${dest.name}.${intentContext} Use MODE 2.`;

      try {
        const text = await callAI([...conversationHistory, { role: "user", content: msg }]);
        const parsed = parseJSON(text);
        setTripPlan(parsed);
      } catch {
        setTripPlan({ error: "Could not generate plan." });
      } finally {
        setPlanLoading(false);
      }
    },
    [conversationHistory, intent]
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0F0A2E 0%, #1A0E4A 40%, #0D1B3E 100%)",
      fontFamily: "'DM Sans', sans-serif",
      color: "#F0ECFF",
    }}>
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <style>{`@keyframes twinkle { 0%,100% { opacity:0.1; } 50% { opacity:0.6; } }`}</style>
        {stars.map((s) => (
          <div key={s.id} style={{
            position: "absolute",
            left: s.left, top: s.top,
            width: s.size, height: s.size,
            borderRadius: "50%",
            background: "white",
            opacity: s.opacity,
            animation: `twinkle ${s.duration} ease-in-out infinite`,
            animationDelay: s.delay,
          }} />
        ))}
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "0 20px 80px" }}>

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

          {showSliders && (
            <div style={{
              background: "rgba(255,255,255,0.08)", borderRadius: 16,
              padding: "20px 24px", marginTop: 16, border: "1px solid rgba(255,255,255,0.15)",
              animation: "fadeSlideUp 0.3s ease",
              textAlign: "left",
            }}>
              <style>{`@keyframes fadeSlideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`}</style>
              <MoodSlider label="Energy" value={sliders.energy} onChange={(v) => setSliders((s) => ({ ...s, energy: v }))} leftLabel="Chilled" rightLabel="High energy" />
              <MoodSlider label="Spontaneity" value={sliders.spontaneity} onChange={(v) => setSliders((s) => ({ ...s, spontaneity: v }))} leftLabel="Planned" rightLabel="Spontaneous" />
              <MoodSlider label="Social" value={sliders.social} onChange={(v) => setSliders((s) => ({ ...s, social: v }))} leftLabel="Solitude" rightLabel="Social" />
            </div>
          )}

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

        {error && (
          <div style={{ background: "#FEE2E2", borderRadius: 12, padding: "14px 18px", marginBottom: 24, color: "#DC2626", fontFamily: "'DM Sans', sans-serif" }}>
            ⚠️ {error}
          </div>
        )}

        {intent && <IntentBadge intent={intent} />}

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
                {["Make it cheaper", "Less humid", "More adventure", "Quieter crowds", "Better food scene"].map((s) => (
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
