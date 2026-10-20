import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541376807.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541376807.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 14, H = 23, D = 19;
const g = new Voxels([W, H, D]);

// Era: late-20th-century Xinyi mid-rise office/retail block. Two storeys of
// about 5 blocks, white-concrete frame with smooth quartz storey lines,
// glass curtain-style window bands, a granite-clad shopfront at street level,
// and a flat roof with plant boxes and parapet.
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inside = (x, z) => ground.has(`${x},${z}`);
const groundOf = (x, z) => ground.get(`${x},${z}`);

const ROOF = 11;     // roof deck level above lowest ground
const PARAPET = 12;  // parapet course on the shell
const L1 = 5;        // first storey line
const L2 = 10;       // second storey line

// Find the street-facing entrance: a shell cell exposed to +z, nearest the middle.
const shellCells = cells.map(([x, z, gr]) => ({ x, z, gr }));
const isShell = (x, z) =>
  !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
let entrance = null;
{
  const southEdge = shellCells.filter(c => !inside(c.x, c.z + 1));
  if (southEdge.length) {
    const mx = southEdge.reduce((a, c) => a + c.x, 0) / southEdge.length;
    southEdge.sort((a, b) => Math.abs(a.x - mx) - Math.abs(b.x - mx));
    entrance = southEdge[0];
  }
}

const isLit = (x, z, y) => ((x * 7 + z * 3 + y) % 5) === 0;

for (const { x, z, gr } of shellCells) {
  if (gr > 0) {
    for (let y = 0; y < gr; y++) g.set(x, y, z, "polished_andesite");
  }
  if (gr >= ROOF) continue;

  const shell = isShell(x, z);
  const exW = !inside(x - 1, z) || !inside(x + 1, z);
  const exN = !inside(x, z - 1) || !inside(x, z + 1);
  const idx = exW && !exN ? z : exN && !exW ? x : x + z;
  const bayWindow = idx % 3 !== 0; // 2 glazed bays, 1 pier per 3

  if (shell) {
    const isEntrance = entrance && entrance.x === x && entrance.z === z;
    for (let y = gr; y <= ROOF; y++) {
      if (y === ROOF) { g.set(x, y, z, "smooth_quartz"); continue; }
      if (y === L1 || y === L2) { g.set(x, y, z, "smooth_quartz"); continue; }
      if (y < L1) {
        if (y === gr) { g.set(x, y, z, "polished_granite"); continue; }
        if (isEntrance && y <= gr + 1) continue; // door cells, set below
        g.set(x, y, z, bayWindow ? "glass" : "polished_granite");
      } else {
        if (bayWindow) {
          g.set(x, y, z, isLit(x, z, y) && y === 7 ? "glowstone" : "light_blue_stained_glass_pane");
        } else {
          g.set(x, y, z, "white_concrete");
        }
      }
    }
    g.set(x, PARAPET, z, "white_concrete");
    // corner lanterns on the parapet for dusk read
    const cornerX = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
    if (cornerX) g.set(x, PARAPET + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  } else {
    // interior: air behind glass, only floor slabs and roof deck
    if (gr < H) g.set(x, gr, z, "light_gray_concrete");
    if (L1 >= gr) g.set(x, L1, z, "light_gray_concrete");
    if (L2 >= gr) g.set(x, L2, z, "light_gray_concrete");
    g.set(x, ROOF, z, "light_gray_concrete");
    // roof plant boxes
    if (x % 4 === 2 && z % 4 === 2) {
      g.set(x, PARAPET, z, "iron_block");
      g.set(x, PARAPET + 1, z, "iron_block");
    }
  }
}

// Entrance door and hanging lantern on the street face.
if (entrance && entrance.gr < ROOF - 2) {
  const { x, z, gr } = entrance;
  g.set(x, gr, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 1, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 2, z, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(OUT);
