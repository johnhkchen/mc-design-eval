// Render-beside-concept — the creation loop's feedback signal (T-152-01, story S-152, epic E-36).
//
// E-36 ("de-freeze the creation loop"): two loops reported "GL absent" and deferred EVERY render to
// an operator runbook — building machinery for two sessions while never looking at the output. GL is
// in fact available; the prior probes consulted the WRONG resolution context (a root `require('gl')`
// where `gl` is a dependency of the nested `render/` project, returning a false-negative
// MODULE_NOT_FOUND). This module makes the render automatic and makes a genuine missing-GL LOUD:
//
//   - assertGlAvailable()      the ONE authoritative GL consultation point (the render module's probe,
//                              never a hand-rolled root require); throws a NAMED error + remedy.
//   - composeBesideConcept()   PURE RGBA — the concept panel prepended to the build's azimuth panels.
//   - renderBesideConcept()    the integrated, judge-free path (render seam injectable for tests).
//
// NO judge runs here (renders are a lens, never an input to a verdict), NO chain, NO pin write. The
// pure pieces + the assert are GL-free so `npm test` (src/**/*.test.mjs) covers them on any host.

import { composeSheet, resampleRgba, RESEMBLANCE_DEFAULTS } from "../form/resemblance.mjs";
import { decodeImage } from "../color/palette-extract.mjs";
import { encodeRgbaToPng } from "../../render/src/headless-canvas.mjs";
import { GL_AVAILABLE, GL_LOAD_ERROR } from "../../render/src/render.mjs";
import { MULTI_ANGLE_GATE } from "../config.mjs";

/** A render-bearing run hit a GL-less environment. Named so it can never be mistaken for a chain
 *  failure (E-36: a swallowed guard refusal once masqueraded as a record-write error). */
export class GlUnavailableError extends Error {
  constructor(loadError) {
    const why = loadError && loadError.message ? loadError.message : "no GPU/display, or `gl` not built";
    super(
      `headless GL unavailable (${why}). ` +
        "Renders are the creation loop's feedback signal and must not be deferred. Remedy: consult the " +
        "render module's GL_AVAILABLE probe (render/src/render.mjs), NOT a root `require('gl')` — `gl` is a " +
        "dependency of the nested render/ project, so a probe from the repo root false-negatives. For a " +
        "genuine GL-less host, build it: `cd render && npm rebuild gl` (or install its build deps).",
    );
    this.name = "GlUnavailableError";
    if (loadError) this.cause = loadError;
  }
}

/** The single GL consultation point. Throws a named GlUnavailableError when GL is absent; else true.
 *  `flags` is injectable so both branches are unit-testable without a GPU. */
export function assertGlAvailable(flags = { GL_AVAILABLE, GL_LOAD_ERROR }) {
  if (!flags.GL_AVAILABLE) throw new GlUnavailableError(flags.GL_LOAD_ERROR);
  return true;
}

/** PURE: prepend the concept panel to the build's azimuth panels and compose one sheet (concept
 *  first, so the eye reads target → build left-to-right). All panels must share dims (composeSheet
 *  enforces). */
export function composeBesideConcept({ conceptPanel, renderPanels, gutter = RESEMBLANCE_DEFAULTS.gutter }) {
  if (!conceptPanel) throw new Error("composeBesideConcept: conceptPanel required");
  if (!Array.isArray(renderPanels) || renderPanels.length < 1) {
    throw new Error("composeBesideConcept: at least one render panel required");
  }
  return composeSheet([conceptPanel, ...renderPanels], { gutter });
}

/**
 * Judge-free textured render of `artifact` at the 4 gate azimuths, placed beside the `conceptPath`
 * image, written to `outPath`. Reuses the existing render seam (renderViews) — no parallel render
 * path, no gate spawn.
 *
 * @param {object} artifact a design artifact
 * @param {string} conceptPath absolute path to the concept image (PNG/JPEG)
 * @param {string} outPath absolute path for the composed sheet (PNG)
 * @param {object} [opts]
 * @param {string} [opts.label="build"] label for the per-azimuth render filenames + the work dir
 * @param {number} [opts.gutter] separator width (default RESEMBLANCE_DEFAULTS.gutter)
 * @param {number} [opts.panel] square panel size (default RESEMBLANCE_DEFAULTS.panel)
 * @param {Function} [opts.renderSeam] injectable (artifact, azimuths, {outDir,label}) => [{angle,path}]
 *   for tests; defaults to renderViews (real GL).
 * @param {object} [opts.glFlags] injectable GL flags for the assert (tests pass {GL_AVAILABLE:true}).
 * @returns {Promise<{outPath:string, panels:number, conceptPath:string}>}
 */
export async function renderBesideConcept(artifact, conceptPath, outPath, opts = {}) {
  const { label = "build", glFlags } = opts;
  const gutter = opts.gutter ?? RESEMBLANCE_DEFAULTS.gutter;
  const P = opts.panel ?? RESEMBLANCE_DEFAULTS.panel;

  assertGlAvailable(glFlags ?? { GL_AVAILABLE, GL_LOAD_ERROR });

  const { mkdir, writeFile } = await import("node:fs/promises");
  const { dirname, join } = await import("node:path");
  const { tmpdir } = await import("node:os");

  const renderSeam =
    opts.renderSeam ||
    (async (art, azimuths, o) => {
      const { renderViews } = await import("./multi-angle.mjs");
      return renderViews(art, azimuths, o);
    });

  const outDir = join(tmpdir(), `render-beside-${label}`);
  const renders = await renderSeam(artifact, [...MULTI_ANGLE_GATE.azimuths], {
    outDir,
    label: (a) => `${label}-${String(a).replace(/\+/g, "p").replace(/-/g, "m")}`,
  });

  const renderPanels = [];
  for (const r of renders) renderPanels.push(resampleRgba(await decodeImage(r.path), P, P, "aspect"));
  const conceptPanel = resampleRgba(await decodeImage(conceptPath), P, P, "aspect");

  const sheet = composeBesideConcept({ conceptPanel, renderPanels, gutter });
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, encodeRgbaToPng(sheet.data, sheet.w, sheet.h));

  return { outPath, panels: renderPanels.length + 1, conceptPath };
}
