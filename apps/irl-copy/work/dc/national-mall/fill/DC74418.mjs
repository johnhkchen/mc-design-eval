import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC74418";
const W = 44, H = 33, D = 18;
const STOREY = 3;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const ORDER = ["N", "S", "W", "E"];
const INNER = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// ---- Pass 1: read cells and smooth the roof tiers ----
const raw = new Map();
for (const c of cells) {
  const [x, z, gr0, rf0] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gr = Math.max(0, Math.round(gr0));
  const rf = Math.round(rf0);
  raw.set(key(x, z), { x, z, gr, rf });
}

// Quantise to storey counts, then take the median over each 3x3 neighbourhood
// so lidar noise collapses into clean flat tiers.
const maxN = (gr) => Math.floor((H - 6 - gr) / STOREY);
const qN = new Map();
for (const [k, c] of raw) {
  const n = Math.max(1, Math.round((c.rf - c.gr) / STOREY));
  qN.set(k, Math.min(n, maxN(c.gr)));
}
const map = new Map();
for (const [k, c] of raw) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const v = qN.get(key(c.x + dx, c.z + dz));
    if (v !== undefined) vals.push(v);
  }
  vals.sort((a, b) => a - b);
  let n = vals[Math.floor(vals.length / 2)];
  n = Math.max(1, Math.min(n, maxN(c.gr)));
  map.set(k, { gr: c.gr, n, top: c.gr + STOREY * n });
}

// A face is exposed if the neighbour is outside the footprint or sits lower
function exposed(x, z, dir) {
  const me = map.get(key(x, z));
  const [dx, dz] = DIRS[dir];
  const nb = map.get(key(x + dx, z + dz));
  if (!nb) return true;
  return nb.top < me.top;
}
// True outer edge of the footprint (no neighbour at all)
function outerEdge(x, z) {
  return ORDER.some((d) => {
    const [dx, dz] = DIRS[d];
    return !map.has(key(x + dx, z + dz));
  });
}

function put(x, y, z, id, props) {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const paneProps = (dir) => {
  const ew = dir === "N" || dir === "S";
  return {
    north: ew ? "false" : "true",
    south: ew ? "false" : "true",
    east: ew ? "true" : "false",
    west: ew ? "true" : "false",
    waterlogged: "false",
  };
};

// Entrance sits on the street (N, z = 0) face, centred
const MID = Math.floor(W / 2);
const isEntranceCell = (x, z) => z === 0 && Math.abs(x - MID) <= 1;

// ---- Pass 2: massing and facade ----
for (const [k, I] of map) {
  const [x, z] = k.split(",").map(Number);
  const { gr, n, top } = I;

  const exDirs = ORDER.filter((d) => exposed(x, z, d));
  const perim = exDirs.length > 0;
  const wallDir = exDirs[0];

  // foundation
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!perim) {
    // interior: floor slabs and roof only, air between
    put(x, gr, z, "smooth_stone");
    for (let s = 1; s < n; s++) put(x, gr + STOREY * s, z, "smooth_stone");
    put(x, top, z, "smooth_stone");
    // roof plant on a few interior cells
    if ((x * 3 + z * 5) % 9 === 0 && x % 2 === 1 && z > 2 && z < D - 3) {
      put(x, top + 1, z, "light_gray_concrete");
      put(x, top + 2, z, "light_gray_concrete");
    }
    continue;
  }

  // perimeter facade
  for (let y = gr; y <= top; y++) {
    const rel = y - gr;
    if (y === gr) { put(x, y, z, "polished_andesite"); continue; }
    if (y === top) { put(x, y, z, "polished_andesite"); continue; }

    const s = Math.floor(rel / STOREY);
    const r = rel % STOREY;

    if (s === 0 && (r === 1 || r === 2)) {
      // ground storey
      if (wallDir === "N") {
        if (x === MID && z === 0) {
          const half = r === 1 ? "lower" : "upper";
          put(x, y, z, "dark_oak_door", {
            facing: "south", half, hinge: "left", open: "false", powered: "false",
          });
        } else if (isEntranceCell(x, z)) {
          // stone surround either side of the door
          put(x, y, z, "stone_bricks");
        } else if (x % 4 === 0) {
          put(x, y, z, "polished_andesite");
        } else {
          put(x, y, z, "light_blue_stained_glass");
        }
      } else {
        const isWin = wallDir === "S" ? x % 3 !== 0 : z % 3 !== 0;
        if (isWin) put(x, y, z, "light_blue_stained_glass_pane", paneProps(wallDir));
        else put(x, y, z, "white_concrete");
      }
      continue;
    }

    if (r === 0) {
      // floor line / spandrel band; stone course above the entrance
      const band = (wallDir === "N" && isEntranceCell(x, z) && s === 1) ? "stone_bricks" : "light_gray_concrete";
      put(x, y, z, band);
      continue;
    }

    // window band (r = 1 or 2)
    const isWin = (wallDir === "N" || wallDir === "S") ? x % 3 !== 0 : z % 3 !== 0;
    if (isWin) {
      put(x, y, z, "light_blue_stained_glass_pane", paneProps(wallDir));
      // sparse warm light behind a pane
      const [ix, iz] = INNER[wallDir];
      const inner = map.get(key(x + ix, z + iz));
      if (inner && y < inner.top && y > inner.gr && r === 1 && (x * 5 + z * 3 + s) % 7 === 0) {
        put(x + ix, y, z + iz, "glowstone");
      }
    } else {
      put(x, y, z, "white_concrete");
    }
  }

  // parapet only on true outer edges, so setback edges stay clean
  if (outerEdge(x, z)) put(x, top + 1, z, "stone_bricks");
}

g.save(`${DIR}/${ID}.nbt`);
