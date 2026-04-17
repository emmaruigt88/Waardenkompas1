import { useState, useEffect, useCallback, useRef } from "react";
import { callAI, callAIJson } from "./lib/ai.js";
import { loadData, saveData } from "./lib/storage.js";
import { gatherAllContext } from "./lib/context.js";
import { MODULES as MODULES_DATA, KOMPAS_QUESTIONS as KOMPAS_DATA } from "./data/modules.js";
import { fonts, colors } from "./lib/theme.js";

const MODULES = MODULES_DATA;
const KOMPAS_QUESTIONS = KOMPAS_DATA;

// ─── Shared UI Components ───────────────────────────────────────────────────

function FadeIn({ children, delay = 0, className = "" }) {
  const [v, setV] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setV(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div
      className={className}
      style={{
        opacity: v ? 1 : 0,
        transform: v ? "translateY(0)" : "translateY(18px)",
        transition: "opacity 0.7s ease, transform 0.7s ease",
      }}
    >
      {children}
    </div>
  );
}

function TextArea({ value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: "100%",
        padding: "16px 18px",
        border: `1.5px solid ${colors.border}`,
        borderRadius: "14px",
        fontSize: "15px",
        lineHeight: "1.7",
        fontFamily: fonts.serif,
        background: "rgba(255,252,247,0.7)",
        color: colors.ink,
        resize: "vertical",
        outline: "none",
        transition: "border-color 0.3s, box-shadow 0.3s",
        boxSizing: "border-box",
      }}
      onFocus={(e) => {
        e.target.style.borderColor = colors.muted;
        e.target.style.boxShadow = `0 0 0 3px rgba(139,125,107,0.12)`;
      }}
      onBlur={(e) => {
        e.target.style.borderColor = colors.border;
        e.target.style.boxShadow = "none";
      }}
    />
  );
}

function Button({ children, onClick, variant = "primary", style = {}, disabled = false }) {
  const base = {
    padding: variant === "small" ? "8px 16px" : "13px 28px",
    borderRadius: "12px",
    fontSize: variant === "small" ? "13px" : "15px",
    fontFamily: fonts.sans,
    fontWeight: 500,
    cursor: disabled ? "default" : "pointer",
    border: "none",
    transition: "all 0.25s ease",
    opacity: disabled ? 0.45 : 1,
    letterSpacing: "0.01em",
  };
  const vs = {
    primary: { background: `linear-gradient(135deg, ${colors.green}, ${colors.greenDark})`, color: "#fff", boxShadow: `0 2px 12px rgba(91,140,90,0.25)` },
    secondary: { background: `rgba(139,125,107,0.1)`, color: "#5C4E3C", border: `1.5px solid ${colors.border}` },
    ghost: { background: "transparent", color: colors.muted },
    small: { background: "rgba(139,125,107,0.08)", color: "#6B5D4E" },
    ai: { background: `linear-gradient(135deg, #7B68A8, #5B5A9E)`, color: "#fff", boxShadow: "0 2px 12px rgba(123,104,168,0.3)" },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...vs[variant], ...style }}
      onMouseEnter={(e) => { if (!disabled) e.target.style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { e.target.style.transform = "translateY(0)"; }}
    >
      {children}
    </button>
  );
}

function Card({ children, style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff",
        borderRadius: "18px",
        padding: "24px",
        boxShadow: "0 1px 8px rgba(61,52,39,0.05)",
        border: "1px solid rgba(212,201,184,0.5)",
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.2s, box-shadow 0.2s",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(61,52,39,0.1)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 1px 8px rgba(61,52,39,0.05)";
      }}
    >
      {children}
    </div>
  );
}

function ProgressDots({ total, current }) {
  return (
    <div style={{ display: "flex", gap: "8px", justifyContent: "center", margin: "20px 0" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ width: i === current ? "24px" : "8px", height: "8px", borderRadius: "4px", background: i <= current ? colors.green : colors.border, transition: "all 0.4s ease" }} />
      ))}
    </div>
  );
}

function BackButton({ onClick }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", fontFamily: fonts.sans, fontSize: "14px", color: colors.muted, cursor: "pointer", padding: "8px 0", marginBottom: "16px" }}>
      ← Terug
    </button>
  );
}

function AIBadge() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "8px", background: "linear-gradient(135deg, #7B68A815, #5B5A9E15)", fontSize: "10px", fontFamily: fonts.sans, fontWeight: 600, color: "#7B68A8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
      <span style={{ fontSize: "11px" }}>✧</span> AI-inzicht
    </span>
  );
}

