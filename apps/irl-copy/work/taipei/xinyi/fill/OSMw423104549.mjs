import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw423104549";

// Footprint cells: [x, z, ground]
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = Array.isArray(raw) ? raw : (raw.cells ?? raw.footprint ?? []);

const W = 59, H = 90, D = 103;
const TOP = 78;        // main roof surface (about 78 blocks above lowest ground)
const SETBACK = 60;    // upper tier begins here; outer 2 cells step back
const g = new Voxels([W, H, D]);

const OFF = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const xz = (key) => key.split(",").map(Number);

// Footprint map: "x,z" -> ground
const ground = new Map();
for (const c of cells) {
  const [x, z, gr] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.round(gr));
}

// Ring distance from the footprint edge (edge cells = 1)
const dist = new Map();
const queue = [];
for (const key of ground.keys()) {
  const [x, z] = xz(key);
  const edge = ["north", "south", "west", "east"].some(
    (d) => !ground.has(`${x + OFF[d][0]},${z + OFF[d][1]}`)
  );
  if (edge) { dist.set(key, 1); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const dd = dist.get(`${x},${z}`);
  for (const d of Object.keys(OFF)) {
    const nx = x + OFF[d][0], nz = z + OFF[d][1];
    const nk = `${nx},${nz}`;
    if (ground.has(nk) && !dist.has(nk)) {
      dist.set(nk, dd + 1);
      queue.push([nx, nz]);
    }
  }
}

// Is (x,z) part of the building at height y?
function inSet(x, z, y) {
  const key = `${x},${z}`;
  if (!ground.has(key)) return false;
  if (y < SETBACK) return true;
  return (dist.get(key) ?? 1) >= 3;
}

// Outward directions where the neighbour at height y is not part of the building
function faceDirs(x, z, y) {
  const out = [];
  for (const d of ["north", "south", "west", "east"]) {
    if (!inSet(x + OFF[d][0], z + OFF[d][1], y)) out.push(d);
  }
  return out;
}

// Main entrance: the outward face with the most edge cells, middle cell of that face
const faceCells = { north: [], south: [], west: [], east: [] };
for (const key of ground.keys()) {
  const [x, z] = xz(key);
  for (const d of faceDirs(x, z, 1)) faceCells[d].push([x, z]);
}
let entDir = "north";
for (const d of Object.keys(faceCells)) {
  if (faceCells[d].length > faceCells[entDir].length) entDir = d;
}
const along = (d) => (d === "north" || d === "south" ? 0 : 1);
const sortedFace = faceCells[entDir].sort((a, b) => a[along(entDir)] - b[along(entDir)]);
const midCell = sortedFace[Math.floor(sortedFace.length / 2)] ?? [0, 0];
const ent = { x: midCell[0], z: midCell[1], dir: entDir };

// Foundation, storeys, setback, roof
for (const [key, gr] of ground) {
  const [x, z] = xz(key);
  const d = dist.get(key) ?? 1;

  for (let y = 0; y <= gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr + 1; y <= TOP; y++) {
    // Outer ring below the setback: terrace over the lower tier
    if (y >= SETBACK && d < 3) {
      if (y === SETBACK) g.set(x, y, z, "light_gray_concrete");
      else if (y === SETBACK + 1 && d === 1) g.set(x, y, z, "smooth_quartz");
      continue;
    }

    const dirs = faceDirs(x, z, y);
    const facade = dirs.length > 0;

    if (y === SETBACK) {
      g.set(x, y, z, facade ? "quartz_block" : "light_gray_concrete");
      continue;
    }

    if (y === TOP) {
      g.set(x, y, z, facade ? "quartz_block" : "light_gray_concrete");
      continue;
    }

    const r = (y - gr - 1) % 5; // 0 floor band, 1-3 glazing, 4 spandrel

    if (!facade) {
      if (r === 0) g.set(x, y, z, "light_gray_concrete"); // floor slab
      continue;
    }

    if (r === 0) { g.set(x, y, z, "quartz_block"); continue; }
    if (r === 4) { g.set(x, y, z, "white_concrete"); continue; }

    if (dirs.length > 1) { g.set(x, y, z, "smooth_quartz"); continue; } // corner pier

    const dir = dirs[0];
    const idx = dir === "north" || dir === "south" ? x : z;
    const isWindow = idx % 4 === 1 || idx % 4 === 2;
    const ground1 = y - gr - 1 < 5;
    const isEnt = ent.dir === dir && ent.x === x && ent.z === z;

    if (ground1 && isEnt) {
      if (r === 1) {
        g.set(x, y, z, "oak_door", { facing: dir, half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (r === 2) {
        g.set(x, y, z, "oak_door", { facing: dir, half: "upper", hinge: "left", open: "false", powered: "false" });
      } else {
        g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      }
      continue;
    }

    if (isWindow) {
      g.set(x, y, z, ground1 ? "glass" : "light_blue_stained_glass");
      // warm light behind some glazing, in the air gap inside
      if ((idx * 5 + y * 3) % 11 === 0) {
        const ix = x - OFF[dir][0], iz = z - OFF[dir][1];
        if (inSet(ix, iz, y) && faceDirs(ix, iz, y).length === 0) {
          g.set(ix, y, iz, "glowstone");
        }
      }
    } else if (idx % 4 === 0) {
      g.set(x, y, z, "smooth_quartz");
    } else {
      g.set(x, y, z, "white_concrete");
    }
  }
}

// Parapet, corner lights and roof plant above the roof
for (const [key] of ground) {
  const [x, z] = xz(key);
  const d = dist.get(key) ?? 1;
  if (d < 3) continue;
  const dirs = faceDirs(x, z, TOP + 1);
  if (dirs.length > 0) {
    g.set(x, TOP + 1, z, "smooth_quartz");
    if (dirs.length >= 2) g.set(x, TOP + 2, z, "sea_lantern");
    continue;
  }
  if (x % 14 >= 5 && x % 14 <= 9 && z % 18 >= 6 && z % 18 <= 11) {
    const h = 2 + ((x + z) % 3);
    for (let y = TOP + 1; y < TOP + 1 + h; y++) {
      g.set(x, y, z, y === TOP + h ? "smooth_quartz" : "white_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
