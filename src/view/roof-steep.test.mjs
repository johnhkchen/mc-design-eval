// roof.gable.steep — the steep-pitch brush proof (T-134-01, story S-134, epic E-33).
// Exhaustive over orientation (ridge axis × class × span parity — the stairRun 4×2 precedent):
// the 2:1/3:1 mixed full-block/stair family realizes state-correct, composes with the roof
// family (caps, verges, gable ends, dormers, courses-even), and every unsupported class is a
// NAMED refusal, never an approximation.

import test from "node:test";
import assert from "node:assert/strict";

import { roofSteepGableConstruct, STEEP_PITCH_CLASSES, STEEP_REFUSALS } from "./roof-steep.mjs";
import { generateRoof, gableRecord } from "./roof-generate.mjs";
import { dormerGable } from "../form/idiom-constructs.mjs";
import { occupancyFromCells } from "./occupancy.mjs";
import { coursesEvenCheck } from "../pack/conformance.mjs";

const BLOCKS = { field: "spruce_planks", stairs: "spruce_stairs", slab: "spruce_slab" };

const spec = (over = {}) => ({
  footprint: { x0: 0, x1: 6, z0: 0, z1: 4 }, ridgeAxis: "z", eaveY: 0, ridgeY: 6, pitch: 2,
  blocks: { ...BLOCKS }, ...over,
});

/** Top cell per "x,z" column. */
function tops(cells) {
  const m = new Map();
  for (const c of cells) {
    const k = `${c.pos[0]},${c.pos[2]}`;
    if (!m.has(k) || c.pos[1] > m.get(k).pos[1]) m.set(k, c);
  }
  return m;
}

const posKey = (p) => p.join(",");

test("ST1: orientation matrix — surface law, tread states, riser runs, no slabs", () => {
  for (const ridgeAxis of ["x", "z"]) {
    for (const pitch of STEEP_PITCH_CLASSES) {
      for (const perpSpan of [7, 8]) { // odd: pointed ridge; even: 2-wide cap
        const fp = ridgeAxis === "z"
          ? { x0: 0, x1: perpSpan - 1, z0: 0, z1: 4 }
          : { x0: 0, x1: 4, z0: 0, z1: perpSpan - 1 };
        const ridgeY = pitch * Math.floor((perpSpan - 1) / 2);
        const r = roofSteepGableConstruct(spec({ footprint: fp, ridgeAxis, ridgeY, pitch }));
        const [s0, s1] = ridgeAxis === "z" ? [fp.x0, fp.x1] : [fp.z0, fp.z1];
        const surf = (s) => Math.min(ridgeY, pitch * Math.min(s - s0, s1 - s));
        for (const [k, top] of tops(r.cells)) {
          const [x, z] = k.split(",").map(Number);
          const s = ridgeAxis === "z" ? x : z;
          assert.equal(top.pos[1], surf(s), `${ridgeAxis}/${pitch}/${perpSpan} col ${k} surface`);
          if (surf(s) === ridgeY) { // cap column: full block, no state
            assert.equal(top.block, BLOCKS.field, `cap ${k} is field`);
            assert.equal(top.state, undefined, `cap ${k} carries no state`);
          } else { // slope column: straight bottom tread facing uphill
            assert.equal(top.block, BLOCKS.stairs, `slope ${k} tops with a tread`);
            const uphillLow = s - s0 < s1 - s; // rises toward larger s on the low side
            const want = ridgeAxis === "z" ? (uphillLow ? "east" : "west") : (uphillLow ? "south" : "north");
            assert.deepEqual(top.state, { facing: want, half: "bottom", shape: "straight" }, `tread ${k} faces uphill`);
          }
        }
        // riser run between successive slope columns is exactly pitch
        for (let s = s0; s < s1; s++) {
          const a = surf(s);
          const b = surf(s + 1);
          if (a < ridgeY && b < ridgeY) assert.equal(Math.abs(b - a), pitch, "riser run = pitch");
        }
        assert.equal(r.counts.slabs, 0, "integer classes never half-step");
        assert.equal(r.ridgeY, ridgeY);
        for (const c of r.cells) assert.ok([BLOCKS.field, BLOCKS.stairs].includes(c.block), "family blocks only");
      }
    }
  }
});

