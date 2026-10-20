import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541865188";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 12, H = 23, D = 16;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
let maxG = 0;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  maxG = Math.max(maxG, gr);
}
const has = (x, z) => ground.has(`${x},${z}`);
const key = (x, z) => `${x},${z}`;

// Storey lines (2 storeys of ~5 blocks, parapet above)
const R = Math.max(11, maxG + 1);   // roof slab top level
const FM = R - 6;                   // floor between storeys (y=5)
const FT = R - 1;                   // upper storey ceiling (y=10)
const PAR = R + 1;                  // parapet course (y=12)

// Edge classification: which facade a footprint cell sits on, and its bay index
const edge = new Map();
for (const [x, z] of ground.keys().map(k => k.split(",").map(Number))) {
  let face = null, idx = 0;
  if (!has(x, z - 1)) { face = "north"; idx = x; }
  else if (!has(x, z + 1)) { face = "south"; idx = x; }
  else if (!has(x - 1, z)) { face = "west"; idx = z; }
  else if (!has(x + 1, z)) { face = "east"; idx = z; }
  if (face) edge.set(key(x, z), { face, idx });
}

// Entrance: prefer the south (street) facade, else whatever exists
const faceCounts = {};
for (const e of edge.values()) faceCounts[e.face] = (faceCounts[e.face] || 0) + 1;
const doorFace = faceCounts.south ? "south" : Object.keys(faceCounts)[0];
const doorIdxs = [...edge.values()].filter(e => e.face === doorFace).map(e => e.idx).sort((a, b) => a - b);
const doorIdx = doorIdxs[Math.floor(doorIdxs.length / 2)];

const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

function facade(x, z, y, e, gr) {
  const { face: f, idx: i } = e;
  if (y < FM) {
    // Ground floor: shopfront with pilasters and one entrance bay
    if (f === doorFace && i === doorIdx) {
      if (y === gr + 1 || y === gr + 2) {
        g.set(x, y, z, "dark_oak_door", {
          facing: f,
          half: y === gr + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        return;
      }
      if (y === FM - 1 && FM - 1 > gr + 2) {
        g.set(x, y, z, "glass");
        g.set(x, y - 1 >= gr + 3 ? y : y, z, "glass"); // keep glazing behind lamp
        g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        return;
      }
    }
    if (i % 3 === 0) g.set(x, y, z, "stone_bricks");
    else g.set(x, y, z, "glass");
    return;
  }

  // Upper storey: white wall, glass-pane window bays, lit rooms
  if (y < FT) {
    if (i % 3 === 1) {
      g.set(x, y, z, "glass_pane");
      if (i % 6 === 1 && y === FM + 2) {
        const [dx, dz] = INWARD[f];
        const ix = x + dx, iz = z + dz;
        if (has(ix, iz) && !edge.has(key(ix, iz))) {
          g.set(ix, y, iz, "glowstone");
        }
      }
    } else if (i % 3 === 0) {
      g.set(x, y, z, "smooth_stone");
    } else {
      g.set(x, y, z, "white_concrete");
    }
  }
}

for (const [x, z, gr] of cells) {
  const k = key(x, z);
  const e = edge.get(k);

  // Solid foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= PAR; y++) {
    if (y === R) {
      // Roof slab (cornice reads at the edges)
      g.set(x, y, z, e ? "stone_brick_slab" : "smooth_stone", e ? { type: "top", waterlogged: "false" } : undefined);
    } else if (y === PAR) {
      if (e) {
        g.set(x, y, z, "white_concrete");
      } else if ((x * 3 + z) % 7 === 0) {
        // Rooftop air-conditioning plant
        g.set(x, y, z, "light_gray_concrete");
      }
    } else if (y === gr && e) {
      // Base course on the facades
      g.set(x, y, z, "polished_granite");
    } else if (y === gr || y === FM || y === FT) {
      // Floor slabs / string courses
      g.set(x, y, z, "smooth_stone");
    } else if (e) {
      facade(x, z, y, e, gr);
    }
    // Interior cells above the floor stay open air (no interiors)
  }
}

g.save(`${DIR}/${ID}.nbt`);
