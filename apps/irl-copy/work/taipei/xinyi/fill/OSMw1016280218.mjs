import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280218";
const W = 20, H = 33, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint helpers -------------------------------------------------
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const has = (x, z) => ground.has(key(x, z));
const minG = Math.min(...cells.map(c => Math.round(c[2])));

// Roof sits 21 blocks above the lowest ground: 4 storeys of 5 blocks, then a
// 2-block parapet (cornice at dy 20, cap at dy 21).
const dyTop = 21;

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (!has(x, z)) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

// outward direction for a perimeter cell (ox/oz = -1, 0 or 1)
const outward = (x, z) => {
  let ox = 0, oz = 0;
  if (!has(x - 1, z)) ox = -1; else if (!has(x + 1, z)) ox = 1;
  if (!has(x, z - 1)) oz = -1; else if (!has(x, z + 1)) oz = 1;
  return { ox, oz };
};
const isEdge = (x, z) =>
  has(x, z) && (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1));

// Entrance faces the street side (smallest z), centred along x.
const midX = Math.floor(W / 2);
const isEntrance = (x, z) => isEdge(x, z) && !has(x, z - 1) && Math.abs(x - midX) <= 2;

// ---- facade pattern ------------------------------------------------------
// dy = height above lowest ground. Storeys every 5 blocks:
// r0 floor line, r1-3 glazing with mullions, r4 spandrel.
function facade(x, z, dy) {
  const s = Math.floor(dy / 5);
  const r = dy % 5;

  if (dy === 20) return ["smooth_stone"];          // cornice
  if (dy === 21) return ["white_concrete"];        // parapet cap

  if (isEntrance(x, z) && s === 0) {
    if (r === 0) return ["stone_bricks"];
    if (r === 4) return ["smooth_stone"];          // canopy fascia
    if (r === 3) return ["smooth_stone"];          // lintel
    return ["black_stained_glass"];                // entrance opening
  }

  if (r === 0) return [s === 0 ? "stone_bricks" : "light_gray_concrete"];
  if (r === 4) return ["white_concrete"];          // spandrel

  const mullion = (x % 3 === 0) || (z % 3 === 0);
  if (mullion) return ["white_concrete"];
  return [s === 0 ? "cyan_stained_glass" : "light_blue_stained_glass"];
}

// ---- main build ------------------------------------------------------------
for (const [xr, zr, grr] of cells) {
  const x = xr, z = zr, gr = Math.round(grr);

  // foundation: solid from base up to this cell's ground
  for (let y = minG; y < gr; y++) put(x, y, z, "stone_bricks");

  // floor slabs per storey across the whole footprint (interior too)
  for (let s = 0; s < 4; s++) {
    const y = minG + 5 * s;
    if (y >= gr) put(x, y, z, "light_gray_concrete");
  }

  // roof deck
  const roofY = minG + dyTop - 1;
  if (roofY >= gr) put(x, roofY, z, "gray_concrete");

  if (isEdge(x, z)) {
    for (let dy = Math.max(0, gr - minG); dy <= dyTop; dy++) {
      const y = minG + dy;
      if (y < gr) continue;
      const [b, p] = facade(x, z, dy);
      put(x, y, z, b, p ? p : undefined);
    }
  }
}

// warm lights: glowstone on the inside of some lit window bays
for (const [xr, zr, grr] of cells) {
  const x = xr, z = zr, gr = Math.round(grr);
  if (!isEdge(x, z)) continue;
  const { ox, oz } = outward(x, z);
  if ((ox === 0) === (oz === 0)) continue; // only straight faces
  const ix = x - ox, iz = z - oz;
  if (!has(ix, iz) || isEdge(ix, iz)) continue;
  for (let s = 0; s < 4; s++) {
    const dy = 5 * s + 2;
    const y = minG + dy;
    if (y < gr) continue;
    const mullion = (x % 3 === 0) || (z % 3 === 0);
    if (mullion) continue;
    if ((x + z + s) % 3 !== 0) continue;
    put(ix, y, iz, "glowstone");
  }
}

// ---- penthouse and roof equipment -----------------------------------------
const px0 = 4, px1 = W - 5, pz0 = 4, pz1 = D - 5;
const base = minG + dyTop; // top of parapet line; penthouse starts above parapet
for (let x = px0; x <= px1; x++) {
  for (let z = pz0; z <= pz1; z++) {
    if (!has(x, z)) continue;
    const border = x === px0 || x === px1 || z === pz0 || z === pz1;
    // floor of penthouse on the roof deck
    put(x, base, z, "gray_concrete");
    if (border) {
      put(x, base + 1, z, "white_concrete");
      const mullion = (x % 3 === 0) || (z % 3 === 0);
      put(x, base + 2, z, mullion ? "white_concrete" : "light_blue_stained_glass");
      put(x, base + 3, z, "white_concrete");
    }
    // roof cap
    put(x, base + 4, z, "light_gray_concrete");
  }
}
// short mast on the penthouse
const cxm = Math.floor((px0 + px1) / 2), czm = Math.floor((pz0 + pz1) / 2);
for (let dy = 5; dy <= 7; dy++) {
  put(cxm, minG + dyTop + dy - 1, czm, "iron_bars");
}
put(cxm, minG + dyTop + 7, czm, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);
