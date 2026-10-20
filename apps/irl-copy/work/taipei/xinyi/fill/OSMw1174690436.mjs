import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1980s-90s Xinyi commercial block: two storeys, stone plinth,
// white tile piers, glazed shopfront, parapet, rooftop plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174690436";
const W = 22, H = 23, D = 36;
const ROOF = 11;      // roof deck level above lowest ground
const PARAPET = 12;   // top of parapet

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Normalise grounds so the lowest footprint cell sits at y 0.
const raw = cells.filter(([x, z]) => x >= 0 && x < W && z >= 0 && z < D);
const minG = Math.min(...raw.map(c => c[2]));
const G = new Map();
for (const [x, z, gr] of raw) G.set(`${x},${z}`, gr - minG);

const inSet = (x, z) => G.has(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const facesOf = (x, z) => DIRS.filter(([dx, dz]) => !inSet(x + dx, z + dz));

const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (!inSet(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const bool = b => (b ? "true" : "false");

for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  const fs = facesOf(x, z);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (fs.length === 0) {
    // Interior: floor slabs per storey and the roof deck.
    for (const y of [gr, 5, 10]) if (y >= gr && y <= 10) put(x, y, z, "smooth_stone");
    put(x, ROOF, z, "gray_concrete");
    continue;
  }

  // Edge cell: facade.
  const o = fs[0];
  const onZFace = o[1] !== 0;
  const a = onZFace ? x : z;                 // position along the facade
  const isWin = a % 3 !== 0;                 // window bays, piers every third cell
  const entrance = o[1] === 1 && a >= 9 && a <= 12;   // main entrance on south face
  const inX = x - o[0], inZ = z - o[1];
  const inward = inSet(inX, inZ);
  const facing = o[1] === 1 ? "south" : o[1] === -1 ? "north" : o[0] === 1 ? "east" : "west";

  const paneProps = () => {
    const west = isWin && false; // placeholder to keep structure clear
    if (onZFace) {
      return {
        north: "false", south: "false",
        east: bool(isWin && (a + 1) % 3 !== 0 && inSet(x + 1, z)),
        west: bool(isWin && (a - 1) % 3 !== 0 && inSet(x - 1, z)),
        waterlogged: "false",
      };
    }
    return {
      east: "false", west: "false",
      north: bool(isWin && (a - 1) % 3 !== 0 && inSet(x, z - 1)),
      south: bool(isWin && (a + 1) % 3 !== 0 && inSet(x, z + 1)),
      waterlogged: "false",
    };
  };

  for (let y = gr; y <= PARAPET; y++) {
    if (y === gr) {
      put(x, y, z, "stone_bricks");                       // base course
    } else if (y <= 4) {
      if (y === 4) {
        put(x, y, z, "smooth_stone");                     // ground-floor lintel
      } else if (entrance) {
        if (a === 10 && (y === gr + 1 || y === gr + 2)) {
          const half = y === gr + 1 ? "lower" : "upper";
          put(x, y, z, "oak_door", {
            facing, half, hinge: "left", open: "false", powered: "false",
          });
        } else {
          put(x, y, z, "glass");                          // entrance glazing
        }
      } else if (a % 4 === 0) {
        put(x, y, z, "white_terracotta");                 // shopfront pier
      } else {
        put(x, y, z, "glass");                            // shopfront glazing
      }
    } else if (y === 5) {
      put(x, y, z, "smooth_stone");                       // storey line
    } else if (y <= 9) {
      if (!isWin) {
        put(x, y, z, "white_terracotta");
      } else if (y === 6 || y === 9) {
        put(x, y, z, "light_gray_concrete");              // sill and head frames
      } else {
        put(x, y, z, "glass_pane", paneProps());
      }
    } else if (y === 10) {
      put(x, y, z, "smooth_stone");                       // cornice band
    } else if (y === 11) {
      put(x, y, z, "light_gray_concrete");                // parapet body
    } else {
      put(x, y, z, "smooth_stone");                       // parapet cap
    }
  }

  // Warm light behind some glazing (air gap inside the facade).
  if (isWin && a % 9 === 4 && inward) put(inX, 7, inZ, "shroomlight");
  if (!entrance && !isWin && false) { /* no-op */ }
  if (!entrance && a % 4 !== 0 && a % 8 === 1 && inward) put(inX, gr + 2, inZ, "glowstone");
}

// Rooftop plant: a solid enclosure centred on the roof, with units on top.
for (let x = 7; x <= 14; x++) {
  for (let z = 12; z <= 21; z++) {
    if (!inSet(x, z)) continue;
    const edge = facesOf(x, z).length > 0;
    if (edge) continue;
    put(x, 12, z, "stone_bricks");
    put(x, 13, z, "stone_bricks");
  }
}
for (const [x, z] of [[8, 13], [9, 13], [12, 13], [13, 13], [8, 17], [9, 17], [12, 17], [13, 17]]) {
  if (inSet(x, z) && facesOf(x, z).length === 0) put(x, 14, z, "iron_block");
}
for (const [x, z] of [[10, 15], [11, 19]]) {
  if (inSet(x, z) && facesOf(x, z).length === 0) put(x, 14, z, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
