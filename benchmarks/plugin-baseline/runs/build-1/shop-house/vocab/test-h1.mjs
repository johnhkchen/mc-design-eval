// Calls every h1 helper once on a small open grid; each placed block must sit inside the footprint it was given.
// Also: a second aislePartition into the same cells is refused, not overwritten (air-only rule).
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h1 from "./h1.mjs";

const g = new Grid([24, 16, 24]);
const fails = [];
const inBox = (b, [x, y, z]) => x >= b[0] && y >= b[1] && z >= b[2] && x <= b[3] && y <= b[4] && z <= b[5];
const check = (name, box, res) => {
  if (!res.placed.length) fails.push(`${name}: placed nothing`);
  const outside = res.placed.filter((p) => !inBox(box, p));
  if (outside.length) fails.push(`${name}: ${outside.length} write(s) outside the footprint, first ${outside[0]}`);
  if (res.refused.length) fails.push(`${name}: refused ${res.refused.length} write(s) on open air`);
};

// the ground the bed replaces is grass, so the farmland rule is exercised
g.fill([3, 5, 13], [7, 5, 17], "grass_block");

check("brickWall", [0, 5, 0, 4, 8, 0], h1.brickWall(g, [0, 5, 0, 4, 8, 0], true, [[1, 6, 0, 2, 7, 0]]));
check("pilaster", [6, 5, 1, 6, 8, 2], h1.pilaster(g, 6, 2, { y0: 5, y1: 8 }));
check("hangingSign", [9, 8, 2, 9, 9, 3], h1.hangingSign(g, 9, 2, 8, "BUTCHER"));
check("shutterPair", [11, 9, 2, 14, 11, 2], h1.shutterPair(g, 12, 9, 2, "north"));
check("aislePartition", [14, 5, 4, 18, 8, 4], h1.aislePartition(g, [14, 18], 4, { y0: 5, y1: 8 }));
const again = h1.aislePartition(g, [14, 18], 4, { y0: 5, y1: 8 });
if (again.placed.length || again.refused.length !== 8) fails.push(`aislePartition re-run: placed ${again.placed.length}, refused ${again.refused.length} (want 0 and 8)`);
check("stairFlight", [1, 5, 6, 4, 9, 10], h1.stairFlight(g, 2, 6, 5, 9, "south", { rails: ["pos"] }));
check("ladderHatch", [16, 5, 9, 16, 9, 10], h1.ladderHatch(g, 16, 10, 5, 8, { facing: "north" }));
check("gardenBed", [3, 5, 13, 7, 6, 17], h1.gardenBed(g, 4, 14, 6, 16, [5, 15], "carrots"));
check("gateDouble", [10, 6, 20, 11, 6, 20], h1.gateDouble(g, 10, 20, "south"));
check("compostStore", [14, 6, 20, 16, 6, 21], h1.compostStore(g, 14, 20));

if (fails.length) {
  console.error(fails.join("\n"));
  process.exit(1);
}
console.log("h1 ok: 9 helpers placed inside their footprints");
