import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC87185";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 4 x 5 footprint, 1990s-era downtown office: stone base, light concrete piers,
// smooth stone spandrels, clear glass window bands, cornice slab, recessed entrance.
const W = 4, D = 5, H = 18;
const g = new Voxels([W, H, D]);

const BASE = "stone_bricks";
const PIER = "polished_andesite";
const SPANDREL = "smooth_stone";
const GLASS = "glass";
const FLOOR = "smooth_stone";
const CAP = "smooth_stone";
const CORNICE = "stone_brick_slab";
const DECK = "light_gray_concrete";
const LIGHT_A = "glowstone";
const LIGHT_B = "shroomlight";
const MECH = "light_gray_concrete";

const clampY = (y) => Math.max(0, Math.min(H - 1, y));
const inFoot = new Set(cells.map(([x, z]) => `${x},${z}`));
const has = (x, z) => inFoot.has(`${x},${z}`);

// Smooth lidar roof into one flat tier for the whole footprint.
const roofAvg = cells.reduce((s, c) => s + c[3], 0) / cells.length;
const roofTop = clampY(Math.round(roofAvg));

// Front face is the z=0 edge; entrance sits on the middle of it.
const DOOR_X = Math.floor(W / 2) - 1;

for (const [x, z, groundRaw] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const ground = clampY(groundRaw);
  const t = clampY(Math.max(roofTop, ground + 2));

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < ground; y++) g.set(x, y, z, BASE);

  const exposed = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  const cornerCell = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
  const xEdge = x === 0 || x === W - 1;
  const midPier = xEdge && z === Math.floor(D / 2);
  const frontFace = z === 0 && !has(x, z - 1);
  const pierCell = cornerCell || midPier || (frontFace && (x === 0 || x === W - 1));

  for (let y = ground; y <= t; y++) {
    const h = y - ground;

    if (!exposed) {
      // Interior: no fit-out, only floor slabs, roof deck and warm lights behind glass.
      if (y === t) {
        g.set(x, y, z, DECK);
      } else if (h > 0 && h % 2 === 0) {
        g.set(x, y, z, FLOOR);
      } else if (h === 1 && (x + z) % 2 === 0) {
        g.set(x, y, z, LIGHT_A);
      } else if (h === 3 && (x + z) % 2 === 1) {
        g.set(x, y, z, LIGHT_B);
      }
      continue;
    }

    // Exposed shell.
    if (y === t) {
      g.set(x, y, z, CAP);                       // parapet
    } else if (h === 0) {
      g.set(x, y, z, BASE);                      // base course
    } else if (h % 2 === 0) {
      g.set(x, y, z, SPANDREL);                  // storey line / spandrel
    } else if (pierCell) {
      g.set(x, y, z, PIER);                      // vertical piers and frames
    } else if (frontFace && x === DOOR_X && h === 1) {
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    } else if (frontFace && x === DOOR_X && h === 2) {
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    } else if (frontFace && x === DOOR_X + 1 && h === 1) {
      g.set(x, y, z, GLASS);                     // lit entrance lobby glazing
    } else {
      g.set(x, y, z, GLASS);                     // window band
    }
  }

  // Cornice slab on the perimeter, one block above the parapet.
  if (exposed && t + 1 < H) g.set(x, t + 1, z, CORNICE, { type: "bottom", waterlogged: "false" });
}

// Rooftop mechanical box on one interior roof cell.
if (has(1, 2) && roofTop + 1 < H) {
  g.set(1, roofTop + 1, 2, MECH);
}

g.save(`${DIR}/${ID}.nbt`);
