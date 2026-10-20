import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${dir}/OSMw839833538.cells.json`, "utf8"));

const W = 20, H = 23, D = 25;
const ROOF_Y = 11;   // roof slab, about 11 blocks above lowest ground
const PARAPET_Y = 12;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Missing-neighbour flags per footprint cell
function faces(x, z) {
  return {
    xm: !has(x - 1, z),
    xp: !has(x + 1, z),
    zm: !has(x, z - 1),
    zp: !has(x, z + 1),
  };
}

// Pick the front door cell: north face (missing z-1), nearest the middle
let doorCell = null;
{
  let best = Infinity;
  for (const [x, z] of [...ground.keys()].map((k) => k.split(",").map(Number))) {
    const f = faces(x, z);
    if (f.zm && !f.xm && !f.xp) {
      const d = Math.abs(x - 9.5);
      if (d < best) { best = d; doorCell = [x, z]; }
    }
  }
}

// Foundation, ground floor slab, storey-line floor slab, roof slab, interiors
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "smooth_stone");
  if (gr < 5) put(x, 5, z, "light_gray_concrete");
  if (gr < ROOF_Y) put(x, ROOF_Y, z, "smooth_stone");
}

// Facade of perimeter cells
for (const [x, z, gr] of cells) {
  const f = faces(x, z);
  const onX = (f.xm || f.xp);
  const onZ = (f.zm || f.zp);
  if (!onX && !onZ) continue; // interior cell

  const corner = onX && onZ;
  const faceX = onX && !onZ; // wall runs along z
  const idx = faceX ? z : x;  // position along the face
  const pillar = corner || idx % 4 === 0;

  const paneProps = faceX
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

  for (let y = gr + 1; y <= PARAPET_Y; y++) {
    if (y === PARAPET_Y) { put(x, y, z, "stone_bricks"); continue; }
    if (y === ROOF_Y) { put(x, y, z, "stone_bricks"); continue; }

    if (y <= 4) {
      // Ground storey: shopfront with polished andesite piers and a lintel
      if (y === 4) put(x, y, z, "light_gray_concrete");
      else if (pillar) put(x, y, z, "polished_andesite");
      else put(x, y, z, "glass_pane", paneProps);
    } else if (y === 5) {
      put(x, y, z, "light_gray_concrete"); // storey line
    } else if (y === 6) {
      put(x, y, z, "white_concrete");      // sill band
    } else if (y <= 9) {
      if (pillar) put(x, y, z, "white_concrete");
      else put(x, y, z, "glass_pane", paneProps);
    } else if (y === 10) {
      put(x, y, z, "light_gray_concrete"); // upper lintel
    }
  }

  // Warm lights behind some upper-storey windows (glowstone one cell inside)
  if (!corner && !pillar && idx % 8 === 2) {
    let ix = x, iz = z;
    if (faceX) ix = f.xm ? x + 1 : x - 1;
    else iz = f.zm ? z + 1 : z - 1;
    if (has(ix, iz) && gr < 8) put(ix, 8, iz, "glowstone");
  }
}

// Front door on the north face, with a lantern-lit ground storey
if (doorCell) {
  const [dx, dz] = doorCell;
  const gr = ground.get(key(dx, dz));
  put(dx, gr + 1, dz, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(dx, gr + 2, dz, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  if (gr + 3 <= 4) put(dx, gr + 3, dz, "light_gray_concrete");
}

// Roof plant: a small block of AC housings with a warm lantern on top
for (let x = 7; x <= 10; x++) {
  for (let z = 10; z <= 12; z++) {
    if (!has(x, z)) continue;
    const gr = ground.get(key(x, z));
    if (gr >= ROOF_Y) continue;
    put(x, PARAPET_Y, z, "light_gray_concrete");
    put(x, PARAPET_Y + 1, z, "light_gray_concrete");
  }
}
if (has(9, 11)) put(9, PARAPET_Y + 2, 11, "lantern", { hanging: "false", waterlogged: "false" });

g.save(`${dir}/OSMw839833538.nbt`);
