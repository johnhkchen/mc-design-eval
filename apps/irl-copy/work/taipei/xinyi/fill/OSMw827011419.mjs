import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const base = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw827011419";
const cells = JSON.parse(readFileSync(`${base}/${id}.cells.json`, "utf8"));

const W = 22, H = 38, D = 19;
const vox = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground
const G = new Map();
for (const [x, z, gc] of cells) G.set(`${x},${z}`, gc);
const inFP = (x, z) => G.has(`${x},${z}`);
const gr = (x, z) => G.get(`${x},${z}`);

const minG = Math.min(...cells.map((c) => c[2]));
const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));
const maxZ = Math.max(...cells.map((c) => c[1]));
const cx = Math.floor((minX + maxX) / 2);
const cz = Math.floor((minZ + maxZ) / 2);

// Roof about 26 blocks above the lowest ground; capped so the rooftop mast fits the 38-high volume.
const roofY = Math.min(minG + 26, 31);

const set = (x, y, z, block, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) vox.set(x, y, z, block, props);
  else vox.set(x, y, z, block);
};

// Which sides of a cell face outside the footprint
const sides = (x, z) => ({
  W: !inFP(x - 1, z),
  E: !inFP(x + 1, z),
  N: !inFP(x, z - 1),
  S: !inFP(x, z + 1),
});
const isPerim = (x, z) => {
  const s = sides(x, z);
  return s.W || s.E || s.N || s.S;
};
const isPier = (x, z) => {
  const s = sides(x, z);
  const fx = s.W || s.E;
  const fz = s.N || s.S;
  if (fx && fz) return true;
  if (fx) return (z - minZ) % 3 === 0;
  if (fz) return (x - minX) % 3 === 0;
  return false;
};

// Entrance: a non-pier front/back facade cell nearest the middle of the footprint
let door = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    const s = sides(x, z);
    const fx = s.W || s.E;
    const fz = s.N || s.S;
    if (!fz || fx || isPier(x, z)) continue;
    const d = Math.abs(x - cx);
    if (d < best) {
      best = d;
      door = { x, z, facing: s.N ? "north" : "south" };
    }
  }
}

// Pass 1: building shell per footprint cell
for (const [x, z, gc] of cells) {
  const s = sides(x, z);
  const perim = s.W || s.E || s.N || s.S;
  const fx = s.W || s.E;
  const fz = s.N || s.S;
  const corner = fx && fz;
  const pier = isPier(x, z);
  const isDoor = door && door.x === x && door.z === z;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gc; y++) set(x, y, z, "stone_bricks");

  // Storeys: o=0 slab/spandrel row, o=1..4 window rows
  for (let y = gc; y < roofY; y++) {
    const o = (y - gc) % 5;
    if (o === 0) {
      set(x, y, z, y === gc ? "stone_bricks" : "light_gray_concrete");
      continue;
    }
    if (!perim) continue; // interior air behind the glass

    if (isDoor && (y === gc + 1 || y === gc + 2)) {
      set(x, y, z, "dark_oak_door", {
        facing: door.facing,
        half: y === gc + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (pier || corner) {
      set(x, y, z, "smooth_quartz");
      continue;
    }

    const isGround = y < gc + 5;
    if (isGround && o === 4) {
      set(x, y, z, "smooth_quartz"); // shopfront canopy band
      continue;
    }

    // Glass pane with connections running along the facade
    const props = fx
      ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
      : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
    set(x, y, z, "light_blue_stained_glass_pane", props);

    // Warm light behind some windows, placed in the interior air gap
    if (((x * 7 + z * 5 + y * 3) % 4) === 0) {
      let ix = x, iz = z;
      if (fx && !fz) ix = s.W ? x + 1 : x - 1;
      else if (fz && !fx) iz = s.N ? z + 1 : z - 1;
      else continue;
      if (inFP(ix, iz) && !isPerim(ix, iz)) {
        const gi = gr(ix, iz);
        const oi = (y - gi) % 5;
        if (y >= gi && oi >= 1 && oi <= 3 && y < roofY) {
          set(ix, y, iz, "glowstone");
        }
      }
    }
  }

  // Roof deck on every footprint cell
  set(x, roofY, z, "light_gray_concrete");

  // Parapet and cornice on the perimeter
  if (perim) {
    set(x, roofY + 1, z, "smooth_quartz");
    set(x, roofY + 2, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
  }
}

// Pass 2: rooftop penthouse core and mast (interior cells only)
for (const [x, z] of cells) {
  if (isPerim(x, z)) continue;
  if (Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 2) {
    for (let y = roofY + 1; y <= roofY + 3; y++) set(x, y, z, "smooth_quartz");
    set(x, roofY + 4, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
  }
}
if (inFP(cx, cz)) {
  for (let y = roofY + 5; y <= roofY + 6; y++) {
    set(cx, y, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

vox.save(`${base}/${id}.nbt`);
