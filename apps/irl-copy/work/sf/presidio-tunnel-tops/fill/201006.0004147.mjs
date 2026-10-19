// 3550 West Pacific Ave: a seven-storey mixed-use block, 1920s cream stucco over a ground-floor shopfront. Footprint = the
// lidar cells; each cell's ground is 0 or 1, so the foundation fills y 0 up to that ground and the walls rise from there to
// one common roof (y 14, parapet to y 15). The downhill cells therefore carry more wall, as the lot does.
// Storeys are two blocks: a floor slab on the even rows (interior) or a belt course (exterior), then the window row on the
// odd rows. Only the shell is built: a one-block wall ring, floor slabs, and the air between them (an air gap behind every
// pane). The street frontage (the face with the most exposed cells) is commercial: a glazed shopfront with dark-oak piers and
// fascia, and an entrance with a dark-oak door and a canopy. A second entrance sits on the next face. Some windows have a
// glowstone set in the air behind them and the shop has hanging lanterns. Roof: a stone deck with an HVAC box and a stair bulkhead.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/sf/presidio-tunnel-tops/fill";
const cells = JSON.parse(readFileSync(`${DIR}/201006.0004147.cells.json`, "utf8"));   // [x, z, ground]
const g = new Voxels([15, 26, 22]);

const ground = new Map(cells.map(([x, z, h]) => [`${x},${z}`, h]));
const inside = (x, z) => ground.has(`${x},${z}`);
const STEP = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };   // from the face into the building
const faceOf = (x, z) => Object.keys(STEP).filter((f) => !inside(x + STEP[f][0], z + STEP[f][1]));
const alongFace = (face) => (face === "north" || face === "south" ? [1, 0] : [0, 1]);
const onSameFace = (x, z, face) => inside(x, z) && faceOf(x, z).includes(face);
const key = (x, z) => `${x},${z}`;

// Storey rows: 0 is the ground storey (y 1 and 2), storeys 1..6 hold window rows at y 3..13; belts at 2..12, roof at 14.
const TOP = 14;
const ROOF_RAISE = 15;

// Frontage: the face with the most exposed cells. Entrances: the cell nearest that face's middle, and the same on the next face.
const faceCount = Object.fromEntries(Object.keys(STEP).map((f) => [f, cells.filter(([x, z]) => faceOf(x, z).includes(f)).length]));
const [front, side] = Object.keys(STEP).sort((a, b) => faceCount[b] - faceCount[a]);
const faceCells = (face) => cells.filter(([x, z]) => faceOf(x, z).includes(face));
const pickDoor = (face) => {
  const on = faceCells(face), n = on.length;
  const mx = on.reduce((s, [x]) => s + x, 0) / n, mz = on.reduce((s, [, z]) => s + z, 0) / n;
  const single = on.filter(([x, z]) => faceOf(x, z).length === 1);   // not on a corner
  return (single.length ? single : on).sort((a, b) => (Math.abs(a[0] - mx) + Math.abs(a[1] - mz)) - (Math.abs(b[0] - mx) + Math.abs(b[1] - mz)))[0];
};
const doors = new Map([[key(...pickDoor(front)), front], [key(...pickDoor(side)), side]]);

const DOOR = (face, half) => ({ facing: face, half, hinge: "left", open: "false", powered: "false" });
const pane = (x, z, face) => {   // a glass pane joins the neighbouring pane or pier along its face
  const [ax, az] = alongFace(face);
  const a = onSameFace(x - ax, z - az, face), b = onSameFace(x + ax, z + az, face);
  const conn = { north: "false", south: "false", east: "false", west: "false" };
  if (ax) { conn.west = String(a); conn.east = String(b); } else { conn.north = String(a); conn.south = String(b); }
  return { ...conn, waterlogged: "false" };
};
const lit = (x, y, z) => (x * 3 + z * 5 + ((y - 1) >> 1) * 4) % 7 === 0;   // about one window in seven, spread over the storeys

