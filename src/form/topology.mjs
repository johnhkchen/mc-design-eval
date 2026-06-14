// TOPOLOGY GUARDRAILS (T-157-01, story S-157, epic E-37) — structure over discipline, pointed at
// the project's own *organization*. The E-37 consolidation (T-154 unify-chain, T-155 one-home,
// T-156 archive) cleaned the state ONCE; autonomous runs start with thin context and docs inform
// but don't bind. These pure helpers feed topology.conformance.test.mjs, which goes RED when the
// canonical shape drifts: the map stops matching the code, a second build entry point appears, a
// live module reaches into the dead-code home, or the pin-guard allowlist regresses to a hand-list.
//
// SAME IDIOM AS THE EXISTING TRIPWIRES (isolation.test.mjs / pin-guard.conformance.test.mjs):
// read SOURCE from disk, scan with PRECISE patterns (not loose regex — comments must not trip it,
// the self-grep lesson), keep the decision core PURE over strings so a synthetic violation proves
// red without mutating the tree. No GL, no spend, no Date/random — runs under src/**/*.test.mjs.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

export const STRUCTURE_REL = "STRUCTURE.md";

/** The one entry point's defining declaration. build.mjs (the unified chain, T-154-01) is the only
 *  file that names itself `build-chain/v1`; a SECOND runner re-implementing the chain would declare
 *  its own record schema and trip this. Matched as the DECLARATION, not a bare substring, so this
 *  module — which mentions the schema name in prose/patterns — is never a false positive. */
export const BUILD_ENTRY_DECL_RE = /BUILD_CHAIN_SCHEMA\s*=\s*["']build-chain\/v1["']/;

/** A real module load reaching into the archived dead-code home. Targets an import/from clause
 *  whose quoted specifier contains the archive segment ONLY — the 17 live files that mention the
 *  archive in provenance COMMENTS (no import/from before the quote) are intentionally not matched.
 *  (This very doc-comment must avoid the literal clause it scans for — the self-grep lesson.) */
export const ARCHIVE_IMPORT_RE = /(?:\bfrom|\bimport\s*\()\s*["'][^"']*_archive[^"']*["']/;

/** The live spine's source roots — everything NOT under the archive and NOT a test. */
export const LIVE_ROOTS = Object.freeze(["src", "benchmarks/sculpture"]);

const isArchived = (rel) => rel.includes("/_archive/") || rel.includes("\\_archive\\");

// --- STRUCTURE.md spine parsing (pure over the markdown string) ----------------------------------

/** Slice the spine table body: the rows of the first markdown table whose header names the
 *  "Owning module" column. Returns { headerCells, rows } or null if no such table. */
function spineTable(structureMd) {
  const lines = structureMd.split("\n");
  const headerIdx = lines.findIndex((l) => l.includes("|") && /owning module/i.test(l));
  if (headerIdx < 0) return null;
  const headerCells = lines[headerIdx].split("|").map((c) => c.trim());
  const rows = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim().startsWith("|")) break; // table ends at the first non-row line
    if (/^\s*\|?\s*-{2,}/.test(line)) continue; // the |---|---| separator
    rows.push(line.split("|").map((c) => c.trim()));
  }
  return { headerCells, rows };
}

/** Does a backtick token look like a resolvable module path? (has a slash, no whitespace, and is a
 *  .mjs file / a dir-glob `…/*` / a brace-glob `…/{a,b}.mjs`). Prose tokens like
 *  `generated-milestone.mjs --skip-gate` (whitespace) and bare names are rejected. */
function isModulePathToken(tok) {
  if (/\s/.test(tok) || !tok.includes("/")) return false;
  return tok.endsWith(".mjs") || tok.endsWith("/*") || /\{[^}]+\}/.test(tok);
}

