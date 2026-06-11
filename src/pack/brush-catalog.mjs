// The brush catalog — pure layout + the committed page (T-128-01, story S-128, epic E-32).
// One plot per registered brush on one baseplate: a construct realizes its FIRST committed card
// spec (the idiom card remains the construct regression sheet — all orientations; the catalog
// shows each brush once), a pass realizes its declared synthetic subject through
// realizePassPreview. The page (brush-catalog.md) renders every brush with its parameter docs,
// composition, and preview plot — and records the BRUSH COUNT, the baseline the E-32 factory
// milestone measures growth against.
//
// The plot-grid algorithm mirrors idiomCardLayout (idiom-card.mjs) over pre-realized cells —
// kept separate rather than parameterizing the committed T-124 module (wrap, don't churn).
//
// PURE — no GL/IO/Date/random.

import { PHASE1_MODEL_ID } from "../config.mjs";
import { BRUSH_REGISTRY, brushNames, getBrush } from "./idiom-registry.mjs";
import { IDIOM_CARD_SPECS } from "./idiom-card.mjs";
import { realizePassPreview } from "./brush-preview.mjs";
import { brushDescriptor } from "./brush-contract.mjs";

export const BRUSH_CATALOG_SCHEMA = "brush-catalog/v1";

export const CATALOG_GAP = 4;
export const CATALOG_MAX_ROW_W = 56;
export const CATALOG_BASEPLATE_BLOCK = "smooth_stone";

/** What deliberately is NOT a brush (design D3) — the page records the reasons so the inventory
 * is honest about its edges, not silently partial. */
export const NOT_BRUSHES = Object.freeze([
  { name: "coverageGate / dominantCoverage (zone-fill)", reason: "instruments — measurement, not technique (creation free / measurement frozen)" },
  { name: "boxShell (workshop/program)", reason: "T-126's program element, a live seam; registry candidate once E-31 lands" },
  { name: "spray-paint (workshop action)", reason: "the model's hand — it composes surface.paint; the technique is the brush, the action is the chooser" },
  { name: "extractApertures / treatmentsFromKit (opening-dressing)", reason: "context producers feeding the opening-dressing brush (its consumes side), not techniques" },
]);

/**
 * One representative realization per brush: {name, kind, cells, via}.
 * Construct: the first committed card spec. Pass: the declared synthetic subject.
 */
export function catalogPlots(registry = BRUSH_REGISTRY, { cardSpecs = IDIOM_CARD_SPECS } = {}) {
  const cardById = new Map(cardSpecs.map((s) => [s.id, s]));
  return Object.keys(registry).sort().map((name) => {
    const entry = registry[name];
    if (entry.kind === "construct") {
      const id = entry.preview.card[0];
      const spec = cardById.get(id);
      if (!spec) throw new Error(`catalogPlots: "${name}" preview card "${id}" not in the card specs`);
      const { cells } = entry.generate(spec.spec);
      return { name, kind: entry.kind, cells, via: `card:${id}` };
    }
    const { cells, effect } = realizePassPreview(name, entry);
    return { name, kind: entry.kind, cells, via: `substrate:${entry.preview.substrate.kind} (effect ${effect})` };
  });
}

/**
 * Lay the plots on a baseplate grid (the idiomCardLayout walk): +x advance with CATALOG_GAP,
 * wrap past CATALOG_MAX_ROW_W, each plot translated so its bbox sits at the cursor, minY = 1.
 * @returns {{cells:object[], plots:{name:string,kind:string,via:string,origin:number[],size:number[]}[],
 *            baseplate:{from:number[],to:number[],block:string}}}
 */
export function brushCatalogLayout(plotList = catalogPlots()) {
  const cells = [];
  const plots = [];
  let cursorX = 0, rowZ = 0, rowDepth = 0;
  for (const { name, kind, cells: raw, via } of plotList) {
    if (!raw.length) throw new Error(`brushCatalogLayout: "${name}" realized no cells`);
    let min = [...raw[0].pos], max = [...raw[0].pos];
    for (const c of raw) {
      for (let i = 0; i < 3; i++) {
        if (c.pos[i] < min[i]) min[i] = c.pos[i];
        if (c.pos[i] > max[i]) max[i] = c.pos[i];
      }
    }
    const size = [max[0] - min[0] + 1, max[1] - min[1] + 1, max[2] - min[2] + 1];
    if (cursorX > 0 && cursorX + size[0] > CATALOG_MAX_ROW_W) {
      cursorX = 0;
      rowZ += rowDepth + CATALOG_GAP;
      rowDepth = 0;
    }
    const origin = [cursorX, 1, rowZ];
    const d = [origin[0] - min[0], origin[1] - min[1], origin[2] - min[2]];
    for (const c of raw) {
      cells.push({ ...c, pos: [c.pos[0] + d[0], c.pos[1] + d[1], c.pos[2] + d[2]] });
    }
    plots.push({ name, kind, via, origin, size });
    cursorX += size[0] + CATALOG_GAP;
    if (size[2] > rowDepth) rowDepth = size[2];
  }
  let maxX = 0, maxZ = 0;
  for (const c of cells) {
    if (c.pos[0] > maxX) maxX = c.pos[0];
    if (c.pos[2] > maxZ) maxZ = c.pos[2];
  }
  return {
    cells,
    plots,
    baseplate: { from: [-1, 0, -1], to: [maxX + 1, 0, maxZ + 1], block: CATALOG_BASEPLATE_BLOCK },
  };
}

