// THE SAME-RULER RECEIPT (T-121-01). One composition point for the milestone runners' instrument
// proof: verdict movement across a re-judge is attributable to the build/judge ONLY if the gate's
// frozen contract (azimuths, elevation, render dims, gap budget, coverage threshold) and the judge
// model held still. Extracted from generated-milestone so the styled chain emits the identical
// receipt on its one sanctioned judge run (the legacy re-judge rotates pins; there is no second
// run to retrofit).
//
// Deliberately NOT compared: verdicts. A live re-judge legitimately moves them — byte-comparing
// parsed verdicts is gateInstrumentDiff's job, and only for `--rejudge` (T-114), where verdicts
// must NOT move. PURE; records are plain JSON.

/**
 * @param {object|null} committedGate  the prior committed gate record (read BEFORE the gate
 *                                     overwrites it), or null when none exists
 * @param {object|null} freshGate      the gate record the run just produced
 * @param {{comparedTo: string, fallbackComparedTo: string, beforeName: string, afterName: string}} names
 *   comparedTo/fallbackComparedTo label the comparator in the receipt; beforeName/afterName
 *   prefix the diff strings (e.g. "styled" → "generated").
 * @returns {{frozen: boolean, comparedTo: string|null, diffs: string[], judgeModels: string[]}}
 */
export function instrumentReceipt(committedGate, freshGate, { comparedTo, fallbackComparedTo, beforeName, afterName }) {
  if (!freshGate) return { frozen: false, comparedTo: null, diffs: ["no fresh gate record"], judgeModels: [] };
  const diffs = [];
  const judgeModels = [...new Set((freshGate.views ?? []).map((v) => v.judge?.model).filter(Boolean))];
  if (!committedGate) {
    return { frozen: true, comparedTo: fallbackComparedTo, diffs, judgeModels };
  }
  const fields = ["azimuths", "elevationDeg", "width", "height", "gapBudget", "coverageThreshold"];
  for (const f of fields) {
    const want = JSON.stringify(committedGate.contract?.[f] ?? null);
    const got = JSON.stringify(freshGate.contract?.[f] ?? null);
    if (want !== got) diffs.push(`contract.${f}: ${beforeName} ${want} → ${afterName} ${got}`);
  }
  const committedModels = new Set((committedGate.views ?? []).map((v) => v.judge?.model).filter(Boolean));
  for (const m of judgeModels) {
    if (committedModels.size && !committedModels.has(m)) diffs.push(`judge.model: ${m} not among ${beforeName}-label models`);
  }
  return { frozen: diffs.length === 0, comparedTo, diffs, judgeModels };
}
