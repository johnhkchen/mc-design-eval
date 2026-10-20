import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Footprint 34 x 58, roof ~25 blocks above lowest ground.
// Read as a 5-storey mid-rise commercial block of the 1990s Xinyi fabric:
// cream tiled piers, light-blue tinted glazing, grey spandrel belts, a
// parapet with cornice, a framed entrance with a lintel, and a rooftop plant core.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw407655203";
const W = 34, H = 37, D = 58;
const ROOF_Y = 25;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) {
  G.set(key(x, z), Math.min(Math.max(Math.round(gr), 0), H - 1));
}
const has = (x, z) => G.has(key(x, z));
const ground = (x, z) => G.get(key(x, z));

const DIRS = [
  { dx: 0, dz: -1 }, { dx: 0, dz: 1 }, { dx: -1, dz: 0 }, { dx: 1, dz: 0 },
];
const facesOf = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));

// Depth inside the footprint (0 = perimeter), by BFS from the perimeter.
const depth = new Map();
{
  const q = [];
  for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
    if (facesOf(x, z).length > 0) {
      depth.set(key(x, z), 0);
      q.push([x, z]);
    }
  }
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i];
    const d = depth.get(key(x, z));
    for (const dd of DIRS) {
      const nx = x + dd.dx, nz = z + dd.dz;
      if (has(nx, nz) && !depth.has(key(nx, nz))) {
        depth.set(key(nx, nz), d + 1);
        q.push([nx, nz]);
      }
    }
  }
}
const depthOf = (x, z) => depth.get(key(x, z)) ?? 0;

// Main entrance: centre of the north (min-z) face.
const northCells = cells.filter(([x, z]) => facesOf(x, z).some((f) => f.dz === -1));
let cx = null;
let doorZ = null;
if (northCells.length) {
  cx = Math.round(northCells.reduce((s, c) => s + c[0], 0) / northCells.length);
  doorZ = Math.min(...northCells.map((c) => c[1]));
}
const isDoor = (x, z) => cx !== null && x === cx && z === doorZ;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Facade element for a perimeter cell at height y (y >= ground, y < ROOF_Y).
function facadeBlock(x, z, y, gr) {
  const faces = facesOf(x, z);
  const k = Math.floor(y / 5);
  const o = y % 5;

  if (faces.length >= 2) return ["white_concrete"];

  const face = faces[0];
  const bay = face.dz !== 0 ? x : z;

  // Entrance on the north face: door centre, glass either side, stone
  // surround, and a dark lintel across the whole portal.
  if (cx !== null && face.dz === -1 && Math.abs(x - cx) <= 2) {
    const off = Math.abs(x - cx);
    if (y === gr + 3) return ["black_concrete"];
    if (off === 0) {
      if (y === gr) return ["dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }];
      if (y === gr + 1) return ["dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }];
      if (y === gr + 2) return ["light_blue_stained_glass"];
    }
    if (off === 1 && y <= gr + 2) return ["light_blue_stained_glass"];
    if (off === 2 && y <= gr + 2) return ["polished_andesite"];
  }

  if (o === 0) return k === 0 ? ["polished_andesite"] : ["light_gray_concrete"];
  if (o === 4) return ["light_gray_concrete"];

  // Piers two wide, glass two wide with a one-wide pier between groups.
  const phase = ((bay % 5) + 5) % 5;
  if (phase === 0 || phase === 1) return ["smooth_quartz"];
  return ["light_blue_stained_glass"];
}

for (const [x, z, gr] of cells) {
  const faces = facesOf(x, z);
  const perim = faces.length > 0;
  const d = depthOf(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  // Floor slabs: ground-level floor, then each storey floor above it.
  put(x, gr, z, "smooth_stone");
  for (let k = 1; k <= 4; k++) {
    const fy = 5 * k;
    if (fy > gr && fy < ROOF_Y) put(x, fy, z, "smooth_stone");
  }

  // Walls and articulation between ground and the roof.
  if (perim) {
    for (let y = gr; y < ROOF_Y; y++) {
      const blk = facadeBlock(x, z, y, gr);
      if (blk) put(x, y, z, blk[0], blk[1]);
    }
  }

  // Warm lights behind selected windows, one air cell kept between glass and lamp.
  if (perim && faces.length === 1) {
    const face = faces[0];
    const bay = face.dz !== 0 ? x : z;
    const phase = ((bay % 5) + 5) % 5;
    for (let k = 0; k <= 4; k += 2) {
      const y = 5 * k + 2;
      if (y < gr || y >= ROOF_Y) continue;
      if (phase !== 3) continue;
      if (cx !== null && face.dz === -1 && Math.abs(x - cx) <= 2) continue;
      const ix = x - 2 * face.dx, iz = z - 2 * face.dz;
      if (!has(ix, iz)) continue;
      if (facesOf(ix, iz).length > 0) continue;
      if (ground(ix, iz) > y) continue;
      put(ix, y, iz, "glowstone");
    }
  }

  // Roof level and parapet.
  if (gr <= ROOF_Y) {
    if (perim) {
      put(x, ROOF_Y, z, "smooth_quartz");
      put(x, ROOF_Y + 1, z, "smooth_quartz");
      put(x, ROOF_Y + 2, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
    } else {
      put(x, ROOF_Y, z, "gray_concrete");
    }
  }

  // Rooftop plant core, set back four cells from the perimeter.
  if (!perim && d >= 4) {
    for (let y = ROOF_Y + 1; y <= ROOF_Y + 3; y++) {
      let id = "light_gray_concrete";
      if (d === 4 && y === ROOF_Y + 2) id = "light_blue_stained_glass";
      put(x, y, z, id);
    }
    put(x, ROOF_Y + 4, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Antenna on the most central core cell.
{
  const pool = cells.filter(([x, z]) => depthOf(x, z) >= 5);
  const pool2 = pool.length ? pool : cells.filter(([x, z]) => depthOf(x, z) >= 4);
  if (pool2.length) {
    const mx = pool2.reduce((s, c) => s + c[0], 0) / pool2.length;
    const mz = pool2.reduce((s, c) => s + c[1], 0) / pool2.length;
    let best = pool2[0];
    let bestD = Infinity;
    for (const c of pool2) {
      const dd = (c[0] - mx) ** 2 + (c[1] - mz) ** 2;
      if (dd < bestD) { bestD = dd; best = c; }
    }
    const [ax, az] = best;
    const baseY = ROOF_Y + 5;
    for (let y = baseY; y <= baseY + 3; y++) put(ax, y, az, "lightning_rod");
  }
}

g.save(`${DIR}/${ID}.nbt`);
