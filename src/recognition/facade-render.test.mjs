// Unit tests — textured-GLB render seam (T-145-01, E-35). PURE: only the render PLAN is exercised
// here; the impure leaf (GL voxel render) is the runner's job, never the test glob's.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  TEXTURED_GLB_METHOD,
  TEXTURED_GLB_NOTE,
  texturedGlbRenderPlan,
} from "./facade-render.mjs";
import { MULTI_ANGLE_GATE } from "../config.mjs";

test("texturedGlbRenderPlan defaults to the four gate azimuths, tagged layout-only", () => {
  const plan = texturedGlbRenderPlan({ glbPath: "benchmarks/sculpture/glb/cottage.glb" });
  assert.deepEqual(plan.azimuths, [...MULTI_ANGLE_GATE.azimuths]);
  assert.equal(plan.method, TEXTURED_GLB_METHOD);
  assert.equal(plan.layoutOnly, true);
  assert.equal(plan.note, TEXTURED_GLB_NOTE);
  assert.match(plan.note, /layout evidence, not relief depth/);
  assert.equal(plan.glb, "benchmarks/sculpture/glb/cottage.glb");
});

test("texturedGlbRenderPlan echoes a custom azimuth set + palette size; never mutates config", () => {
  const custom = ["+x+z", "-x-z"];
  const plan = texturedGlbRenderPlan({ glbPath: "a.glb", azimuths: custom, paletteSize: 6 });
  assert.deepEqual(plan.azimuths, custom);
  assert.equal(plan.paletteSize, 6);
  // a copy, not the same reference — config stays frozen and untouched
  assert.notEqual(plan.azimuths, custom);
  assert.deepEqual([...MULTI_ANGLE_GATE.azimuths], ["+x+z", "+x-z", "-x-z", "-x+z"]);
});

test("texturedGlbRenderPlan requires a glb path", () => {
  assert.throws(() => texturedGlbRenderPlan({}), /glbPath/);
});