test("ST2: ridge caps — one cap per ridge column (odd span), the 2-wide cap (even span)", () => {
  const odd = roofSteepGableConstruct(spec()); // perp span 7 (x0..6), ridge along z (5 columns)
  assert.equal(odd.capKeys.size, 5, "pointed ridge: one cap cell per ridge column");
  const even = roofSteepGableConstruct(spec({ footprint: { x0: 0, x1: 7, z0: 0, z1: 4 } }));
  assert.equal(even.capKeys.size, 10, "even span: the 2-wide cap course");
  for (const r of [odd, even]) {
    const byPos = new Map(r.cells.map((c) => [posKey(c.pos), c]));
    for (const k of r.capKeys) {
      const c = byPos.get(k);
      assert.equal(c.block, BLOCKS.field, `cap ${k} is the field, never a tread`);
      assert.equal(c.state, undefined);
    }
  }
});

test("ST3: verges — fitted ends trim past the tip; the overhang strip is a sheet (open underside)", () => {
  // generateRoof-level composition: a steep program gable carrying roof-end-fit `ends`.
  const g = {
    ...gableRecord({ footprint: { x0: 0, x1: 4, z0: 0, z1: 6 }, ridgeAxis: "x", eaveY: 0, ridgeY: 6, pitch: 2 }),
    ends: { lo: null, hi: { coord: 3, faceCoord: 2 } }, // x=3 is the verge sheet, x=4 trimmed off
  };
  const { cells, sheetKeys } = generateRoof([g], { ...BLOCKS, findings: [] });
  assert.ok(cells.length > 0);
  assert.ok(!cells.some((c) => c.pos[0] > 3), "columns past the fitted verge tip are not generated");
  const sheetCols = cells.filter((c) => c.pos[0] === 3);
  const byCol = new Map();
  for (const c of sheetCols) byCol.set(`${c.pos[0]},${c.pos[2]}`, (byCol.get(`${c.pos[0]},${c.pos[2]}`) ?? 0) + 1);
  for (const [k, n] of byCol) assert.equal(n, 1, `verge column ${k} places the surface course only`);
  for (const c of sheetCols) assert.ok(sheetKeys.has(posKey(c.pos)), "verge cells are declared sheet");
});

test("ST4: gable ends — the end cross-section is solid to the ridge (no holes to patch)", () => {
  const r = roofSteepGableConstruct(spec({ footprint: { x0: 0, x1: 6, z0: 0, z1: 4 }, ridgeAxis: "z", ridgeY: 6 }));
  for (const zEnd of [0, 4]) {
    const cols = new Map(); // x → sorted ys
    for (const c of r.cells.filter((c) => c.pos[2] === zEnd)) {
      if (!cols.has(c.pos[0])) cols.set(c.pos[0], []);
      cols.get(c.pos[0]).push(c.pos[1]);
    }
    assert.equal(cols.size, 7, `end z=${zEnd} covers the full span`);
    for (const [x, ys] of cols) {
      ys.sort((a, b) => a - b);
      assert.equal(ys[0], 0, `end column x=${x} reaches the band floor`);
      for (let i = 1; i < ys.length; i++) assert.equal(ys[i], ys[i - 1] + 1, `end column x=${x} is gapless`);
    }
  }
});

