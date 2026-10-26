import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1221 10th St NW: a Victorian-era red-brick rowhouse conversion. Street front = z 0 (the 3-block face), long sides x 0 and 2.
// Main bays top out at y 6 (three storeys in brick between a stone base course, a string course at y 3 and a parapet cap);
// the two lower end bays (lidar 5) step down one course with a stone cornice at y 4.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC76827.cells.json", "utf8"));
const roof = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));
// lidar smoothing into two clean tiers: main body (z 2..5) at 6, front/back end bays (z 0..1, 6) at 5
const H = (x, z) => (z >= 2 && z <= 5 ? 6 : 5);

const g = new Voxels([3, 8, 7]);
const BRICK = "bricks", STONE = "stone_bricks", PANE = "glass_pane";
const pane = (dirs) => ({ north: dirs.includes("n") ? "true" : "false", south: dirs.includes("s") ? "true" : "false", east: dirs.includes("e") ? "true" : "false", west: dirs.includes("w") ? "true" : "false" });

// windows: ground storey (y 1-2) on every face at z 1,3,5 (piers between); upper storey (y 4) on the main bays only, z 3 and 5
const groundWin = (x, z) => (z === 1 || z === 3 || z === 5) && (x !== 1 || z === 0);
const upperWin = (x, z) => H(x, z) === 6 && (z === 3 || z === 5) && x !== 1;
const frontWin = (x, z) => z === 0 && (x === 0 || x === 2);
const lights = new Set(["1,2,3", "1,2,5", "1,4,3", "1,4,5"]);   // lanterns hung in the air gap behind glass

for (let z = 0; z < 7; z++) for (let x = 0; x < 3; x++) {
  const h = H(x, z);
  for (let y = 0; y < h; y++) {
    const isWallCell = x !== 1 || z === 0 || z === 6;   // walls and the front/back row; x 1 interior is air except slabs
    if (y === 0) { g.set(x, y, z, STONE); continue; }                                  // base course / foundation
    if (y === 3) { g.set(x, y, z, STONE); continue; }                                  // string course = floor slab
    if (y === h - 1 && h === 6) { g.set(x, y, z, STONE); continue; }                   // parapet / roof slab
    if (y === 4 && h === 5) { g.set(x, y, z, STONE); continue; }                       // end-bay cornice
    if (!isWallCell && y !== 3) continue;
    // ground storey y 1-2 and upper y 4 (main bays)
    const storeyWin = (y <= 2 && (groundWin(x, z) || frontWin(x, z))) || (y === 4 && upperWin(x, z));
    if (x === 1 && z === 0 && y <= 2) { continue; }                                    // door cells set below
    if (storeyWin) {
      const dirs = z === 0 ? "s" : x === 0 ? "ns" : x === 2 ? "ns" : "";   // panes join their neighbours
      g.set(x, y, z, PANE, pane(dirs));
    } else {
      g.set(x, y, z, BRICK);
    }
  }
}

// entrance on the street front: a door at x 1 (y 1-2) with the stone lintel above
g.set(1, 1, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(1, 2, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

// warm light: lanterns hung from the floor/roof slab inside the glass (air gap behind the pane)
for (const k of lights) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); }
// the front hall lantern sits in the air gap behind the door; no solid light blocks on the façade
g.set(1, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });

// roof: one stair bulkhead on the main-body roof (x 0, z 3..4), brick walls with a stone cap
for (const y of [6, 7]) { g.set(0, y, 3, BRICK); g.set(0, y, 4, BRICK); }
g.set(0, 7, 3, STONE); g.set(0, 7, 4, STONE);

const res = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC76827.nbt");
console.log(res);
