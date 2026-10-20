import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1159644391";
const W = 36, H = 23, D = 32;

// Two-storey Xinyi-style commercial block (c. 1990s): clad in pale quartz tile,
// stone plinth, shopfront glazing at street level, a continuous cornice and a
// rooftop plant room. Roof top sits at y 11, two storeys of ~5 blocks each.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const ground = new Map();
for (const c of cells) {
  const [x, z, gr] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(key(x, z), clamp(Math.round(gr), 0, 10));
}
const has = (x, z) => ground.has(key(x, z));

const DIRS = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "west", dx: -1, dz: 0 },
  { n: "east", dx: 1, dz: 0 },
];
const exposed = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));

const paneProps = (d) => {
  const along = (d.n === "north" || d.n === "south")
    ? { east: "true", west: "true" }
    : { north: "true", south: "true" };
  return { north: "false", south: "false", east: "false", west: "false", ...along, waterlogged: "false" };
};

const vox = new Voxels([W, H, D]);

const ring = new Map(); // key -> { x, z, g, dirs }

// Pass 1: foundations, floors, facades
for (const [k, g] of ground) {
  const [x, z] = k.split(",").map(Number);
  const dirs = exposed(x, z);

  // foundation up to this cell's ground
  for (let y = 0; y < g; y++) vox.set(x, y, z, "stone");

  if (dirs.length === 0) {
    // interior: storey floor slab at y 5, roof deck at y 10
    vox.set(x, 5, z, "smooth_stone");
    vox.set(x, 10, z, "smooth_stone");
    continue;
  }

  ring.set(k, { x, z, g, dirs });
  const single = dirs.length === 1;
  const d = dirs[0];
  const t = d && d.dx === 0 ? x : z;
  const pier = !single || t % 3 === 0;

  for (let y = g; y <= 11; y++) {
    if (y === g) { vox.set(x, y, z, "stone_bricks"); continue; }
    if (y === 4 || y === 5) { vox.set(x, y, z, "light_gray_concrete"); continue; }
    if (y === 9) { vox.set(x, y, z, "quartz_block"); continue; }
    if (y === 10) { vox.set(x, y, z, "smooth_stone"); continue; }
    if (y === 11) { vox.set(x, y, z, "smooth_quartz"); continue; }
    // window bands: ground storey (g+1..3) and upper storey (6..8)
    const windowBand = (y > g && y <= 3) || (y >= 6 && y <= 8);
    if (windowBand) {
      if (pier) vox.set(x, y, z, "smooth_quartz");
      else vox.set(x, y, z, "glass_pane", paneProps(d));
    }
  }
}

// Pass 2: warm lights behind some glazing (inside air, not on the wall)
for (const { x, z, g, dirs } of ring.values()) {
  if (dirs.length !== 1) continue;
  const d = dirs[0];
  const t = d.dx === 0 ? x : z;
  if (t % 3 === 0) continue;
  const ix = x - d.dx, iz = z - d.dz;
  const inner = has(ix, iz) && !ring.has(key(ix, iz));
  if (!inner) continue;
  if (t % 6 === 1) vox.set(ix, 7, iz, "shroomlight");
  if (g + 2 <= 3 && t % 6 === 4) vox.set(ix, g + 2, iz, "glowstone");
}

// Pass 3: main entrance centred on the south (+z) face
for (const { x, z, g, dirs } of ring.values()) {
  const south = dirs.find((d) => d.n === "south");
  if (!south || x !== 18) continue;
  vox.set(x, g + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  vox.set(x, g + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  vox.set(x, g + 3, z, "light_gray_concrete");
  const ix = x, iz = z - 1;
  if (has(ix, iz) && !ring.has(key(ix, iz))) {
    vox.set(ix, g + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Pass 4: rooftop plant room, centred on the roof
for (let x = 12; x <= 23; x++) {
  for (let z = 10; z <= 21; z++) {
    if (!has(x, z) || ring.has(key(x, z))) continue;
    const edge = x === 12 || x === 23 || z === 10 || z === 21;
    if (edge) {
      vox.set(x, 11, z, "light_gray_concrete");
      vox.set(x, 12, z, "light_gray_concrete");
      vox.set(x, 13, z, "light_gray_concrete");
    }
    vox.set(x, 13, z, edge ? "light_gray_concrete" : "smooth_stone");
  }
}

vox.save(`${DIR}/${ID}.nbt`);