for (const [x, z, h] of cells) {
  const faces = faceOf(x, z), wall = faces.length > 0, face = faces[0];

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < h; y++) g.set(x, y, z, "stone_bricks");

  if (!wall) {   // interior: floor slabs on the even rows, air between, roof deck on top
    g.set(x, 0, z, "smooth_stone");
    for (let y = 2; y < TOP; y += 2) g.set(x, y, z, "smooth_stone");
    g.set(x, TOP, z, "stone");
    continue;
  }

  const door = doors.get(key(x, z));
  const [ax, az] = alongFace(face), bay = ax ? x : z;
  const frontCell = faces.includes(front);

  g.set(x, 0, z, "stone_bricks");   // base course
  for (let y = 2; y < TOP; y += 2) g.set(x, y, z, "light_gray_concrete");   // storey lines
  g.set(x, TOP, z, "light_gray_concrete");   // cornice
  g.set(x, ROOF_RAISE, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });   // low parapet

  // Ground storey (y 1), shopfront on the frontage, plain windows elsewhere.
  if (frontCell && face === front) {
    const fbay = (ax ? x : z);
    if (fbay % 4 === 0) g.set(x, 1, z, "dark_oak_planks");
    else g.set(x, 1, z, "glass");
    g.set(x, 2, z, "dark_oak_planks");   // fascia
  } else {
    g.set(x, 1, z, bay % 3 === 0 ? "smooth_quartz" : "glass_pane", bay % 3 === 0 ? undefined : pane(x, z, face));
  }

  // Upper storeys: window rows on the odd rows, piers between them.
  for (let y = 3; y < TOP; y += 2) {
    if (bay % 3 === 0) { g.set(x, y, z, "smooth_quartz"); continue; }
    g.set(x, y, z, "glass_pane", pane(x, z, face));
  }
  // Any stucco left: the wall rises as solid stucco on the rows not yet filled.
  for (let y = 1; y < TOP; y++) if (!g.get(x, y, z)) g.set(x, y, z, "smooth_quartz");

  // Warm light in the air behind some panes (and in the shop).
  const [ix, iz] = [x + INWARD[face][0], z + INWARD[face][1]];
  const behindOpen = inside(ix, iz) && faceOf(ix, iz).length === 0;
  if (behindOpen) {
    for (let y = 1; y < TOP; y += 2) {
      if (!lit(x, y, z)) continue;
      if (y === 1 && face === front) g.set(ix, 1, iz, "lantern", { hanging: "true", waterlogged: "false" });
      else if (y > 1) g.set(ix, y, iz, "glowstone");
    }
  }

  if (door) {
    g.set(x, 1, z, "dark_oak_door", DOOR(door, "lower"));
    g.set(x, 2, z, "dark_oak_door", DOOR(door, "upper"));
    // Canopy over the entrance and its two neighbours on the same face.
    for (const d of [-1, 0, 1]) {
      const cx = x + ax * d, cz = z + az * d;
      if (onSameFace(cx, cz, face)) g.set(cx, 3, cz, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// Roof: find room for a stair bulkhead (2x2) and an HVAC box (3x2) on the deck, at least two blocks from any edge.
const dist = new Map(), q = [];
for (const [x, z] of cells) if (faceOf(x, z).length) { dist.set(key(x, z), 0); q.push([x, z]); }
for (let i = 0; i < q.length; i++) {
  const [x, z] = q[i], d = dist.get(key(x, z));
  for (const [dx, dz] of Object.values(STEP)) {
    const nx = x + dx, nz = z + dz, k = key(nx, nz);
    if (inside(nx, nz) && !dist.has(k)) { dist.set(k, d + 1); q.push([nx, nz]); }
  }
}
const used = new Set();
const place = (w, d, minD, [cx, cz]) => {
  const spots = cells.filter(([x, z]) => faceOf(x, z).length === 0)
    .sort((a, b) => (Math.abs(a[0] - cx) + Math.abs(a[1] - cz)) - (Math.abs(b[0] - cx) + Math.abs(b[1] - cz)));
  for (const [x0, z0] of spots) {
    const rect = [];
    for (let dx = 0; dx < w; dx++) for (let dz = 0; dz < d; dz++) rect.push([x0 + dx, z0 + dz]);
    if (rect.every(([x, z]) => inside(x, z) && (dist.get(key(x, z)) ?? 0) >= minD && !used.has(key(x, z)))) {
      rect.forEach(([x, z]) => used.add(key(x, z)));
      return rect;
    }
  }
  return null;
};
const bulkhead = place(2, 2, 2, [7, 11]);
if (bulkhead) for (const [x, z] of bulkhead) {
  g.set(x, TOP + 1, z, "smooth_quartz");
  g.set(x, TOP + 2, z, "smooth_quartz");
  g.set(x, TOP + 3, z, "light_gray_concrete");
}
const hvac = place(3, 2, 2, [4, 16]);
if (hvac) for (const [x, z] of hvac) g.set(x, TOP + 1, z, "gray_concrete");

const out = g.save(`${DIR}/201006.0004147.nbt`);
console.log(JSON.stringify({ front, side, faceCount, doors: [...doors], bulkhead: !!bulkhead, hvac: !!hvac, ...out }));