test("ST5: dormer on steep courses — pitch-aware seat: light clear, niche sealed, face on mass", () => {
  // Compile-shaped composition: mass rect x0..8/z0..6, ridge along x, eave-side dormer facing +z.
  const eaveY = 8;
  const pitch = 2;
  const fp = { x0: 0, x1: 8, z0: -1, z1: 7 }; // roof footprint expanded past the eave edges
  const ridgeY = eaveY + pitch * Math.floor((7 - -1) / 2);
  const roof = roofSteepGableConstruct({ footprint: fp, ridgeAxis: "x", eaveY, ridgeY, pitch, blocks: BLOCKS });
  // the T-134 seat rule: the dormer origin clears the wedge at the wall plane (eaveY + ⌈pitch⌉;
  // ⌈1⌉ = 1 reproduces compile's legacy eaveY+1 seat byte-identically at pitch ≤ 1)
  const seatY = eaveY + Math.max(1, Math.ceil(pitch));
  const dormer = dormerGable({
    origin: [4, seatY, 6], facing: "+z", width: 3, depth: 3, wallHeight: 2,
    wallBlock: "white_terracotta", roofBlock: BLOCKS.stairs, faceBlock: "white_terracotta",
    ridgeBlock: BLOCKS.field, aperture: { w: 1, h: 1 },
  });
  const roofAt = new Map(roof.cells.map((c) => [posKey(c.pos), c]));
  for (const apKey of dormer.aperture) {
    assert.ok(!roofAt.has(apKey), `the light ${apKey} is not flooded by the wedge`);
    const [x, y, z] = apKey.split(",").map(Number);
    const behind = roofAt.get(posKey([x, y, z - 1]));
    assert.ok(behind, `the niche behind ${apKey} is backed by wedge mass`);
    assert.equal(behind.block, BLOCKS.field, "the backing course is solid, not a tread");
  }
  // the face's bottom row seats on the wedge surface (mass contact, no hovering dormer)
  const faceBottom = dormer.cells.filter((c) => c.pos[2] === 6 && c.pos[1] === seatY);
  assert.ok(faceBottom.length > 0);
  for (const c of faceBottom) assert.ok(roofAt.has(posKey(c.pos)), `face cell ${posKey(c.pos)} lands on wedge mass`);
  // no floating dormer cell: every cell overlaps or touches the merged build
  const merged = new Set([...roofAt.keys(), ...dormer.cells.map((c) => posKey(c.pos))]);
  for (const c of dormer.cells) {
    const [x, y, z] = c.pos;
    const touching = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]
      .some(([dx, dy, dz]) => merged.has(posKey([x + dx, y + dy, z + dz])));
    assert.ok(touching, `dormer cell ${posKey(c.pos)} is attached`);
  }
});

test("ST6: conformance courses-even passes on steep courses (chain-shaped declarations)", () => {
  const r = roofSteepGableConstruct(spec());
  const occ = occupancyFromCells(r.cells);
  const bands = [{ name: "roof", yRange: [0, 6], blocks: [BLOCKS.field, BLOCKS.slab, BLOCKS.stairs].sort(), mixed: true }];
  const verdict = coursesEvenCheck(occ, { bands });
  assert.equal(verdict.passed, true, JSON.stringify(verdict.findings));
});

test("ST7: refusals are named findings, never approximations", () => {
  const cases = [
    [{ pitch: 1.5, ridgeY: 6 }, STEEP_REFUSALS.nonInteger],
    [{ pitch: 1 }, STEEP_REFUSALS.shallow],
    [{ pitch: 0.5 }, STEEP_REFUSALS.shallow],
    [{ pitch: 4, ridgeY: 12 }, STEEP_REFUSALS.cliff],
    [{ blocks: { field: BLOCKS.field, stairs: null } }, STEEP_REFUSALS.noStairs],
    [{ ridgeY: 5 }, STEEP_REFUSALS.offStepping],
    [{ ridgeY: 8 }, STEEP_REFUSALS.unreachable], // apex on a 7-span at 2:1 is 6
    [{ footprint: { x0: 3, x1: 0, z0: 0, z1: 4 } }, "footprint"],
    [{ eaveY: 0.5 }, "eaveY"],
    [{ ridgeAxis: "y" }, "ridgeAxis"],
    [{ blocks: { field: "", stairs: BLOCKS.stairs } }, "blocks.field"],
  ];
  for (const [over, needle] of cases) {
    assert.throws(() => roofSteepGableConstruct(spec(over)), new RegExp(needle.slice(0, 40).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), JSON.stringify(over));
  }
});

test("ST8: deterministic and byte-stable", () => {
  const a = roofSteepGableConstruct(spec({ pitch: 3, ridgeY: 9 }));
  const b = roofSteepGableConstruct(spec({ pitch: 3, ridgeY: 9 }));
  assert.equal(JSON.stringify(a.cells), JSON.stringify(b.cells));
  assert.deepEqual(a.counts, b.counts);
});

test("ST9: a below-apex ridge is an allowed plateau — wide cap, invariant holds", () => {
  // 9-span at 2:1 could rise to 8; ridgeY 4 clips it into a plateau (still on the stepping)
  const r = roofSteepGableConstruct(spec({ footprint: { x0: 0, x1: 8, z0: 0, z1: 4 }, ridgeY: 4 }));
  assert.ok(r.capKeys.size > 5, "the clipped ridge caps a plateau, not a line");
  const byPos = new Map(r.cells.map((c) => [posKey(c.pos), c]));
  for (const k of r.capKeys) assert.equal(byPos.get(k).block, BLOCKS.field);
});
