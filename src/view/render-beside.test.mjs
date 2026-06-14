// Unit tests for render-beside-concept (T-152-01). GL-free: the assert takes injectable flags and
// renderBesideConcept takes an injectable render seam, so no GPU is touched here.

import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { encodeRgbaToPng } from "../../render/src/headless-canvas.mjs";
import {
  GlUnavailableError,
  assertGlAvailable,
  composeBesideConcept,
  renderBesideConcept,
} from "./render-beside.mjs";
import { resampleRgba, RESEMBLANCE_DEFAULTS } from "../form/resemblance.mjs";
import { MULTI_ANGLE_GATE } from "../config.mjs";

const solidPanel = (w, h, rgba) => {
  const data = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const o = i << 2;
    data[o] = rgba[0]; data[o + 1] = rgba[1]; data[o + 2] = rgba[2]; data[o + 3] = rgba[3];
  }
  return { w, h, data };
};

test("assertGlAvailable throws a named GlUnavailableError with the remedy when GL is absent", () => {
  const cause = new Error("no GPU/display");
  assert.throws(
    () => assertGlAvailable({ GL_AVAILABLE: false, GL_LOAD_ERROR: cause }),
    (err) => {
      assert.ok(err instanceof GlUnavailableError);
      assert.equal(err.name, "GlUnavailableError");
      assert.match(err.message, /no GPU\/display/); // the underlying cause is surfaced
      assert.match(err.message, /render module's GL_AVAILABLE probe/); // the remedy is named
      assert.match(err.message, /npm rebuild gl/);
      assert.equal(err.cause, cause);
      return true;
    },
  );
});

test("assertGlAvailable returns true when GL is present", () => {
  assert.equal(assertGlAvailable({ GL_AVAILABLE: true, GL_LOAD_ERROR: null }), true);
});

test("composeBesideConcept puts the concept panel first and yields N+1 columns at the right width", () => {
  const P = 32;
  const gutter = 8;
  const concept = solidPanel(P, P, [10, 20, 30, 255]);
  const renders = [
    solidPanel(P, P, [200, 0, 0, 255]),
    solidPanel(P, P, [0, 200, 0, 255]),
    solidPanel(P, P, [0, 0, 200, 255]),
    solidPanel(P, P, [200, 200, 0, 255]),
  ];
  const sheet = composeBesideConcept({ conceptPanel: concept, renderPanels: renders, gutter });
  const cols = renders.length + 1;
  assert.equal(sheet.w, P * cols + gutter * (cols - 1));
  assert.equal(sheet.h, P);
  // leftmost column belongs to the concept
  assert.equal(sheet.data[0], 10);
  assert.equal(sheet.data[1], 20);
  assert.equal(sheet.data[2], 30);
});

test("composeBesideConcept rejects an empty render list and mismatched dims", () => {
  const concept = solidPanel(16, 16, [0, 0, 0, 255]);
  assert.throws(() => composeBesideConcept({ conceptPanel: concept, renderPanels: [] }), /at least one render panel/);
  assert.throws(
    () => composeBesideConcept({ conceptPanel: concept, renderPanels: [solidPanel(8, 8, [1, 1, 1, 255])] }),
    /must share dimensions/,
  );
});

test("renderBesideConcept composes a sheet via an injected seam without touching GL", async () => {
  const dir = await mkdtemp(join(tmpdir(), "render-beside-test-"));
  try {
    // a tiny concept image on disk
    const conceptPath = join(dir, "concept.png");
    await writeFile(conceptPath, encodeRgbaToPng(solidPanel(20, 20, [123, 45, 67, 255]).data, 20, 20));

    // a fake render seam: writes tiny PNGs and returns their paths, exactly like renderViews' shape
    const seamCalls = [];
    const renderSeam = async (artifact, azimuths, o) => {
      seamCalls.push({ azimuths, o });
      const out = [];
      for (const a of azimuths) {
        const p = join(dir, `r-${a}.png`);
        await writeFile(p, encodeRgbaToPng(solidPanel(24, 24, [0, 0, 0, 255]).data, 24, 24));
        out.push({ angle: a, path: p });
      }
      return out;
    };

    const outPath = join(dir, "beside.png");
    const res = await renderBesideConcept({ name: "x" }, conceptPath, outPath, {
      label: "x",
      renderSeam,
      glFlags: { GL_AVAILABLE: true }, // assert passes without consulting the real GL
    });

    assert.equal(res.panels, MULTI_ANGLE_GATE.azimuths.length + 1);
    assert.equal(seamCalls.length, 1);
    assert.deepEqual(seamCalls[0].azimuths, [...MULTI_ANGLE_GATE.azimuths]);

    // the sheet exists and is a non-trivial PNG of the expected width
    const P = RESEMBLANCE_DEFAULTS.panel;
    const cols = MULTI_ANGLE_GATE.azimuths.length + 1;
    const buf = await readFile(outPath);
    assert.ok(buf.length > 100);
    const { PNG } = await import("pngjs");
    const png = PNG.sync.read(buf);
    assert.equal(png.width, P * cols + RESEMBLANCE_DEFAULTS.gutter * (cols - 1));
    assert.equal(png.height, P);
    // silence unused import lint without changing behavior
    void resampleRgba;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("renderBesideConcept fails loud (GlUnavailableError) when GL is absent", async () => {
  await assert.rejects(
    () =>
      renderBesideConcept({}, "/nonexistent.png", "/tmp/never.png", {
        glFlags: { GL_AVAILABLE: false, GL_LOAD_ERROR: new Error("no GPU") },
        renderSeam: async () => {
          throw new Error("seam should never run when GL assert fails first");
        },
      }),
    (err) => err instanceof GlUnavailableError,
  );
});
