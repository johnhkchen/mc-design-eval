// Way 769193365: a two-storey interwar brick commercial block on Mt Eden / Eden Terrace, its street (north) face shopfronted.
// Massing follows the lidar roof, 3x3-smoothed and snapped to three tiers (8, 9, 10 blocks above y 0); the parapet adds a course.
// Interior is solid massing with an air pocket behind each window (a glowstone in some), so every tier stands on solid below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_769193365.cells.json`, "utf8"));

const C = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { x, z, g: ground, r: roof }]));
const at = (x, z) => C.get(`${x},${z}`);

// Roof tiers: 3x3 mean of the lidar roof heights over footprint cells, snapped to 8 / 9 / 10.
for (const c of C.values()) {
  let s = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const o = at(c.x + dx, c.z + dz); if (o) { s += o.r; n++; } }
  const m = s / n;
  c.R = m < 8.5 ? 8 : m < 9.5 ? 9 : 10;
}

// Outward faces of a cell: n = -z (the street side), s = +z, w = -x, e = +x. Interior cells have none.
const faces = (c) => {
  const f = [];
  if (!at(c.x, c.z - 1)) f.push("n");
  if (!at(c.x, c.z + 1)) f.push("s");
  if (!at(c.x - 1, c.z)) f.push("w");
  if (!at(c.x + 1, c.z)) f.push("e");
  return f;
};
const inward = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] };
const faceIdx = { n: (c) => c.x, s: (c) => c.x, w: (c) => c.z, e: (c) => c.z };
const perimeter = (c) => faces(c).length > 0;

// Entrance: the street-face cell nearest the middle of that face.
const nFace = [...C.values()].filter((c) => faces(c).includes("n"));
const midX = nFace.reduce((a, c) => a + c.x, 0) / nFace.length;
const door = nFace.reduce((best, c) => (Math.abs(c.x - midX) < Math.abs(best.x - midX) ? c : best));

const g = new Voxels([13, 23, 22]);
const B = "bricks", ST = "stone_bricks", SM = "smooth_stone", RF = "stone";   // a light roof cover, not a dark well inside the parapet
const paneState = (c, f) => {
  const along = f === "n" || f === "s";
  return {
    north: !along && at(c.x, c.z - 1) ? "true" : "false",
    south: !along && at(c.x, c.z + 1) ? "true" : "false",
    east: along && at(c.x + 1, c.z) ? "true" : "false",
    west: along && at(c.x - 1, c.z) ? "true" : "false",
    waterlogged: "false",
  };
};

// Pass 1: the massing. Foundation to the ground, solid body to the roof cover, parapet and cornice on the perimeter.
for (const c of C.values()) {
  const { x, z, g: gr, R } = c;
  for (let y = 0; y < gr; y++) g.set(x, y, z, ST);
  for (let y = gr; y < R - 1; y++) g.set(x, y, z, B);
  g.set(x, R - 1, z, RF);
  if (perimeter(c)) {
    for (let y = gr; y <= R; y++) g.set(x, y, z, B);
    g.set(x, gr, z, ST);                                   // base course
    if (gr + 4 < R - 1) g.set(x, gr + 4, z, SM);           // first-floor string course
    g.set(x, R - 1, z, SM);                                // cornice
    g.set(x, R, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); // coping
  }
}

// Pass 2: the openings. Window columns two wide, stone piers one wide; shopfront glazing on the street face.
const lamps = [];
for (const c of C.values()) {
  if (!perimeter(c)) continue;
  const { x, z, g: gr, R } = c;
  const f = faces(c)[0];
  const [dx, dz] = inward[f];
  const isWin = faceIdx[f](c) % 3 !== 0;
  const upper = [gr + 5, gr + 6].filter((y) => y <= R - 3);
  const ground = [gr + 1, gr + 2];

  if (c === door) {
    for (const y of ground) g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === gr + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 3, z, "dark_oak_planks");
    if (at(x + dx, z + dz)) for (const y of ground) g.set(x + dx, y, z + dz, "air");
    continue;
  }
  if (!isWin) {
    for (const y of upper) g.set(x, y, z, ST);             // pier
    continue;
  }
  for (const y of ground) {
    g.set(x, y, z, "glass_pane", paneState(c, f));
    const ix = x + dx, iz = z + dz; if (at(ix, iz) && !perimeter(at(ix, iz))) g.set(ix, y, iz, "air");
  }
  if (f === "n") g.set(x, gr + 3, z, "dark_oak_planks"); // transom over the shopfront
  else g.set(x, gr + 3, z, B);
  for (const y of upper) {
    g.set(x, y, z, "glass_pane", paneState(c, f));
    const ix = x + dx, iz = z + dz; if (at(ix, iz) && !perimeter(at(ix, iz))) g.set(ix, y, iz, "air");
  }
  // Warm light behind some panes.
  const h = (x * 7 + z * 3 + gr) % 3;
  const ix = x + dx, iz = z + dz;
  if (at(ix, iz) && !perimeter(at(ix, iz))) {
    if (h === 0 && upper.length) lamps.push([ix, gr + 5, iz]);
    if (h === 1) lamps.push([ix, gr + 2, iz]);
  }
}
for (const [x, y, z] of lamps) g.set(x, y, z, "glowstone");

// Pass 3: roof plant on the tallest tier, a 2x2 box two high, on the roof cover.
const tall = [...C.values()].filter((c) => c.R === 10 && !perimeter(c));
const cx = tall.reduce((a, c) => a + c.x, 0) / tall.length, cz = tall.reduce((a, c) => a + c.z, 0) / tall.length;
const origins = tall.filter((c) => [[1, 0], [0, 1], [1, 1]].every(([a, b]) => { const o = at(c.x + a, c.z + b); return o && o.R === 10 && !perimeter(o); }));
const plant = origins.reduce((best, c) => (Math.hypot(c.x - cx, c.z - cz) < Math.hypot(best.x - cx, best.z - cz) ? c : best));
for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
  g.set(plant.x + a, 10, plant.z + b, ST);
  g.set(plant.x + a, 11, plant.z + b, "smooth_stone");
}

const stats = g.save(`${HERE}/way_769193365.nbt`);
console.log(JSON.stringify({ tiers: Object.fromEntries([8, 9, 10].map((t) => [t, [...C.values()].filter((c) => c.R === t).length])), door: [door.x, door.z], lamps: lamps.length, ...stats }));
