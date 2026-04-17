import { MODULES } from '../data/modules.js';

/**
 * Gathers all user reflections into a formatted string
 * that can be passed as context to AI prompts.
 */
export function gatherAllContext(data) {
  const sections = [];

  // Module answers
  MODULES.forEach((mod) => {
    const answered = mod.questions
      .filter((q) => data.answers[q.id]?.trim())
      .map((q) => `Vraag: "${q.prompt}"\nAntwoord: "${data.answers[q.id]}"`)
      .join("\n");
    if (answered) {
      sections.push(`=== MODULE: ${mod.title} (${mod.subtitle}) ===\n${answered}`);
    }
  });

  // Impulses
  if (data.impulses?.length > 0) {
    const impTxt = data.impulses
      .slice(-5)
      .map(
        (i) =>
          `[${new Date(i.date).toLocaleDateString("nl-NL")}] Eigen gevoel: "${i.feeling}" | Externe invloed: "${i.external}"`
      )
      .join("\n");
    sections.push(`=== EERSTE IMPULSEN ===\n${impTxt}`);
  }

  // Decisions
  if (data.decisions?.length > 0) {
    const decTxt = data.decisions
      .slice(-3)
      .map(
        (d) =>
          `[${new Date(d.date).toLocaleDateString("nl-NL")}] Situatie: "${d.situation}" | Eerste impuls: "${d.answers?.k1 || ""}" | Druk: "${d.answers?.k2 || ""}" | Zonder publiek: "${d.answers?.k3 || ""}"`
      )
      .join("\n");
    sections.push(`=== EERDERE BESLISSINGEN ===\n${decTxt}`);
  }

  // Actions
  if (data.actions?.length > 0) {
    const actTxt = data.actions
      .slice(-5)
      .map(
        (a) =>
          `[${new Date(a.date).toLocaleDateString("nl-NL")}] Actie: "${a.text}" | Reflectie: "${a.reflection || "nog niet"}" | Paste bij mij: ${a.wasMe === true ? "ja" : a.wasMe === false ? "twijfel" : "onbekend"}`
      )
      .join("\n");
    sections.push(`=== ACTIES & EXPERIMENTEN ===\n${actTxt}`);
  }

  return sections.join("\n\n");
}
