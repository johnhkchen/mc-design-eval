import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE91-0071-11F";
const W = 125, H = 66, D = 37;
const ROOF = 54;          // roof line, about 11 storeys of 5 blocks
const STOREY = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
let xmin = Infinity, xmax = -Infinity, zmin = Infinity, zmax = -Infinity;
for (const [x, z, gr] of cells) {
  G.set(`${x},${z}`, gr);
  xmin = Math.min(xmin, x); xmax = Math.max(xmax, x);
  zmin = Math.min(zmin, z); zmax = Math.max(zmax, z);
}
const has = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);

// Entrance centre for each long face: middle of that face's own row of cells
function rowMid(zRow) {
  const xs = cells.filter(([x, z]) => z === zRow && !has(x, zRow + (zRow === zmax ? 1 : -1))).map(c => c[0]);
  if (!xs.length) return null;
  return Math.floor((Math.min(...xs) + Math.max(...xs)) / 2);
}
const doorMid = { [zmax]: rowMid(zmax), [zmin]: rowMid(zmin) };

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

// Which face a facade cell sits on (null for interior cells)
function face(x, z) {
  const N = !has(x, z - 1), S = !has(x, z + 1);
  const Wm = !has(x - 1, z), E = !has(x + 1, z);
  if (N || S) return { axis: "x", ox: 0, oz: S ? 1 : -1, a: x, corner: Wm || E };
  if (Wm || E) return { axis: "z", ox: E ? 1 : -1, oz: 0, a: z, corner: false };
  return null;
}

function panePros(f) {
  if (f.corner) return { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
  return f.axis === "x"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  const f = face(x, z);

  if (!f) {
    // Interior: floor slabs per storey and the roof cap, air between
    for (let y = gr; y <= ROOF; y++) {
      if (y === ROOF || (y % STOREY === 0 && y > gr)) put(x, y, z, "smooth_stone");
    }
    continue;
  }

  const ix = x - f.ox, iz = z - f.oz;          // inward neighbour
  const inward = has(ix, iz) ? { x: ix, z: iz, gr: gnd(ix, iz) } : null;
  const mullion = f.a % 3 === 0 || f.corner;

  // Entrance on the north and south long faces, centred on that face's row
  const onEntryRow = f.axis === "x" && (z === zmax || z === zmin) && doorMid[z] !== null;
  const dm = onEntryRow ? doorMid[z] : null;
  const isDoorCol = onEntryRow && (f.a === dm || f.a === dm + 1);
  const canopyCol = onEntryRow && f.a >= dm - 2 && f.a <= dm + 3;
  const lobbyCol = onEntryRow && f.a >= dm - 4 && f.a <= dm + 5;
  const doorFacing = f.oz === 1 ? "south" : "north";

  for (let y = gr; y <= ROOF + 1; y++) {
    // Base course
    if (y === gr) { put(x, y, z, "polished_granite"); continue; }

    // Parapet and cornice
    if (y === ROOF + 1) { put(x, y, z, "light_gray_concrete"); continue; }
    if (y === ROOF) { put(x, y, z, "smooth_quartz"); continue; }

    // Ground zone: shopfront with entrance, lobby glazing and canopy
    if (y < gr + STOREY) {
      if (isDoorCol && y <= gr + 2) {
        const half = y === gr + 1 ? "lower" : "upper";
        const hinge = f.a === dm ? "left" : "right";
        put(x, y, z, "iron_door", {
          facing: doorFacing, half, hinge, open: "false", powered: "false",
        });
        continue;
      }
      if (canopyCol && y === gr + 3) {
        put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
        continue;
      }
      if (lobbyCol && y > gr + 3 && y < gr + 4) {
        // Glazed lobby band above the canopy
        put(x, y, z, "light_blue_stained_glass_pane", panePros(f));
        continue;
      }
      if (mullion) put(x, y, z, "smooth_quartz");
      else put(x, y, z, "light_blue_stained_glass_pane", panePros(f));
      continue;
    }

    // Upper storeys: spandrels, mullions and glass panes
    const rel = y % STOREY;
    if (rel === 0) { put(x, y, z, "white_concrete"); continue; }
    if (mullion) { put(x, y, z, "light_gray_concrete"); continue; }
    put(x, y, z, "light_blue_stained_glass_pane", panePros(f));

    // Warm light in the air gap behind some windows
    if (rel === 2 && inward && y >= inward.gr && ((f.a + y) % 9 === 0)) {
      put(inward.x, y, inward.z, "glowstone");
    }
  }
}

// Mechanical penthouse on the roof, centred and set in from the edges
const phX0 = xmin + 30, phX1 = xmax - 30, phZ0 = zmin + 8, phZ1 = zmax - 8;
for (const [x, z] of cells) {
  if (x < phX0 || x > phX1 || z < phZ0 || z > phZ1) continue;
  if (face(x, z)) continue;
  for (let y = ROOF + 1; y <= ROOF + 4; y++) put(x, y, z, "light_gray_concrete");
}

// Antenna mast on the penthouse centre
const cx = Math.floor((xmin + xmax) / 2), cz = Math.floor((zmin + zmax) / 2);
if (has(cx, cz)) {
  for (let y = ROOF + 5; y <= ROOF + 8; y++) put(cx, y, cz, "iron_bars");
  put(cx, ROOF + 9, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
