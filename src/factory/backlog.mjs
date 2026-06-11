// The design-backlog factory, pure half (T-131-01, story S-131, epic E-32). Decompose output
// (BrushBacklog) + registry ownership in → reviewable draft DOCUMENTS out. The runaway risk is
// structural (E-32 Rule 3, the T-119-style twin): drafts land in docs/active/backlog/ — outside
// every `.lisa.toml` scan dir (asserted from the config by the tests, not by convention) — and
// carry NONE of lisa's scheduling vocabulary (no id/story/phase), so even a mis-copied draft
// cannot enter the DAG. Promotion is a human act (README.md in the backlog dir).
//
// FX-D1 (T-129): BrushBacklog is an all-array class, so BAML's SAP parser never rejects — any
// malformed reply degrades to the EMPTY backlog. assertNonEmptyBacklog is the consuming
// runner's classifier: the empty union is MALFORMED for the re-ask policy, never a verdict.
//
// Duplicate detection is code-enforced here, not just prompt-instructed: a work item naming an
// owned brush is DEMOTED to a parametrization note and ledgered (the factory's quality signal).
//
// PURE — no fs, no bridge, no clock; provenance arrives as data so rendering is byte-replayable
// from committed records (E-31 Rule 5).

export const BACKLOG_DIR = "docs/active/backlog";
export const BACKLOG_SCHEMA = "design-backlog/v1";

/** A neutral one-page digest of a committed style pack — decompose's style_summary input.
 * (Moved verbatim from scripts/mint-baml-fixture.mjs; the committed decompose fixture pins
 * its output bytes for packs/rustic.json.) */
export function packSummary(pack) {
  const pr = pack.proportions;
  return [
    `Style: ${pack.style} — ${pack.provenance.setting}`,
    "",
    "Palette (role → block — the diegetic material assignments):",
    ...pack.palette.map((p) => `- ${p.role} → ${p.block}: ${p.rationale}`),
    "",
    `Idioms in use: ${pack.idioms.map((i) => i.name).join(", ")}.`,
    `Proportions: storey height ${pr.storeyHeight.min}–${pr.storeyHeight.max} blocks; ` +
      `pitch classes ${JSON.stringify(pr.pitchClasses)}; ` +
      `opening spacing ${pr.openingRhythm.minSpacing}–${pr.openingRhythm.maxSpacing} cells.`,
  ].join("\n");
}

/** FX-D1 classifier: the empty union (no items AND no notes) is MALFORMED, not a verdict. */
export function assertNonEmptyBacklog(parsed) {
  const items = parsed?.items ?? [];
  const notes = parsed?.parametrization_notes ?? [];
  if (items.length === 0 && notes.length === 0) {
    throw new Error("empty backlog (no items, no notes) — SAP-degraded or refusing reply, classified MALFORMED (FX-D1)");
  }
  return parsed;
}

/**
 * Code-enforced duplicate detection (AC3). A work item whose name the registry already owns is
 * demoted to a parametrization note (never silently dropped — `demotions` is the ledger field);
 * a note citing an unowned brush is kept but flagged in `warnings`.
 * @param {{items:object[], parametrization_notes:object[]}} backlog parsed BrushBacklog
 * @param {string[]} ownedNames registry brush names (the ownership set, injected)
 */
export function enforceRegistryDedup(backlog, ownedNames) {
  const owned = new Set(ownedNames);
  const items = [];
  const parametrization_notes = [...(backlog.parametrization_notes ?? [])];
  const demotions = [];
  const warnings = [];
  for (const item of backlog.items ?? []) {
    if (owned.has(item.name)) {
      demotions.push({ name: item.name });
      parametrization_notes.push({
        need: item.purpose,
        existing_brush: item.name,
        note:
          `Demoted by the registry gate: requested as a new work item but the registry owns ` +
          `"${item.name}". Parametrize the owned brush instead — the requested sketch was: ${item.parameter_sketch}`,
      });
    } else {
      items.push(item);
    }
  }
  for (const n of backlog.parametrization_notes ?? []) {
    if (!owned.has(n.existing_brush)) {
      warnings.push(`parametrization note "${n.need}" names a brush the registry does not own ("${n.existing_brush}") — verify by hand before relying on it`);
    }
  }
  return { items, parametrization_notes, demotions, warnings };
}

export const draftRel = (styleName, itemName) => `${BACKLOG_DIR}/${styleName}--${itemName}.md`;
export const notesRel = (styleName) => `${BACKLOG_DIR}/${styleName}--parametrization-notes.md`;

// YAML scalar via JSON string syntax — valid YAML, safe for colons/quotes in model prose.
const y = (s) => JSON.stringify(String(s));

const provenanceLines = (p) => [
  "provenance:",
  `  function: ${y(p.function)}`,
  `  model: ${y(p.model)}`,
  `  prompt_sha256: ${y(p.prompt_sha256)}`,
  `  generated: ${y(p.generated)}`,
];

