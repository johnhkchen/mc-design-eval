import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi-district low-rise commercial block, c.1985-1995: a concrete-frame shophouse with
// a red shopfront fascia, a cream tiled upper facade in bays, a cornice and parapet, a
// central entrance, and a rooftop water tank. Floors sit at base+5 and base+10.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw643833880";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 12, H = 23, D = 25;
const g = new Voxels([W, H, D]);

const ground = new Map();
let base = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  base = Math.min(base, gr);
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// Outward faces of a footprint cell: dz=-1 is the street (front) face.
function outFaces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push({ dx: 0, dz: -1 });
  if (!has(x, z + 1)) f.push({ dx: 0, dz: 1 });
  if (!has(x - 1, z)) f.push({ dx: -1, dz: 0 });
  if (!has(x + 1, z)) f.push({ dx: 1, dz: 0 });
  return f;
}

const xs = cells.map(c => c[0]);
const zs = cells.map(c => c[1]);
const midX = Math.floor((Math.min(...xs) + Math.max(...xs)) / 2);

const DOOR_FACING = "north";
const doorProps = half => ({ facing: DOOR_FACING, half, hinge: "left", open: "false", powered: "false" });

for (const [x, z, gc] of cells) {
  // Foundation up to this cell's ground so nothing floats on the slope.
  for (let y = 0; y < gc; y++) g.set(x, y, z, "stone_bricks");

  const faces = outFaces(x, z);
  const edge = faces.length > 0;
  const top = base + 11;

  for (let y = gc; y <= top && y < H; y++) {
    const r = y - base;

    // Roof deck (interior) at r=10.
    if (r === 10 && !edge) { g.set(x, y, z, "gray_concrete"); continue; }
    // Second-storey floor slab at r=5.
    if (r === 5 && !edge) { g.set(x, y, z, "smooth_stone"); continue; }
    // Interior air elsewhere.
    if (!edge && r !== 10) continue;

    // Edge (façade) cells from here on.
    const f0 = faces[0];
    const along = f0.dz !== 0 ? x : z;
    const pillar = along % 3 === 0;

    if (r === 11) {
      g.set(x, y, z, "smooth_quartz", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (r === 10) {
      g.set(x, y, z, "smooth_quartz");
      continue;
    }
    if (r === 9 || r === 5) {
      g.set(x, y, z, "quartz_block");
      continue;
    }
    if (r === 4) {
      g.set(x, y, z, "red_concrete");
      continue;
    }
    if (r === 0 || y === gc) {
      g.set(x, y, z, "polished_andesite");
      continue;
    }
    if (r >= 6 && r <= 8) {
      g.set(x, y, z, pillar ? "smooth_quartz" : "glass");
      continue;
    }
    if (r >= 1 && r <= 3) {
      const front = faces.some(f => f.dz === -1);
      if (front) {
        // Entrance: dark oak door at the middle bay of the street face.
        if (z === Math.min(...zs) && x === midX && (r === 1 || r === 2)) {
          g.set(x, y, z, "dark_oak_door", doorProps(r === 1 ? "lower" : "upper"));
          continue;
        }
        g.set(x, y, z, pillar ? "smooth_quartz" : "glass");
      } else {
        g.set(x, y, z, "quartz_block");
      }
      continue;
    }
    // Any remaining wall layer.
    g.set(x, y, z, "quartz_block");
  }

  // Warm lights behind the street-facing glass, inside the interior air.
  if (faces.some(f => f.dz === -1) && has(x, z + 1)) {
    if (x % 6 === 3) g.set(x, base + 2, z + 1, "shroomlight");
    if (x % 6 === 0) g.set(x, base + 7, z + 1, "shroomlight");
  }
}

// Rooftop water tank: a 3x3 ring of white concrete on the roof deck with an iron cap.
const cxAll = Math.round((Math.min(...xs) + Math.max(...xs)) / 2);
const czAll = Math.round((Math.min(...zs) + Math.max(...zs)) / 2);
let tankOk = true;
for (let dx = -1; dx <= 1; dx++)
  for (let dz = -1; dz <= 1; dz++)
    if (!has(cxAll + dx, czAll + dz)) tankOk = false;
if (tankOk) {
  const tyBase = base + 11;
  for (let dy = 0; dy < 2; dy++)
    for (let dx = -1; dx <= 1; dx++)
      for (let dz = -1; dz <= 1; dz++) {
        if (dx === 0 && dz === 0) continue;
        g.set(cxAll + dx, tyBase + dy, czAll + dz, "white_concrete");
      }
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++)
      g.set(cxAll + dx, tyBase + 2, czAll + dz, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
