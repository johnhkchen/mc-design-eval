import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE108-0066-22F-2: 2019 Xinyi glass-and-concrete residential/office tower, ~21 storeys
// of 5 blocks, roof ~107 blocks above lowest ground. Two setbacks (y 60, y 90), light-grey
// spandrels and white mullions, alternating light-blue and cyan glass bays, glowstone-lit
// offices, a recessed lobby with a canopy and iron door, a parapet with crown lights,
// a penthouse and a steel mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE108-0066-22F-2";
const W = 71, H = 119, D = 58;
const ROOF_TOP = 106;   // last solid roof slab row
const PARAPET = 107;    // parapet row on outer cells
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

const key = (x, z) => `${x},${z}`;
const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(key(x, z), gr);
const has = (x, z) => gmap.has(key(x, z));
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Edge distance: 1 on the outline, growing inward (4-neighbour BFS).
const dist = new Map();
const q = [];
for (const [x, z] of cells) {
  if (NB.some(([dx, dz]) => !has(x + dx, z + dz))) {
    dist.set(key(x, z), 1);
    q.push([x, z]);
  }
}
for (let i = 0; i < q.length; i++) {
  const [x, z] = q[i];
  const d = dist.get(key(x, z));
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !dist.has(key(nx, nz))) {
      dist.set(key(nx, nz), d + 1);
      q.push([nx, nz]);
    }
  }
}
const D_ = (x, z) => dist.get(key(x, z)) ?? 1;

// Outward facing of an outline cell.
function outward(x, z) {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x + 1, z)) return "east";
  if (!has(x - 1, z)) return "west";
  return "north";
}

// Inward neighbour (one cell deeper) of an outline cell.
function inward(x, z) {
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && D_(nx, nz) === 2) return [nx, nz];
  }
  return null;
}

// Setbacks: the footprint shrinks at y 60 and y 90.
const inset = (y) => (y < 60 ? 0 : y < 90 ? 4 : 8);

// Main body, cell by cell.
for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(gr0, H - 1));
  const d = D_(x, z);

  // Foundation below ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= ROOF_TOP; y++) {
    const k = inset(y);
    const inc = d > k;
    const wasInc = y - 1 >= gr && d > inset(y - 1);

    if (!inc) {
      if (wasInc) {
        // Terrace cap over the setback, with solid support beneath it.
        for (let yy = Math.max(gr, y - 5); yy < y; yy++) put(x, yy, z, "light_gray_concrete");
        put(x, y, z, "smooth_stone");
      }
      continue;
    }

    if (y === ROOF_TOP) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }

    const dd = d - k; // depth inside the current tier's outline
    if (dd === 1) {
      // Facade: light-grey spandrels at storey lines, white mullions every 4 cells,
      // glass bays alternating between light blue and cyan.
      if (y % 5 === 0 || y % 5 === 4) {
        put(x, y, z, "light_gray_concrete");
      } else if ((x + z) % 4 === 0) {
        put(x, y, z, "white_concrete");
      } else if (Math.floor((x + z) / 4) % 2 === 0) {
        put(x, y, z, "light_blue_stained_glass");
      } else {
        put(x, y, z, "cyan_stained_glass");
      }
      if (y === gr) put(x, y, z, "stone_bricks"); // base course
    } else if (dd >= 8) {
      put(x, y, z, "light_gray_concrete"); // core
    } else {
      if (y % 5 === 0) {
        put(x, y, z, "light_gray_concrete"); // storey floor slab
      } else if (dd === 2 && y % 5 === 2 && (x * 3 + z + y) % 7 === 0) {
        put(x, y, z, "glowstone"); // warm office light behind the glass
      }
    }
  }

  // Parapet and crown lights on the top outline.
  if (d === 9) {
    put(x, PARAPET, z, "white_concrete");
    if ((x + z) % 12 === 0) put(x, PARAPET, z, "glowstone");
  }

  // Penthouse over the deepest core.
  if (d >= 14) {
    for (let y = PARAPET; y <= 109; y++) put(x, y, z, "light_gray_concrete");
    put(x, 110, z, "smooth_stone");
  }
}

// Steel mast on the deepest cell nearest the centroid.
{
  let maxD = 0;
  for (const [x, z] of cells) maxD = Math.max(maxD, D_(x, z));
  const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
  const cz = cells.reduce((s, c) => s + c[1], 0) / cells.length;
  let best = null, bestD2 = Infinity;
  for (const [x, z] of cells) {
    if (D_(x, z) !== maxD) continue;
    const d2 = (x - cx) ** 2 + (z - cz) ** 2;
    if (d2 < bestD2) { bestD2 = d2; best = [x, z]; }
  }
  if (best) {
    const [mx, mz] = best;
    for (let y = 111; y <= 116; y++) put(mx, y, mz, "iron_block");
    put(mx, 117, mz, "lightning_rod");
  }
}

// Recessed lobby entrance on the north-most outline run, with canopy and iron door.
{
  const outer = cells.filter(([x, z]) => D_(x, z) === 1);
  if (outer.length) {
    const minZ = Math.min(...outer.map(([, z]) => z));
    const row = outer.filter(([, z]) => z === minZ).sort((a, b) => a[0] - b[0]);
    const mid = Math.floor(row.length / 2);
    const [ex, ez] = row[mid];
    const gr = Math.max(0, Math.min(gmap.get(key(ex, ez)), H - 8));
    const facing = outward(ex, ez);
    const run = row.slice(Math.max(0, mid - 2), mid + 3);

    // Recess: clear the lobby cells (outline and one deeper) for four storeys.
    for (const [rx, rz] of run) {
      const inn = inward(rx, rz);
      for (let y = gr; y <= gr + 3; y++) {
        put(rx, y, rz, "air");
        if (inn) put(inn[0], y, inn[1], "air");
      }
    }
    // Lobby frame: concrete pillars at the run ends, glass transom over the door.
    for (const idx of [0, run.length - 1]) {
      const [rx, rz] = run[idx];
      const inn = inward(rx, rz);
      for (let y = gr; y <= gr + 3; y++) {
        put(rx, y, rz, "white_concrete");
        if (inn) put(inn[0], y, inn[1], "white_concrete");
      }
    }
    put(ex, gr + 2, ez, "light_blue_stained_glass");
    put(ex, gr + 3, ez, "light_blue_stained_glass");
    // Canopy beam at gr+4 across the run, outline and inward cells.
    for (const [rx, rz] of run) {
      put(rx, gr + 4, rz, "stone_bricks");
      const inn = inward(rx, rz);
      if (inn) put(inn[0], gr + 4, inn[1], "stone_bricks");
    }
    // Iron door (lower + upper) in the middle of the lobby.
    put(ex, gr, ez, "iron_door", { facing, half: "lower", hinge: "left", open: "false" });
    put(ex, gr + 1, ez, "iron_door", { facing, half: "upper", hinge: "left", open: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
