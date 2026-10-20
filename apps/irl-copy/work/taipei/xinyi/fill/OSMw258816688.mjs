import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw258816688";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 57, H = 19, D = 28;
const ROOF = 6;                       // roof deck top: 7 blocks above lowest ground
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.min(ROOF - 1, Math.max(0, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const missing = {
  xm: (x, z) => !has(x - 1, z),
  xp: (x, z) => !has(x + 1, z),
  zm: (x, z) => !has(x, z - 1),
  zp: (x, z) => !has(x, z + 1),
};
const isEdge = (x, z) => missing.xm(x, z) || missing.xp(x, z) || missing.zm(x, z) || missing.zp(x, z);

// Bounds of the footprint, used for entrance placement and corner towers.
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of ground.keys().map(k => k.split(",").map(Number))) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const midX = Math.round((minX + maxX) / 2);

// Entrance: the south (z max) face, centred on the building, three bays wide.
const inEntrance = (x, z) => z === maxZ && Math.abs(x - midX) <= 2;

// Corner towers: edge cells within 3 blocks of a corner rise two storeys above the roof deck.
const nearCorner = (x, z) =>
  (Math.abs(x - minX) <= 3 || Math.abs(x - maxX) <= 3) &&
  (Math.abs(z - minZ) <= 3 || Math.abs(z - maxZ) <= 3);

for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const gr = ground.get(`${x},${z}`);

  // Foundation: solid from y 0 to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (isEdge(x, z)) {
    // Mullion axis: on north/south faces the rhythm runs along x, on east/west along z.
    const onZFace = missing.zm(x, z) || missing.zp(x, z);
    const bayIndex = onZFace ? x - minX : z - minZ;
    const pillar = bayIndex % 4 === 0;
    const corner = nearCorner(x, z);
    const topY = corner ? ROOF + 2 : ROOF;

    for (let y = gr; y <= topY; y++) {
      let b;
      if (y > ROOF) {
        // Corner tower storeys: glazed bays with a white frame, capped on top.
        if (y === topY) b = "smooth_quartz";
        else b = pillar ? "white_concrete" : (y === ROOF + 1 ? "white_concrete" : "light_blue_stained_glass_pane");
      } else if (y === ROOF) {
        b = "smooth_quartz";                                    // coping
      } else if (y === 5) {
        b = pillar ? "smooth_quartz" : "white_concrete";        // cornice band
      } else if (y <= 1) {
        // Plinth; the entrance bay is a glazed opening framed by pillars.
        if (inEntrance(x, z)) {
          b = (Math.abs(x - midX) === 2) ? "smooth_quartz" : "glass";
        } else {
          b = "polished_andesite";
        }
      } else if (y === 3) {
        b = pillar ? "smooth_quartz" : "white_concrete";        // storey line
      } else {
        // Window rows at y 2 and 4: glass set between pillars, deep shadow via pillar contrast.
        if (inEntrance(x, z) && y === 2) {
          b = (Math.abs(x - midX) === 2) ? "smooth_quartz" : "glass";
        } else {
          b = pillar ? "white_concrete" : "light_blue_stained_glass_pane";
        }
      }
      g.set(x, y, z, b);
    }

    // Entrance canopy: a lintel over the opening, carried by the framing pillars.
    if (inEntrance(x, z)) {
      g.set(x, 3, z, "smooth_quartz");
    }
  } else {
    // Interior: floor slabs per storey, roof deck, no rooms.
    if (gr <= 3) g.set(x, 3, z, "smooth_quartz");
    if (gr < ROOF) g.set(x, gr, z, "smooth_quartz");
    g.set(x, ROOF, z, "stone_bricks");                          // roof deck, lighter than gray concrete
    // Warm lights standing on the floor slabs, seen through the glass.
    if ((x + 2 * z) % 9 === 0 && gr + 1 < 5 && gr + 1 !== 3) {
      g.set(x, gr + 1, z, "glowstone");
    }
    if ((x + z) % 13 === 4 && gr + 1 < 5 && gr + 1 !== 3) {
      g.set(x, gr + 1, z, "shroomlight");
    }
    // Rooftop plant: compact air-handling blocks on the roof deck.
    if (x % 12 >= 6 && x % 12 <= 7 && z % 10 >= 4 && z % 10 <= 5) {
      g.set(x, ROOF + 1, z, "iron_block");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
