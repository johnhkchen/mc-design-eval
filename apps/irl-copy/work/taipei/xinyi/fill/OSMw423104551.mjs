import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded mid-rise office tower in Xinyi, Taipei: c.1995-2000 style.
// White tiled concrete frame, light-blue glass curtain wall, grey spandrel bands,
// a three-storey glazed podium, two setbacks, a mechanical crown and a rod.
// Heights are in blocks above the lowest ground (y 0); storey lines sit on a global
// 5-block grid (y = 3 + 5k) so every tier lines up across the footprint.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw423104551";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 36, H = 90, D = 37;
const g = new Voxels([W, H, D]);

const ROOF = 78;       // main roof, blocks above lowest ground
const CROWN_TOP = 83;  // mechanical crown cap
const DIRS = [["N", 0, -1], ["S", 0, 1], ["E", 1, 0], ["W", -1, 0]];
const dirVec = Object.fromEntries(DIRS.map(([n, dx, dz]) => [n, [dx, dz]]));
const facingName = { N: "north", S: "south", E: "east", W: "west" };

const put = (x, y, z, b, p) => { if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b); };

// ---- footprint --------------------------------------------------------------
const foot = new Map();
for (const [x, z, gr] of cells) foot.set(`${x},${z}`, Math.max(0, Math.round(gr)));
const key = (x, z) => `${x},${z}`;
const inF = (x, z) => foot.has(key(x, z));

// ---- depth from the outside edge (4-connected BFS) ---------------------------
const depth = new Map();
const queue = [];
for (const k of foot.keys()) {
  const [x, z] = k.split(",").map(Number);
  if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inF(x + dx, z + dz))) {
    depth.set(k, 0);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = depth.get(key(x, z));
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (inF(nx, nz) && !depth.has(key(nx, nz))) {
      depth.set(key(nx, nz), d + 1);
      queue.push([nx, nz]);
    }
  }
}
const depthOf = (x, z) => depth.get(key(x, z)) ?? 0;

// ---- global storey lines and tier tops ---------------------------------------
const isLine = (y) => y >= 3 && (y - 3) % 5 === 0;
const snapUp = (v) => { let L = 3; while (L < v) L += 5; return L; };
const nextLine = (y) => { let v = y + 1; while (!isLine(v)) v++; return v; };

function tiers(gr) {
  const P = snapUp(Math.max(18, gr + 10));             // podium roof (3 storeys)
  const M = Math.min(73, Math.max(snapUp(63), P + 5)); // setback tower roof
  return { P, M };
}
function topOf(d, gr) {
  const t = tiers(gr);
  if (d >= 11) return CROWN_TOP;
  if (d >= 9) return ROOF;
  if (d >= 5) return t.M;
  return t.P;
}

const topMap = new Map();
for (const [k, gr] of foot) {
  const [x, z] = k.split(",").map(Number);
  topMap.set(k, topOf(depthOf(x, z), gr));
}

// Exposed faces: a neighbour that is outside the footprint or lower than y.
function exposed(x, z, y) {
  const out = [];
  for (const [n, dx, dz] of DIRS) {
    const k = key(x + dx, z + dz);
    if (!foot.has(k) || y > topMap.get(k)) out.push(n);
  }
  return out;
}

const along = (x, z, f) => (f === "N" || f === "S") ? x : z;

// ---- entrance: street-facing depth-0 cell near the middle ---------------------
const cand = [];
for (const [k, gr] of foot) {
  const [x, z] = k.split(",").map(Number);
  if (depthOf(x, z) !== 0) continue;
  for (const [n, dx, dz] of DIRS) if (!inF(x + dx, z + dz)) cand.push({ x, z, n, gr });
}
let pool = cand.filter((c) => c.n === "S");
if (pool.length === 0) pool = cand;
const meanX = pool.reduce((s, c) => s + c.x, 0) / Math.max(1, pool.length);
pool.sort((a, b) => Math.abs(a.x - meanX) - Math.abs(b.x - meanX) || a.gr - b.gr);
const door = pool.length ? pool[0] : null;
const doorAlong = door ? along(door.x, door.z, door.n) : NaN;

