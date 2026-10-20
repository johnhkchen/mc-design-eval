import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw964997229: no record. Read from lidar: roof ~11 blocks above lowest ground.
// Decided: a two-storey (5 blocks per storey) mid-century-style commercial block,
// white-tiled concrete body, light-grey spandrels and base course, quartz cornice,
// tinted blue glass in a 3-block mullion grid, dark-oak entrance on the southern
// (maxZ) face, warm shroomlight and glowstone behind some windows, a flat roof
// with a central plant room.

const BASE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw964997229";
const cells = JSON.parse(readFileSync(`${BASE}/${ID}.cells.json`, "utf8"));

const W = 35, H = 23, D = 26;
const ROOF = 10;           // top course (cornice) at y=10, roof surface at y=11
const STOREY = 5;          // storey height in blocks

const ground = new Map();  // "x,z" -> ground y
for (const c of cells) {
  const [x, z, gr] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, gr ?? 0);
}
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

// Exterior-face analysis of a footprint cell
function wall(x, z) {
  const n = !has(x, z - 1), s = !has(x, z + 1);
  const w = !has(x - 1, z), e = !has(x + 1, z);
  const perim = n || s || w || e;
  const corner = (n || s) && (w || e);
  const alongX = (n || s) && !(w || e);
  const alongZ = (w || e) && !(n || s);
  return { n, s, w, e, perim, corner, alongX, alongZ };
}

// Entrance: median cell of the southern-most row (maxZ)
let maxZ = -Infinity;
for (const k of ground.keys()) maxZ = Math.max(maxZ, Number(k.split(",")[1]));
const frontRow = [...ground.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([, z]) => z === maxZ)
  .sort((a, b) => a[0] - b[0]);
const [dx, dz] = frontRow.length ? frontRow[Math.floor(frontRow.length / 2)] : [-1, -1];
const doorKey = `${dx},${dz}`;

const g = new Voxels([W, H, D]);

// Wall material for a perimeter cell at height y (ground gr)
function wallBlock(x, y, z, gr, info) {
  let id = "white_concrete";
  let props;
  if (y === gr || y === 0 || y === 4 || y === 5 || y === 9) id = "light_gray_concrete";
  if (y === ROOF) id = "quartz_block";

  const band = y > gr && ((y >= 1 && y <= 3) || (y >= 6 && y <= 8));
  if (band && !info.corner) {
    const idx = info.alongX ? x : z;
    if (idx % 3 === 0) {
      id = "quartz_block";                       // mullion
    } else {
      id = "light_blue_stained_glass_pane";      // tinted glazing
      props = info.alongX
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    }
  }
  if (info.corner && !(y === gr || y === ROOF)) id = "white_concrete";
  return { id, props };
}

// Main massing pass: foundation, walls, floor slabs, roof deck, entrance
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const info = wall(x, z);
  const gi = Math.min(gr, H - 1);

  // Foundation from y=0 up to this cell's ground
  for (let y = 0; y < gi; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gi; y <= ROOF; y++) {
    if (!info.perim) {
      // Interior: no air-filled interiors, only storey slab and roof deck
      if (y === STOREY) g.set(x, y, z, "smooth_stone");
      else if (y === ROOF) g.set(x, y, z, "gravel");
      continue;
    }

    if (k === doorKey) {
      if (y === gi) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (y === gi + 1) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (y === gi + 2) {
        g.set(x, y, z, "light_gray_concrete"); // entrance lintel
        continue;
      }
    }

    const b = wallBlock(x, y, z, gi, info);
    g.set(x, y, z, b.id, b.props);
  }
}

// Warm lights behind some windows (inside, at the cell inward of the glazing)
const inward = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] };
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const info = wall(x, z);
  if (!info.perim || info.corner || k === doorKey) continue;
  const dir = info.n ? "n" : info.s ? "s" : info.w ? "w" : "e";
  const [ox, oz] = inward[dir];
  const ix = x + ox, iz = z + oz;
  if (!has(ix, iz)) continue;
  const iw = wall(ix, iz);
  if (iw.perim) continue;
  const igr = gnd(ix, iz);
  const idx = info.alongX ? x : z;
  if (idx % 3 === 0) continue; // only behind glazing
  if ((x + z) % 5 === 0) {
    if (2 > gr && 2 > igr) g.set(ix, 2, iz, "shroomlight");
  } else if ((x + z) % 5 === 2) {
    if (7 > gr && 7 > igr) g.set(ix, 7, iz, "glowstone");
  }
}

// Roof plant room: central block on the roof deck, stepped down at the top
const xs = [...ground.keys()].map((k) => Number(k.split(",")[0]));
const zs = [...ground.keys()].map((k) => Number(k.split(",")[1]));
const cx = Math.round((Math.min(...xs) + Math.max(...xs)) / 2);
const cz = Math.round((Math.min(...zs) + Math.max(...zs)) / 2);
for (let x = cx - 4; x <= cx + 4; x++) {
  for (let z = cz - 3; z <= cz + 3; z++) {
    if (!has(x, z) || wall(x, z).perim) continue;
    g.set(x, ROOF + 1, z, "light_gray_concrete");
    const inner = Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 1;
    if (inner) g.set(x, ROOF + 2, z, "white_concrete");
  }
}

g.save(`${BASE}/${ID}.nbt`);
