import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey post-war commercial block (c. 1970s-80s Taipei): reinforced
// concrete frame, white tiled piers, light-grey spandrels, shopfronts with
// red awnings at street level, a flat parapeted roof and a rooftop water tank.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw980871925";
const W = 19, H = 23, D = 36;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup, ground normalised so the lowest cell sits at y 0.
const ground = new Map();
const rawMin = Math.min(...cells.map(c => c[2]));
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.min(12, Math.round(gr - rawMin)));
}
const has = (x, z) => ground.has(`${x},${z}`);
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

// Missing orthogonal neighbours of a footprint cell.
const missing = (x, z) =>
  Object.keys(DIRS).filter(k => !has(x + DIRS[k][0], z + DIRS[k][1]));
const isEdge = (x, z) => missing(x, z).length > 0;
const isCorner = (x, z) => missing(x, z).length >= 2;

// Roof row: every building is two storeys above its local ground,
// never lower than y 10 (roof surface at 11 blocks above lowest ground).
const roofRow = gl => Math.min(H - 4, Math.max(10, gl + 10));

const glassProps = facing =>
  facing === "north" || facing === "south"
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Pass 1: foundations, floor slabs and roof deck for every footprint cell.
for (const [key, gl] of ground) {
  const [x, z] = key.split(",").map(Number);
  const R = roofRow(gl);
  for (let y = 0; y < gl; y++) g.set(x, y, z, "stone_bricks");
  for (let k = 0; k <= 2; k++) {
    const fy = gl + 5 * k;
    if (fy < R) g.set(x, fy, z, "light_gray_concrete");
  }
  g.set(x, R, z, "light_gray_concrete");
}

// Pass 2: perimeter facades (walls, piers, windows, shopfronts, door, lights).
// Door sits on the east/west long faces, middle of the length.
let doorPlaced = false;
for (const [key, gl] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (!isEdge(x, z)) continue;
  const R = roofRow(gl);
  const miss = missing(x, z);
  const corner = isCorner(x, z);
  const facing = miss[0] ?? "north";
  const [dx, dz] = DIRS[facing];
  const longFace = facing === "east" || facing === "west";
  const ai = longFace ? z : x;               // position along the facade
  const pier = corner || ai % 4 === 0;
  const innerX = x - dx, innerZ = z - dz;
  const innerIsInterior = has(innerX, innerZ) &&
    Object.keys(DIRS).every(k => has(innerX + DIRS[k][0], innerZ + DIRS[k][1]));
  const isDoorCol = longFace && !doorPlaced && z === 17 && ai === 17;

  for (let y = gl; y <= R; y++) {
    if (y === R) { g.set(x, y, z, "white_concrete"); continue; } // parapet
    const dy = y - gl;
    const s = Math.floor(dy / 5);
    const r = dy % 5;

    if (s === 0) {
      if (r === 0) { g.set(x, y, z, "stone_bricks"); continue; }  // base course
      if (r === 4) { g.set(x, y, z, pier ? "white_concrete" : "red_concrete"); continue; } // awning band
      if (pier) { g.set(x, y, z, "white_concrete"); continue; }
      if (isDoorCol && (r === 1 || r === 2)) {
        g.set(x, y, z, "oak_door", {
          facing, half: r === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false",
        });
        if (r === 2) doorPlaced = true;
        continue;
      }
      if (isDoorCol && r === 3) { g.set(x, y, z, "white_concrete"); continue; }
      g.set(x, y, z, "glass_pane", glassProps(facing));
      if (r === 2 && ai % 8 === 5 && innerIsInterior) g.set(innerX, y, innerZ, "shroomlight");
      continue;
    }

    // Upper storey: spandrels at r0 and r4, glazed bays between piers.
    if (r === 0 || r === 4) {
      g.set(x, y, z, pier ? "white_concrete" : "light_gray_concrete");
      continue;
    }
    if (pier) { g.set(x, y, z, "white_concrete"); continue; }
    g.set(x, y, z, "glass_pane", glassProps(facing));
    if (r === 2 && ai % 8 === 2 && innerIsInterior) g.set(innerX, y, innerZ, "glowstone");
  }
}

// Pass 3: rooftop water tank (3x3 ring) and a couple of AC units on the deck.
const R_ALL = [...ground].map(([k, gl]) => roofRow(gl));
const roofFlat = R_ALL.every(v => v === R_ALL[0]);
if (roofFlat) {
  const R = R_ALL[0];
  const interior = (x, z) => has(x, z) && !isEdge(x, z);
  let best = null, bestD = Infinity;
  for (const [key] of ground) {
    const [cx, cz] = key.split(",").map(Number);
    let ok = true;
    for (let i = -1; i <= 1 && ok; i++)
      for (let j = -1; j <= 1 && ok; j++)
        if (!interior(cx + i, cz + j)) ok = false;
    if (!ok) continue;
    const d = Math.abs(cx - 9) + Math.abs(cz - 18);
    if (d < bestD) { bestD = d; best = [cx, cz]; }
  }
  if (best && R + 3 <= H - 1) {
    const [cx, cz] = best;
    for (let y = R + 1; y <= R + 3; y++)
      for (let i = -1; i <= 1; i++)
        for (let j = -1; j <= 1; j++) {
          if (i === 0 && j === 0) continue;
          g.set(cx + i, y, cz + j, "white_concrete");
        }
    for (let i = -1; i <= 1; i++) g.set(cx + i, R + 4 <= H - 1 ? R + 4 : R + 3, cz, "smooth_stone");
  }
  // AC units on interior deck cells away from the tank.
  let placed = 0;
  for (const [key] of ground) {
    if (placed >= 2) break;
    const [x, z] = key.split(",").map(Number);
    if (!interior(x, z) || (best && Math.abs(x - best[0]) <= 2 && Math.abs(z - best[1]) <= 2)) continue;
    if ((x + z) % 7 !== 0) continue;
    g.set(x, R + 1, z, "iron_block");
    placed++;
  }
}

g.save(`${DIR}/${ID}.nbt`);
