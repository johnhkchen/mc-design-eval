import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey Xinyi-style mid-century shophouse block: stone plinth, cream
// tiled-concrete walls, a red sign band over a shopfront ground floor, paired
// upper windows with header and sill courses, a stone parapet, and two
// rooftop units. Ground is stepped to the lidar footprint (y 0 = lowest ground).

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw542016203";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 21, H = 23, D = 16;
const g = new Voxels([W, H, D]);

const ROOF_DECK = 10;   // roof deck layer (interior), cornice layer (exterior)
const PARAPET = 11;     // parapet layer on the perimeter

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

const glassN = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const glassEW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Exterior faces per cell and pillar/corner classification.
const info = [];
for (const [x, z, gr] of cells) {
  const ex = {
    N: !has(x, z - 1),
    S: !has(x, z + 1),
    W: !has(x - 1, z),
    E: !has(x + 1, z),
  };
  const nFaces = (ex.N ? 1 : 0) + (ex.S ? 1 : 0) + (ex.W ? 1 : 0) + (ex.E ? 1 : 0);
  const onNS = ex.N || ex.S;
  const t = onNS ? x : z;
  const pillar = nFaces >= 2 || t % 3 === 0;
  info.push({ x, z, gr, ex, nFaces, t, onNS, pillar, exterior: nFaces > 0 });
}

// Entrance: middle opening on the north face (ground-floor door).
const northOpenings = info
  .filter(c => c.ex.N && c.nFaces === 1 && !c.pillar)
  .map(c => c.x)
  .sort((a, b) => a - b);
const doorX = northOpenings.length ? northOpenings[Math.floor(northOpenings.length / 2)] : null;

for (const c of info) {
  const { x, z, gr, ex, exterior, nFaces, t, onNS, pillar } = c;

  // Foundation under the cell up to its ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Plinth / ground floor slab.
  g.set(x, gr, z, exterior ? "polished_andesite" : "smooth_stone");

  // Storey line: floor slab between ground floor and upper floor.
  const f2 = gr + Math.floor((ROOF_DECK - gr) / 2);
  g.set(x, f2, z, exterior ? "smooth_quartz" : "smooth_stone");

  // Roof deck, cornice and parapet.
  if (exterior) {
    g.set(x, ROOF_DECK, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    g.set(x, PARAPET, z, "stone_bricks");
  } else {
    g.set(x, ROOF_DECK, z, "gray_concrete");
  }

  if (!exterior) continue;

  // Inward neighbour for placing light sources behind glass.
  let inward = null;
  if (nFaces === 1) {
    if (ex.N) inward = [x, z + 1];
    else if (ex.S) inward = [x, z - 1];
    else if (ex.W) inward = [x + 1, z];
    else if (ex.E) inward = [x - 1, z];
  }
  const inwardOk = inward && has(inward[0], inward[1]);

  // Walls, shopfronts, windows.
  for (let y = gr + 1; y <= 9; y++) {
    if (y === f2) continue;

    if (y < f2) {
      // Ground storey: shopfront.
      if (pillar) {
        g.set(x, y, z, "smooth_quartz");
      } else if (y === f2 - 1) {
        g.set(x, y, z, "red_terracotta"); // sign band
      } else if (ex.N && x === doorX && y <= gr + 2) {
        const half = y === gr + 1 ? "lower" : "upper";
        g.set(x, y, z, "dark_oak_door", {
          facing: "north", half, hinge: "left", open: "false", powered: "false",
        });
      } else {
        g.set(x, y, z, "glass_pane", onNS ? glassN : glassEW);
        if (inwardOk && y === gr + 2 && t % 6 === 1) {
          g.set(inward[0], y, inward[1], "glowstone");
        }
      }
    } else {
      // Upper storey: paired windows with sill and header.
      if (pillar || y === f2 + 1 || y === 9) {
        g.set(x, y, z, "smooth_quartz");
      } else {
        g.set(x, y, z, "glass_pane", onNS ? glassN : glassEW);
        if (inwardOk && y === f2 + 2 && t % 6 === 2) {
          g.set(inward[0], y, inward[1], "lantern", { hanging: "false", waterlogged: "false" });
        }
      }
    }
  }
}

// Two rooftop air-conditioning units near the middle of the roof.
const interior = info.filter(c => !c.exterior);
if (interior.length) {
  const cx = (W - 1) / 2, cz = (D - 1) / 2;
  const picks = [...interior]
    .sort((a, b) => Math.hypot(a.x - cx, a.z - cz) - Math.hypot(b.x - cx, b.z - cz))
    .slice(0, 2);
  for (const c of picks) g.set(c.x, PARAPET - 1, c.z, "iron_block");
}

g.save(`${dir}/${id}.nbt`);