/**
 * One brush work-item draft, house ticket STYLE but structurally unschedulable: no id/story/
 * phase keys anywhere in the frontmatter (tested), status fixed to `draft`.
 */
export function renderDraft({ styleName, item, provenance }) {
  return [
    "---",
    `draft: ${y(`${styleName}--${item.name}`)}`,
    `style: ${y(styleName)}`,
    `brush: ${y(item.name)}`,
    "type: brush-work-item",
    "status: draft",
    ...provenanceLines(provenance),
    "promotion:",
    "  promoted_by: null",
    "  date: null",
    "  ticket: null",
    "rework: []",
    "---",
    "",
    `# Brush draft: \`${item.name}\` (style: ${styleName})`,
    "",
    "> DRAFT — not a ticket. This directory is outside lisa's scan dirs; promotion is a human",
    "> act (see `README.md` beside this file). E-32 Rule 3: the system never schedules its own work.",
    "",
    "## Context (self-contained)",
    "",
    item.context,
    "",
    `**Purpose:** ${item.purpose}`,
    "",
    "## Acceptance Criteria",
    "",
    ...item.acceptance_criteria.map((ac) => `- [ ] ${ac}`),
    "",
    "## Parameter sketch",
    "",
    "```",
    item.parameter_sketch,
    "```",
    "",
    "## Composition",
    "",
    item.composition_notes,
    "",
    "## Test plan",
    "",
    item.test_plan,
    "",
    "## Preview subject",
    "",
    item.preview_subject,
    "",
  ].join("\n");
}

/** The per-run notes page: covered needs, code-gate demotions, and hand-check warnings. */
export function renderNotes({ styleName, notes, demotions, warnings, provenance }) {
  const lines = [
    "---",
    `style: ${y(styleName)}`,
    "type: parametrization-notes",
    "status: notes",
    ...provenanceLines(provenance),
    "---",
    "",
    `# Parametrization notes — style ${styleName}`,
    "",
    "Needs the registry already covers (an owned brush, parametrized — never a duplicate work",
    `item). ${notes.length} note(s); ${demotions.length} demoted by the code gate; ${warnings.length} warning(s).`,
    "",
    "## Notes",
    "",
  ];
  for (const n of notes) {
    lines.push(`### \`${n.existing_brush}\``, "", `- **need:** ${n.need}`, `- **how:** ${n.note}`, "");
  }
  lines.push("## Demoted by the registry gate (factory quality signal)", "");
  lines.push(
    ...(demotions.length
      ? demotions.map((d) => `- \`${d.name}\` — requested as a new work item; the registry owns it.`)
      : ["- none — the model honored the registry digest."]),
    ""
  );
  lines.push("## Warnings", "");
  lines.push(...(warnings.length ? warnings.map((w) => `- ${w}`) : ["- none"]), "");
  return lines.join("\n");
}

/**
 * Every file one factory run emits, as {rel, content} — the runner writes them, the offline
 * replay re-derives and byte-asserts them.
 * @param {{styleName:string, backlog:{items,parametrization_notes,demotions,warnings}, provenance:object}} p
 *        backlog is the DEDUPED result (enforceRegistryDedup output)
 */
export function backlogFiles({ styleName, backlog, provenance }) {
  const files = backlog.items.map((item) => ({
    rel: draftRel(styleName, item.name),
    content: renderDraft({ styleName, item, provenance }),
  }));
  if (backlog.parametrization_notes.length || backlog.demotions.length || backlog.warnings.length) {
    files.push({
      rel: notesRel(styleName),
      content: renderNotes({
        styleName,
        notes: backlog.parametrization_notes,
        demotions: backlog.demotions,
        warnings: backlog.warnings,
        provenance,
      }),
    });
  }
  return files;
}

/** The `[dirs]` values of a flat lisa config — the scan dirs the backlog must stay outside of. */
export function lisaScanDirs(tomlText) {
  const dirs = [];
  let inDirs = false;
  for (const raw of tomlText.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("[")) inDirs = line === "[dirs]";
    else if (inDirs) {
      const m = line.match(/^[A-Za-z_]+\s*=\s*"([^"]+)"/);
      if (m) dirs.push(m[1]);
    }
  }
  return dirs;
}

const strip = (d) => d.replace(/\/+$/, "");

/** Outside = no containment in EITHER direction (a scan dir nested under the backlog dir would
 * expose drafts just the same). Path-prefix with separator, so docs/active/ticketsX ≠ tickets. */
export function isOutsideScanDirs(dir, scanDirs) {
  const d = strip(dir);
  return scanDirs.every((s0) => {
    const s = strip(s0);
    return d !== s && !d.startsWith(s + "/") && !s.startsWith(d + "/");
  });
}
