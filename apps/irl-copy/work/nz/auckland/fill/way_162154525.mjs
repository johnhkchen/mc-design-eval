// The Naval and Family Hotel: a four-storey brick hotel (c.1900s commercial Edwardian) on a 25 x 17 footprint, with a
// stone base, a shopfront at street level, sash-style windows in brick piers, a stepped core for the fifth storey
// (lidar roof 19-20), a roof tank and chimney. Massing follows the lidar roof per cell, smoothed into two tiers:
// body to y 17 (parapet), core to y 20 where the lidar reads 19+. Hollow inside: ring walls, floor slabs per storey,
// and air behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_162154525.cells.json`, "utf8"));   // [x, z, ground, roof]
const g = new Voxels([25, 33, 17]);

const at = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const has = (x, z) => at.has(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };   // north is -z

// the sides of cell (x, z) whose neighbour is outside the set `inSet` (a predicate)
const facesOf = (x, z, inSet) => Object.keys(DIRS).filter(d => !inSet(x + DIRS[d][0], z + DIRS[d][1]));

// the core: the lidar's 19-20 block roof, set in from the edge so it steps back from the parapet
const inBody = (x, z) => has(x, z);
const coreRaw = (x, z) => inBody(x, z) && at.get(`${x},${z}`).roof >= 19;
const isCore = (x, z) => coreRaw(x, z) && facesOf(x, z, inBody).length === 0;
const coreTop = 20, bodyTop = 17;
const cell = (x, z) => at.get(`${x},${z}`);

// the facade of a wall cell at height y: its sides it faces outward, along-face index for the bay rhythm
function facade(x, y, z, faces, doorX) {
  if (y === 0) return ["stone_bricks"];
  if (y % 4 === 0) return ["smooth_stone"];                                       // storey lines and the coping
  const corner = faces.length > 1;
  const along = faces[0] === "N" || faces[0] === "S" ? x : z;
  const bay = y < 4 ? along % 4 !== 0 : (along % 4 === 1 || along % 4 === 2);      // ground: wider glass; upper: 2 panes, 1 pier
  if (y === 3) return ["dark_oak_planks"];                                         // shopfront fascia
  if (corner || !bay) return ["bricks"];
  if (y % 4 === 3) return ["quartz_block"];                                        // window head
  // the window bay: door, lit lanterns on the hanging row, warm glow in some panes, else clear glass
  if (y <= 2 && z === 0 && x === doorX) return ["door"];
  if (y === 2 && z === 0 && (x === doorX - 2 || x === doorX + 2)) return ["lantern"];
  if (y >= 5 && y % 4 === 1 && (x + 2 * z) % 11 === 0) return ["glowstone"];      // a few warm panes, not a spotted wall
  return ["glass_pane"];
}

const DOOR_X = 19;
for (const [x, z, ground] of cells) {
  const y0 = 0;
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");                 // foundation to the lowest ground under it
  const core = isCore(x, z);
  const top = core ? coreTop : bodyTop;
  const bodyFaces = facesOf(x, z, inBody);                                          // outer sides of the body
  const coreFaces = core ? facesOf(x, z, (a, b) => isCore(a, b)) : [];              // core sides against the body
  for (let y = y0; y < top; y++) {
    if (y < ground) continue;
    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }
    const ringBody = bodyFaces.length > 0 && y < bodyTop;
    const ringCore = core && coreFaces.length > 0 && y >= 16;
    if (ringBody) {
      const [b, s] = facade(x, y, z, bodyFaces, DOOR_X);
      if (b === "door") { g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      g.set(x, y, z, b, b === "lantern" ? { hanging: "true", waterlogged: "false" } : s);
      continue;
    }
    if (ringCore) {
      const [b, s] = facade(x, y, z, coreFaces, DOOR_X);
      g.set(x, y, z, b, s);
      continue;
    }
    // interior: floor slabs each storey and the roof slab; air behind the glass
    if (y % 4 === 0 || (core && y === 19)) g.set(x, y, z, "stone_bricks");
  }
}

// roof kit on the body's flat top (y 17): a 3 x 2 x 3 oak tank and a brick chimney, both on the cap, away from the core
const onRoof = (x, z) => has(x, z) && !isCore(x, z) && facesOf(x, z, inBody).length === 0;
let tank = null;
for (let x = 2; x <= 22 && !tank; x++) for (let z = 2; z <= 14 && !tank; z++) {
  const all = [...Array(9).keys()].every(k => onRoof(x + (k % 3), z + Math.floor(k / 3)));
  if (all) tank = [x, z];
}
if (tank) {
  for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 3; dz++) for (let y = 17; y < 19; y++)
    g.set(tank[0] + dx, y, tank[1] + dz, "oak_planks");
  g.set(tank[0] + 1, 19, tank[1] + 1, "oak_slab", { type: "bottom", waterlogged: "false" });
}
const chim = [...at.keys()].map(k => k.split(",").map(Number)).find(([x, z]) => onRoof(x, z) && (!tank || Math.abs(x - tank[0]) > 3 || Math.abs(z - tank[1]) > 3));
if (chim) for (let y = 17; y < 21; y++) g.set(chim[0], y, chim[1], "bricks");

const out = `${DIR}/way_162154525.nbt`;
const stats = g.save(out);
const coreCount = cells.filter(([x, z]) => isCore(x, z)).length;
console.log(`core ${coreCount} cells, tank ${tank ? tank.join(",") : "none"}, chimney ${chim ? chim.join(",") : "none"}`, stats);