/** EVERY registry brush must be plotted (the card's construct pin, widened to the whole table). */
export function catalogCoverage(plotList = catalogPlots(), registry = BRUSH_REGISTRY) {
  const brushes = Object.keys(registry).sort();
  const plotted = new Set(plotList.map((p) => p.name));
  return { brushes, missing: brushes.filter((n) => !plotted.has(n)) };
}

const namespaced = (id) => (id.includes(":") ? id : `minecraft:${id}`);

/** Assemble the schema-valid catalog artifact (the idiomCard pattern). */
export function brushCatalog({ modelId = PHASE1_MODEL_ID } = {}) {
  const { cells, baseplate } = brushCatalogLayout();
  const placements = [
    { op: "fill", from: baseplate.from, to: baseplate.to, block: namespaced(baseplate.block) },
    ...cells.map((c) =>
      c.state == null
        ? { op: "voxel", pos: c.pos, block: namespaced(c.block) }
        : { op: "voxel", pos: c.pos, block: namespaced(c.block), state: { ...c.state } }
    ),
  ];
  const manifest = [...new Set(placements.map((p) => p.block))].sort();
  return {
    schema_version: "1.0.0",
    metadata: {
      trial_id: "brush-catalog",
      prompting_method_id: "procedural/brush-catalog@1",
      model_id: modelId,
      seed: 0,
      server_state_id: "in-memory",
    },
    style: {
      name: "brush-catalog",
      rationale:
        "Not a design: the S-128 brush catalog — every registered brush realized once (constructs from committed card specs, passes on their declared synthetic subjects), the capability baseline sheet.",
    },
    palette: { manifest },
    placements,
  };
}

/** Render one paramsSchema as parameter-doc lines (the open pass schemas surface honestly). */
function paramDocLines(schema) {
  const props = schema?.properties ?? {};
  const names = Object.keys(props);
  if (names.length === 0) {
    return schema?.additionalProperties === false
      ? ["- (no style-level parameters)"]
      : ["- open schema — parameters live in the module contract (tightening is S-125/S-126 territory)"];
  }
  const fmt = (s) => {
    if (s.enum) return s.enum.map((v) => JSON.stringify(v)).join(" | ");
    const parts = [Array.isArray(s.type) ? s.type.join("|") : s.type ?? "object"];
    if (s.minimum !== undefined) parts.push(`≥ ${s.minimum}`);
    if (s.exclusiveMinimum !== undefined) parts.push(`> ${s.exclusiveMinimum}`);
    if (s.items) parts.push(`of ${fmt(s.items)}`);
    return parts.join(", ");
  };
  const lines = names.map((n) => `- \`${n}\`: ${fmt(props[n])}`);
  if (schema?.additionalProperties !== false) {
    lines.push("- …plus open pass parameters (see the module contract)");
  }
  return lines;
}

/**
 * The committed catalog page: every brush — kind, source, tests, composition, parameter docs,
 * preview plot location — plus the deliberate non-brushes and THE COUNT.
 * @param {{plots:object[], renders?:{file:string, sha256:string}[]}} p layout plots + runner receipts
 */
export function brushCatalogMarkdown({ plots, renders = [] } = {}) {
  const names = brushNames();
  const constructs = names.filter((n) => BRUSH_REGISTRY[n].kind === "construct");
  const passes = names.filter((n) => BRUSH_REGISTRY[n].kind === "pass");
  const plotByName = new Map((plots ?? []).map((p) => [p.name, p]));
  const lines = [
    "# Brush catalog — the registry's capability baseline",
    "",
    `**Brush count: ${names.length}** (${constructs.length} constructs, ${passes.length} passes) — `,
    "the E-32 factory baseline (S-132 measures growth against this number).",
    "",
    "Every brush enters through `src/pack/idiom-registry.mjs` (E-32 Rule 1 — the only door) and",
    "satisfies the contract in `schema/brush.schema.json` + `src/pack/brush-contract.mjs`:",
    "parametrized (style-level paramsSchema), composable (declared consumes/emits), unit-tested,",
    "preview-carded. Generated by `npm run brush:catalog`; renders are evidence with sha256",
    "receipts, never verdicts.",
    "",
  ];
  if (renders.length) {
    lines.push("## Renders", "");
    for (const r of renders) lines.push(`- \`${r.file}\` — sha256 \`${r.sha256}\``);
    lines.push("");
  }
  lines.push("## Brushes", "");
  for (const name of names) {
    const entry = getBrush(name);
    const d = brushDescriptor(name, entry);
    const plot = plotByName.get(name);
    lines.push(`### \`${name}\` (${d.kind})`, "");
    lines.push(`- **source:** \`${d.source}\` — **tests:** \`${d.tests}\``);
    lines.push(`- **composition:** consumes ${d.composition.consumes.join(", ")} → emits ${d.composition.emits.join(", ")}`);
    if (entry.apply) lines.push(`- **apply:** \`${entry.apply.name}\`${entry.merge ? ` — **merge:** \`${entry.merge.name}\`` : ""}`);
    lines.push(
      plot
        ? `- **preview:** ${plot.via} — plot at [${plot.origin.join(", ")}], size ${plot.size.join("×")}`
        : `- **preview:** ${d.preview.card ? `card ids ${d.preview.card.join(", ")}` : `substrate ${d.preview.substrate.kind}`}`
    );
    lines.push("- **style parameters:**");
    lines.push(...paramDocLines(d.paramsSchema).map((l) => `  ${l}`));
    lines.push("");
  }
  lines.push("## Deliberately not brushes", "");
  lines.push("| what | why |", "| --- | --- |");
  for (const { name, reason } of NOT_BRUSHES) lines.push(`| ${name} | ${reason} |`);
  lines.push("");
  return lines.join("\n");
}
