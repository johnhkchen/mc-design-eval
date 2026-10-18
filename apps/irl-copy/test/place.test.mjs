import { test } from "node:test";
import assert from "node:assert/strict";
import { fitArc, compose } from "../src/place.mjs";
import { Voxels } from "../src/voxels.mjs";

test("the arc through a thick, partial ring footprint: centre and radii within a block", () => {
  const c = []; for (let a = -2.4; a < -0.7; a += 0.01) for (let r = 100; r < 112; r++) c.push([Math.round(200 + r * Math.cos(a)), Math.round(150 + r * Math.sin(a))]);
  const f = fitArc(c);
  assert.ok(Math.abs(f.cx - 200) < 1 && Math.abs(f.cz - 150) < 1, `centre ${f.cx},${f.cz}`);
  assert.ok(Math.abs(f.r0 - 100) < 1.5 && Math.abs(f.r1 - 111) < 1.5, `radii ${f.r0}..${f.r1}`);
});

test("a module bent along an arc fills the band without holes and turns its stairs with the curve", () => {
  const N = 120, g = new Voxels([N, 10, N]), mod = new Voxels([4, 3, 3]);
  for (let x = 0; x < 4; x++) for (let z = 0; z < 3; z++) mod.set(x, 0, z, "stone");
  mod.set(1, 1, 1, "oak_stairs", { facing: "east", half: "bottom" });
  const fp = []; for (let a = -Math.PI * 0.9; a < -Math.PI * 0.1; a += 0.004) for (let r = 40; r < 43; r += 0.5) fp.push([Math.floor(60 + r * Math.cos(a)), Math.floor(60 + r * Math.sin(a))]);
  const cells = [...new Map(fp.map((c) => [c.join(), c])).values()];
  const manifest = { buildings: [{ id: "c", base: 0, footprint: cells }] };
  const notes = compose(g, manifest, [{ building: "c", module: mod, plot: [0, 0, 3, 2], mode: "arc" }], { ground: () => 0, I: (x, z) => z * N + x });
  assert.match(notes[0], /bent along an arc/);
  // straight north of the centre the curve runs east-west: stone on the band, the stairs turned to run along it
  let stone = 0; for (let z = 15; z < 25; z++) if (g.get(60, 0, z)?.block === "minecraft:stone") stone++;
  assert.ok(stone >= 2, `band at the top of the arc (${stone})`);
  const stairs = []; for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) { const c = g.get(x, 1, z); if (c) stairs.push(c.state.facing); }
  assert.ok(stairs.length > 10 && new Set(stairs).size >= 2, "stairs placed and turned with the curve");
});
