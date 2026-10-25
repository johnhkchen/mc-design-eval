import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499697.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499697.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 12, H = 26, D = 14;
const g = new Voxels([W, H, D]);

const byKey = new Map();
for (const [x, z, gr, roof] of cells) {
  byKey.set(`${x},${z}`, { g: Math.round(gr), r: Math.min(H - 1, Math.round(roof)) });
}
const has = (x, z) => byKey.has(`${x},${z}`);
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const GLASS_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const GLASS_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Pass 1: massing, foundations, floors, roof
for (const [x, z, gr, roof] of cells) {
  const { g: gd, r } = byKey.get(`${x},${z}`);
  const per = isPerim(x, z);

  // foundation up to the cell's ground
  for (let y = 0; y < gd; y++) g.set(x, y, z, "stone_bricks");

  if (per) {
    for (let y = gd; y < r - 1; y++) g.set(x, y, z, "smooth_stone");
    g.set(x, gd, z, "stone_bricks");                  // base course
    if (gd + 5 < r - 1) g.set(x, gd + 5, z, "stone_bricks"); // storey line
    if (gd + 10 < r - 1) g.set(x, gd + 10, z, "stone_bricks");
    if (r - 1 >= gd) g.set(x, r - 1, z, "chiseled_stone_bricks"); // cornice / parapet
  } else {
    g.set(x, gd, z, "stone_bricks");                  // floor slab
    if (gd + 5 < r) g.set(x, gd + 5, z, "stone_bricks");
    if (gd + 10 < r) g.set(x, gd + 10, z, "stone_bricks");
    g.set(x, r - 1, z, "smooth_stone");               // roof deck
    // roof equipment: AC units
    if ((x + z) % 5 === 0 && r < H - 2) {
      g.set(x, r, z, "iron_block");
    }
  }
}

// Pass 2: facades - shopfronts, upper windows, door, canopy, lights
for (const [x, z] of byKey.keys().constructor === Object ? [] : [...byKey.keys()].map(k => k.split(",").map(Number))) {
  const { g: gd, r } = byKey.get(`${x},${z}`);
  if (!isPerim(x, z)) continue;

  const faces = [];
  if (z === 0) faces.push({ axis: "ns", idx: x, inx: x, inz: 1, face: "north" });
  if (z === D - 1) faces.push({ axis: "ns", idx: x, inx: x, inz: D - 2, face: "south" });
  if (x === 0) faces.push({ axis: "ew", idx: z, inx: 1, inz: z, face: "west" });
  if (x === W - 1) faces.push({ axis: "ew", idx: z, inx: W - 2, inz: z, face: "east" });

  for (const f of faces) {
    const idx = f.idx;
    const glassProps = f.axis === "ns" ? GLASS_NS : GLASS_EW;
    const inside = has(f.inx, f.inz) && !isPerim(f.inx, f.inz);

    // ground floor shopfront
    const isEntrance = f.face === "south" && x === 6;
    if (isEntrance && has(x, z)) {
      // door
      if (gd + 1 < r) g.set(x, gd + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      if (gd + 2 < r) g.set(x, gd + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      if (gd + 3 < r) g.set(x, gd + 3, z, "glass_pane", glassProps);
    } else {
      for (let y = gd + 1; y <= gd + 3 && y < r; y++) {
        if (idx % 3 === 0) g.set(x, y, z, "stone_bricks");
        else g.set(x, y, z, "glass_pane", glassProps);
      }
      if (inside && idx % 3 === 2 && gd + 2 < r) g.set(f.inx, gd + 2, f.inz, "glowstone");
    }

    // dark awning fascia above shopfront
    if (gd + 4 < r) g.set(x, gd + 4, z, "dark_oak_planks");

    // upper storey windows with stone pilasters
    for (let y = gd + 6; y <= gd + 8 && y < r; y++) {
      if (idx % 2 === 1) g.set(x, y, z, "glass_pane", glassProps);
      else g.set(x, y, z, "stone_bricks");
    }
    if (inside && idx % 4 === 1 && gd + 7 < r) g.set(f.inx, gd + 7, f.inz, "shroomlight");
  }
}

g.save(OUT);