/** Every module-path token named in the spine's "Owning module" column, unique, in order. */
export function parseSpineModules(structureMd) {
  const table = spineTable(structureMd);
  if (!table) return [];
  const col = table.headerCells.findIndex((c) => /owning module/i.test(c));
  const seen = new Set();
  const out = [];
  for (const cells of table.rows) {
    const cell = cells[col] ?? "";
    for (const m of cell.matchAll(/`([^`]+)`/g)) {
      const tok = m[1];
      if (isModulePathToken(tok) && !seen.has(tok)) { seen.add(tok); out.push(tok); }
    }
  }
  return out;
}

/** Expand a brace-glob `a/{x,y}.mjs` into concrete paths; tokens without braces pass through. */
function expandBraces(token) {
  const m = token.match(/^(.*)\{([^}]+)\}(.*)$/);
  if (!m) return [token];
  const [, pre, body, post] = m;
  return body.split(",").map((part) => `${pre}${part.trim()}${post}`);
}

/** Resolve a spine module token against disk. `ok:false` with a reason when the named code is
 *  absent — that is the "map names a module that doesn't exist" failure. */
export function resolveModuleToken(root, token) {
  if (token.endsWith("/*")) {
    const dir = token.slice(0, -2);
    const abs = join(root, dir);
    const ok = existsSync(abs) && (() => { try { return readdirSync(abs).length > 0; } catch { return false; } })();
    return { token, files: ok ? [dir] : [], ok, reason: ok ? null : `dir-glob ${dir} missing or empty` };
  }
  const files = expandBraces(token);
  const missing = files.filter((f) => !existsSync(join(root, f)));
  return { token, files, ok: missing.length === 0, reason: missing.length === 0 ? null : `missing ${missing.join(", ")}` };
}

// --- map reverse-drift: the stages the canonical chain actually runs ------------------------------

/** The stage modules build.mjs (the one chain) invokes: every `join(HERE, "<x>.mjs")` spawn target
 *  plus the render module it imports for the E-36 beside-concept glance. These MUST be named in the
 *  map — a chain that gains a stage without updating STRUCTURE.md trips missingFromMap. */
export function chainStageModules(buildMjsSrc) {
  const out = new Set();
  for (const m of buildMjsSrc.matchAll(/join\(\s*HERE\s*,\s*["']([\w.-]+\.mjs)["']\)/g)) out.add(m[1]);
  const render = buildMjsSrc.match(/from\s+["'][^"']*\/(render-beside\.mjs)["']/);
  if (render) out.add(render[1]);
  return [...out];
}

/** Stage basenames not named anywhere in the map markdown. */
export function missingFromMap(structureMd, stageBasenames) {
  return stageBasenames.filter((b) => !structureMd.includes(b));
}

// --- live-spine source scans (thin IO leaves) ----------------------------------------------------

function walkMjs(root, relDir, acc) {
  let entries;
  try { entries = readdirSync(join(root, relDir), { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const rel = relDir ? `${relDir}/${e.name}` : e.name;
    if (e.isDirectory()) { if (e.name !== "_archive") walkMjs(root, rel, acc); continue; }
    if (e.name.endsWith(".mjs") && !e.name.endsWith(".test.mjs") && !isArchived(rel)) acc.push(rel);
  }
}

/** Repo-root-relative *.mjs across LIVE_ROOTS, excluding _archive/ and *.test.mjs. */
export function liveSpineFiles(root) {
  const acc = [];
  for (const r of LIVE_ROOTS) walkMjs(root, r, acc);
  return acc.sort();
}

/** Live files that perform a real import from the archive (each: { rel, line }). */
export function findArchiveImports(root) {
  const hits = [];
  for (const rel of liveSpineFiles(root)) {
    const src = readFileSync(join(root, rel), "utf8");
    for (const line of src.split("\n")) {
      if (ARCHIVE_IMPORT_RE.test(line)) hits.push({ rel, line: line.trim() });
    }
  }
  return hits;
}

/** Pure: does this source declare itself a "build a subject" entry point? */
export function isBuildEntrySource(src) {
  return BUILD_ENTRY_DECL_RE.test(src);
}

/** Live runners that declare the build-chain schema — must be exactly one (one chain only). */
export function findBuildEntryPoints(root) {
  return liveSpineFiles(root).filter((rel) => isBuildEntrySource(readFileSync(join(root, rel), "utf8")));
}
