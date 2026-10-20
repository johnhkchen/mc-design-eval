import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538408112";
const W = 27, H = 23, D = 15;

// Storey levels (absolute y). Lowest ground is y 0; roof deck sits at 11.
const BAND = 5;      // first floor line
const CORNICE = 10;  // top of walls
const ROOF = 11;     // roof deck
const PARAPET = 12;  // parapet course
const DOOR_X = 13;   // door column on south frontage

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.max(0, Math.min(9, Math.round(gr))));
}
const has = (x, z) => ground.has(key(x, z));

function exposedFaces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
}

// Facade block for a perimeter wall cell.
// i = position along the face (x for N/S, z for W/E); last = final index on that face.
function wallBlock(face, i, last, y, gr) {
  const pillar = i % 3 === 0 || i === last;
  if (y === CORNICE || y === BAND) return { id: "red_terracotta" };
  if (y > BAND) {
    // upper storey: y 6..9
    if (pillar || y === 6) return { id: "white_concrete" };
    return { id: "light_blue_stained_glass" };
  }
  // ground storey: y gr+2 .. 4
  if (y === 4) return { id: "white_concrete" }; // shopfront lintel
  if (pillar) return { id: "white_concrete" };
  return { id: "light_blue_stained_glass" };
}

for (const [x, z, gr] of cells) {
  const base = ground.get(key(x, z));
  const faces = exposedFaces(x, z);
  const perimeter = faces.length > 0;

  // Foundation: solid from y 0 up to and including the ground cell.
  for (let y = 0; y <= base; y++) g.set(x, y, z, "stone_bricks");

  if (perimeter) {
    const face = faces[0];
    const isNS = face === "N" || face === "S";
    const i = isNS ? x : z;
    const last = isNS ? 26 : 14;

    for (let y = base + 1; y <= CORNICE; y++) {
      if (y === base + 1) {
        g.set(x, y, z, "stone_bricks"); // base course
        continue;
      }
      // Entrance on the south frontage: glass door centred on DOOR_X.
      if (face === "S" && x === DOOR_X && y >= base + 2 && y <= base + 3 && base + 3 <= 4) {
        const half = y === base + 2 ? "lower" : "upper";
        g.set(x, y, z, "oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
        continue;
      }
      const b = wallBlock(face, i, last, y, base);
      g.set(x, y, z, b.id);
    }

    // Warm lights set back inside the upper-storey windows.
    if (base < 8) {
      for (const f of faces) {
        const along = f === "N" || f === "S" ? x : z;
        const lastAlong = f === "N" || f === "S" ? 26 : 14;
        const isPillar = along % 3 === 0 || along === lastAlong;
        if (isPillar || along % 6 !== 2) continue;
        let lx = x, lz = z;
        if (f === "N") lz = z + 2;
        if (f === "S") lz = z - 2;
        if (f === "W") lx = x + 2;
        if (f === "E") lx = x - 2;
        if (has(lx, lz)) g.set(lx, 8, lz, "shroomlight");
      }
    }
  } else {
    // Interior: first-floor slab only (no fitted interiors).
    if (BAND > base) g.set(x, BAND, z, "smooth_stone");
    // Pendant lanterns under the first-floor slab.
    if (BAND > base && x % 6 === 4 && z % 5 === 2) {
      g.set(x, BAND - 1, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }

  // Roof deck across every footprint cell.
  g.set(x, ROOF, z, "stone_bricks");

  // Parapet and cap on the perimeter.
  if (perimeter) {
    g.set(x, PARAPET, z, "white_concrete");
    g.set(x, PARAPET + 1, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  } else if (x % 6 === 3 && z % 5 === 2) {
    // Roof plant: air-conditioning units.
    g.set(x, PARAPET, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
