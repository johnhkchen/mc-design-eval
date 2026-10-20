import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw538617871";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 10, H = 23, D = 17;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground (lowest ground is y 0)
const key = (x, z) => `${x},${z}`;
const G = new Map(cells.map(([x, z, gr]) => [key(x, z), Math.round(gr)]));
const has = (x, z) => G.has(key(x, z));
const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));
const maxZ = Math.max(...cells.map((c) => c[1]));
const spanX = maxX - minX;
const spanZ = maxZ - minZ;

// Exposed faces of a footprint cell
const faces = (x, z) => ({
  fx: !has(x, z - 1), // front: z-min side, faces north
  bk: !has(x, z + 1), // back: z-max side
  lf: !has(x - 1, z), // left: x-min side
  rt: !has(x + 1, z), // right: x-max side
});
const isPer = (x, z) => {
  const f = faces(x, z);
  return f.fx || f.bk || f.lf || f.rt;
};

// Taipei shophouse-tower hybrid: white concrete piers, glass bays, red sign band,
// stone base, stone cornice and parapet. Two storeys of ~5 blocks, roof at y 11.
const DOOR_FACING = "north";

for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(H - 1, gr0));
  const f = faces(x, z);
  const per = f.fx || f.bk || f.lf || f.rt;
  const corner = (f.fx || f.bk) && (f.lf || f.rt);

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Ground-floor slab / base course at this cell's ground
  g.set(x, gr, z, per ? "stone_bricks" : "light_gray_concrete");

  if (!per) {
    // Interior: air gap, floor slabs at storey lines and roof deck
    if (5 > gr && 5 < H) g.set(x, 5, z, "light_gray_concrete");
    if (10 > gr && 10 < H) g.set(x, 10, z, "light_gray_concrete");
    // Roof equipment: a small plant block on the roof deck
    const inMechX = x >= minX + 3 && x <= minX + 4;
    const inMechZ = z >= minZ + 6 && z <= minZ + 7;
    if (inMechX && inMechZ && gr < 10) {
      g.set(x, 11, z, "light_gray_concrete");
      g.set(x, 12, z, "iron_bars");
    }
    continue;
  }

  // Perimeter wall column from above the base up to the parapet
  let idx, span, frontFace;
  if (f.fx || f.bk) {
    idx = x - minX;
    span = spanX;
    frontFace = f.fx;
  } else {
    idx = z - minZ;
    span = spanZ;
    frontFace = false;
  }
  const pier = corner || idx % 3 === 0 || idx === span;
  const doorCol = frontFace && idx === Math.floor(span / 2) && gr <= 2;

  for (let y = gr + 1; y <= 11 && y < H; y++) {
    // Entrance door on the front, ground storey
    if (doorCol && (y === gr + 1 || y === gr + 2)) {
      g.set(x, y, z, "oak_door", {
        facing: DOOR_FACING,
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    let block;
    if (y === 11) block = "white_concrete";            // parapet
    else if (y === 10) block = "stone_bricks";          // cornice
    else if (y === 5) block = "smooth_stone";           // storey line
    else if (y === 4 && frontFace) block = "red_concrete"; // shop sign band
    else if (pier) block = "white_concrete";            // piers
    else if (y === 4) block = "smooth_stone";           // ground lintel
    else if (y <= 3 && gr + 1 <= y) block = "glass";    // shopfront glazing
    else if (y === 6 || y === 9) block = "smooth_stone"; // sill / lintel
    else block = "glass";                               // upper windows (7, 8)

    g.set(x, y, z, block);
  }
}

// Warm light in some upper-storey windows, placed in the air gap behind the glass
const inwardOf = (x, z, f) => {
  if (f.fx) return [x, z + 1];
  if (f.bk) return [x, z - 1];
  if (f.lf) return [x + 1, z];
  return [x - 1, z];
};

for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(H - 1, gr0));
  const f = faces(x, z);
  if (!(f.fx || f.bk || f.lf || f.rt)) continue;
  if (f.fx && f.bk) continue;
  if (f.lf && f.rt) continue;
  const idx = (f.fx || f.bk) ? x - minX : z - minZ;
  if (idx % 3 === 0 || idx === ((f.fx || f.bk) ? spanX : spanZ)) continue;
  if (idx % 6 !== 1) continue;
  if (7 <= gr) continue;

  const [ix, iz] = inwardOf(x, z, f);
  if (!has(ix, iz) || isPer(ix, iz)) continue;
  g.set(ix, 7, iz, "shroomlight");
}

// Warm glass at the shopfront, one glowstone-lit bay behind the glass on the front
for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(H - 1, gr0));
  const f = faces(x, z);
  if (!f.fx || f.lf || f.rt || f.bk) continue;
  const idx = x - minX;
  if (idx % 3 === 0 || idx === spanX) continue;
  if (idx % 6 !== 2) continue;
  if (gr + 2 > 3) continue;
  if (!has(x, z + 1) || isPer(x, z + 1)) continue;
  g.set(x, gr + 1, z + 1, "glowstone");
}

g.save(`${dir}/${id}.nbt`);
