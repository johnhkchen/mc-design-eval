import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi-style commercial block (1980s-90s): white tiled concrete facade,
// stone base course, black-framed shopfront at grade, tinted glazing above,
// smooth quartz storey lines, stone-brick parapet, rooftop plant.
const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw456557666";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 20, H = 19, D = 18;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const base = Math.min(...ground.values());
for (const [k, v] of ground) ground.set(k, v - base); // local: lowest ground = 0

const inside = (x, z) => ground.has(key(x, z));
const gOf = (x, z) => ground.get(key(x, z));
const ROOF = 7; // roof top sits 7 blocks above lowest ground

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Distance from the outside (perimeter cells = 1)
const dist = new Map();
const queue = [];
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1)) {
    dist.set(k, 1);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = dist.get(key(x, z));
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist.has(key(nx, nz))) {
      dist.set(key(nx, nz), d + 1);
      queue.push([nx, nz]);
    }
  }
}

// Entrance: south-facing perimeter cell nearest the footprint's centre column
let minX = Infinity, maxX = -Infinity;
for (const k of ground.keys()) { const x = +k.split(",")[0]; minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
const centreX = Math.round((minX + maxX) / 2);
let door = null;
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!inside(x, z + 1) && (!door || Math.abs(x - centreX) < Math.abs(door.x - centreX))) door = { x, z };
}

// Pass 1: columns (foundation, floors, roof deck, plant)
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const gr = gOf(x, z);
  const d = dist.get(k);

  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  if (d >= 2 && gr + 3 <= 5) put(x, gr + 3, z, "light_gray_concrete"); // interior floor slab
  if (d >= 2 && gr <= ROOF - 1) put(x, ROOF - 1, z, "light_gray_concrete"); // roof deck
  if (d >= 3 && x % 7 === 3 && z % 6 === 2) {
    put(x, ROOF, z, "iron_block"); // rooftop plant
  }
}

// Pass 2: perimeter facade
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (dist.get(k) !== 1) continue;
  const gr = gOf(x, z);

  // Outward face (first open side) and inward offset
  let face = null;
  if (!inside(x, z - 1)) face = "N";
  else if (!inside(x, z + 1)) face = "S";
  else if (!inside(x - 1, z)) face = "W";
  else if (!inside(x + 1, z)) face = "E";
  if (!face) continue;

  const alongNS = face === "N" || face === "S";
  const t = alongNS ? x : z;
  const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] }[face];
  const faceIdx = { N: 0, E: 1, S: 2, W: 3 }[face];
  const bay = t % 3;
  const paneProps = alongNS
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  const isDoorCell = door && door.x === x && door.z === z && face === "S";

  for (let y = gr; y <= ROOF - 1; y++) {
    let b, p;
    if (y === ROOF - 1) {
      b = "smooth_quartz"; // frieze
    } else if (y === gr + 3) {
      b = "smooth_quartz"; // storey line
    } else if (y < gr + 3) {
      // shopfront
      if (bay === 0) b = "black_concrete";
      else b = "glass";
    } else {
      // upper storey window band
      if (bay === 0) b = "white_concrete";
      else { b = "light_blue_stained_glass_pane"; p = paneProps; }
    }

    if (isDoorCell && (y === gr || y === gr + 1) && bay !== undefined) {
      b = "oak_door";
      const half = y === gr ? "lower" : "upper";
      p = { facing: "south", half, hinge: "left", open: "false", powered: "false" };
    }

    put(x, y, z, b, p);

    // Warm lights behind some upper windows / shopfront glass
    const ix = x + inward[0], iz = z + inward[1];
    if (inside(ix, iz) && dist.get(key(ix, iz)) >= 2) {
      if (y === gr + 4 && bay === 1 && (Math.floor(t / 3) * 2 + faceIdx) % 3 === 0) {
        put(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
      }
      if (y === gr + 1 && bay === 2 && (t % 4 === 2) && !isDoorCell) {
        put(ix, y, iz, "glowstone");
      }
    }
  }

  // Parapet cornice on top of the wall
  put(x, ROOF, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${dir}/${id}.nbt`);