function LoadingPulse({ text = "Even nadenken..." }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginBottom: "16px" }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: "10px", height: "10px", borderRadius: "50%", background: "linear-gradient(135deg, #7B68A8, #5B5A9E)", animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
      <p style={{ fontFamily: fonts.serif, fontSize: "14px", color: colors.muted }}>{text}</p>
      <style>{`@keyframes pulse { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  );
}

function AICard({ children, style = {} }) {
  return (
    <Card style={{ background: "linear-gradient(135deg, #F8F5FF 0%, #F2F0FA 50%, #EDF2F0 100%)", border: "1.5px solid rgba(123,104,168,0.15)", ...style }}>
      {children}
    </Card>
  );
}

// ─── Welcome ────────────────────────────────────────────────────────────────

function WelcomePage({ onStart }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "40px 24px", textAlign: "center" }}>
      <FadeIn delay={200}><div style={{ fontSize: "64px", marginBottom: "24px" }}>🧭</div></FadeIn>
      <FadeIn delay={500}>
        <h1 style={{ fontFamily: fonts.serif, fontSize: "32px", fontWeight: 600, color: colors.ink, marginBottom: "12px", letterSpacing: "-0.02em" }}>Waardenkompas</h1>
      </FadeIn>
      <FadeIn delay={700}>
        <p style={{ fontFamily: fonts.serif, fontSize: "17px", color: colors.muted, maxWidth: "340px", lineHeight: "1.7", marginBottom: "48px" }}>
          Een rustige plek om te ontdekken wat jij eigenlijk voelt, wilt en kiest. Zonder oordeel. Jij bent de autoriteit.
        </p>
      </FadeIn>
      <FadeIn delay={1000}><Button onClick={onStart}>Begin je ontdekking</Button></FadeIn>
      <FadeIn delay={1300}>
        <p style={{ fontSize: "13px", color: colors.faint, marginTop: "32px", maxWidth: "280px", lineHeight: "1.6" }}>
          Je antwoorden blijven privé op jouw apparaat. AI-analyse verwerkt je data alleen op het moment zelf.
        </p>
      </FadeIn>
    </div>
  );
}

// ─── Onboarding ─────────────────────────────────────────────────────────────

function OnboardingPage({ data, setData, onComplete }) {
  const [moduleIdx, setModuleIdx] = useState(0);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [showIntro, setShowIntro] = useState(true);

  const mod = MODULES[moduleIdx];
  const q = mod.questions[questionIdx];
  const answerKey = q.id;
  const currentAnswer = data.answers[answerKey] || "";
  const totalQ = MODULES.reduce((s, m) => s + m.questions.length, 0);
  const globalIdx = MODULES.slice(0, moduleIdx).reduce((s, m) => s + m.questions.length, 0) + questionIdx;

  function updateAnswer(val) {
    setData((prev) => { const next = { ...prev, answers: { ...prev.answers, [answerKey]: val } }; saveData(next); return next; });
  }

  function next() {
    if (questionIdx < mod.questions.length - 1) setQuestionIdx(questionIdx + 1);
    else if (moduleIdx < MODULES.length - 1) { setModuleIdx(moduleIdx + 1); setQuestionIdx(0); setShowIntro(true); }
    else { setData((prev) => { const next = { ...prev, onboardingDone: true }; saveData(next); return next; }); onComplete(); }
  }

  function prev() {
    if (showIntro && moduleIdx > 0) { setModuleIdx(moduleIdx - 1); setQuestionIdx(MODULES[moduleIdx - 1].questions.length - 1); setShowIntro(false); }
    else if (questionIdx > 0) setQuestionIdx(questionIdx - 1);
    else if (moduleIdx > 0) { setModuleIdx(moduleIdx - 1); setQuestionIdx(MODULES[moduleIdx - 1].questions.length - 1); setShowIntro(false); }
  }

  if (showIntro) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 24px" }}>
        <FadeIn key={mod.id + "-intro"}>
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "12px", fontFamily: fonts.sans, color: colors.muted, textTransform: "uppercase", letterSpacing: "0.12em" }}>Module {moduleIdx + 1} van {MODULES.length}</span>
          </div>
          <div style={{ width: "80px", height: "80px", borderRadius: "20px", background: `linear-gradient(135deg, ${mod.color}18, ${mod.color}30)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px", margin: "0 auto 24px" }}>{mod.icon}</div>
          <h2 style={{ fontFamily: fonts.serif, fontSize: "26px", color: colors.ink, textAlign: "center", marginBottom: "8px" }}>{mod.title}</h2>
          <p style={{ fontFamily: fonts.sans, fontSize: "14px", color: mod.color, textAlign: "center", marginBottom: "24px", fontWeight: 500 }}>{mod.subtitle}</p>
          <p style={{ fontFamily: fonts.serif, fontSize: "16px", color: "#6B5D4E", textAlign: "center", lineHeight: "1.75", maxWidth: "380px", margin: "0 auto 40px" }}>{mod.intro}</p>
          <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
            {moduleIdx > 0 && <Button variant="secondary" onClick={prev}>Terug</Button>}
            <Button onClick={() => setShowIntro(false)}>Ik ben er klaar voor</Button>
          </div>
        </FadeIn>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "40px 24px" }}>
      <ProgressDots total={totalQ} current={globalIdx} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: "500px", margin: "0 auto", width: "100%" }}>
        <FadeIn key={answerKey}>
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: mod.color, margin: "0 auto 20px", opacity: 0.5 }} />
          <p style={{ fontFamily: fonts.serif, fontSize: "20px", color: colors.ink, lineHeight: "1.65", textAlign: "center", marginBottom: "32px" }}>{q.prompt}</p>
          <TextArea value={currentAnswer} onChange={updateAnswer} placeholder={q.placeholder} rows={5} />
        </FadeIn>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "20px", maxWidth: "500px", margin: "0 auto", width: "100%" }}>
        <Button variant="ghost" onClick={prev}>← Vorige</Button>
        <Button onClick={next} disabled={!currentAnswer?.trim()}>
          {moduleIdx === MODULES.length - 1 && questionIdx === mod.questions.length - 1 ? "Afronden" : "Volgende →"}
        </Button>
      </div>
    </div>
  );
}

// ─── Home ───────────────────────────────────────────────────────────────────

