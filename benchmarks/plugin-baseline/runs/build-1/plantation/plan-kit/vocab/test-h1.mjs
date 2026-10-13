// Calls each H1 helper once on a grid the size make.sh builds, and checks that every block it placed sits inside the
// footprint it was given. The only refusals allowed are the planted grass cell (air-only rule) and the dock's posts
// below y0 (the grid has no negative y). Run: node vocab/test-h1.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { colossalColumn, fanlitDoor, hearth, stoop, driveStrip, lampPost, greenhouse, dock } from "./h1.mjs";

const g = new Grid([96, 33, 96]);

function check(name, [lo, hi], call, allowedRefused = () => false) {
  const before = new Set(g.cells.values());
  const refused = call();
  const added = [...g.cells.values()].filter((c) => !before.has(c));
  for (const c of added) {
    assert.ok(c.pos.every((v, i) => v >= lo[i] && v <= hi[i]), `${name}: ${c.block} at ${c.pos} is outside ${lo}..${hi}`);
  }
  for (const r of refused) assert.ok(allowedRefused(r), `${name}: unexpected refusal ${JSON.stringify(r)}`);
  console.log(`ok ${name}: ${added.length} cells placed, ${refused.length} refused`);
}

check("colossalColumn", [[24, 4, 34], [27, 16, 37]], () =>
  colossalColumn(g, 25, 35, { volutes: ["north", "south", "west", "east"] }));

check("fanlitDoor", [[44, 4, 41], [51, 15, 42]], () => [
  ...fanlitDoor(g, 45, 4, 42, "north"),
  ...fanlitDoor(g, 45, 11, 42, "north", { height: 5 }),
]);

check("hearth", [[32, 4, 45], [34, 7, 47]], () => hearth(g, 33, 46, "west", 4));

check("stoop", [[23, 1, 50], [25, 3, 53]], () => stoop(g, 25, 50, "east"));

g.set(46, 0, 5, "grass_block");
check("driveStrip", [[44, 0, 0], [51, 0, 23]], () => driveStrip(g, 45, 0, 50, 23),
  ([x, y, z]) => x === 46 && y === 0 && z === 5);
assert.equal(g.blockAt(46, 0, 5), "minecraft:grass_block", "driveStrip wrote over grass without over:");

check("lampPost", [[30, 1, 90], [30, 4, 90]], () => lampPost(g, 30, 90));

check("greenhouse", [[4, 0, 64], [21, 9, 75]], () => greenhouse(g, 4, 64, 21, 75));

check("dock", [[44, 0, 84], [51, 3, 92]], () => dock(g, 44, 84, 51, 92), ([, y]) => y < 0);
