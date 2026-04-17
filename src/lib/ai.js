// ─── AI Service Layer ───────────────────────────────────────────────────────
// All Anthropic API calls are routed through this module.
// In production, these calls should go through your own backend proxy
// to avoid exposing API keys. See README for setup instructions.

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

const SYSTEM_PROMPT = `Je bent de Waardenkompas-begeleider: een warme, empathische AI die mensen helpt hun eigen waarden, voorkeuren en identiteit te ontdekken. 

KERNPRINCIPES:
- De gebruiker is altijd de autoriteit over zichzelf
- Er is geen goed of fout
- Je helpt eerste impulsen vangen, versterken en toepassen
- Je onderscheidt eigen gevoel van externe invloed
- Je toon is rustig, uitnodigend en oordeelvrij
- Je schrijft in het Nederlands, helder en warm
- Je gebruikt NOOIT em-dashes

STIJL:
- Korte, krachtige zinnen
- Persoonlijk en direct ("je", "jij")
- Geen jargon, geen therapietaal
- Wel: zachte observaties, patronen benoemen, ruimte laten
- Gebruik af en toe metaforen uit de natuur (kompas, pad, wortels, stroming)`;

function getHeaders() {
  const headers = { "Content-Type": "application/json" };
  // When using the Anthropic API directly from an artifact or Claude-in-Claude,
  // the API key is injected automatically. For standalone deployment,
  // route through your own /api/chat proxy instead.
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (apiKey) {
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";
    // NOTE: anthropic-dangerous-direct-browser-access is required when
    // calling the Anthropic API directly from a browser for development.
    // In production, always use a backend proxy.
    headers["anthropic-dangerous-direct-browser-access"] = "true";
  }
  return headers;
}

export async function callAI(userPrompt, systemAddition = "") {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        system: SYSTEM_PROMPT + (systemAddition ? "\n\n" + systemAddition : ""),
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      console.error("AI response error:", response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    return text || null;
  } catch (err) {
    console.error("AI call failed:", err);
    return null;
  }
}

export async function callAIJson(userPrompt, systemAddition = "") {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        system:
          SYSTEM_PROMPT +
          "\n\nANTWOORD ALLEEN MET VALIDE JSON. Geen tekst ervoor of erna, geen markdown backticks." +
          (systemAddition ? "\n\n" + systemAddition : ""),
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      console.error("AI JSON response error:", response.status);
      return null;
    }

    const data = await response.json();
    const raw = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("AI JSON call failed:", err);
    return null;
  }
}
