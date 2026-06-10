// Unit tests for the fixture test-card (T-097-01, story S-097, epic E-26).
//
// The load-bearing pins:
//   • the card passes the LIVE AJV gate (AC #2 — "the gate accepts every state the card uses",
//     pinned offline forever);
//   • the row vocabulary covers every fixture family/orientation the kit grammar needs (AC #1);
//   • the layout is deterministic and collision-free (the committed card.json is reproducible);
//   • the state-id decoder inverts the encoder for EVERY card row against real minecraft-data
//     (the read-back channel the runner's verification ladder stands on), with the radix walk
//     additionally pinned on a synthetic descriptor (no data load needed to see the math fail).
//
// The real-data decoder tests import render/src/version.mjs dynamically (the staged-loop.test.mjs
// precedent): module resolution walks up from render/, so minecraft-data resolves there.

import test from "node:test";
import assert from "node:assert/strict";

import { assertArtifact } from "../artifact.mjs";
import { loadBlockTable } from "../color/block-table.mjs";
import {
  CARD_ROWS,
  CARD_BASEPLATE_BLOCK,
  CARD_PITCH,
  cardLayout,
  fixtureCard,
} from "./fixture-card.mjs";

test("fixtureCard passes the live AJV gate (AC #2)", () => {
  const artifact = assertArtifact(fixtureCard());
  assert.equal(artifact.placements.length, CARD_ROWS.length + 1); // rows + baseplate
});

test("CARD_ROWS covers every kit fixture family and orientation", () => {
  const families = new Set(CARD_ROWS.map((r) => r.family));
  for (const f of ["trapdoor", "fence", "stairs", "slab", "door", "lantern"]) {
    assert.ok(families.has(f), `family ${f} missing`);
  }
  const trapdoorFacings = new Set(
    CARD_ROWS.filter((r) => r.family === "trapdoor" && r.state?.open === "true").map((r) => r.state.facing)
  );
  assert.deepEqual([...trapdoorFacings].sort(), ["east", "north", "south", "west"]);
  const stairFacings = new Set(
    CARD_ROWS.filter((r) => r.family === "stairs" && r.state?.half === "bottom").map((r) => r.state.facing)
  );
  assert.deepEqual([...stairFacings].sort(), ["east", "north", "south", "west"]);
  const slabTypes = new Set(CARD_ROWS.filter((r) => r.family === "slab").map((r) => r.state.type));
  assert.deepEqual([...slabTypes].sort(), ["bottom", "double", "top"]);
});

test("fence rows carry explicit string connection booleans (no neighbor updates exist)", () => {
  const connected = CARD_ROWS.filter((r) => r.family === "fence" && r.state !== null);
  assert.ok(connected.length >= 4);
  for (const r of connected) {
    for (const [k, v] of Object.entries(r.state)) {
      assert.ok(["north", "south", "east", "west"].includes(k), `${r.id}: unexpected prop ${k}`);
      assert.equal(typeof v, "string", `${r.id}.${k} must be a string (schema blockState form)`);
      assert.equal(v, "true");
    }
  }
});

test("all state values across the card are strings (the schema's blockState form)", () => {
  for (const r of CARD_ROWS) {
    for (const [k, v] of Object.entries(r.state ?? {})) {
      assert.equal(typeof v, "string", `${r.id}.${k}`);
    }
  }
});

