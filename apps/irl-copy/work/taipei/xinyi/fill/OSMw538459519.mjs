import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538459519";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 12, H = 23, D = 17;
const g = new Voxels([W, H, D]);

// Footprint lookup
const key = (x, z) => `${x},${z}`;
const groundOf = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => groundOf.has(key(x, z));
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, z) => Object.keys(DIRS).filter(d => !has(x + DIRS[d][0], z + DIRS[d][1]));

const minG = Math.min(...cells.map(c => c[2]));
const base = minG;                       // y 0 is lowest ground; storeys start here
const minX = Math.min(...cells.map(c => c[0])), maxX = Math.max(...cells.map(c => c[0]));
const minZ = Math.min(...cells.map(c => c[1])), maxZ = Math.max(...cells.map(c => c[1]));

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || !has(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Entrance: street front is the north (z min) face; door sits nearest the centre line
const cx = (minX + maxX) / 2;
const frontCells = cells.filter(([x, z]) => exposed(x, z).includes("N"));
const byCentre = (a, b) => Math.abs(a[0] - cx) - Math.abs(b[0] - cx);
const doorCandidates = frontCells.filter(([x, z]) => exposed(x, z).length === 1).sort(byCentre);
const doorCell = doorCandidates[0] ?? [...frontCells].sort(byCentre)[0];
const doorKey = doorCell ? key(doorCell[0], doorCell[1]) : null;

// Pass 1: foundation, walls, openings, floors, roof deck
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const d = exposed(x, z);
  const per = d.length > 0;
  const corner = d.length > 1;
  const front = d.includes("N");
  const isDoor = front && key(x, z) === doorKey;
  const uAlong = (d[0] === "N" || d[0] === "S") ? x : z;
  const win = per && !corner && (uAlong % 2 === 1);

  for (let y = gr; y <= base + 11; y++) {
    const rel = y - base;

    if (!per) {
      // Interior: floor slabs at storey line and roof deck, air elsewhere
      if (rel === 5 || rel === 10) put(x, y, z, "light_gray_concrete");
      continue;
    }

    // Perimeter envelope
    if (rel === 11) { put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; } // parapet cap
    if (rel === 10) { put(x, y, z, "stone_bricks"); continue; }                                              // cornice
    if (rel === 5) { put(x, y, z, "stone_bricks"); continue; }                                               // storey line
    if (rel === 4 && front) { put(x, y, z, "red_concrete"); continue; }                                      // shop sign band

    if (rel <= 4) {
      // Ground storey
      if (front) {
        if (isDoor) {
          if (y === gr) put(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
          else if (y === gr + 1) put(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
          else if (rel <= 3) put(x, y, z, "glass");
        } else if (corner) {
          put(x, y, z, "stone_bricks");
        } else if (y === gr) {
          put(x, y, z, "stone_bricks");
        } else if (rel <= 3) {
          put(x, y, z, "glass");                       // shopfront glazing
        }
      } else {
        if (corner || y === gr) put(x, y, z, "stone_bricks");
        else if (win && rel >= 1 && rel <= 3) put(x, y, z, "glass");
        else put(x, y, z, "smooth_quartz");
      }
      continue;
    }

    // Upper storey
    if (win && rel >= 6 && rel <= 8) put(x, y, z, "glass");
    else put(x, y, z, "smooth_quartz");
  }
}

// Pass 2: warm light behind upper-storey windows (on the floor slab, inside)
for (const [x, z, gr] of cells) {
  const d = exposed(x, z);
  if (d.length !== 1) continue;
  const uAlong = (d[0] === "N" || d[0] === "S") ? x : z;
  if (uAlong % 2 !== 1) continue;
  if ((x * 5 + z * 3) % 4 !== 0) continue;
  const ix = x - DIRS[d[0]][0], iz = z - DIRS[d[0]][1];
  if (!has(ix, iz) || exposed(ix, iz).length > 0) continue;
  put(ix, base + 6, iz, "glowstone");
}

// Pass 3: roof plant: a water tank on an interior 3x3 patch, near the back, plus a small box
const interior3 = (x0, z0, n) => {
  for (let dx = 0; dx < n; dx++) for (let dz = 0; dz < n; dz++) {
    const x = x0 + dx, z = z0 + dz;
    if (!has(x, z) || exposed(x, z).length > 0 || groundOf.get(key(x, z)) > base + 10) return false;
  }
  return true;
};

let tank = null;
for (let tz = maxZ - 3; tz >= minZ + 1 && !tank; tz--) {
  for (let tx = minX + 1; tx <= maxX - 3; tx++) {
    if (interior3(tx, tz, 3)) { tank = [tx, tz]; break; }
  }
}
if (tank) {
  const [tx, tz] = tank;
  for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 3; dz++) {
    const x = tx + dx, z = tz + dz;
    for (let y = base + 11; y <= base + 12; y++) put(x, y, z, "white_concrete");
    put(x, base + 13, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

let box = null;
for (let bz = minZ + 1; bz <= maxZ - 1 && !box; bz++) {
  for (let bx = minX + 1; bx <= maxX - 2; bx++) {
    if (tank && bx < tank[0] + 4 && bx + 2 > tank[0] - 1 && bz < tank[1] + 4 && bz + 1 > tank[1] - 1) continue;
    if (interior3(bx, bz, 2)) { box = [bx, bz]; break; }
  }
}
if (box) {
  for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
    put(box[0] + dx, base + 11, box[1] + dz, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
