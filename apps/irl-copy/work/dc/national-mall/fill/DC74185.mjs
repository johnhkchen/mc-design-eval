// DC74185: a 9 x 14 block, four-tier brick commercial block of the late 19th century on the Mall's edge.
// A stone base, three brick storeys with a smooth-stone string course at each floor line and a cornice on top,
// a glass-and-pier window grid on every outward face, a shopfront and dark-oak door on the street (north) front,
// and a stepped core on the east flank: lidar 11 and 12 become a 1-block setback then a 2-block tower top.
// Interior cells are air behind the glass with a solid floor slab per storey; the tiers are solid to their deck.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC74185.cells.json`, "utf8"));   // [x, z, ground, roof]

const W = 9, D = 14, Y = 24;
const FLOOR = 3;                  // storey height in blocks (floor line every 3 rows)
const g = new Voxels([W, Y, D]);

// lidar roof -> clean tier: 12 is the tower top, 11 its setback, anything at 10 or below (including 9 noise) is the main roof
const tier = (r) => (r >= 12 ? 12 : r === 11 ? 11 : 10);

const at = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, top: tier(roof) }]));
const has = (x, z) => at.has(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const outward = (x, z) => Object.keys(DIRS).filter((d) => !has(x + DIRS[d][0], z + DIRS[d][1]));
const exterior = new Map();
for (const key of at.keys()) { const [x, z] = key.split(",").map(Number); exterior.set(key, outward(x, z)); }

// a cross of pane arms: a one-axis plate reads as a hole from the street on the W and E faces, the cross reads as a framed window
const glassPane = () => ({ north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });

for (const [key, { ground, top }] of at) {
  const [x, z] = key.split(",").map(Number);
  const faces = exterior.get(key);
  const ext = faces.length > 0;
  const single = faces.length === 1 ? faces[0] : null;
  const axis = single === "N" || single === "S" ? "x" : "z";
  const u = axis === "x" ? x : z;
  for (let y = 0; y < top; y++) {
    if (y < ground) { g.set(x, y, z, "stone"); continue; }                  // foundation: nothing floats on a slope
    if (!ext) { if (y % FLOOR === 0 || y >= 9) g.set(x, y, z, "stone"); continue; }  // interior: floors, decks, air between
    // exterior shell
    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }               // base course
    if (y % FLOOR === 0 || y === top - 1) { g.set(x, y, z, "smooth_quartz"); continue; }   // string courses and the cornice
    // an opening row: a window bay on a single face at an odd bay, a brick pier everywhere else
    const bay = single !== null && u % 2 === 1;
    if (single === "N" && y <= 2) {                                         // the street front, ground storey
      if (x === 4) { g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (x === 3 || x === 5) { g.set(x, y, z, "stone_bricks"); continue; }  // door surround
    }
    if (bay) g.set(x, y, z, "glass_pane", glassPane());
    else g.set(x, y, z, "bricks");
  }
}

// warm light behind some glass on the upper storeys: the interior cell inside the window, on a row that is air
const IN = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
for (const [key, { top }] of at) {
  const [x, z] = key.split(",").map(Number);
  const faces = exterior.get(key);
  if (faces.length !== 1) continue;
  const f = faces[0], u = f === "N" || f === "S" ? x : z;
  if (u % 2 !== 1) continue;
  for (const y of [4, 5, 7, 8]) {
    if (y >= top - 1 || (u + y) % 5 !== 0) continue;
    const ix = x + IN[f][0], iz = z + IN[f][1];
    if (!has(ix, iz) || exterior.get(`${ix},${iz}`).length) continue;
    if (y >= at.get(`${ix},${iz}`).top - 1) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

// roof equipment: two brick chimney stacks on the main roof, a pair of lanterns, and a hanging lantern in the entrance bay
for (const [cx, cz] of [[2, 4], [5, 3]]) { g.set(cx, 10, cz, "bricks"); g.set(cx, 11, cz, "smooth_quartz"); }
g.set(6, 10, 2, "lantern", { hanging: "false", waterlogged: "false" });
g.set(1, 10, 9, "lantern", { hanging: "false", waterlogged: "false" });
g.set(4, 2, 2, "lantern", { hanging: "true", waterlogged: "false" });

const out = `${DIR}/DC74185.nbt`;
const r = g.save(out);
console.log(`wrote ${out}: ${r.blocks} blocks, ${r.palette} palette entries`);
