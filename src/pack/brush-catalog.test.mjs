// Brush catalog tests (T-128-01, story S-128, epic E-32): coverage pin, overlap-free layout,
// gate-shape artifact, page completeness.

import { test } from "node:test";
import assert from "node:assert/strict";

import { assertArtifact } from "../artifact.mjs";
import { BRUSH_REGISTRY, brushNames } from "./idiom-registry.mjs";
import {
  catalogPlots, brushCatalogLayout, catalogCoverage, brushCatalog, brushCatalogMarkdown, NOT_BRUSHES,
} from "./brush-catalog.mjs";

test("catalogPlots realizes one plot per brush, in sorted order", () => {
  const plots = catalogPlots();
  assert.deepEqual(plots.map((p) => p.name), brushNames());
  for (const p of plots) assert.ok(p.cells.length > 0, p.name);
});

test("catalogCoverage pins EVERY brush (constructs AND passes)", () => {
  const cov = catalogCoverage();
  assert.deepEqual(cov.missing, []);
  assert.equal(cov.brushes.length, Object.keys(BRUSH_REGISTRY).length);
  const partial = catalogPlots().slice(1);
  assert.ok(catalogCoverage(partial).missing.length === 1, "a dropped plot is caught");
});

test("layout plots are overlap-free and sit on the baseplate (minY = 1)", () => {
  const { cells, plots, baseplate } = brushCatalogLayout();
  const seen = new Set();
  for (const c of cells) {
    const key = c.pos.join(",");
    assert.ok(!seen.has(key), `overlapping cell at ${key}`);
    seen.add(key);
    assert.ok(c.pos[1] >= 1, "no cell sinks into the baseplate");
  }
  // plot bboxes are disjoint on the (x,z) plane
  for (let i = 0; i < plots.length; i++) {
    for (let j = i + 1; j < plots.length; j++) {
      const a = plots[i], b = plots[j];
      const overlapX = a.origin[0] < b.origin[0] + b.size[0] && b.origin[0] < a.origin[0] + a.size[0];
      const overlapZ = a.origin[2] < b.origin[2] + b.size[2] && b.origin[2] < a.origin[2] + a.size[2];
      assert.ok(!(overlapX && overlapZ), `plots ${a.name} and ${b.name} overlap`);
    }
  }
  assert.equal(baseplate.from[1], 0);
});

test("the catalog artifact passes the AJV gate and is deterministic", () => {
  const a = brushCatalog();
  assertArtifact(JSON.stringify(a));
  assert.deepEqual(a, brushCatalog());
  assert.equal(a.metadata.trial_id, "brush-catalog");
});

test("the page names every brush, the count, parameter docs, and the non-brush table", () => {
  const { plots } = brushCatalogLayout();
  const md = brushCatalogMarkdown({ plots, renders: [{ file: "view-catalog-front.png", sha256: "abc" }] });
  assert.ok(md.includes(`**Brush count: ${brushNames().length}**`));
  for (const name of brushNames()) assert.ok(md.includes(`### \`${name}\``), name);
  assert.ok(md.includes("consumes spec → emits cells"));
  assert.ok(md.includes("open schema — parameters live in the module contract"), "the open pass schemas surface honestly");
  for (const { name } of NOT_BRUSHES) assert.ok(md.includes(name), name);
  assert.ok(md.includes("view-catalog-front.png"));
});
