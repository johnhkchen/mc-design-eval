import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1042397505";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 27 x 23 x 15 footprint volume: 2-storey 1980s commercial block, flat parapet roof
// at about 11 blocks above the lowest ground, with a small roof penthouse.
const W = 27, H = 23, D = 15;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const fp = new Map();
for (const [x, z, gr] of cells) fp.set(key(x, z), gr);
const has = (x, z) => fp.has(key(x, z));
const B = Math.min(...cells.map((c) => c[2])); // lowest ground = base level

function faces(x, z) {
  return { N: !has(x, z - 1), S: !has(x, z + 1), W: !has(x - 1, z), E: !has(x + 1, z) };
}

// Which exterior face a single-face wall cell sits on, if it is a window bay.
function bayFace(x, z, f) {
  const n = (f.N ? 1 : 0) + (f.S ? 1 : 0) + (f.W ? 1 : 0) + (f.E ? 1 : 0);
  if (n !== 1) return null;
  if ((f.N || f.S) && x % 3 === 1) return f.N ? "N" : "S";
  if ((f.W || f.E) && z % 3 === 1) return f.W ? "W" : "E";
  return null;
}

// ---- Pass 1: foundations, shell walls, interior decks and columns ----
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const f = faces(x, z);
  const shell = f.N || f.S || f.E || f.W;

  if (shell) {
    // Walls from ground to the parapet course.
    for (let y = gr; y < B + 11; y++) {
      const o = y - B;
      let id;
      if (o === 0) id = "stone_bricks";          // base course
      else if (o === 5 || o === 10) id = "light_gray_concrete"; // storey lines / cornice
      else id = "smooth_quartz";                  // wall
      g.set(x, y, z, id);
    }
    // Parapet cap.
    if (gr <= B + 11) g.set(x, B + 11, z, "white_concrete");
  } else {
    // Interior: storey decks and structural columns (no interior fit-out).
    if (gr <= B + 5) g.set(x, B + 5, z, "light_gray_concrete");
    if (gr <= B + 10) g.set(x, B + 10, z, "light_gray_concrete");
    if (x % 6 === 3 && z % 5 === 2) {
      for (let y = gr; y <= B + 10; y++) g.set(x, y, z, "white_concrete");
    }
  }
}

// ---- Pass 2: openings on window bays and the shopfront ----
for (const [x, z, gr] of cells) {
  const f = faces(x, z);
  if (!(f.N || f.S || f.E || f.W)) continue;

  // Shopfront band along the south (Xinyi-side) frontage, ground storey.
  const onShopfront = f.S && x >= 9 && x <= 17;

  const face = bayFace(x, z, f);
  const isBay = face !== null;

  // Ground-storey glass (shopfront or bay).
  if (onShopfront || isBay) {
    for (let o = 1; o <= 3; o++) {
      const y = B + o;
      if (y < gr) continue;
      if (onShopfront) {
        g.set(x, y, z, "light_blue_stained_glass");
      } else {
        const warm = (x + z) % 3 === 0 && o === 2;
        g.set(x, y, z, warm ? "shroomlight" : "light_blue_stained_glass");
      }
    }
  }

  // Upper-storey windows on bays only.
  if (isBay) {
    for (let o = 7; o <= 9; o++) {
      const y = B + o;
      if (y < gr) continue;
      const lit = (x + z) % 5 === 0 && o === 8;
      g.set(x, y, z, lit ? "glowstone" : "light_blue_stained_glass");
    }
    if (B + 6 >= gr) g.set(x, B + 6, z, "smooth_quartz_slab", { type: "bottom" });
  }

  // Dark canopy band over the shopfront at the fascia course.
  if (onShopfront && B + 4 >= gr) {
    g.set(x, B + 4, z, "dark_oak_planks");
  }
}

// ---- Entrance door on the south frontage ----
if (has(13, 14)) {
  const gr = fp.get(key(13, 14));
  const y0 = Math.max(gr, B + 1);
  g.set(13, y0, 14, "dark_oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(13, y0 + 1, 14, "dark_oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

// ---- Roof equipment: penthouse box, vents, rooftop beacon ----
for (let x = 7; x <= 11; x++) {
  for (let z = 4; z <= 9; z++) {
    if (!has(x, z)) continue;
    const gr = fp.get(key(x, z));
    if (gr > B + 11) continue;
    g.set(x, B + 11, z, "light_gray_concrete");
    g.set(x, B + 12, z, "light_gray_concrete");
    if (x === 9 && z === 6) g.set(x, B + 13, z, "shroomlight");
  }
}
for (let x = 19; x <= 21; x++) {
  for (let z = 3; z <= 4; z++) {
    if (!has(x, z)) continue;
    const gr = fp.get(key(x, z));
    if (gr > B + 11) continue;
    g.set(x, B + 11, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