test("cardLayout: collision-free, deterministic, fixtures above the baseplate", () => {
  const a = cardLayout();
  const b = cardLayout();
  assert.deepEqual(a, b, "layout must be deterministic");
  const seen = new Set();
  for (const c of a.cells) {
    const k = c.pos.join(",");
    assert.ok(!seen.has(k), `coordinate collision at ${k}`);
    seen.add(k);
    assert.ok(c.pos[1] >= 1, `${c.id} must sit above the y=0 baseplate`);
    assert.ok(
      c.pos[0] >= a.baseplate.from[0] && c.pos[0] <= a.baseplate.to[0] &&
      c.pos[2] >= a.baseplate.from[2] && c.pos[2] <= a.baseplate.to[2],
      `${c.id} column must be over the baseplate`
    );
  }
  // families on distinct z-lines, rows pitched apart
  const zByFamily = new Map();
  for (const c of a.cells) {
    if (!zByFamily.has(c.family)) zByFamily.set(c.family, c.pos[2]);
    else assert.equal(c.pos[2], zByFamily.get(c.family), `${c.id} left its family line`);
  }
  assert.equal(new Set(zByFamily.values()).size, zByFamily.size, "family lines must not overlap");
});

test("door pairUp rows stack at y+1 over the previous row's cell", () => {
  const { cells } = cardLayout();
  const byId = new Map(cells.map((c) => [c.id, c]));
  for (const [upper, lower] of [["door-closed-upper", "door-closed-lower"], ["door-open-upper", "door-open-lower"]]) {
    const u = byId.get(upper);
    const l = byId.get(lower);
    assert.deepEqual(u.pos, [l.pos[0], l.pos[1] + 1, l.pos[2]], `${upper} must sit on ${lower}`);
  }
});

test("fixtureCard is deterministic and its manifest matches its placements", () => {
  const a = fixtureCard();
  const b = fixtureCard();
  assert.deepEqual(a, b);
  const used = [...new Set(a.placements.map((p) => p.block))].sort();
  assert.deepEqual(a.palette.manifest, used);
});

test("baseplate block is a full cube in the E-10 block table (classifies cube, not fixture)", () => {
  const cubes = new Set(loadBlockTable().blocks.map((b) => b.block));
  assert.ok(cubes.has(CARD_BASEPLATE_BLOCK));
});

test("CARD_PITCH isolates fixtures (no two same-family rows adjacent)", () => {
  assert.ok(CARD_PITCH >= 2);
});

test("decoder: stateProps inverts the radix walk on a synthetic descriptor", async () => {
  const { stateProps } = await import("../../render/src/version.mjs");
  // 3 props: enum×3 (a,b,c), bool, int×4 → 24 ids starting at 100
  const block = { name: "synthetic", minStateId: 100, maxStateId: 123 };
  const states = [
    { name: "kind", type: "enum", num_values: 3, values: ["a", "b", "c"] },
    { name: "lit", type: "bool", num_values: 2 },
    { name: "level", type: "int", num_values: 4 },
  ];
  // id = 100 + ((kindIdx*2)+litIdx)*4 + level  (big-endian: last prop fastest)
  assert.deepEqual(stateProps(block, states, 100).properties, { kind: "a", lit: "true", level: "0" });
  assert.deepEqual(stateProps(block, states, 100 + 1 * 8 + 1 * 4 + 3).properties, { kind: "b", lit: "false", level: "3" });
  assert.deepEqual(stateProps(block, states, 123).properties, { kind: "c", lit: "false", level: "3" });
  assert.throws(() => stateProps(block, states, 99), /out of range/);
  assert.throws(() => stateProps(block, states, 124), /out of range/);
  // stateless block → empty properties
  assert.deepEqual(stateProps({ name: "s", minStateId: 5, maxStateId: 5 }, [], 5), { name: "s", properties: {} });
});

test("decoder: every CARD_ROW round-trips through blockStateId → decodeStateId (real 1.20.1 data)", async () => {
  const { blockStateId, decodeStateId } = await import("../../render/src/version.mjs");
  for (const r of CARD_ROWS) {
    const id = blockStateId(r.block, r.state ?? undefined);
    const dec = decodeStateId(id);
    assert.equal(dec.name, r.block, r.id);
    for (const [k, v] of Object.entries(r.state ?? {})) {
      assert.equal(dec.properties[k], v, `${r.id}.${k}`);
    }
  }
});
