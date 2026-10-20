import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi commercial block (two storeys over a stone plinth, flat roof with
// stone parapet). Late-1980s / 1990s street-level shopfront and mall-style glazing,
// light concrete piers, stone cornice and storey band.

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw980871790.cells.json", "utf8"));
const W = 41, H = 23, D = 24;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);

const minG = Math.min(...ground.values());
const TOP = minG + 10;          // top course index: parapet and roof deck (roof ~11 above lowest ground)

// Outward neighbour offsets and the facing name used for doors.
const FACES = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};

const exteriorFaces = (x, z) =>
  Object.keys(FACES).filter(f => {
    const [dx, dz] = FACES[f];
    return !ground.has(key(x + dx, z + dz));
  });

// Work out which faces are facade, and the coordinate range along each.
const faceCount = { north: 0, south: 0, west: 0, east: 0 };
const faceMin = { north: Infinity, south: Infinity, west: Infinity, east: Infinity };
const faceMax = { north: -Infinity, south: -Infinity, west: -Infinity, east: -Infinity };
for (const [x, z] of cells) {
  for (const f of exteriorFaces(x, z)) {
    faceCount[f]++;
    const along = (f === "north" || f === "south") ? x : z;
    faceMin[f] = Math.min(faceMin[f], along);
    faceMax[f] = Math.max(faceMax[f], along);
  }
}
// Main entrance on the face with the longest frontage (ties: order above).
const entranceFace = Object.keys(faceCount).reduce((a, b) => (faceCount[b] > faceCount[a] ? b : a));
const entranceMid = Math.round((faceMin[entranceFace] + faceMax[entranceFace]) / 2);

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const faces = exteriorFaces(x, z);
  const facade = faces.length > 0;
  const primary = faces.includes(entranceFace) ? entranceFace : faces[0];
  const along = primary ? ((primary === "north" || primary === "south") ? x : z) : 0;
  const t = primary ? along - faceMin[primary] : 0;
  const outward = primary;

  for (let y = gr; y <= TOP; y++) {
    const rel = y - minG;

    // Base course / floor slab at the cell's own ground.
    if (y === gr) {
      g.set(x, y, z, facade ? "polished_andesite" : "smooth_stone");
      continue;
    }

    // Roof level: parapet on the facade, roof deck inside.
    if (rel === TOP - minG) {
      g.set(x, y, z, facade ? "stone_bricks" : "smooth_stone");
      continue;
    }

    // Storey line between the two floors.
    if (rel === 5) {
      g.set(x, y, z, facade ? "smooth_stone" : "smooth_stone");
      continue;
    }

    // Interior: air behind the glass, nothing else.
    if (!facade) continue;

    // Facade rows: ground storey 1..4, upper storey 6..9.
    if (rel >= 1 && rel <= 4) {
      const isEntranceFace = primary === entranceFace;
      const nearEntrance = isEntranceFace && Math.abs(t - (entranceMid - faceMin[entranceFace])) <= 1;
      const doorCol = isEntranceFace && t === entranceMid - faceMin[entranceFace];

      if (doorCol && (rel === 1 || rel === 2)) {
        g.set(x, y, z, "oak_door", {
          facing: outward,
          half: rel === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (nearEntrance && rel === 3) {
        g.set(x, y, z, "stone_bricks");            // entrance lintel
      } else if (nearEntrance) {
        g.set(x, y, z, "glass");                   // lobby glazing
      } else if (t % 3 === 0) {
        g.set(x, y, z, "polished_andesite");       // shopfront piers
      } else {
        g.set(x, y, z, "glass");                   // shopfront glazing
      }
      continue;
    }

    if (rel >= 6 && rel <= 9) {
      if (rel === 6 || rel === 9) {
        g.set(x, y, z, "white_concrete");          // frame rails top and bottom of the storey
      } else if (t % 3 === 0) {
        g.set(x, y, z, "white_concrete");          // piers
      } else if (rel === 7 && t % 6 === 1) {
        g.set(x, y, z, "glowstone");               // warm light behind a window
      } else {
        g.set(x, y, z, "glass");
      }
    }
  }
}

// Roof plant: a few mechanical boxes on the roof deck.
for (const [x, z] of cells) {
  if (exteriorFaces(x, z).length === 0 && x % 7 === 3 && z % 5 === 2) {
    g.set(x, TOP + 1, z, "iron_block");
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw980871790.nbt");
