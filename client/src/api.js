export const callAI = async (messages) => {
  const response = await fetch("/api/travel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  const data = await response.json();
  return data.text;
};

export const parseJSON = (text) => {
  try {
    const clean = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Could not parse response");
  }
};
