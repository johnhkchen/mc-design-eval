// A two-storey brick commercial block (shop-top, c.1920s), flat parapet roof, on the lidar's footprint.
// Ground storey: basalt plinth, glazed shopfronts on dark-oak fascia, brick piers, timber door with a red awning.
// Upper storey: brick piers with paned sash windows on quartz sills; quartz string course and cornice; parapet
// capped in quartz at the piers. Walls are a shell (interior air, floor slabs per storey), lanterns inside.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${dir}/way_1095570516.cells.json`, "utf8"));   // [x, z, ground, roof]

const key = (x, z) => `${x},${z}`;
const foot = new Set(cells.map(([x, z]) => key(x, z)));
const inFoot = (x, z) => foot.has(key(x, z));
const TOP = Math.max(...cells.map((c) => c[3]));           // roof height above y 0 (10 here); parapet top
const GROUND_TOP = 3, FLOOR1 = 4, UPPER_TOP = 7, CORNICE = 8;
if (TOP !== 10) throw new Error(`layout is for a 10-block roof, got ${TOP}`);

// the sides of a footprint cell that face outside it
const faces = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => !inFoot(x + dx, z + dz));
// piers at corners and on every third block along each face; windows between them
const pier = (x, z) => { const f = faces(x, z); return f.length >= 2 || f.some(([dx]) => (dx ? z : x) % 3 === 0); };
const perim = (x, z) => faces(x, z).length > 0;

const g = new Voxels([9, 23, 7]);
const S = (x, y, z, b, st) => g.set(x, y, z, b, st);
const paneOn = (dx) => (dx ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

// the street door: a plain window bay on a single outward face, facing south, near the middle of the block
const southBays = cells.filter(([x, z]) => { const f = faces(x, z); return f.length === 1 && f[0][1] === 1 && !pier(x, z); });
const [dX, dZ] = southBays.reduce((a, b) => (Math.abs(b[0] - 4) < Math.abs(a[0] - 4) ? b : a));

for (const [x, z] of cells) {
  const isP = pier(x, z), per = perim(x, z), f = faces(x, z);
  // floors: plinth and interior floor at y 0, storey floor at 4, ceiling / cornice at 8, roof membrane at 9
  S(x, 0, z, per ? "polished_basalt" : "stone_bricks");
  S(x, FLOOR1, z, per ? "smooth_quartz" : "smooth_stone");
  S(x, CORNICE, z, per ? "smooth_quartz" : "smooth_stone");
  S(x, TOP - 1, z, per ? (isP ? "smooth_quartz" : "bricks") : "gray_concrete");
  if (!per) {
    // interior: air; a lantern standing on the floor of each storey on every third interior cell
    if ((x + z) % 3 === 0) { S(x, 1, z, "lantern", { hanging: "false", waterlogged: "false" }); S(x, 5, z, "lantern", { hanging: "false", waterlogged: "false" }); }
    continue;
  }
  // ground storey (y 1..3)
  if (isP) { for (let y = 1; y <= GROUND_TOP; y++) S(x, y, z, "bricks"); }
  else if (x === dX && z === dZ) {
    S(x, 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    S(x, 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    S(x, 3, z, "red_wool");                               // the entrance awning above the door
  } else {
    S(x, 1, z, "glass"); S(x, 2, z, "glass"); S(x, GROUND_TOP, z, "dark_oak_planks");
  }
  // upper storey (y 5..7): piers, sills, panes on the window bays
  if (isP) { for (let y = FLOOR1 + 1; y <= UPPER_TOP; y++) S(x, y, z, "bricks"); }
  else { S(x, FLOOR1 + 1, z, "smooth_quartz"); for (let y = FLOOR1 + 2; y <= UPPER_TOP; y++) S(x, y, z, "glass_pane", paneOn(f[0][0])); }
}
g.save(`${dir}/way_1095570516.nbt`);
console.log("saved", g.count(), "blocks, palette", g.palette.length, "door", [dX, dZ]);
