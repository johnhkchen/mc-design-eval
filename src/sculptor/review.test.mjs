// Diagnostic review critic tests (T-026-01) — the PURE routing core + the orchestrator driven with
// STUBBED render+diagnose. This file never loads GL, the SDK, or BAML: the model call is stubbed
// and the routing logic is tested directly (AC#4). The live render/BAML leaves are demonstrated in
// consolidation (S-029), per the ticket.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createBuildState, draftState } from "./build-state.mjs";
import {
  DEFECTS,
  ROUTE_TARGETS,
  ROUTING_TABLE,
  routeDefect,
  routeDiagnosis,
  assertDefect,
  DefectVocabularyError,
  reviewBuildState,
} from "./review.mjs";

/** A flat, UN-textured wall: occupied cells, no material, no relief — the canonical defect fixture. */
function flatUntexturedWall() {
  const d = draftState(createBuildState({ width: 3, height: 2 }));
  for (let x = 0; x < 3; x++) for (let y = 0; y < 2; y++) d.set(x, y, { occupied: true });
  return d.commit();
}

/** A flat wall that IS textured (material set) but has no relief — flat should route to relief. */
function flatTexturedWall() {
  const d = draftState(createBuildState({ width: 3, height: 2 }));
  for (let x = 0; x < 3; x++) for (let y = 0; y < 2; y++) {
    d.set(x, y, { occupied: true, material: "minecraft:stone_bricks" });
  }
  return d.commit();
}

// --- vocabulary + routing table invariants (AC#1) ---

test("the defect vocabulary and routing table are explicit and consistent", () => {
  assert.deepEqual([...DEFECTS].sort(), Object.keys(ROUTING_TABLE).sort());
  assert.deepEqual([...DEFECTS].sort(), ["flat", "proportion", "ringing", "under-detailed-focal"]);
  // every candidate stage is a known route target
  for (const candidates of Object.values(ROUTING_TABLE)) {
    for (const stage of candidates) assert.ok(ROUTE_TARGETS.includes(stage), `unknown target ${stage}`);
  }
  // the table matches the ticket's routing spec verbatim
  assert.deepEqual(ROUTING_TABLE.ringing, ["curve"]);
  assert.deepEqual(ROUTING_TABLE["under-detailed-focal"], ["detail"]);
  assert.deepEqual(ROUTING_TABLE.proportion, ["massing"]);
  assert.deepEqual(ROUTING_TABLE.flat, ["material", "relief"]);
});

// --- per-defect routing (AC#1/#2) ---

test("each defect routes to the stage that should re-run", () => {
  const s = flatTexturedWall(); // a state with material set; non-flat routes ignore it
  assert.equal(routeDefect(s, { defect: "proportion", where: "the base" }).route, "massing");
  assert.equal(routeDefect(s, { defect: "under-detailed-focal", where: "the door" }).route, "detail");
  assert.equal(routeDefect(s, { defect: "ringing", where: "the dome" }).route, "curve");
});

test("routeDefect passes the free-text `where` through untouched", () => {
  const got = routeDefect(flatTexturedWall(), { defect: "proportion", where: "upper-left bay" });
  assert.deepEqual(got, { defect: "proportion", where: "upper-left bay", route: "massing" });
});

// --- flat disambiguation is driven BY THE STATE (AC#3 / D4) ---

test("flat on an UN-textured wall routes to material", () => {
  assert.equal(routeDefect(flatUntexturedWall(), { defect: "flat", where: "the wall" }).route, "material");
});

test("flat on an already-textured wall routes to relief", () => {
  assert.equal(routeDefect(flatTexturedWall(), { defect: "flat", where: "the wall" }).route, "relief");
});

// --- vocabulary guard ---

test("an out-of-vocabulary defect throws DefectVocabularyError", () => {
  assert.throws(() => assertDefect("smudgy"), DefectVocabularyError);
  assert.throws(
    () => routeDefect(flatTexturedWall(), { defect: "smudgy", where: "x" }),
    (e) => e instanceof DefectVocabularyError && e.code === "unknown_defect" && e.defect === "smudgy",
  );
});

// --- routeDiagnosis: list mapping, order, empty ---

test("routeDiagnosis maps a list order-preserving; empty in, empty out", () => {
  assert.deepEqual(routeDiagnosis(flatTexturedWall(), []), []);
  assert.deepEqual(routeDiagnosis(flatTexturedWall()), []); // default arg
  const raws = [
    { defect: "proportion", where: "base" },
    { defect: "ringing", where: "arch" },
  ];
  const out = routeDiagnosis(flatTexturedWall(), raws);
  assert.deepEqual(out.map((d) => d.defect), ["proportion", "ringing"]);
  assert.deepEqual(out.map((d) => d.route), ["massing", "curve"]);
});

// --- the orchestrator end-to-end with STUBBED render + diagnose (AC#2/#4) ---

test("reviewBuildState: a flat untextured fixture yields a flat→material route", async () => {
  const calls = [];
  const stubRender = async (state) => (calls.push(state), { image: Buffer.from("png"), report: { path: "/tmp/x.png" } });
  const stubDiagnose = async () => [{ defect: "flat", where: "the wall" }];
  const { diagnosis, render } = await reviewBuildState(flatUntexturedWall(), {
    brief: "a flat wall",
    render: stubRender,
    diagnose: stubDiagnose,
  });
  assert.equal(calls.length, 1);
  assert.deepEqual(diagnosis, [{ defect: "flat", where: "the wall", route: "material" }]);
  assert.deepEqual(render, { path: "/tmp/x.png" }); // report passed through
});

test("reviewBuildState: a clean fixture (no defects) yields an empty diagnosis", async () => {
  const stubRender = async () => ({ image: Buffer.from("png") }); // no report → null
  const stubDiagnose = async () => []; // the model sees a clean build
  const { diagnosis, render } = await reviewBuildState(flatTexturedWall(), {
    render: stubRender,
    diagnose: stubDiagnose,
  });
  assert.deepEqual(diagnosis, []);
  assert.equal(render, null);
});

test("reviewBuildState forwards the brief to the diagnose seam", async () => {
  let seenBrief;
  const stubRender = async () => ({ image: Buffer.from("p") });
  const stubDiagnose = async (_img, brief) => ((seenBrief = brief), []);
  await reviewBuildState(flatTexturedWall(), { brief: "neoclassical temple", render: stubRender, diagnose: stubDiagnose });
  assert.equal(seenBrief, "neoclassical temple");
});
