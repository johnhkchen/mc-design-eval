import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020167";
const W = 22, H = 23, D = 14;
const ROOF = 11;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

function outward(x, z) {
  const out = [];
  if (!has(x - 1, z)) out.push([-1, 0]);
  if (!has(x + 1, z)) out.push([1, 0]);
  if (!has(x, z - 1)) out.push([0, -1]);
  if (!has(x, z + 1)) out.push([0, 1]);
  return out;
}
const isExt = (x, z) => outward(x, z).length > 0;
const FACING = { "0,1": "south", "0,-1": "north", "1,0": "east", "-1,0": "west" };

const g = new Voxels([W, H, D]);

// Pass 1: foundation, floor slabs, roof deck (interior and exterior)
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, gr, z, "smooth_stone");                 // ground floor slab
  if (gr + 5 < ROOF) g.set(x, gr + 5, z, "smooth_stone"); // second floor slab
  g.set(x, ROOF, z, "gray_concrete");              // roof deck
}

// Pass 2: facade on exterior cells (storey 1 k=0..4, storey 2 k=5..9, cornice k=10)
for (const [x, z, gr] of cells) {
  const out = outward(x, z);
  if (out.length === 0) continue;
  const corner = out.length >= 2;
  const d = out[0] ?? [0, 0];
  const u = d[0] !== 0 ? z : x; // position along the face

  for (let k = 0; k <= 10; k++) {
    const y = gr + k;
    if (y >= ROOF) break;
    let b = "smooth_quartz";
    let p = null;
    if (k === 0) b = "stone_bricks";                 // base course
    else if (k === 4 || k === 5) b = "light_gray_concrete"; // lintel and floor band
    else if (k === 10) b = "smooth_quartz";          // cornice
    else if (!corner) {
      const win = k <= 3 ? u % 3 !== 0 : u % 3 === 1;
      if (win) {
        b = "glass_pane";
        p = d[0] !== 0
          ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
          : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
      }
    }
    if (p) g.set(x, y, z, b, p);
    else g.set(x, y, z, b);
  }

  // Warm lights inside some windows, on the interior floor slab
  if (!corner) {
    const ix = x - d[0], iz = z - d[1];
    if (has(ix, iz)) {
      const igr = ground.get(`${ix},${iz}`);
      if (u % 3 === 1 && (u + x) % 4 === 0) {
        g.set(ix, igr + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
      }
      if (u % 3 === 1 && (u + z) % 3 === 0 && igr + 6 < ROOF) {
        g.set(ix, igr + 6, iz, "glowstone");
      }
    }
  }
}

// Pass 3: entrance on the south (+z) face nearest the centre, else any street face
let entrance = null;
let best = Infinity;
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const out = outward(x, z);
  if (out.length !== 1) continue;
  const [dx, dz] = out[0];
  const score = (dz === 1 ? 0 : 100) + Math.abs(x - W / 2);
  if (score < best) { best = score; entrance = { x, z, dx, dz, gr: ground.get(`${x},${z}`) }; }
}
if (entrance) {
  const facing = FACING[`${entrance.dx},${entrance.dz}`];
  const door = (y, half) => g.set(entrance.x, y, entrance.z, "dark_oak_door", {
    facing, half, hinge: "left", open: "false", powered: "false",
  });
  door(entrance.gr + 1, "lower");
  door(entrance.gr + 2, "upper");
}

// Pass 4: parapet on the perimeter and rooftop plant in the middle
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (isExt(x, z)) {
    if (ROOF + 1 < H) g.set(x, ROOF + 1, z, "smooth_quartz");
  } else {
    if (x >= 7 && x <= 13 && z >= 4 && z <= 9 && ROOF + 1 < H) {
      g.set(x, ROOF + 1, z, "light_gray_concrete");
      if (x >= 9 && x <= 11 && z >= 5 && z <= 8 && ROOF + 2 < H) {
        g.set(x, ROOF + 2, z, "iron_block");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
