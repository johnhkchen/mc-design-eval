import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC66943.cells.json`, "utf8"));

const W = 22, H = 29, D = 19;
const g = new Voxels([W, H, D]);

// Commercial-Office-Large: 8 storeys of 2 blocks, parapet at 17, core rising above a 14-block setback ring.
const SETBACK = 14;
const key = (x, z) => x + "," + z;
const cellMap = new Map();

for (const [x, z, gr, roof] of cells) {
  const gi = Math.max(0, Math.round(gr));
  const T = Math.min(H - 4, Math.max(Math.round(roof), gi + 6));
  cellMap.set(key(x, z), { x, z, g: gi, T });
}

const nbrs = (x, z) => [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]];
const has = (x, z) => cellMap.has(key(x, z));

// Depth from the outer boundary (0 = edge cell).
const depth = new Map();
const queue = [];
for (const c of cellMap.values()) {
  const edge = nbrs(c.x, c.z).some(([nx, nz]) => !has(nx, nz));
  if (edge) { depth.set(key(c.x, c.z), 0); queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  const d = depth.get(key(c.x, c.z));
  for (const [nx, nz] of nbrs(c.x, c.z)) {
    const k = key(nx, nz);
    if (cellMap.has(k) && !depth.has(k)) {
      depth.set(k, d + 1);
      queue.push(cellMap.get(k));
    }
  }
}

// Setback: the outer two bays stop at the setback height; the core rises to the full roof.
for (const c of cellMap.values()) {
  const d = depth.get(key(c.x, c.z)) ?? 0;
  if (d < 2 && c.T > SETBACK) c.T = SETBACK;
}

// A face is exterior at row y if a side neighbour is missing or does not reach that row.
function isExt(x, z, y) {
  return nbrs(x, z).some(([nx, nz]) => {
    const n = cellMap.get(key(nx, nz));
    return !n || n.T <= y;
  });
}

// Street-facing edge: which footprint side (if any) this cell sits on.
function edgeSide(x, z) {
  if (!has(x, z - 1)) return "north";  // -z side
  if (!has(x, z + 1)) return "south";  // +z side
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  return null;
}

function inBounds(x, y, z) {
  return x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
}

// Entrance band: centred on the footprint so the lobby sits on the middle of each exposed face.
const minX = Math.min(...[...cellMap.values()].map(c => c.x));
const maxX = Math.max(...[...cellMap.values()].map(c => c.x));
const minZ = Math.min(...[...cellMap.values()].map(c => c.z));
const maxZ = Math.max(...[...cellMap.values()].map(c => c.z));
const midX = Math.round((minX + maxX) / 2);
const midZ = Math.round((minZ + maxZ) / 2);

function isLobbyCell(x, z) {
  const side = edgeSide(x, z);
  if (side === "north" || side === "south") return Math.abs(x - midX) <= 2;
  if (side === "west" || side === "east") return Math.abs(z - midZ) <= 2;
  return false;
}

for (const c of cellMap.values()) {
  const { x, z, g: gr, T } = c;

  // Foundation up to the local ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const side = edgeSide(x, z);
  const lobby = isLobbyCell(x, z);
  const lobbyCore = lobby && Math.abs((side === "north" || side === "south") ? x - midX : z - midZ) <= 1;
  const pier = side !== null && (x === minX || x === maxX || z === minZ || z === maxZ);

  for (let y = gr; y < T; y++) {
    const ext = isExt(x, z, y);
    const rel = y - gr;

    if (y === T - 1) {
      // Roof slab / parapet coping.
      g.set(x, y, z, ext ? "smooth_quartz" : "light_gray_concrete");
      continue;
    }

    if (rel % 2 === 0) {
      // Storey slab / base course / lintel over the lobby.
      if (y === gr && ext) g.set(x, y, z, "stone_bricks");
      else if (y === gr + 2 && ext && lobby) g.set(x, y, z, "smooth_quartz");
      else g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // Wall row inside a storey.
    if (ext) {
      if (y === gr + 1 && lobby) {
        // Glazed lobby: dark tinted glass with stone reveals at its edges.
        if (lobbyCore) g.set(x, y, z, "tinted_glass");
        else g.set(x, y, z, "polished_granite");
      } else if (pier) {
        // Corner piers read as a clear vertical rhythm.
        g.set(x, y, z, "white_concrete");
      } else {
        // Bays: two panes between mullions.
        const s = (side === "north" || side === "south") ? x : z;
        if (s % 3 === 0) g.set(x, y, z, "white_concrete");
        else g.set(x, y, z, "light_blue_stained_glass_pane");
      }
    } else {
      // Interior: air gap, with a few warm lights set well back from the glass.
      if (y === gr + 1 && lobby && (x + z) % 3 === 0) g.set(x, y, z, "glowstone");
      else if (y > gr + 1 && (x * 3 + z * 5 + y) % 13 === 0) {
        const nearExt = nbrs(x, z).some(([nx, nz]) => {
          const n = cellMap.get(key(nx, nz));
          return n && isExt(nx, nz, y) && n.T > y;
        });
        if (nearExt) g.set(x, y, z, "glowstone");
      }
    }
  }

  // Roof plant on the core roof, set back from the parapet.
  const d = depth.get(key(x, z)) ?? 0;
  if (d >= 3 && T >= 17 && x % 4 === 1 && z % 4 === 1 && inBounds(x, T, z)) {
    g.set(x, T, z, "iron_block");
  }
}

g.save(`${DIR}/DC66943.nbt`);
