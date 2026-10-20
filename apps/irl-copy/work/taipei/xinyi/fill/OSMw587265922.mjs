import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name or era given. Lidar roof ~21 blocks above lowest ground, 29 x 16 footprint.
// Read as a 1980s-90s Taipei commercial/office block: 4 storeys of 5 blocks, white
// tile-and-concrete piers and spandrels, blue-tinted glass bands, a quartz cornice,
// a recessed entrance on the south face and a small rooftop plant enclosure.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587265922";
const W = 29, H = 33, D = 16;

const FLOORS = [5, 10, 15, 20];   // floor slab layers (20 = roof slab)
const PARAPET_Y = 21;              // top of parapet and cornice
const MAX_G = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.max(0, Math.min(MAX_G, Math.round(gr))));
}

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};
const OPP = { north: "south", south: "north", west: "east", east: "west" };

// Outward faces per footprint cell (empty array = interior cell)
const out = new Map();
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const o = [];
  for (const [d, [dx, dz]] of Object.entries(DIRS)) {
    if (!ground.has(key(x + dx, z + dz))) o.push(d);
  }
  out.set(k, o);
}

// Distance from the outer edge (edge cells = 1), used for the rooftop plant
const dist = new Map();
const queue = [];
for (const [k, o] of out) {
  if (o.length) { dist.set(k, 1); queue.push(k); }
}
for (let i = 0; i < queue.length; i++) {
  const k = queue[i];
  const [x, z] = k.split(",").map(Number);
  for (const [dx, dz] of Object.values(DIRS)) {
    const nk = key(x + dx, z + dz);
    if (ground.has(nk) && !dist.has(nk)) {
      dist.set(nk, dist.get(k) + 1);
      queue.push(nk);
    }
  }
}

const vox = new Voxels([W, H, D]);
const windows = []; // glass cells, for placing warm lights behind them

function paneProps(o) {
  // Panes join along the wall they sit in
  const alongX = o[0] === "north" || o[0] === "south";
  return alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

// ---- main massing, cell by cell ----
for (const [k, g] of ground) {
  const [x, z] = k.split(",").map(Number);
  const o = out.get(k);
  const edge = o.length > 0;
  const isPier = o.length > 1 || (o.length === 1 && (o[0] === "north" || o[0] === "south")
    ? x % 3 === 0
    : z % 3 === 0);

  // foundation under the building
  for (let y = 0; y < g; y++) vox.set(x, y, z, "stone_bricks");

  const fl = new Set([g, ...FLOORS.filter((f) => f > g)]);

  for (let y = g; y <= PARAPET_Y; y++) {
    if (fl.has(y)) {
      if (y === 20) {
        vox.set(x, y, z, edge ? "smooth_quartz" : "gray_concrete");
      } else if (y === g) {
        vox.set(x, y, z, edge ? "polished_andesite" : "smooth_stone");
      } else {
        vox.set(x, y, z, edge ? "white_concrete" : "smooth_stone");
      }
      continue;
    }
    if (y === PARAPET_Y) {
      if (edge) vox.set(x, y, z, "white_concrete");
      continue;
    }
    if (!edge) continue; // interior air behind the facade

    // facade wall rows inside a storey
    let fb = g;
    for (const f of fl) if (f < y && f > fb) fb = f;
    const nf = FLOORS.find((f) => f > y);
    const top = nf - 1;

    if (isPier) {
      vox.set(x, y, z, "smooth_quartz");
    } else if (y === top) {
      vox.set(x, y, z, "white_concrete");   // spandrel band
    } else {
      vox.set(x, y, z, "light_blue_stained_glass_pane", paneProps(o));
      windows.push({ x, y, z, o, mid: fb + 2 });
    }
  }

  // rooftop plant enclosure, set back from the edge
  const d = dist.get(k) || 0;
  if (d >= 4) vox.set(x, 21, z, "light_gray_concrete");
  if (d >= 6) vox.set(x, 22, z, "iron_block");
}

// ---- warm lights behind some windows (air gap in between) ----
for (const w of windows) {
  if (w.mid < 5) continue;                // skip the ground storey
  if ((w.x + w.z) % 6 !== 0) continue;
  const inward = OPP[w.o[0]];
  const [dx, dz] = DIRS[inward];
  const ix = w.x + dx, iz = w.z + dz;
  const ik = key(ix, iz);
  if (!ground.has(ik)) continue;
  if (out.get(ik).length) continue;      // keep the air gap behind glass
  const id = (w.x + w.z) % 12 === 0 ? "shroomlight" : "glowstone";
  vox.set(ix, w.mid, iz, id);
}

// ---- south-face recessed entrance (ground storey) ----
const front = [];
for (const [k, o] of out) {
  if (o.length === 1 && o[0] === "south") {
    const [x] = k.split(",").map(Number);
    front.push({ x, z: Number(k.split(",")[1]) });
  }
}
if (front.length) {
  front.sort((a, b) => a.x - b.x);
  const door = front[Math.floor(front.length / 2)];
  const g = ground.get(key(door.x, door.z));
  if (g + 2 <= 4) {
    const base = { facing: "south", hinge: "left", open: "false", powered: "false" };
    vox.set(door.x, g + 1, door.z, "dark_oak_door", { ...base, half: "lower" });
    vox.set(door.x, g + 2, door.z, "dark_oak_door", { ...base, half: "upper" });
  }
}

vox.save(`${DIR}/${ID}.nbt`);
