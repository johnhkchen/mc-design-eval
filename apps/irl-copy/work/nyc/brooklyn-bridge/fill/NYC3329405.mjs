import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3329405.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3329405.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 20, H = 20, D = 10;
const g = new Voxels([W, H, D]);

// ---- footprint bookkeeping -------------------------------------------------
const key = (x, z) => x + "," + z;
const cellMap = new Map();
for (const c of cells) cellMap.set(key(c[0], c[1]), { x: c[0], z: c[1], G: Math.round(c[2]), r: c[3] });

const inFp = (x, z) => cellMap.has(key(x, z));
const isPerim = (x, z) => !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);
const groundAt = (x, z) => (cellMap.get(key(x, z)) || { G: 0 }).G;

const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const maxG = Math.max(...cells.map((c) => Math.round(c[2])));

// ---- massing: one clean flat roof tier, ~8 blocks above lowest ground -------
const roofs = cells.map((c) => c[3]).sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];
let top = Math.round(medRoof);
top = Math.max(top, maxG + 6);   // at least 3 storeys of 2 blocks above the highest ground
top = Math.min(top, 16);         // keep the flue inside the 20-block height
// roof deck is layer top-1; the coping sits on it at y = top-1 (cornice course)

// ---- entrance: on the long south (max z) face, nearest to middle ----------
let door = null;
{
  let best = Infinity;
  for (const c of cells) {
    const [x, z] = [c[0], c[1]];
    if (z !== maxZ || !isPerim(x, z)) continue;
    const d = Math.abs(x - 10);
    if (d < best) { best = d; door = { x, z }; }
  }
  if (!door) {
    for (const c of cells) if (isPerim(c[0], c[1])) { door = { x: c[0], z: c[1] }; break; }
  }
}

const doorFacing = (x, z) =>
  z === maxZ ? "south" : z === minZ ? "north" : x === minX ? "west" : "east";

// window bay test: two glass panes then one brick pier, repeating
const bayWindow = (coord, bmin) => ((coord - bmin) % 3) !== 2;

// ---- build every footprint cell -------------------------------------------
for (const c of cells) {
  const x = c[0], z = c[1], G = Math.round(c[2]);
  const perim = isPerim(x, z);

  // foundation: solid base from y0 up to this cell's ground
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");

  if (!perim) {
    // interior: floor slabs at each storey line and a roof deck, otherwise air
    for (let y = G; y < top; y++) {
      if (y === top - 1) g.set(x, y, z, "smooth_stone");
      else if (y > G && (y - G) % 2 === 0) g.set(x, y, z, "smooth_stone");
    }
    continue;
  }

  const corner = (x === minX || x === maxX) && (z === minZ || z === maxZ);
  const onLong = z === minZ || z === maxZ;
  const coord = onLong ? x : z;
  const bmin = onLong ? minX : minZ;
  const win = !corner && bayWindow(coord, bmin);
  const paneProps = onLong
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

  const isDoor = door && door.x === x && door.z === z;

  for (let y = G; y < top; y++) {
    const h = y - G;
    if (y === top - 1) {
      g.set(x, y, z, "smooth_stone");                       // cornice / coping course
    } else if (isDoor && h <= 1) {
      const half = h === 0 ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", {
        facing: doorFacing(x, z), half, hinge: "left", open: "false", powered: "false",
      });
    } else if (h === 0) {
      g.set(x, y, z, "stone_bricks");                       // shopfront bulkhead / base course
    } else if (h === 1 && !corner) {
      g.set(x, y, z, "glass_pane", paneProps);              // ground-floor shopfront glazing
    } else if (h % 2 === 1 && win) {
      g.set(x, y, z, "glass_pane", paneProps);              // upper window rows, two-pane bays
    } else {
      g.set(x, y, z, "bricks");                             // piers and floor lines
    }
  }
}

// ---- warm light: glowstone just behind a sample of upper-floor windows -----
for (const c of cells) {
  const x = c[0], z = c[1], G = Math.round(c[2]);
  if (!isPerim(x, z)) continue;
  const corner = (x === minX || x === maxX) && (z === minZ || z === maxZ);
  if (corner) continue;
  const onLong = z === minZ || z === maxZ;
  const coord = onLong ? x : z;
  const bmin = onLong ? minX : minZ;
  if (!bayWindow(coord, bmin)) continue;

  const ix = x === minX ? x + 1 : x === maxX ? x - 1 : x;
  const iz = z === minZ ? z + 1 : z === maxZ ? z - 1 : z;
  if (!inFp(ix, iz) || isPerim(ix, iz)) continue;
  const Gn = groundAt(ix, iz);

  for (let y = G + 3; y < top - 1; y += 2) {
    if (y < Gn || (y - Gn) % 2 !== 1) continue;
    if (((x * 31 + z * 17 + y * 7) % 5) !== 0) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

// ---- a small brick flue on the roof, inside the footprint ------------------
{
  const cx = Math.min(maxX - 3, 16), cz = Math.floor((minZ + maxZ) / 2);
  if (inFp(cx, cz) && !isPerim(cx, cz)) {
    for (let y = top; y <= top + 1; y++) g.set(cx, y, cz, "bricks");
    g.set(cx, top + 2, cz, "smooth_stone");
  }
}

g.save(OUT);
