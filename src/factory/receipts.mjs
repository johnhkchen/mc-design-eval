// The compounding receipts, pure half (T-132-01, story S-132, epic E-32 terminal) — the
// epic's actual deliverable: REUSE, MEASURED. One table: registry count before/after, the
// reuse fraction (brushes the new style shares with the curated baseline vs newly built),
// the draft-rework measure (T-131's quality metric, read from the promoted drafts), the cost
// shape (model calls per stage, from the committed ledgers), and the frozen-gate verdict
// beside the conformance results — honestly, whichever way it fell.
//
// Pure given its inputs: the impure runner (scripts/factory-receipts.mjs) reads the committed
// records and the registry; this half does arithmetic + rendering only. Deterministic —
// sorted keys, no clock reads (every date in the output arrived inside a committed record).

export const FACTORY_RECEIPTS_SCHEMA = "factory-receipts/v1";

function fail(msg) { throw new Error(`composeReceipts: ${msg}`); }

const pct = (x) => `${Math.round(x * 100)}%`;

/** One gateRow (src/form/head-to-head.mjs) → the table's verdict cell. */
function verdictCell(row) {
  if (!row) return "—";
  const verdict = row.decided ? (row.passed ? "PASS" : "FAIL") : `REFUSAL (${row.refusal})`;
  const gaps = row.gapCount === null ? "" : `, ${row.gapCount} gap(s) vs budget ${row.gapBudget}`;
  return `${verdict} — same-object ${row.sameObject.count}/${row.sameObject.total}${gaps}`;
}

/**
 * @param {{
 *   before: {count:number, names:string[], ref:string},
 *   afterNames: string[],
 *   baselineStyle: string, baselineIdioms: string[],
 *   style: string, styleIdioms: string[],
 *   backlog: {items:number, notes:number, demotions:number, askCount:number},
 *   drafts: Array<{name:string, rework:string[]}>,
 *   costShape: Array<{stage:string, calls:number, source:string}>,
 *   gates: {baseline:object|null, candidate:object},   // gateRow shapes
 *   conformance: {first:object|null, final:object},     // conformanceScore shapes
 *   chain: {record:string, replay:string},
 * }} p
 * @returns {{receipts:object, md:string}}
 */
export function composeReceipts(p) {
  const {
    before, afterNames, baselineStyle, baselineIdioms, style, styleIdioms,
    backlog, drafts, costShape, gates, conformance, chain, instrument = null,
  } = p;
  if (!before?.names?.length || !Number.isInteger(before.count)) fail("before snapshot {count, names, ref} is required");
  if (before.count !== before.names.length) fail("before.count must equal before.names.length");
  if (!Array.isArray(afterNames) || !afterNames.length) fail("afterNames is required");
  if (!Array.isArray(styleIdioms) || !styleIdioms.length) fail("styleIdioms is required");
  if (!gates?.candidate) fail("gates.candidate (the new-style gate row) is required");

  const beforeSet = new Set(before.names);
  const grown = afterNames.filter((n) => !beforeSet.has(n)).sort();
  const baselineSet = new Set(baselineIdioms);
  const sharedWithBaseline = styleIdioms.filter((n) => baselineSet.has(n)).sort();
  // the style's BRUSH DEMAND = what its pack composes from (all pre-existing at formation
  // time — the formation chain can only seat registry brushes) + what the factory had to
  // build for it (the promoted drafts). Reuse = pre-existing / demand. NOTE the timing
  // honesty: the pack's idiom list predates the new brushes — they grow the registry for
  // the NEXT building, they are not in THIS one (compounding is forward-looking).
  const newlyBuilt = drafts.map((d) => d.name).sort();
  const demand = styleIdioms.length + newlyBuilt.length;
  const reuseFraction = styleIdioms.length / demand;
  const reworkTotal = drafts.reduce((a, d) => a + d.rework.length, 0);
  const callsTotal = costShape.reduce((a, c) => a + c.calls, 0);

  const receipts = {
    schema: FACTORY_RECEIPTS_SCHEMA,
    ticket: "T-132-01",
    style,
    registry: { before: before.count, beforeRef: before.ref, after: afterNames.length, grown },
    reuse: {
      baseline: baselineStyle,
      packIdioms: [...styleIdioms].sort(),
      sharedWithBaseline,
      newlyBuilt,
      demand,
      fraction: Number(reuseFraction.toFixed(4)),
    },
    factory: {
      backlog: { ...backlog },
      drafts: drafts.map((d) => ({ name: d.name, rework: [...d.rework] })).sort((a, b) => a.name.localeCompare(b.name)),
      reworkTotal,
    },
    costShape: costShape.map((c) => ({ ...c })),
    callsTotal,
    verdict: { baseline: gates.baseline ?? null, candidate: gates.candidate },
    instrument,
    conformance,
    chain: { ...chain },
  };

  const md = [
    `# The compounding receipts — ${style} through the brush factory (${FACTORY_RECEIPTS_SCHEMA}, T-132-01)`,
    "",
    `E-32's claim, measured: a style formed in language, its gap brushes specified by the`,
    `factory and implemented once, a building composed from the registry — reuse as numbers.`,
    "",
    `| receipt | value |`,
    `| --- | --- |`,
    `| registry before → after | **${before.count} → ${afterNames.length}** (${grown.map((g) => `\`${g}\``).join(", ") || "no growth"}) at \`${before.ref}\` |`,
    `| ${style}'s brush demand | ${demand} = ${styleIdioms.length} pack idioms (all pre-existing) + ${newlyBuilt.length} factory-built |`,
    `| **reuse fraction** | **${styleIdioms.length}/${demand} (${pct(reuseFraction)}) pre-existing** — ${sharedWithBaseline.length} also in \`${baselineStyle}\`'s own pack list |`,
    `| newly built for ${style} | ${newlyBuilt.length ? newlyBuilt.map((g) => `\`${g}\``).join(", ") : "none"} — in the registry for the NEXT building (the pack's idiom list predates them) |`,
    `| backlog (factory output) | ${backlog.items} work item(s), ${backlog.notes} parametrization note(s), ${backlog.demotions} demotion(s); accepted on ask ${backlog.askCount} |`,
    `| draft rework (T-131 metric) | ${reworkTotal} note(s) across ${drafts.length} promoted draft(s)${reworkTotal ? "" : " — none"} |`,
    `| cost shape | ${costShape.map((c) => `${c.stage} ${c.calls}`).join(" · ")} = **${callsTotal} model call(s)** |`,
    `| frozen gate — ${style} | ${verdictCell(gates.candidate)} |`,
    `| frozen gate — \`${baselineStyle}\` best (same subject) | ${verdictCell(gates.baseline)} |`,
    `| pack conformance (chain) | ${conformance.first ? `${conformance.first.passed}✓/${conformance.first.findings}f` : "—"} → ${conformance.final.passed}✓/${conformance.final.findings}f |`,
    ...(instrument ? [`| instrument receipt | frozen: ${instrument.frozen}, diffs: ${JSON.stringify(instrument.diffs)} (vs ${instrument.comparedTo}) |`] : []),
    `| replay | \`${chain.replay}\` (byte-identical from committed program + ledger) |`,
    "",
    `Verdict context: the candidate is judged by the frozen instrument against the subject's`,
    `committed concept — the baseline style's look. A diegetic substitution diverges in palette`,
    `BY CONSTRUCTION; the gate records it honestly (the named-finding clause in the ticket AC).`,
    "",
  ].join("\n");

  return { receipts, md };
}
