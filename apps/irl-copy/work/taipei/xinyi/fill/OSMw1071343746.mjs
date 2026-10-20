import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey shophouse-style commercial block (1980s Xinyi row building):
// stone foundation, granite base course, ground-floor shopfront with a red fascia,
// upper storey of pane windows between white terracotta piers, quartz cornice,
// parapet, roof deck with AC plant, interior lanterns behind some windows.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343746";
const W = 7, H = 23, D = 51;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
let base = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), gr);
  if (gr < base) base = gr;
}
const has = (x, z) => ground.has(key(x, z));
const ROOF = base + 10;       // top solid block index -> roof about 11 blocks above lowest ground
const DOOR_Z = 25;

const g = new Voxels([W, H, D]);

const PANE_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }; // wall runs along z
const PANE_X = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }; // wall runs along x

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward face of an edge cell: prefer the long (W/E) facades, then the short (N/S) ends.
function faceOf(x, z) {
  const f = [];
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (f.includes("W")) return "W";
  if (f.includes("E")) return "E";
  if (f.length) return f[0];
  return null;
}

const DOOR_CELL = (x, z, f) => f === "W" && x === 0 && z === DOOR_Z;

for (const [x, z, gr] of cells) {
  const f = faceOf(x, z);
  const longFace = f === "W" || f === "E";
  const win = longFace ? (z % 4 === 1 || z % 4 === 2) : (x % 3 !== 0);
  const pane = longFace ? PANE_Z : PANE_X;

  for (let y = 0; y < H; y++) {
    // Foundation: solid from 0 up to this cell's ground.
    if (y < gr) { put(x, y, z, "stone_bricks"); continue; }
    if (y > ROOF) continue;

    if (!f) {
      // Interior: air gap, floor slabs per storey, roof deck under the roof.
      if (y === gr || y === base + 5) put(x, y, z, "smooth_stone");
      else if (y === base + 9) put(x, y, z, "gray_concrete");
      continue;
    }

    // Entrance door on the west facade.
    if (DOOR_CELL(x, z, f) && (y === gr + 1 || y === gr + 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: "west",
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (y === gr) { put(x, y, z, "polished_granite"); continue; }           // base course
    if (y >= base + 1 && y <= base + 3) {                                    // shopfront band
      put(x, y, z, win ? "glass" : "white_terracotta");
    } else if (y === base + 4) {                                             // shop fascia
      put(x, y, z, "red_terracotta");
    } else if (y === base + 5) {                                             // floor line
      put(x, y, z, "light_gray_concrete");
    } else if (y >= base + 6 && y <= base + 8) {                             // upper storey
      put(x, y, z, win ? "glass_pane" : "white_terracotta", win ? pane : undefined);
    } else if (y === base + 9) {                                             // cornice
      put(x, y, z, "smooth_quartz");
    } else if (y === ROOF) {                                                 // parapet
      put(x, y, z, "white_terracotta");
    }
  }
}

// Roof plant: two AC housings on the roof deck.
for (const [x0, z0] of [[2, 8], [2, 40]]) {
  for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
    const x = x0 + dx, z = z0 + dz;
    if (!has(x, z) || faceOf(x, z) || ground.get(key(x, z)) > base + 9) continue;
    put(x, ROOF, z, "light_gray_concrete");
    put(x, ROOF + 1, z, "light_gray_concrete");
  }
}

// Warm lanterns standing on interior floors, behind selected window bays.
const LANTERN = { hanging: "false", waterlogged: "false" };
for (let z = 1; z < D - 1; z++) {
  if (has(1, z) && !faceOf(1, z)) {
    if (z % 8 === 2) put(1, base + 6, z, "lantern", LANTERN);
    if (z % 8 === 6 && ground.get(key(1, z)) === base) put(1, base + 1, z, "lantern", LANTERN);
  }
  if (has(5, z) && !faceOf(5, z) && z % 8 === 2) put(5, base + 6, z, "lantern", LANTERN);
}

g.save(`${DIR}/${ID}.nbt`);