function HomePage({ data, setPage }) {
  return (
    <div style={{ padding: "24px", maxWidth: "500px", margin: "0 auto" }}>
      <FadeIn>
        <div style={{ textAlign: "center", marginBottom: "32px", paddingTop: "12px" }}>
          <span style={{ fontSize: "36px" }}>🧭</span>
          <h1 style={{ fontFamily: fonts.serif, fontSize: "24px", color: colors.ink, marginTop: "8px", marginBottom: "4px" }}>Jouw Waardenkompas</h1>
          <p style={{ fontFamily: fonts.sans, fontSize: "13px", color: colors.muted }}>Wat voel jij vandaag?</p>
        </div>
      </FadeIn>

      <FadeIn delay={200}>
        <Card style={{ background: `linear-gradient(135deg, ${colors.warm}, #EDE7DD)`, marginBottom: "12px" }} onClick={() => setPage("impuls")}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: `linear-gradient(135deg, ${colors.amber}, #D4956B)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>✦</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: fonts.serif, fontSize: "16px", fontWeight: 600, color: colors.ink, marginBottom: "2px" }}>Vang je eerste impuls</p>
              <p style={{ fontFamily: fonts.sans, fontSize: "13px", color: colors.muted }}>Inclusief AI-reflectie op je patronen</p>
            </div>
            <AIBadge />
          </div>
        </Card>
      </FadeIn>

      <FadeIn delay={300}>
        <Card style={{ marginBottom: "12px" }} onClick={() => setPage("besliskompas")}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: `linear-gradient(135deg, ${colors.green}, ${colors.greenDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", color: "#fff", flexShrink: 0 }}>◇</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: fonts.serif, fontSize: "16px", fontWeight: 600, color: colors.ink, marginBottom: "2px" }}>Beslis-kompas</p>
              <p style={{ fontFamily: fonts.sans, fontSize: "13px", color: colors.muted }}>AI helpt je keuze verkennen</p>
            </div>
            <AIBadge />
          </div>
        </Card>
      </FadeIn>

      <FadeIn delay={400}>
        <Card style={{ marginBottom: "12px", background: "linear-gradient(135deg, #F8F5FF, #F2F0FA)" }} onClick={() => setPage("ai-gesprek")}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "linear-gradient(135deg, #7B68A8, #5B5A9E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", color: "#fff", flexShrink: 0 }}>✧</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: fonts.serif, fontSize: "16px", fontWeight: 600, color: colors.ink, marginBottom: "2px" }}>AI Verkenningsgesprek</p>
              <p style={{ fontFamily: fonts.sans, fontSize: "13px", color: colors.muted }}>Verdiep patronen in dialoog</p>
            </div>
            <AIBadge />
          </div>
        </Card>
      </FadeIn>

      <FadeIn delay={500}>
        <p style={{ fontFamily: fonts.sans, fontSize: "12px", color: colors.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "24px", marginBottom: "12px" }}>Reflectiemodules</p>
      </FadeIn>
      {MODULES.map((mod, idx) => {
        const answered = mod.questions.filter((q) => data.answers[q.id]?.trim()).length;
        return (
          <FadeIn key={mod.id} delay={600 + idx * 80}>
            <Card style={{ marginBottom: "10px", padding: "18px 20px" }} onClick={() => setPage("module-" + mod.id)}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: `${mod.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>{mod.icon}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: fonts.serif, fontSize: "15px", fontWeight: 600, color: colors.ink, marginBottom: "2px" }}>{mod.title}</p>
                  <p style={{ fontFamily: fonts.sans, fontSize: "12px", color: colors.muted }}>{mod.subtitle}</p>
                </div>
                <div style={{ fontFamily: fonts.sans, fontSize: "12px", color: answered === mod.questions.length ? colors.green : colors.faint, fontWeight: 500 }}>{answered}/{mod.questions.length}</div>
              </div>
            </Card>
          </FadeIn>
        );
      })}

      <FadeIn delay={900}>
        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          {[{ icon: "🪞", label: "AI Profiel", page: "profiel" }, { icon: "📖", label: "Tijdlijn", page: "tijdlijn" }, { icon: "🌿", label: "Leren door doen", page: "acties" }].map((item) => (
            <Card key={item.page} style={{ flex: 1, padding: "16px", textAlign: "center" }} onClick={() => setPage(item.page)}>
              <span style={{ fontSize: "20px" }}>{item.icon}</span>
              <p style={{ fontFamily: fonts.sans, fontSize: "12px", color: "#6B5D4E", marginTop: "6px" }}>{item.label}</p>
            </Card>
          ))}
        </div>
      </FadeIn>
      <div style={{ height: "40px" }} />
    </div>
  );
}

// ─── Impuls Page (AI-powered) ───────────────────────────────────────────────

function ImpulsPage({ data, setData, onBack }) {
  const [feeling, setFeeling] = useState("");
  const [external, setExternal] = useState("");
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(false);
  const [aiReflection, setAiReflection] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  async function analyzeImpuls() {
    setAiLoading(true);
    const context = gatherAllContext(data);
    const prompt = `Een gebruiker heeft zojuist een eerste impuls vastgelegd.

EIGEN GEVOEL: "${feeling}"
EXTERNE INVLOED: "${external}"

CONTEXT VAN EERDERE REFLECTIES:
${context}

Geef een warme, korte analyse (max 150 woorden) in JSON:
{
  "reflectie": "Wat valt op aan het verschil tussen eigen gevoel en externe invloed? Herken je patronen uit eerdere antwoorden?",
  "patroon": "Welk terugkerend thema zie je? (1 zin)",
  "vraag": "Een verdiepende vraag die de gebruiker kan meenemen (1 zin)"
}`;
    const result = await callAIJson(prompt);
    setAiReflection(result);
    setAiLoading(false);
  }

  function saveImpuls() {
    const impuls = { id: Date.now().toString(), date: new Date().toISOString(), feeling, external, aiReflection };
    setData((prev) => { const next = { ...prev, impulses: [...(prev.impulses || []), impuls] }; saveData(next); return next; });
    setSaved(true);
  }

  if (saved) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "40px 24px", textAlign: "center" }}>
        <FadeIn>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>✦</div>
          <h2 style={{ fontFamily: fonts.serif, fontSize: "22px", color: colors.ink, marginBottom: "12px" }}>Je signaal is vastgelegd</h2>
          <p style={{ fontFamily: fonts.serif, fontSize: "15px", color: colors.muted, marginBottom: "32px", lineHeight: "1.7", maxWidth: "320px" }}>Jouw eerste gevoel telt. Bewaar het als anker voor wanneer de buitenwereld luider wordt.</p>
          <Button onClick={onBack}>Terug naar overzicht</Button>
        </FadeIn>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", padding: "24px", maxWidth: "500px", margin: "0 auto" }}>
      <BackButton onClick={onBack} />
      <FadeIn>
        <h2 style={{ fontFamily: fonts.serif, fontSize: "24px", color: colors.ink, marginBottom: "8px" }}>Eerste Impuls</h2>
        <p style={{ fontFamily: fonts.serif, fontSize: "14px", color: colors.muted, marginBottom: "28px", lineHeight: "1.7" }}>Vang wat je voelt voordat het overschreven wordt.</p>
      </FadeIn>

      {step === 0 && (
        <FadeIn key="s0">
          <Card>
            <p style={{ fontFamily: fonts.serif, fontSize: "17px", color: colors.ink, marginBottom: "6px", lineHeight: "1.6" }}>Wat voelde je als eerste?</p>
            <p style={{ fontFamily: fonts.sans, fontSize: "13px", color: colors.muted, marginBottom: "16px" }}>Wat wilde jij, vóórdat iemand anders iets zei?</p>
            <TextArea value={feeling} onChange={setFeeling} placeholder="Mijn eerste gevoel is..." rows={5} />
            <div style={{ marginTop: "16px", textAlign: "right" }}><Button onClick={() => setStep(1)} disabled={!feeling.trim()}>Volgende →</Button></div>
          </Card>
        </FadeIn>
      )}

      {step === 1 && (
        <FadeIn key="s1">
          <Card>
            <p style={{ fontFamily: fonts.serif, fontSize: "17px", color: colors.ink, marginBottom: "6px", lineHeight: "1.6" }}>Wat zeggen anderen? Wat lijkt logisch volgens de buitenwereld?</p>
            <p style={{ fontFamily: fonts.sans, fontSize: "13px", color: colors.muted, marginBottom: "16px" }}>Dit hoeft niet jouw waarheid te zijn.</p>
            <TextArea value={external} onChange={setExternal} placeholder="Anderen zouden zeggen..." rows={5} />
            <div style={{ marginTop: "16px", display: "flex", justifyContent: "space-between" }}>
              <Button variant="ghost" onClick={() => setStep(0)}>← Terug</Button>
              <Button onClick={() => { setStep(2); analyzeImpuls(); }} disabled={!external.trim()}>Vergelijk →</Button>
            </div>
          </Card>
        </FadeIn>
      )}

      {step === 2 && (
        <FadeIn key="s2">
          <p style={{ fontFamily: fonts.sans, fontSize: "12px", color: colors.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "14px", textAlign: "center" }}>Dual View: Jij vs. de buitenwereld</p>
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
            <div style={{ flex: 1, background: "linear-gradient(180deg, #E8F0E4, #F2EDE5)", borderRadius: "16px", padding: "18px", border: `2px solid ${colors.green}30` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: colors.green }} />
                <span style={{ fontFamily: fonts.sans, fontSize: "11px", fontWeight: 600, color: colors.green, textTransform: "uppercase", letterSpacing: "0.08em" }}>Mijn gevoel</span>
              </div>
              <p style={{ fontFamily: fonts.serif, fontSize: "14px", color: colors.ink, lineHeight: "1.65" }}>{feeling}</p>
            </div>
            <div style={{ flex: 1, background: "linear-gradient(180deg, #EDEBE8, #F2EDE5)", borderRadius: "16px", padding: "18px", border: `2px solid ${colors.muted}20` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: colors.muted }} />
                <span style={{ fontFamily: fonts.sans, fontSize: "11px", fontWeight: 600, color: colors.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Externe invloed</span>
              </div>
              <p style={{ fontFamily: fonts.serif, fontSize: "14px", color: "#6B5D4E", lineHeight: "1.65" }}>{external}</p>
            </div>
          </div>

          {aiLoading ? <LoadingPulse text="AI analyseert je patronen..." /> : aiReflection ? (
            <FadeIn>
              <AICard style={{ marginBottom: "16px" }}>
                <div style={{ marginBottom: "12px" }}><AIBadge /></div>
                <p style={{ fontFamily: fonts.serif, fontSize: "15px", color: colors.ink, lineHeight: "1.7", marginBottom: "12px" }}>{aiReflection.reflectie}</p>
                {aiReflection.patroon && (
                  <div style={{ padding: "10px 14px", background: "rgba(123,104,168,0.06)", borderRadius: "10px", marginBottom: "10px" }}>
                    <p style={{ fontFamily: fonts.sans, fontSize: "11px", fontWeight: 600, color: "#7B68A8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Patroon</p>
                    <p style={{ fontFamily: fonts.serif, fontSize: "14px", color: colors.ink, lineHeight: "1.6" }}>{aiReflection.patroon}</p>
                  </div>
                )}
                {aiReflection.vraag && <p style={{ fontFamily: fonts.serif, fontSize: "14px", color: "#7B68A8", fontStyle: "italic", lineHeight: "1.6" }}>💭 {aiReflection.vraag}</p>}
              </AICard>
            </FadeIn>
          ) : (
            <Card style={{ background: "#FDFBF7", textAlign: "center", marginBottom: "16px" }}>
              <p style={{ fontFamily: fonts.serif, fontSize: "15px", color: colors.ink, lineHeight: "1.7" }}>Kijk naar beide kanten. Welk gevoel is meer van jou?</p>
            </Card>
          )}
          <div style={{ textAlign: "center" }}><Button onClick={saveImpuls}>Bewaar mijn signaal ✦</Button></div>
        </FadeIn>
      )}
    </div>
  );
}

// ─── Module Page ────────────────────────────────────────────────────────────

function ModulePage({ moduleId, data, setData, onBack }) {
  const mod = MODULES.find((m) => m.id === moduleId);
  function updateAnswer(qId, val) {
    setData((prev) => { const next = { ...prev, answers: { ...prev.answers, [qId]: val } }; saveData(next); return next; });
  }
  if (!mod) return null;
  return (
    <div style={{ padding: "24px", maxWidth: "500px", margin: "0 auto" }}>
      <BackButton onClick={onBack} />
      <FadeIn>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <span style={{ fontSize: "28px" }}>{mod.icon}</span>
          <div>
            <h2 style={{ fontFamily: fonts.serif, fontSize: "22px", color: colors.ink }}>{mod.title}</h2>
            <p style={{ fontFamily: fonts.sans, fontSize: "13px", color: mod.color, fontWeight: 500 }}>{mod.subtitle}</p>
          </div>
        </div>
        <p style={{ fontFamily: fonts.serif, fontSize: "14px", color: colors.muted, lineHeight: "1.7", marginBottom: "24px" }}>{mod.intro}</p>
      </FadeIn>
      {mod.questions.map((q, idx) => (
        <FadeIn key={q.id} delay={200 + idx * 150}>
          <Card style={{ marginBottom: "14px" }}>
            <p style={{ fontFamily: fonts.serif, fontSize: "15px", color: colors.ink, lineHeight: "1.6", marginBottom: "12px" }}>{q.prompt}</p>
            <TextArea value={data.answers[q.id] || ""} onChange={(val) => updateAnswer(q.id, val)} placeholder={q.placeholder} rows={3} />
          </Card>
        </FadeIn>
      ))}
    </div>
  );
}

// ─── Beslis-kompas (AI) ─────────────────────────────────────────────────────

function BeslisKompasPage({ data, setData, onBack }) {
  const [situation, setSituation] = useState("");
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);
  const [aiInsight, setAiInsight] = useState(null);
  const [loading, setLoading] = useState(false);

  async function generateInsight() {
    setLoading(true);
    const context = gatherAllContext(data);
    const prompt = `Een gebruiker staat voor een keuze en heeft reflectievragen beantwoord.

SITUATIE: "${situation}"
KOMPAS-ANTWOORDEN:
- Eerste impuls: "${answers.k1 || ""}"
- Externe druk: "${answers.k2 || ""}"
- Zonder publiek: "${answers.k3 || ""}"
- Energie-check: "${answers.k4 || ""}"

VOLLEDIGE CONTEXT:
${context}

Analyseer en geef persoonlijk inzicht. Zoek patronen en spanning tussen verlangen en druk. Antwoord in JSON:
{
  "kerninzicht": "Belangrijkste observatie (2-3 zinnen, warm)",
  "patroonherkenning": "Terugkerende patronen uit alle reflecties (2-3 zinnen)",
  "energie_richting": "Waar wijst de energie heen? (1-2 zinnen)",
  "blinde_vlek": "Welke externe invloed speelt onbewust mee? (1-2 zinnen)",
  "suggestie": "Concrete kleine stap passend bij eigen waarden (1 zin)",
  "verdiepende_vraag": "Vraag om mee te nemen (1 zin)"
}`;
    const result = await callAIJson(prompt);
    setAiInsight(result || {
      kerninzicht: "Je eerste impuls en je keuze 'zonder publiek' bevatten waardevolle informatie.",
      patroonherkenning: "Kijk terug naar je eerdere reflecties voor aanwijzingen.",
      energie_richting: "Volg wat je lichter maakt.",
      blinde_vlek: "Let op stemmen die als 'logisch' klinken maar niet van jou zijn.",
      suggestie: "Kies deze week iets dat past bij je eerste impuls.",
      verdiepende_vraag: "Welke keuze zou je over een jaar trots maken?",
    });
    setLoading(false);
  }

  if (step === 0) {
    return (
      <div style={{ padding: "24px", maxWidth: "500px", margin: "0 auto" }}>
        <BackButton onClick={onBack} />
        <FadeIn>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <span style={{ fontSize: "40px" }}>◇</span>
            <h2 style={{ fontFamily: fonts.serif, fontSize: "24px", color: colors.ink, marginTop: "8px" }}>Beslis-kompas</h2>
            <div style={{ display: "flex", justifyContent: "center", margin: "8px 0" }}><AIBadge /></div>
            <p style={{ fontFamily: fonts.serif, fontSize: "14px", color: colors.muted, lineHeight: "1.7", maxWidth: "340px", margin: "4px auto 0" }}>AI analyseert je reflecties en helpt patronen zichtbaar maken.</p>
          </div>
          <Card>
            <p style={{ fontFamily: fonts.serif, fontSize: "16px", color: colors.ink, marginBottom: "12px" }}>Waar sta je voor? Beschrijf de keuze of situatie.</p>
            <TextArea value={situation} onChange={setSituation} placeholder="Bijv: Ik twijfel of ik..." rows={4} />
            <div style={{ marginTop: "16px", textAlign: "right" }}><Button onClick={() => setStep(1)} disabled={!situation.trim()}>Verken deze keuze →</Button></div>
          </Card>
        </FadeIn>
      </div>
    );
  }

  if (step >= 1 && step <= KOMPAS_QUESTIONS.length) {
    const q = KOMPAS_QUESTIONS[step - 1];
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "24px", maxWidth: "500px", margin: "0 auto" }}>
        <ProgressDots total={KOMPAS_QUESTIONS.length} current={step - 1} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <FadeIn key={q.id}>
            <p style={{ fontFamily: fonts.sans, fontSize: "11px", color: colors.muted, textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center", marginBottom: "8px" }}>{q.label}</p>
            <p style={{ fontFamily: fonts.serif, fontSize: "20px", color: colors.ink, lineHeight: "1.6", textAlign: "center", marginBottom: "28px" }}>{q.prompt}</p>
            <TextArea value={answers[q.id] || ""} onChange={(val) => setAnswers((p) => ({ ...p, [q.id]: val }))} placeholder="Neem de tijd..." rows={4} />
          </FadeIn>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "16px" }}>
          <Button variant="ghost" onClick={() => setStep(step - 1)}>← Terug</Button>
          <Button onClick={() => { setStep(step + 1); if (step === KOMPAS_QUESTIONS.length) generateInsight(); }} disabled={!answers[q.id]?.trim()}>
            {step === KOMPAS_QUESTIONS.length ? "Bekijk AI-inzicht →" : "Volgende →"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "500px", margin: "0 auto" }}>
      <BackButton onClick={onBack} />
      <FadeIn><div style={{ textAlign: "center", marginBottom: "24px" }}><span style={{ fontSize: "40px" }}>◇</span><h2 style={{ fontFamily: fonts.serif, fontSize: "22px", color: colors.ink, marginTop: "8px" }}>Jouw kompasrichting</h2></div></FadeIn>

      {loading ? <LoadingPulse text="AI analyseert je reflecties en patronen..." /> : aiInsight ? (
        <>
          <FadeIn delay={100}>
            <Card style={{ marginBottom: "12px", background: "#FDFBF7" }}>
              <p style={{ fontFamily: fonts.sans, fontSize: "11px", color: colors.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>Je keuze</p>
              <p style={{ fontFamily: fonts.serif, fontSize: "14px", color: colors.ink, lineHeight: "1.6" }}>{situation}</p>
            </Card>
          </FadeIn>

          <FadeIn delay={200}>
            <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
              <Card style={{ flex: 1, padding: "14px", background: "#E8F0E420" }}>
                <p style={{ fontFamily: fonts.sans, fontSize: "10px", color: colors.green, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Jouw impuls</p>
                <p style={{ fontFamily: fonts.serif, fontSize: "13px", color: colors.ink, lineHeight: "1.5" }}>{answers.k1?.substring(0, 100)}</p>
              </Card>
              <Card style={{ flex: 1, padding: "14px", background: "#EDEBE820" }}>
                <p style={{ fontFamily: fonts.sans, fontSize: "10px", color: colors.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Externe druk</p>
                <p style={{ fontFamily: fonts.serif, fontSize: "13px", color: "#6B5D4E", lineHeight: "1.5" }}>{answers.k2?.substring(0, 100)}</p>
              </Card>
            </div>
          </FadeIn>

          <FadeIn delay={350}>
            <AICard style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}><AIBadge /><span style={{ fontFamily: fonts.sans, fontSize: "11px", color: colors.faint }}>Patroonherkenning</span></div>
              <p style={{ fontFamily: fonts.serif, fontSize: "16px", color: colors.ink, lineHeight: "1.7", marginBottom: "16px", fontWeight: 500 }}>{aiInsight.kerninzicht}</p>
              {[
                { label: "Patronen in je reflecties", text: aiInsight.patroonherkenning, color: "#7B68A8" },
                { label: "Waar je energie heen wijst", text: aiInsight.energie_richting, color: colors.green },
                { label: "Mogelijke blinde vlek", text: aiInsight.blinde_vlek, color: colors.amber },
              ].map((item, i) => item.text && (
                <div key={i} style={{ padding: "12px 14px", background: `${item.color}08`, borderRadius: "10px", marginBottom: "10px", borderLeft: `3px solid ${item.color}40` }}>
                  <p style={{ fontFamily: fonts.sans, fontSize: "10px", fontWeight: 600, color: item.color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>{item.label}</p>
                  <p style={{ fontFamily: fonts.serif, fontSize: "14px", color: colors.ink, lineHeight: "1.65" }}>{item.text}</p>
                </div>
              ))}
              {aiInsight.suggestie && (
                <div style={{ padding: "14px", background: `${colors.green}10`, borderRadius: "12px", marginTop: "12px" }}>
                  <p style={{ fontFamily: fonts.sans, fontSize: "10px", fontWeight: 600, color: colors.green, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Kleine stap</p>
                  <p style={{ fontFamily: fonts.serif, fontSize: "15px", color: colors.ink, lineHeight: "1.6" }}>{aiInsight.suggestie}</p>
                </div>
              )}
              {aiInsight.verdiepende_vraag && <p style={{ fontFamily: fonts.serif, fontSize: "14px", color: "#7B68A8", fontStyle: "italic", lineHeight: "1.6", marginTop: "14px" }}>💭 {aiInsight.verdiepende_vraag}</p>}
            </AICard>
          </FadeIn>

          <FadeIn delay={500}>
            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <Button onClick={() => {
                const decision = { id: Date.now().toString(), date: new Date().toISOString(), situation, answers: { ...answers }, aiInsight };
                setData((prev) => { const next = { ...prev, decisions: [...(prev.decisions || []), decision] }; saveData(next); return next; });
                onBack();
              }}>Bewaar deze reflectie</Button>
            </div>
          </FadeIn>
        </>
      ) : null}
    </div>
  );
}

// ─── AI Gesprek ─────────────────────────────────────────────────────────────

function AIGesprekPage({ data, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function startGesprek() {
    setStarted(true);
    setLoading(true);
    const context = gatherAllContext(data);
    const prompt = `De gebruiker wil een verkenningsgesprek. Hier zijn al hun reflecties:

${context}

Start met een warme begroeting. Benoem 1-2 opvallende patronen en stel 1 uitnodigende vraag. Max 100 woorden. Wees specifiek: verwijs naar hun antwoorden.`;
    const response = await callAI(prompt, "Houd antwoorden kort (max 100 woorden). Stel steeds 1 vraag.");
    setMessages([{ role: "assistant", content: response || "Welkom bij je verkenningsgesprek. Ik heb je reflecties bekeken. Waar wil je het over hebben?" }]);
    setLoading(false);
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    const newMsgs = [...messages, { role: "user", content: userMsg }];
    setMessages(newMsgs);
    setLoading(true);

    const context = gatherAllContext(data);
    const history = newMsgs.map((m) => `${m.role === "user" ? "GEBRUIKER" : "BEGELEIDER"}: ${m.content}`).join("\n\n");
    const prompt = `REFLECTIES:\n${context}\n\nGESPREK:\n${history}\n\nReageer warm en specifiek. Verwijs naar patronen. Stel 1 vraag. Max 100 woorden.`;
    const response = await callAI(prompt, "Kort (max 100 woorden). Verwijs naar specifieke antwoorden. Stel 1 vraag.");
    if (response) setMessages([...newMsgs, { role: "assistant", content: response }]);
    setLoading(false);
  }

  if (!started) {
    return (
      <div style={{ padding: "24px", maxWidth: "500px", margin: "0 auto" }}>
        <BackButton onClick={onBack} />
        <FadeIn>
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "20px", background: "linear-gradient(135deg, #7B68A820, #5B5A9E20)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px", margin: "0 auto 24px" }}>✧</div>
            <h2 style={{ fontFamily: fonts.serif, fontSize: "24px", color: colors.ink, marginBottom: "8px" }}>AI Verkenningsgesprek</h2>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}><AIBadge /></div>
            <p style={{ fontFamily: fonts.serif, fontSize: "15px", color: colors.muted, lineHeight: "1.7", maxWidth: "340px", margin: "0 auto 32px" }}>
              AI analyseert al je reflecties en gaat met je in gesprek over patronen, thema's en verborgen aanwijzingen.
            </p>
            <Button variant="ai" onClick={startGesprek}>Start verkenningsgesprek ✧</Button>
            <p style={{ fontFamily: fonts.sans, fontSize: "12px", color: colors.faint, marginTop: "16px" }}>Hoe meer reflecties je hebt ingevuld, hoe dieper het gesprek.</p>
          </div>
        </FadeIn>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", maxWidth: "500px", margin: "0 auto" }}>
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${colors.border}40`, background: "rgba(255,252,247,0.95)", backdropFilter: "blur(10px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={onBack} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: colors.muted, padding: "4px" }}>←</button>
          <div>
            <p style={{ fontFamily: fonts.serif, fontSize: "16px", fontWeight: 600, color: colors.ink }}>Verkenningsgesprek</p>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#7B68A8" }} />
              <span style={{ fontFamily: fonts.sans, fontSize: "11px", color: "#7B68A8" }}>AI-begeleider actief</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: "16px", display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "85%", padding: "14px 18px",
              borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              background: msg.role === "user" ? `linear-gradient(135deg, ${colors.green}, ${colors.greenDark})` : "linear-gradient(135deg, #F8F5FF, #F2F0FA)",
              color: msg.role === "user" ? "#fff" : colors.ink,
              fontFamily: fonts.serif, fontSize: "14px", lineHeight: "1.7",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && <LoadingPulse text="" />}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: "16px 24px", borderTop: `1px solid ${colors.border}40`, background: "rgba(255,252,247,0.95)" }}>
        <div style={{ display: "flex", gap: "10px" }}>
          <input value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Deel je gedachten..."
            style={{ flex: 1, padding: "12px 16px", borderRadius: "14px", border: `1.5px solid ${colors.border}`, fontFamily: fonts.serif, fontSize: "15px", color: colors.ink, background: "rgba(255,252,247,0.7)", outline: "none" }}
          />
          <button onClick={sendMessage} disabled={!input.trim() || loading}
            style={{ width: "44px", height: "44px", borderRadius: "14px", border: "none", background: input.trim() && !loading ? "linear-gradient(135deg, #7B68A8, #5B5A9E)" : `${colors.border}50`, color: "#fff", fontSize: "18px", cursor: input.trim() && !loading ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Acties ─────────────────────────────────────────────────────────────────

function ActiesPage({ data, setData, onBack }) {
  const [newAction, setNewAction] = useState("");
  const [reflectingId, setReflectingId] = useState(null);
  const [reflection, setReflection] = useState("");
  const [wasMe, setWasMe] = useState(null);

  function addAction() {
    if (!newAction.trim()) return;
    setData((prev) => { const next = { ...prev, actions: [...(prev.actions || []), { id: Date.now().toString(), date: new Date().toISOString(), text: newAction, reflection: null, wasMe: null }] }; saveData(next); return next; });
    setNewAction("");
  }

  function saveReflection(id) {
    setData((prev) => { const next = { ...prev, actions: prev.actions.map((a) => a.id === id ? { ...a, reflection, wasMe, reflectedAt: new Date().toISOString() } : a) }; saveData(next); return next; });
    setReflectingId(null); setReflection(""); setWasMe(null);
  }

  return (
    <div style={{ padding: "24px", maxWidth: "500px", margin: "0 auto" }}>
      <BackButton onClick={onBack} />
      <FadeIn>
        <span style={{ fontSize: "28px" }}>🌿</span>
        <h2 style={{ fontFamily: fonts.serif, fontSize: "22px", color: colors.ink, marginTop: "4px" }}>Leren door doen</h2>
        <p style={{ fontFamily: fonts.serif, fontSize: "14px", color: colors.muted, lineHeight: "1.7", marginBottom: "20px" }}>Kleine stappen helpen je ontdekken wat bij je past.</p>
      </FadeIn>
      <FadeIn delay={200}>
        <Card style={{ marginBottom: "20px" }}>
          <p style={{ fontFamily: fonts.serif, fontSize: "15px", color: colors.ink, marginBottom: "12px" }}>Wat ga je klein proberen deze week?</p>
          <TextArea value={newAction} onChange={setNewAction} placeholder="Bijv: iets nieuws leren, iets kiezen vanuit mezelf..." rows={3} />
          <div style={{ marginTop: "12px", textAlign: "right" }}><Button onClick={addAction} disabled={!newAction.trim()} variant="small">+ Toevoegen</Button></div>
        </Card>
      </FadeIn>
      {data.actions?.map((action, idx) => (
        <FadeIn key={action.id} delay={300 + idx * 80}>
          <Card style={{ marginBottom: "10px", padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: fonts.sans, fontSize: "11px", color: colors.faint, marginBottom: "4px" }}>{new Date(action.date).toLocaleDateString("nl-NL", { day: "numeric", month: "long" })}</p>
                <p style={{ fontFamily: fonts.serif, fontSize: "14px", color: colors.ink, lineHeight: "1.5" }}>{action.text}</p>
              </div>
              {action.wasMe !== null && <span style={{ fontSize: "18px", marginLeft: "8px" }}>{action.wasMe ? "🌱" : "🤔"}</span>}
            </div>
            {action.reflection ? (
              <div style={{ marginTop: "12px", padding: "12px", background: colors.warm, borderRadius: "10px" }}>
                <p style={{ fontFamily: fonts.sans, fontSize: "11px", color: colors.muted, fontWeight: 600, marginBottom: "4px" }}>Reflectie {action.wasMe ? "(dit was meer ik)" : "(nog aan het ontdekken)"}</p>
                <p style={{ fontFamily: fonts.serif, fontSize: "13px", color: "#6B5D4E", lineHeight: "1.6" }}>{action.reflection}</p>
              </div>
            ) : reflectingId === action.id ? (
              <div style={{ marginTop: "12px" }}>
                <p style={{ fontFamily: fonts.serif, fontSize: "14px", color: colors.ink, marginBottom: "8px" }}>Hoe voelde dit?</p>
                <TextArea value={reflection} onChange={setReflection} placeholder="Beschrijf hoe het voelde..." rows={2} />
                <p style={{ fontFamily: fonts.serif, fontSize: "14px", color: colors.ink, margin: "12px 0 8px" }}>Was dit meer 'jij'?</p>
                <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                  {[{ val: true, icon: "🌱", text: "Ja, dit past", c: colors.green }, { val: false, icon: "🤔", text: "Nog niet zeker", c: colors.muted }].map((o) => (
                    <button key={String(o.val)} onClick={() => setWasMe(o.val)} style={{ padding: "8px 16px", borderRadius: "10px", border: wasMe === o.val ? `2px solid ${o.c}` : `1.5px solid ${colors.border}`, background: wasMe === o.val ? `${o.c}10` : "#fff", fontFamily: fonts.sans, fontSize: "13px", cursor: "pointer", color: colors.ink }}>{o.icon} {o.text}</button>
                  ))}
                </div>
                <Button variant="small" onClick={() => saveReflection(action.id)} disabled={!reflection.trim() || wasMe === null}>Bewaar reflectie</Button>
              </div>
            ) : (
              <button onClick={() => setReflectingId(action.id)} style={{ marginTop: "10px", background: "none", border: "none", fontFamily: fonts.sans, fontSize: "12px", color: colors.green, cursor: "pointer", padding: 0, fontWeight: 500 }}>Reflecteren →</button>
            )}
          </Card>
        </FadeIn>
      ))}
    </div>
  );
}

// ─── AI Profiel ─────────────────────────────────────────────────────────────

function ProfielPage({ data, setData, onBack }) {
  const [aiProfile, setAiProfile] = useState(data.aiProfile);
  const [loading, setLoading] = useState(false);

  const hasData = MODULES.some((m) => m.questions.some((q) => data.answers[q.id]?.trim()));

  async function generateAIProfile() {
    setLoading(true);
    const context = gatherAllContext(data);
    const prompt = `Analyseer ALLE reflecties en maak een diep waardenprofiel.

${context}

Antwoord in JSON:
{
  "kern_identiteit": "Rode draad van wie deze persoon is (2-3 zinnen, warm, specifiek)",
  "energiebronnen": ["Bron 1 (specifiek)", "Bron 2", "Bron 3"],
  "nieuwsgierigheid": ["Thema 1", "Thema 2", "Thema 3"],
  "eigen_kracht": "Unieke kracht, waar kiezen ze vrij voor? (1-2 zinnen)",
  "externe_patronen": "Waar wijken ze af van zichzelf? (1-2 zinnen)",
  "groei_richting": "Waar beweegt deze persoon naartoe? (1-2 zinnen)",
  "uitnodiging": "Persoonlijke uitnodiging voor volgende stap (1 zin)"
}
Wees SPECIFIEK. Verwijs naar concrete antwoorden.`;
    const result = await callAIJson(prompt);
    if (result) {
      setAiProfile(result);
      setData((prev) => { const next = { ...prev, aiProfile: result, aiProfileDate: new Date().toISOString() }; saveData(next); return next; });
    }
    setLoading(false);
  }

  function exportProfile() {
    let text = "MIJN WAARDENPROFIEL\n" + `Gegenereerd: ${new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}\n\n`;
    if (aiProfile) {
      text += `KERN\n${aiProfile.kern_identiteit}\n\n`;
      if (aiProfile.energiebronnen?.length) text += `ENERGIEBRONNEN\n${aiProfile.energiebronnen.map((e) => `  - ${e}`).join("\n")}\n\n`;
      if (aiProfile.nieuwsgierigheid?.length) text += `NIEUWSGIERIGHEID\n${aiProfile.nieuwsgierigheid.map((n) => `  - ${n}`).join("\n")}\n\n`;
      if (aiProfile.eigen_kracht) text += `EIGEN KRACHT\n${aiProfile.eigen_kracht}\n\n`;
      if (aiProfile.externe_patronen) text += `EXTERNE PATRONEN\n${aiProfile.externe_patronen}\n\n`;
      if (aiProfile.groei_richting) text += `GROEIRICHTING\n${aiProfile.groei_richting}\n\n`;
      if (aiProfile.uitnodiging) text += `UITNODIGING\n${aiProfile.uitnodiging}\n`;
    }
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "mijn-waardenprofiel.txt"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ padding: "24px", maxWidth: "500px", margin: "0 auto" }}>
      <BackButton onClick={onBack} />
      <FadeIn>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <span style={{ fontSize: "40px" }}>🪞</span>
          <h2 style={{ fontFamily: fonts.serif, fontSize: "24px", color: colors.ink, marginTop: "8px" }}>Jouw waardenprofiel</h2>
          <div style={{ display: "flex", justifyContent: "center", margin: "8px 0" }}><AIBadge /></div>
          <p style={{ fontFamily: fonts.serif, fontSize: "14px", color: colors.muted, lineHeight: "1.7" }}>AI bouwt een dynamisch beeld op basis van al je reflecties.</p>
        </div>
      </FadeIn>

      {!hasData ? (
        <Card style={{ textAlign: "center", padding: "40px 24px" }}>
          <p style={{ fontFamily: fonts.serif, fontSize: "16px", color: colors.muted, lineHeight: "1.7" }}>Begin met de reflectiemodules om je profiel te laten groeien.</p>
        </Card>
      ) : (
        <>
          <FadeIn delay={200}>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <Button variant="ai" onClick={generateAIProfile} disabled={loading}>
                {aiProfile ? "✧ Opnieuw analyseren" : "✧ Genereer AI-profiel"}
              </Button>
              {data.aiProfileDate && <p style={{ fontFamily: fonts.sans, fontSize: "11px", color: colors.faint, marginTop: "8px" }}>Laatst: {new Date(data.aiProfileDate).toLocaleDateString("nl-NL", { day: "numeric", month: "long" })}</p>}
            </div>
          </FadeIn>

          {loading ? <LoadingPulse text="AI bouwt je waardenprofiel..." /> : aiProfile ? (
            <>
              <FadeIn delay={300}>
                <AICard style={{ marginBottom: "12px" }}>
                  <p style={{ fontFamily: fonts.sans, fontSize: "10px", fontWeight: 600, color: "#7B68A8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>🧭 Kern van wie jij bent</p>
                  <p style={{ fontFamily: fonts.serif, fontSize: "16px", color: colors.ink, lineHeight: "1.75", fontWeight: 500 }}>{aiProfile.kern_identiteit}</p>
                </AICard>
              </FadeIn>

              <FadeIn delay={400}>
                <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                  <Card style={{ flex: 1, padding: "16px", borderLeft: `3px solid ${colors.amber}` }}>
                    <p style={{ fontFamily: fonts.sans, fontSize: "10px", fontWeight: 600, color: colors.amber, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>🔥 Energie</p>
                    {(aiProfile.energiebronnen || []).map((e, i) => <p key={i} style={{ fontFamily: fonts.serif, fontSize: "13px", color: colors.ink, lineHeight: "1.5", marginBottom: "4px" }}>• {e}</p>)}
                  </Card>
                  <Card style={{ flex: 1, padding: "16px", borderLeft: `3px solid ${colors.blue}` }}>
                    <p style={{ fontFamily: fonts.sans, fontSize: "10px", fontWeight: 600, color: colors.blue, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>🔍 Nieuwsgierigheid</p>
                    {(aiProfile.nieuwsgierigheid || []).map((n, i) => <p key={i} style={{ fontFamily: fonts.serif, fontSize: "13px", color: colors.ink, lineHeight: "1.5", marginBottom: "4px" }}>• {n}</p>)}
                  </Card>
                </div>
              </FadeIn>

              {[
                { label: "Eigen kracht", text: aiProfile.eigen_kracht, icon: "🌱", c: colors.green },
                { label: "Externe patronen", text: aiProfile.externe_patronen, icon: "⚡", c: colors.muted },
                { label: "Groeirichting", text: aiProfile.groei_richting, icon: "🌿", c: colors.green },
              ].map((item, i) => item.text && (
                <FadeIn key={i} delay={500 + i * 100}>
                  <Card style={{ marginBottom: "10px", padding: "16px 18px", borderLeft: `3px solid ${item.c}40` }}>
                    <p style={{ fontFamily: fonts.sans, fontSize: "10px", fontWeight: 600, color: item.c, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>{item.icon} {item.label}</p>
                    <p style={{ fontFamily: fonts.serif, fontSize: "14px", color: colors.ink, lineHeight: "1.65" }}>{item.text}</p>
                  </Card>
                </FadeIn>
              ))}

              {aiProfile.uitnodiging && (
                <FadeIn delay={800}>
                  <AICard style={{ marginBottom: "16px", textAlign: "center" }}>
                    <p style={{ fontFamily: fonts.serif, fontSize: "15px", color: "#7B68A8", fontStyle: "italic", lineHeight: "1.7" }}>💭 {aiProfile.uitnodiging}</p>
                  </AICard>
                </FadeIn>
              )}
            </>
          ) : null}

          <FadeIn delay={900}>
            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <Button variant="secondary" onClick={exportProfile}>📄 Exporteer waardenprofiel</Button>
            </div>
          </FadeIn>
        </>
      )}
    </div>
  );
}

// ─── Tijdlijn ───────────────────────────────────────────────────────────────

function TijdlijnPage({ data, onBack }) {
  const entries = [];
  (data.impulses || []).forEach((imp) => entries.push({ date: imp.date, title: "Eerste impuls", text: imp.feeling, icon: "✦", color: colors.amber, hasAI: !!imp.aiReflection }));
  (data.decisions || []).forEach((dec) => entries.push({ date: dec.date, title: "Beslis-kompas", text: dec.situation, icon: "◇", color: colors.green, hasAI: !!dec.aiInsight }));
  (data.actions || []).forEach((act) => entries.push({ date: act.date, title: act.wasMe ? "Dit paste bij mij" : "Experiment", text: act.text, icon: "🌿", color: colors.blue, reflection: act.reflection }));
  entries.sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div style={{ padding: "24px", maxWidth: "500px", margin: "0 auto" }}>
      <BackButton onClick={onBack} />
      <FadeIn>
        <span style={{ fontSize: "28px" }}>📖</span>
        <h2 style={{ fontFamily: fonts.serif, fontSize: "22px", color: colors.ink, marginTop: "4px" }}>Jouw tijdlijn</h2>
        <p style={{ fontFamily: fonts.serif, fontSize: "14px", color: colors.muted, lineHeight: "1.7", marginBottom: "24px" }}>Je ontwikkeling in de tijd.</p>
      </FadeIn>
      {entries.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "40px 24px" }}><p style={{ fontFamily: fonts.serif, fontSize: "15px", color: colors.muted }}>Je tijdlijn is nog leeg.</p></Card>
      ) : (
        <div style={{ position: "relative", paddingLeft: "24px" }}>
          <div style={{ position: "absolute", left: "7px", top: "8px", bottom: "8px", width: "2px", background: `linear-gradient(to bottom, ${colors.border}, transparent)` }} />
          {entries.map((entry, idx) => (
            <FadeIn key={idx} delay={idx * 100}>
              <div style={{ position: "relative", marginBottom: "16px" }}>
                <div style={{ position: "absolute", left: "-21px", top: "20px", width: "12px", height: "12px", borderRadius: "50%", background: entry.color, border: "2px solid #FFFCF7" }} />
                <Card style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "14px" }}>{entry.icon}</span>
                    <span style={{ fontFamily: fonts.sans, fontSize: "11px", color: entry.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{entry.title}</span>
                    {entry.hasAI && <AIBadge />}
                    <span style={{ fontFamily: fonts.sans, fontSize: "11px", color: colors.faint, marginLeft: "auto" }}>{new Date(entry.date).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}</span>
                  </div>
                  <p style={{ fontFamily: fonts.serif, fontSize: "14px", color: colors.ink, lineHeight: "1.5" }}>{entry.text?.substring(0, 150)}{entry.text?.length > 150 ? "..." : ""}</p>
                  {entry.reflection && <p style={{ fontFamily: fonts.serif, fontSize: "12px", color: colors.muted, fontStyle: "italic", marginTop: "6px" }}>Reflectie: {entry.reflection.substring(0, 80)}</p>}
                </Card>
              </div>
            </FadeIn>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────

export default function Waardenkompas() {
  const [data, setData] = useState(loadData);
  const [page, setPage] = useState(data.onboardingDone ? "home" : "welcome");
  const navigate = useCallback((p) => { setPage(p); window.scrollTo(0, 0); }, []);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(170deg, #FFFCF7 0%, #F7F3ED 40%, #F2EDE5 100%)", fontFamily: fonts.sans, color: colors.ink, maxWidth: "100%", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Source+Serif+4:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        ::selection { background: #5B8C5A30; }
        textarea::placeholder, input::placeholder { color: #C4B9AA; }
      `}</style>
      {page === "welcome" && <WelcomePage onStart={() => navigate("onboarding")} />}
      {page === "onboarding" && <OnboardingPage data={data} setData={setData} onComplete={() => navigate("home")} />}
      {page === "home" && <HomePage data={data} setPage={navigate} />}
      {page === "impuls" && <ImpulsPage data={data} setData={setData} onBack={() => navigate("home")} />}
      {page === "besliskompas" && <BeslisKompasPage data={data} setData={setData} onBack={() => navigate("home")} />}
      {page === "ai-gesprek" && <AIGesprekPage data={data} onBack={() => navigate("home")} />}
      {page === "acties" && <ActiesPage data={data} setData={setData} onBack={() => navigate("home")} />}
      {page === "profiel" && <ProfielPage data={data} setData={setData} onBack={() => navigate("home")} />}
      {page === "tijdlijn" && <TijdlijnPage data={data} onBack={() => navigate("home")} />}
      {page?.startsWith("module-") && <ModulePage moduleId={page.replace("module-", "")} data={data} setData={setData} onBack={() => navigate("home")} />}
    </div>
  );
}