// ---- facade helpers ----------------------------------------------------------
const paneProps = (face) => (face === "N" || face === "S")
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// ---- build every column --------------------------------------------------------
for (const [k, gr] of foot) {
  const [x, z] = k.split(",").map(Number);
  const d = depthOf(x, z);
  const T = topMap.get(k);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= T; y++) {
    const exp = exposed(x, z, y);
    const floor = y === gr || isLine(y);

    // Crown: mechanical penthouse above the tower roof.
    if (d >= 11 && y > ROOF && y < CROWN_TOP) {
      if (exp.length) {
        const i = along(x, z, exp[0]);
        put(x, y, z, i % 3 === 1 ? "light_gray_concrete" : "white_concrete");
      }
      continue;
    }

    // Entrance zone: three cells wide, door in the middle, lintel above.
    const inZone = door && exp.length && d === 0 && exp.includes(door.n)
      && Math.abs(along(x, z, door.n) - doorAlong) <= 1;
    if (inZone && y >= gr + 1 && y <= gr + 3) {
      if (y === gr + 3) put(x, y, z, "white_concrete");
      else if (along(x, z, door.n) === doorAlong) {
        put(x, y, z, "dark_oak_door", {
          facing: facingName[door.n],
          half: y === gr + 1 ? "lower" : "upper",
          hinge: "left", open: "false", powered: "false",
        });
      } else put(x, y, z, "light_blue_stained_glass");
      continue;
    }

    // Floor slabs and storey bands.
    if (floor) {
      if (y === gr && exp.length) put(x, y, z, "gray_concrete");        // base course
      else if (exp.length) put(x, y, z, "light_gray_concrete");          // spandrel band
      else put(x, y, z, "smooth_stone");                                 // floor slab
      continue;
    }

    // Window rows: only exposed faces get a facade.
    if (!exp.length) continue;
    const face = exp[0];
    const idx = along(x, z, face);

    const shop = d < 5 && y < nextLine(gr);
    const storey = Math.floor((y - 3) / 5);
    const oddStorey = storey % 2 === 1;
    const mullion = idx % 4 === 0;
    // Odd storeys: solid white panels with a single narrow glass light per bay.
    const solidPanel = !shop && oddStorey && idx % 4 !== 2;
    const glassed = !mullion && !shop && !solidPanel;

    if (mullion || solidPanel) put(x, y, z, "white_concrete");
    else if (shop) put(x, y, z, "light_blue_stained_glass");
    else put(x, y, z, "light_blue_stained_glass_pane", paneProps(face));

    // Warm light behind some glazed tower bays, sitting on the slab below.
    if (glassed && d >= 5 && (y - 4) % 5 === 0 && idx % 8 === 2) {
      const [dx, dz] = dirVec[face];
      const ix = x - dx, iz = z - dz;
      if (inF(ix, iz) && depthOf(ix, iz) >= 1 && topMap.get(key(ix, iz)) >= y) {
        put(ix, y, iz, "glowstone");
      }
    }
  }
}

// ---- parapets on the outer edge of each roof tier -----------------------------------
for (const [k] of foot) {
  const [x, z] = k.split(",").map(Number);
  const d = depthOf(x, z);
  if (d >= 11 || ![0, 5, 9].includes(d)) continue;
  const T = topMap.get(k);
  if (exposed(x, z, T + 1).length) put(x, T + 1, z, "white_concrete");
}

// ---- entrance canopy and hanging lanterns --------------------------------------------
if (door) {
  const [dx, dz] = dirVec[door.n];
  const isNS = door.n === "N" || door.n === "S";
  for (let e = -2; e <= 2; e++) {
    const bx = isNS ? door.x + e : door.x;
    const bz = isNS ? door.z : door.z + e;
    const ox = bx + dx, oz = bz + dz;
    if (!inF(ox, oz)) put(ox, door.gr + 3, oz, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
  for (const e of [-2, 2]) {
    const bx = isNS ? door.x + e : door.x;
    const bz = isNS ? door.z : door.z + e;
    const ox = bx + dx, oz = bz + dz;
    if (!inF(ox, oz)) put(ox, door.gr + 2, oz, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// ---- antenna: iron core and lightning rod on the crown centre -----------------------
const crownCells = [...foot.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => depthOf(x, z) >= 11);
if (crownCells.length) {
  const cx = crownCells.reduce((s, [x]) => s + x, 0) / crownCells.length;
  const cz = crownCells.reduce((s, [, z]) => s + z, 0) / crownCells.length;
  crownCells.sort((a, b) => ((a[0] - cx) ** 2 + (a[1] - cz) ** 2) - ((b[0] - cx) ** 2 + (b[1] - cz) ** 2));
  const [ax, az] = crownCells[0];
  for (let y = CROWN_TOP + 1; y <= CROWN_TOP + 4; y++) put(ax, y, az, "iron_block");
  put(ax, CROWN_TOP + 5, az, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
