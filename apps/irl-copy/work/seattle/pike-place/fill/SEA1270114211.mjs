// HILLCLIMB COURT CONDOMINIUM (1425 Western Ave, 1982, condo over ground-floor retail). Eight storeys of brick on a
// granite plinth, stone belt courses every 5 blocks, white-trimmed window grids, a shopfront band at the street, two
// entrances under green awnings, a flat roof with a parapet and rooftop mechanical boxes. Cells come from lidar: each
// footprint cell stands on its own foundation up to its ground, and the roof is level at y 40 so the downhill side
// shows the extra storeys.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle/pike-place/fill";
const cells = JSON.parse(readFileSync(`${DIR}/SEA1270114211.cells.json`, "utf8"));

const ROOF = 40;                                  // roof surface y; cornice rides on it, parapet sits on the cornice
const PARAPET = 41;
const H = 52;
const NORMALS = [[-1, 0], [1, 0], [0, -1], [0, 1]];  // outward (dx, dz)
const FACING = { "0,-1": "north", "0,1": "south", "1,0": "east", "-1,0": "west" };

const K = (x, z) => x * 100 + z;                  // unique key; z is always 0..90 inside the footprint
const ground = new Map(cells.map(([x, z, gr]) => [K(x, z), gr]));
const inF = (x, z) => ground.has(K(x, z));
const exposed = (x, z) => NORMALS.filter(([dx, dz]) => !inF(x + dx, z + dz));

// Facade rhythm: bays 4 wide (pier, two window/glass cells, pier), storeys 5 high (row 0 = belt course, rows 1-3 open, row 4 head).
const bayPos = (t) => ((t % 4) + 4) % 4;
const bandOf = (y) => Math.floor(y / 5);
const rowOf = (y) => y % 5;

// Entrances: ground-band cells on a facade, in every fifth bay, where the ground is at or under the first storey.
const entrances = new Set();
for (const [x, z, gr] of cells) {
  const ex = exposed(x, z);
  if (!ex.length || gr > 1) continue;
  const [dx, dz] = ex[0];
  const t = dx !== 0 ? z : x;
  const fixed = dx !== 0 ? x : z;
  if (bayPos(t) === 1 && Math.floor(t / 4) % 5 === 2) entrances.add(`${dx},${dz},${fixed},${Math.floor(t / 4)}`);
}
const entranceKey = (dx, dz, fixed, bay) => `${dx},${dz},${fixed},${bay}`;

const g = new Voxels([71, H, 91]);

// Mechanical boxes and interior-depth test on the roof: BFS depth from the perimeter.
const depth = new Map();
const queue = [];
for (const [x, z] of cells.map(([x, z]) => [x, z])) if (exposed(x, z).length) { depth.set(K(x, z), 0); queue.push([x, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i]; const d = depth.get(K(x, z));
  for (const [dx, dz] of NORMALS) {
    const nx = x + dx, nz = z + dz;
    if (inF(nx, nz) && !depth.has(K(nx, nz))) { depth.set(K(nx, nz), d + 1); queue.push([nx, nz]); }
  }
}

let lights = 0;
for (const [x, z, gr] of cells) {
  const ex = exposed(x, z);
  const ring = ex.length > 0;

  // Foundation and ground floor: solid from y 0 up to this cell's ground, plus the plinth floor at y 0.
  for (let y = 0; y < Math.max(gr, 1); y++) g.set(x, y, z, "polished_granite");

  if (!ring) {
    for (let y = gr; y <= ROOF; y++) {
      if (y === ROOF) g.set(x, y, z, "gray_concrete");                       // flat roof surface
      else if (y > 0 && y % 5 === 0) g.set(x, y, z, "smooth_stone");          // floor slab per storey
    }
    continue;
  }

  const [dx, dz] = ex[0];
  const t = dx !== 0 ? z : x;
  const fixed = dx !== 0 ? x : z;
  const bay = Math.floor(t / 4), p = bayPos(t);
  const alongX = dz !== 0;                       // facade runs along x: panes connect east-west
  const bottomBand = bandOf(gr);
  const isEntrance = entrances.has(entranceKey(dx, dz, fixed, bay));
  const ek = entranceKey(dx, dz, fixed, bay);

  for (let y = gr; y <= PARAPET; y++) {
    if (y === PARAPET) { g.set(x, y, z, "stone_brick_wall"); continue; }
    if (y === ROOF) { g.set(x, y, z, "stone_bricks"); continue; }                    // cornice
    const band = bandOf(y), r = rowOf(y);
    const shop = band === bottomBand;                                                // street-level band of this cell
    const win = p === 1 || p === 2;
    if (r === 0) { g.set(x, y, z, "stone_bricks"); continue; }                       // belt course
    if (r === 4) { g.set(x, y, z, win ? "white_concrete" : "bricks"); continue; }      // head row
    if (shop) {
      if (isEntrance && p === 1 && r <= 2) {
        const half = r === 1 ? "lower" : "upper";
        g.set(x, y, z, "dark_oak_door", { facing: FACING[`${dx},${dz}`], half, hinge: "left", open: "false", powered: "false" });
      } else if (isEntrance && r === 3) {
        g.set(x, y, z, "green_concrete");                                             // awning over the entrance bay
      } else if (win) {
        g.set(x, y, z, "glass");
      } else {
        g.set(x, y, z, "bricks");
      }
      continue;
    }
    if (win) {
      if (r === 2) g.set(x, y, z, "white_concrete");                                   // transom
      else g.set(x, y, z, "glass_pane", alongX
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
    } else {
      g.set(x, y, z, "bricks");
    }
  }

  // Warm light behind some glass: one block in from the facade, inside the air gap.
  const ix = x - dx, iz = z - dz;
  if (!inF(ix, iz) || exposed(ix, iz).length) continue;
  if (p !== 1) continue;
  if (isEntrance) continue;
  for (let band = bottomBand; band <= 7; band++) {
    if ((bay * 7 + band * 5 + band_hash(fixed, dx, dz)) % 9 !== 0) continue;             // about one window in nine, scattered over the storeys
    if (band === bottomBand) { g.set(ix, band * 5 + 2, iz, "shroomlight"); lights++; }   // shopfront: warm lamp behind the display glass
    else if (band * 5 + 1 >= gr) { g.set(ix, band * 5 + 1, iz, "glowstone"); lights++; }
  }
}

function band_hash(fixed, dx, dz) { return (fixed * 3 + dx * 5 + dz * 7 + 11) % 9; }

// Rooftop mechanical boxes: 4 x 3 blocks, two high, a slab cap, placed only where the roof is at least 3 in from the edge.
for (let bx = 8; bx < 71; bx += 14) for (let bz = 6; bz < 91; bz += 12) {
  let ok = true;
  for (let x = bx; x < bx + 4 && ok; x++) for (let z = bz; z < bz + 3; z++) if (!inF(x, z) || (depth.get(K(x, z)) ?? 0) < 3) { ok = false; break; }
  if (!ok) continue;
  for (let x = bx; x < bx + 4; x++) for (let z = bz; z < bz + 3; z++) {
    g.set(x, PARAPET, z, "light_gray_concrete");
    g.set(x, PARAPET + 1, z, "light_gray_concrete");
    g.set(x, PARAPET + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

const { blocks, palette } = g.save(`${DIR}/SEA1270114211.nbt`);
console.log(JSON.stringify({ cells: cells.length, entrances: entrances.size, lights, blocks, palette }));
