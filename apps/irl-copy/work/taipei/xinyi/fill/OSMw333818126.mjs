import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Era read from the record: 11 storeys (about 54 blocks to the roof), a single
// footprint, no further data. Treated as a late-1990s/2000s Xinyi office block:
// white concrete piers and spandrels, tinted glass bands, a granite and glass
// ground storey, a setback podium, and a plant box with a mast on the roof.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw333818126";
const W = 51, H = 66, D = 34;
const SETBACK = 40;   // podium roof / first setback line
const ROOF = 54;      // tower roof slab, about 54 blocks above lowest ground

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, Math.max(0, Math.round(gy)));

const K = (x, z) => `${x},${z}`;
const parse = k => k.split(",").map(Number);
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const full = new Set(ground.keys());

function erode(S) {
  const out = new Set();
  for (const k of S) {
    const [x, z] = parse(k);
    if (N4.every(([dx, dz]) => S.has(K(x + dx, z + dz)))) out.add(k);
  }
  return out;
}
// Upper tower = footprint eroded twice (a 2-block setback all round).
let upper = erode(erode(full));
if (upper.size < 6) upper = erode(full);

const isEdge = (x, z, S) => N4.some(([dx, dz]) => !S.has(K(x + dx, z + dz)));
const setFor = y => (y >= SETBACK ? upper : full);

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => (p ? g.set(x, y, z, b, p) : g.set(x, y, z, b));
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

// Entrance: centred on the north-most (minimum z) edge.
let entrance = null;
{
  const edges = [...full].map(parse).filter(([x, z]) => isEdge(x, z, full));
  if (edges.length) {
    const minZ = Math.min(...edges.map(([, z]) => z));
    const north = edges.filter(([, z]) => z === minZ).sort((a, b) => a[0] - b[0]);
    const [ex, ez] = north[Math.floor(north.length / 2)];
    entrance = { x: ex, z: ez, g: ground.get(K(ex, ez)) };
  }
}
const isEntranceBay = (x, z) => entrance && Math.abs(x - entrance.x) <= 1 && z === entrance.z;

// 1. Foundations: solid from y 0 up to each cell's ground.
for (const k of full) {
  const [x, z] = parse(k);
  const gy = ground.get(k);
  for (let y = 0; y < gy; y++) put(x, y, z, "polished_andesite");
}

// 2. Walls, storey lines, glazing, ground storey and setback tower.
for (const k of full) {
  const [x, z] = parse(k);
  const gy = ground.get(k);
  const inU = upper.has(k);
  const top = inU ? 53 : 39;
  const eLow = isEdge(x, z, full);
  const eHigh = inU && isEdge(x, z, upper);

  for (let y = gy; y <= top; y++) {
    const S = setFor(y);
    const e = y >= SETBACK ? eHigh : eLow;
    const row = y % 5;

    // Ground storey: granite base, shopfront glass, quartz transom and lintel.
    if (eLow && y < 5) {
      if (y === gy) put(x, y, z, "polished_granite");
      else if (y < 4 && y <= gy + 2) put(x, y, z, "glass");
      else put(x, y, z, "smooth_quartz");
      continue;
    }

    // Floor slab rows (string course on the facade, slab inside).
    if (row === 0) {
      put(x, y, z, e ? "smooth_quartz" : "light_gray_concrete");
      continue;
    }
    if (!e) continue; // interior: air gap behind the glass

    // Spandrel: darker band so the storey lines read from the street.
    if (row === 4) { put(x, y, z, "light_gray_concrete"); continue; }
    // White concrete piers read as the frame between bays.
    if ((x + z) % 3 === 0) { put(x, y, z, "white_concrete"); continue; }

    put(x, y, z, "light_blue_stained_glass_pane");

    // Warm light: rare glowstone behind some panes, one bay per storey.
    if (hash(x, y, z) % 11 === 0) {
      for (const [dx, dz] of N4) {
        const nx = x + dx, nz = z + dz, nk = K(nx, nz);
        if (!S.has(nk) || isEdge(nx, nz, S)) continue;
        if (ground.get(nk) > y) continue;
        put(nx, y, nz, "glowstone");
        break;
      }
    }
  }
}

// 2b. Entrance: granite jambs either side, quartz lintel above, door in the middle.
if (entrance) {
  const { x: ex, z: ez, g: eg } = entrance;
  for (const dx of [-1, 0, 1]) {
    const x = ex + dx;
    if (!full.has(K(x, ez))) continue;
    const gy = ground.get(K(x, ez));
    if (gy > eg + 2) continue;
    if (dx !== 0) {
      put(x, gy, ez, "polished_granite");
      put(x, gy + 1, ez, "polished_granite");
      put(x, gy + 2, ez, "polished_granite");
    }
    put(x, Math.min(4, gy + 3), ez, "polished_granite"); // lintel band
  }
  put(ex, eg + 2, ez, "lantern", { hanging: "true", waterlogged: "false" });
  for (const dx of [-1, 1]) {
    const x = ex + dx;
    if (full.has(K(x, ez)) && ground.get(K(x, ez)) === eg && eg + 1 <= 4) {
      put(x, eg + 1, ez, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// 3. Podium terrace at the setback: slab at y 40, parapet on the ring edge.
for (const k of full) {
  if (upper.has(k)) continue;
  const [x, z] = parse(k);
  put(x, SETBACK, z, "light_gray_concrete");
  if (isEdge(x, z, full)) put(x, SETBACK + 1, z, "white_concrete");
}

// 4. Tower roof: slab at ROOF, cornice and parapet on the edge.
for (const k of upper) {
  const [x, z] = parse(k);
  const e = isEdge(x, z, upper);
  put(x, ROOF, z, e ? "smooth_quartz" : "light_gray_concrete");
  if (e) put(x, ROOF + 1, z, "white_concrete");
}

// 5. Roof plant: a box on interior roof cells, with a mast on its centre.
{
  const arr = [...upper].map(parse);
  if (arr.length) {
    const cx = arr.reduce((s, [x]) => s + x, 0) / arr.length;
    const cz = arr.reduce((s, [, z]) => s + z, 0) / arr.length;
    const interior = arr.filter(([x, z]) => !isEdge(x, z, upper));
    let centre = null, best = Infinity;
    for (const [x, z] of interior) {
      const d = (x - cx) ** 2 + (z - cz) ** 2;
      if (d < best) { best = d; centre = [x, z]; }
    }
    if (centre) {
      const [mx, mz] = centre;
      for (const [x, z] of interior) {
        if (Math.abs(x - mx) <= 3 && Math.abs(z - mz) <= 2) {
          for (let y = ROOF + 1; y <= ROOF + 3; y++) put(x, y, z, "light_gray_concrete");
        }
      }
      for (let y = ROOF + 4; y <= ROOF + 6; y++) put(mx, y, mz, "iron_block");
      put(mx, ROOF + 7, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
    }
  }
}

// 6. Doors last, so nothing overwrites them.
if (entrance) {
  const { x: ex, z: ez, g: eg } = entrance;
  const door = half => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  put(ex, eg, ez, "oak_door", door("lower"));
  put(ex, eg + 1, ez, "oak_door", door("upper"));
}

g.save(`${DIR}/${ID}.nbt`);
