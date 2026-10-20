import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538403000";
const W = 12, H = 23, D = 19;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const cx = (minX + maxX) / 2;

// Exterior sides of a footprint cell
const sides = (x, z) => ({
  N: !has(x, z - 1), S: !has(x, z + 1),
  W: !has(x - 1, z), E: !has(x + 1, z),
});

// Per-cell facade classification
function info(x, z) {
  const s = sides(x, z);
  const ext = s.N || s.S || s.W || s.E;
  const alongX = s.N || s.S;
  const alongZ = s.W || s.E;
  const corner = alongX && alongZ;
  const uRel = alongX && !alongZ ? x - minX : alongZ && !alongX ? z - minZ : 0;
  const span = alongX && !alongZ ? maxX - minX : maxZ - minZ;
  const pillar = ext && (corner || uRel % 3 === 0 || uRel === span);
  return { s, ext, alongX: alongX && !alongZ, alongZ: alongZ && !alongX, corner, pillar };
}

// Door: centre-most cell of the north (minZ) row
let doorKey = null, best = Infinity;
for (const [x, z] of cells) {
  if (!has(x, z - 1)) {
    const d = Math.abs(x - cx);
    if (d < best) { best = d; doorKey = `${x},${z}`; }
  }
}

const P = {
  wall: "white_concrete",
  pillar: "light_gray_concrete",
  base: "polished_andesite",
  found: "stone_bricks",
  floor: "smooth_quartz",
  roof: "smooth_stone",
  awning: "red_concrete",
  lamp: "glowstone",
  eq: "light_gray_concrete",
};

const set = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Glass pane connection props so runs read as continuous glazing
const paneProps = (alongX) => alongX
  ? { north: "false", south: "false", east: "true", west: "true" }
  : { north: "true", south: "true", east: "false", west: "false" };

// Warm light behind a glass cell (interior cell next to a non-pillar facade cell)
function behindGlass(x, z, y) {
  const i = info(x, z);
  if (!has(x, z) || i.ext) return false;
  if (((x * 31 + z * 17 + y) % 5) !== 0) return false;
  for (const [dx, dz] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    const nx = x + dx, nz = z + dz;
    if (!has(nx, nz)) continue;
    const n = info(nx, nz);
    if (n.ext && !n.pillar && !n.corner) return true;
  }
  return false;
}

for (const [x, z, gr0] of cells) {
  // Ground level is clamped so the roof (ground + 11) stays inside the volume
  const gr = Math.max(0, Math.min(H - 12, gr0));
  const i = info(x, z);
  const { ext } = i;
  const isDoor = `${x},${z}` === doorKey;
  const front = i.s.N;

  // Foundation from y 0 up to ground
  for (let y = 0; y < gr; y++) set(x, y, z, P.found);

  // Base course / ground floor slab
  set(x, gr, z, ext ? P.base : P.floor);

  // Ground storey: shopfront (gr+1 .. gr+3)
  if (ext) {
    if (isDoor) {
      const doorProps = (half) => ({
        facing: "north", half, hinge: "left", open: "false", powered: "false",
      });
      set(x, gr + 1, z, "oak_door", doorProps("lower"));
      set(x, gr + 2, z, "oak_door", doorProps("upper"));
      set(x, gr + 3, z, P.wall);
    } else {
      for (let y = gr + 1; y <= gr + 3; y++) {
        if (i.pillar) set(x, y, z, P.pillar);
        else if (y === gr + 3) set(x, y, z, P.wall);
        else set(x, y, z, "glass_pane", paneProps(i.alongX));
      }
    }
    // Fascia / awning band over the shopfront on the street face
    set(x, gr + 4, z, front ? P.awning : P.wall);
  } else {
    for (let y = gr + 1; y <= gr + 4; y++) {
      if (y === gr + 2 && behindGlass(x, z, y)) set(x, y, z, P.lamp);
    }
  }

  // Ground-storey interior air gap is left empty; upper floor slab at gr+5
  set(x, gr + 5, z, ext ? P.wall : P.floor);

  // Upper storey windows (gr+6 .. gr+8)
  for (let y = gr + 6; y <= gr + 8; y++) {
    if (ext) {
      if (i.pillar) set(x, y, z, P.pillar);
      else set(x, y, z, "glass_pane", paneProps(i.alongX));
    } else if (y === gr + 7 && behindGlass(x, z, y)) {
      set(x, y, z, P.lamp);
    }
  }

  // Lintel band above upper windows
  if (ext) set(x, gr + 9, z, P.wall);

  // Roof slab over the top storey, cornice on the perimeter
  set(x, gr + 10, z, ext ? P.wall : P.roof);

  // Parapet on the perimeter, rooftop plant on the interior
  if (ext) {
    set(x, gr + 11, z, P.parapet ?? P.wall);
  } else if (((x * 5 + z * 3) % 17) === 0 && (x + z) % 2 === 0) {
    set(x, gr + 11, z, P.eq);
  }
}

g.save(`${DIR}/${ID}.nbt`);
