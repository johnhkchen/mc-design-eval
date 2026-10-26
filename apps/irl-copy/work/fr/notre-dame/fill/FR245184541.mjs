// FR245184541: Hôtel de la Motte Montgoubert, residential, two storeys under a steep Parisian mansard (the lidar's roof
// 22-27 above y 0). Limestone walls (rusticated stone on the ground storey, smooth stone above), quoins at the corners,
// a stone cornice, a mansard stepped in on the outer rings with glass dormers, a straight core rising to the lidar's roof,
// two chimneys, a dark oak street door, and warm lanterns and shroomlights behind some panes. Each cell stands on its
// ground (foundation below); the storey floors are full slabs across the footprint; the interior stays air.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${HERE}/FR245184541.cells.json`, "utf8"));   // [x, z, ground, roof]

const key = (x, z) => `${x},${z}`;
const foot = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inFoot = (x, z) => foot.has(key(x, z));
// outward face directions: north is -z
const FACES = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const exteriorFaces = (x, z) => Object.keys(FACES).filter(f => !inFoot(x + FACES[f][0], z + FACES[f][1]));
// a face's run runs along x (north, south) or z (west, east)
const along = (f, x, z) => (f === "north" || f === "south" ? x : z);
const paneState = f => (f === "north" || f === "south"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// depth: steps in from the outside (1 on the outer ring)
const depth = new Map(); const queue = [];
for (const [x, z] of cells) if (exteriorFaces(x, z).length) { depth.set(key(x, z), 1); queue.push([x, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = depth.get(key(x, z));
  for (const [dx, dz] of Object.values(FACES)) {
    if (inFoot(x + dx, z + dz) && !depth.has(key(x + dx, z + dz))) { depth.set(key(x + dx, z + dz), d + 1); queue.push([x + dx, z + dz]); }
  }
}
const D = (x, z) => depth.get(key(x, z));

// the lidar roof averaged over the 3x3 around each cell: its noise goes, the top reads as one tier
const roofAt = (x, z) => {
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFoot(x + dx, z + dz)) { s += foot.get(key(x + dx, z + dz)).r; n++; }
  return Math.round(s / n);
};

const FLOORS = [5, 11];   // storey slabs: the first floor and the attic floor, across the whole footprint
const CORNICE = 12;       // the cornice course on the outer ring; the mansard rises from here
const CORE = 4;           // cells this deep rise straight to the lidar roof; shallower cells step in (the mansard)

const v = new Voxels([25, 43, 24]);
const put = (x, y, z, block, state) => v.set(x, y, z, block, state);

// 1. foundation, ground slab and the floors across the footprint
for (const [x, z, g] of cells) {
  for (let y = 0; y <= g; y++) put(x, y, z, "stone_bricks");
  for (const y of FLOORS) put(x, y, z, "smooth_stone");
}

// 2. walls and glass on the outer ring: rusticated ground storey, smooth stone above, quoins at corners, paired windows
for (const [x, z, g] of cells) {
  const faces = exteriorFaces(x, z);
  if (!faces.length) continue;
  const corner = faces.length > 1, face = faces[0];
  for (let y = g + 1; y <= 10; y++) {
    if (FLOORS.includes(y)) continue;
    const ground = y < 5;
    const windowRow = (y >= g + 1 && y <= Math.min(g + 3, 4)) || (y >= 6 && y <= 8);
    if (!corner && along(face, x, z) % 2 === 1 && windowRow) { put(x, y, z, "glass_pane", paneState(face)); continue; }
    put(x, y, z, corner || ground ? "stone_bricks" : "smooth_stone");
  }
}

// 3. warm lights behind some panes: a lantern on the ground storey's floor, a shroomlight on the first floor's
for (const [x, z, g] of cells) {
  const faces = exteriorFaces(x, z);
  if (faces.length !== 1) continue;
  const f = faces[0], [dx, dz] = FACES[f];
  const ix = x - dx, iz = z - dz;   // the cell inside this one
  if (!inFoot(ix, iz) || D(ix, iz) < 2 || along(f, x, z) % 2 !== 1) continue;
  const gi = foot.get(key(ix, iz)).g;
  if (along(f, x, z) % 4 === 1 && gi + 1 <= 4) put(ix, gi + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  if (along(f, x, z) % 4 === 3) put(ix, 6, iz, "shroomlight");
}

// 4. the mansard: cornice on the outer ring, then solid up to the lidar roof in the core and stepped in on the rings
for (const [x, z] of cells) {
  const top = roofAt(x, z), d = D(x, z);
  for (let y = CORNICE; y < top; y++) {
    const k = 1 + Math.floor((y - CORNICE) / 2);   // the rings this high: one block in per two rising
    if (d < CORE && d < k) continue;
    put(x, y, z, y === CORNICE && d === 1 ? "stone_bricks" : "deepslate_tiles");
  }
}

// 5. dormers: glass set into the step of a second-ring cell, capped with a slab
for (const [x, z, g] of cells) {
  const d = D(x, z);
  if (d !== 2 || roofAt(x, z) < 18) continue;
  const f = Object.keys(FACES).find(f => inFoot(x + FACES[f][0], z + FACES[f][1]) && D(x + FACES[f][0], z + FACES[f][1]) === 1);
  if (!f || along(f, x, z) % 4 !== 2) continue;
  put(x, 14, z, "glass_pane", paneState(f));
  put(x, 15, z, "glass_pane", paneState(f));
  put(x, 16, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// 6. the street door: a ground-floor cell in a straight run of the outer ring, with a stone lintel
let door = null;
for (const [x, z, g] of cells) {
  const faces = exteriorFaces(x, z);
  if (faces.length !== 1 || g > 1) continue;
  const f = faces[0], [ax, az] = f === "north" || f === "south" ? [1, 0] : [0, 1];
  const straight = [[ax, az], [-ax, -az]].every(([dx, dz]) => inFoot(x + dx, z + dz) && exteriorFaces(x + dx, z + dz).includes(f));
  if (straight && (!door || g < door.g)) door = { x, z, g, f };
}
if (door) {
  const hinge = { facing: door.f, hinge: "left", open: "false", powered: "false" };
  put(door.x, door.g + 1, door.z, "dark_oak_door", { ...hinge, half: "lower" });
  put(door.x, door.g + 2, door.z, "dark_oak_door", { ...hinge, half: "upper" });
  put(door.x, door.g + 3, door.z, "stone_bricks");
}

// 7. two chimneys on the straight core, set into its top
const core = cells.filter(([x, z]) => D(x, z) >= CORE).map(([x, z]) => [x, z, roofAt(x, z)])
  .sort((a, b) => b[2] - a[2] || a[0] - b[0] || a[1] - b[1]);
const flues = [];
for (const c of core) if (flues.every(h => Math.abs(h[0] - c[0]) + Math.abs(h[1] - c[1]) >= 6)) flues.push(c);
for (const [x, z, top] of flues.slice(0, 2)) {
  for (let y = top; y < top + 3; y++) put(x, y, z, "stone_bricks");
  put(x, top + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

v.save(`${HERE}/FR245184541.nbt`);
