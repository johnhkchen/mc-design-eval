import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499471.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499471.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 28, H = 19, D = 17;
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------
const cm = new Map();
for (const c of cells) cm.set(`${c[0]},${c[1]}`, { x: c[0], z: c[1], ground: c[2], roof: c[3] });
const inFP = (x, z) => cm.has(`${x},${z}`);

// ---- one clean flat roof tier ----------------------------------------
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const median = roofs[Math.floor(roofs.length / 2)];
const maxG = Math.max(...cells.map(c => c[2]));
let top = Math.round(median);
top = Math.max(top, maxG + 6);   // one full storey plus cornice
top = Math.min(top, 16);

// ---- helpers ----------------------------------------------------------
const DIRS = [
  { dx: 1, dz: 0, name: "east" },
  { dx: -1, dz: 0, name: "west" },
  { dx: 0, dz: 1, name: "south" },
  { dx: 0, dz: -1, name: "north" },
];
const outwardDirs = (x, z) => DIRS.filter(d => !inFP(x + d.dx, z + d.dz));

const hasSouth = cells.some(c => !inFP(c[0], c[1] + 1));
const FRONT = hasSouth ? "south"
  : (DIRS.find(d => cells.some(c => !inFP(c[0] + d.dx, c[1] + d.dz)))?.name ?? "south");
const frontCells = cells.filter(c => {
  const d = DIRS.find(d => d.name === FRONT);
  return !inFP(c[0] + d.dx, c[1] + d.dz);
});
const frontXs = frontCells.map(c => c[0]);
const doorX = frontXs.length ? Math.floor((Math.min(...frontXs) + Math.max(...frontXs)) / 2) : -1;
const frontSet = new Set(frontCells.map(c => `${c[0]},${c[1]}`));

// ---- build each footprint cell ---------------------------------------
for (const c of cells) {
  const x = c[0], z = c[1], ground = c[2];
  const outs = outwardDirs(x, z);
  const isEdge = outs.length > 0;
  const isCorner = outs.length >= 2;
  const onFront = frontSet.has(`${x},${z}`);

  // foundation solid from 0 up to ground
  for (let y = 0; y < ground; y++) g.set(x, y, z, "granite");

  // interior floor and roof deck
  if (!isEdge) g.set(x, ground, z, "smooth_stone");
  g.set(x, top, z, "smooth_stone");

  if (!isEdge) continue;

  // parapet / roof-edge cornice on the perimeter
  g.set(x, top + 1, z, "stone_brick_wall");

  // base course
  g.set(x, ground, z, "granite");

  const outDir = outs[0];
  const i = (outDir.name === "north" || outDir.name === "south") ? x : z;

  for (let y = ground + 1; y <= top - 1; y++) {
    let id = "stone_bricks";

    if (y === top - 1) {
      id = "chiseled_stone_bricks";              // cornice course
    } else if (isCorner) {
      id = "stone_bricks";                        // solid corner piers
    } else if (onFront) {
      if (x === doorX && (y === ground + 1 || y === ground + 2)) {
        g.set(x, y, z, "dark_oak_door", {
          facing: outDir.name,
          half: y === ground + 1 ? "lower" : "upper",
          hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (y === ground + 3) {
        id = "dark_oak_planks";                   // timber lintel / fascia
      } else if (y === ground + 1) {
        id = "stone_brick_slab";                  // shop sill
        g.set(x, y, z, id, { type: "bottom", waterlogged: "false" });
        continue;
      } else if (y === ground + 2) {
        id = "glass_pane";                        // shopfront glass
      } else {
        id = (i % 3 === 0) ? "stone_bricks" : "glass_pane";
      }
    } else {
      const pier = (i % 3 === 0);
      if (pier) {
        id = "stone_bricks";
      } else if (y === ground + 1) {
        id = "stone_brick_slab";                  // window sill
        g.set(x, y, z, id, { type: "bottom", waterlogged: "false" });
        continue;
      } else if (y === top - 2) {
        id = "stone_bricks";                      // window head
      } else if (y >= ground + 2 && y <= top - 3) {
        id = "glass_pane";
      }
    }

    g.set(x, y, z, id);
  }

  // warm light behind some windows (inside cell next to the glass)
  const ix = x - outDir.dx, iz = z - outDir.dz;
  if (inFP(ix, iz) && outwardDirs(ix, iz).length === 0) {
    if (!onFront && !isCorner && i % 6 === 1) g.set(ix, ground + 2, iz, "glowstone");
    if (onFront && x !== doorX && x % 4 === 1) g.set(ix, ground + 2, iz, "shroomlight");
  }
}

// ---- simple rooftop chimney stack near the centre (no floating lantern)
{
  const interior = cells.filter(c => !outwardDirs(c[0], c[1]).length);
  if (interior.length) {
    const cx = Math.round(interior.reduce((s, c) => s + c[0], 0) / interior.length);
    const cz = Math.round(interior.reduce((s, c) => s + c[1], 0) / interior.length);
    const pick = interior.reduce((best, c) =>
      Math.abs(c[0] - cx) + Math.abs(c[1] - cz) < Math.abs(best[0] - cx) + Math.abs(best[1] - cz) ? c : best);
    g.set(pick[0], top + 1, pick[1], "stone_bricks");
    g.set(pick[0], top + 2, pick[1], "stone_bricks");
    g.set(pick[0], top + 3, pick[1], "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
}

g.save(OUT);
