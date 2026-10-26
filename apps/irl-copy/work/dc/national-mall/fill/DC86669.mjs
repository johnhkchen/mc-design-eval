import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86669";
const W = 25, H = 31, D = 7;
const STOREY = 3;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint records -------------------------------------------------
const cellMap = new Map();
const at = (x, z) => cellMap.get(`${x},${z}`);
let maxRoof = 0;
for (const [x, z, gr, rf] of cells) {
  const ground = Math.max(0, Math.min(H - 4, gr));
  const roof = Math.max(ground + STOREY, Math.min(H - 4, rf));
  cellMap.set(`${x},${z}`, { x, z, ground, roof });
  maxRoof = Math.max(maxRoof, roof);
}

// Core keeps full lidar height; the outer ring on the tallest tier steps back
// one storey, so every setback stands on solid masonry below it.
const isCore = (x, z) => x >= 3 && x <= 21 && z >= 1 && z <= 5;
for (const c of cellMap.values()) {
  const tallest = c.roof >= maxRoof - 1;
  c.top = !isCore(c.x, c.z) && tallest && c.roof - STOREY >= c.ground + STOREY
    ? c.roof - STOREY
    : c.roof;
}

const solid = (x, z, y) => {
  const c = at(x, z);
  return !!c && y >= c.ground && y < c.top;
};

const exposure = (x, z, y) => ({
  xm: !solid(x - 1, z, y),
  xp: !solid(x + 1, z, y),
  zm: !solid(x, z - 1, y),
  zp: !solid(x, z + 1, y),
});

// ---- massing: foundation, shell, floors, roofs -------------------------
for (const c of cellMap.values()) {
  const { x, z, ground, top } = c;

  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  for (let y = ground; y < top; y++) {
    const rel = y - ground;
    const ex = exposure(x, z, y);
    const shell = ex.xm || ex.xp || ex.zm || ex.zp;
    const isTop = y === top - 1;

    if (!shell) {
      // interior: floor slabs per storey, air between (no interiors)
      if (isTop) g.set(x, y, z, "smooth_stone");
      else if (rel % STOREY === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }

    const faceZ = ex.zm || ex.zp;
    const faceX = ex.xm || ex.xp;
    const corner = faceZ && faceX;
    const idx = faceZ && !faceX ? x : z;
    const bay = idx % 3;

    let mat;
    if (isTop) mat = "smooth_stone";                       // cornice
    else if (rel === 0) mat = "stone_bricks";              // base course
    else if (rel % STOREY === 0) mat = "smooth_stone";     // storey line
    else if (corner || bay === 0) mat = "bricks";          // piers / mullions
    else mat = "glass_pane";                               // window lights

    g.set(x, y, z, mat);

    if (isTop) g.set(x, top, z, "stone_brick_wall");       // parapet

    // warm light: glowstone on the room side of some lit windows
    if (mat === "glass_pane" && ((x * 7 + y * 3 + z * 5) % 4 === 0)) {
      let ix = x, iz = z;
      if (ex.zm) iz = z + 1;
      else if (ex.zp) iz = z - 1;
      else if (ex.xm) ix = x + 1;
      else if (ex.xp) ix = x - 1;
      if (at(ix, iz) && y >= at(ix, iz).ground && y < at(ix, iz).top) {
        const e2 = exposure(ix, iz, y);
        const interior = !(e2.xm || e2.xp || e2.zm || e2.zp);
        if (interior && rel % STOREY !== 0) g.set(ix, y, iz, "glowstone");
      }
    }
  }
}

// ---- entrances on both long faces (z = 0 and z = D-1) ------------------
function entrance(x, z, facing, lanternX) {
  const c = at(x, z);
  if (!c) return;
  const y0 = c.ground + 1;
  // stone surround and lintel
  for (const dx of [x - 1, x + 1]) {
    const dc = at(dx, z);
    if (dc) {
      g.set(dx, y0, z, "stone_bricks");
      g.set(dx, y0 + 1, z, "stone_bricks");
    }
  }
  g.set(x, y0 + 2, z, "smooth_stone");
  g.set(x, y0, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, y0 + 1, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  // lanterns flanking the door, on the inside air at the ground floor
  const lc = at(lanternX, z);
  if (lc) g.set(lanternX, y0 + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
}

entrance(12, 0, "north", 10);
entrance(12, D - 1, "south", 14);

// ---- roof plant: stone penthouse on the core ---------------------------
for (let x = 9; x <= 13; x++) {
  for (let z = 2; z <= 4; z++) {
    const c = at(x, z);
    if (!c || c.top !== c.roof) continue;
    g.set(x, c.top, z, "stone_bricks");
    g.set(x, c.top + 1, z, x === 11 && z === 3 ? "lantern" : "stone_bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
