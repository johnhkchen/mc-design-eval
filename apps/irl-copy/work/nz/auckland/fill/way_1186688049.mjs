import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// C Block, Auckland (OSM way 1186688049): a 1970s-80s precast-concrete office block on a stepped plan. Lidar roofs
// snap to storey lines (4 blocks): a low 3-storey wing, 5-storey shoulders, an 8-storey main body and a 9-storey tower
// in the south-east, with a plant room on top. Pale cream concrete, a dark mullioned glass curtain wall, a granite
// lintel over the entrance, and warm light behind some windows.

const DIR = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
const NAME = { N: "north", E: "east", S: "south", W: "west" };
const W = 55, D = 90, TOP = 40;
const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1186688049";

const cells = JSON.parse(readFileSync(`${SRC}.cells.json`, "utf8"));
const k = (x, z) => `${x},${z}`;
const raw = new Map(), ground = new Map();
for (const [x, z, g, r] of cells) { raw.set(k(x, z), r); ground.set(k(x, z), g); }

// Roof height per cell: a 0 is a lidar dropout at the edge and takes its neighbours' median; then each roof snaps to
// the nearest 4-block storey line, so every tier is flat (28 = 7 storeys, 32 = 8, 36 = 9 with the tower).
const H = new Map();
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  let r = raw.get(k(x, z));
  if (!r) {
    const nb = Object.values(DIR).map(([dx, dz]) => raw.get(k(x + dx, z + dz))).filter(Boolean).sort((a, b) => a - b);
    r = nb.length ? nb[nb.length >> 1] : 28;
  }
  H.set(k(x, z), Math.max(4, 4 * Math.round(r / 4)));
}
const hAt = (x, z) => H.get(k(x, z)) ?? 0;
const inside = (x, z) => H.has(k(x, z));

// Envelope: a cell with an open side (outside the footprint or beside a lower tier) is wall for its full height.
// Cells inside a tier stay air between slabs, so each storey stands on the slab below it.
const env = new Map();
for (const [key, h] of H) {
  const [x, z] = key.split(",").map(Number);
  const outs = [], lows = [];
  for (const d of Object.keys(DIR)) {
    const [dx, dz] = DIR[d];
    if (!inside(x + dx, z + dz)) outs.push(d);
    else if (hAt(x + dx, z + dz) < h) lows.push(d);
  }
  if (!outs.length && !lows.length) continue;
  env.set(key, { x, z, h, face: outs[0] ?? lows[0], outFace: outs[0] ?? null });
}

const g = new Voxels([W, TOP, D]);

// Structure: a floor slab at every storey line and a roof cap over each cell; the air between is the interior.
for (const [key, h] of H) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < h - 1; y += 4) g.set(x, y, z, y === 0 && ground.get(key) > 0 ? "stone" : "gray_concrete");
  g.set(x, h - 1, z, "stone");
}

// Facade: base course, string course at each storey line, spandrels, mullioned glass (piers every third cell).
// Some windows get a glowstone just inside, on the floor, the way a lit office shows at dusk.
for (const e of env.values()) {
  const { x, z, h, face } = e;
  const [dx, dz] = DIR[face];
  const u = dz ? x : z;                                   // the coordinate that runs along this face
  for (let y = 0; y < h - 1; y++) {
    let b;
    if (y === 0) b = "stone_bricks";
    else if (y % 4 === 0) b = "gray_concrete";
    else if (y % 4 === 3) b = "smooth_quartz";
    else if (u % 3 === 0) b = y < 4 ? "polished_granite" : "polished_andesite";
    else b = "light_blue_stained_glass";
    g.set(x, y, z, b);
    if (b === "light_blue_stained_glass" && y % 4 === 1 && ((Math.floor(u / 3) + Math.floor(y / 4)) % 3 === 0)) {
      const ix = x - dx, iz = z - dz, ik = k(ix, iz);
      if (H.has(ik) && !env.has(ik) && H.get(ik) > y + 1) g.set(ix, y, iz, "glowstone");
    }
  }
}

// Entrance: the middle of the longest exposed face, a glazed-looking dark oak door, a granite lintel over three cells
// and a hanging lantern in the lobby behind it.
const faces = {};
for (const e of env.values()) if (e.outFace) (faces[e.outFace] ??= []).push(e);
const bestFace = Object.keys(faces).sort((a, b) => faces[b].length - faces[a].length)[0];
const along = (e) => (DIR[bestFace][1] ? e.x : e.z);
const onFace = faces[bestFace].filter((e) => e.h >= 12).sort((a, b) => along(a) - along(b));
const door = onFace[onFace.length >> 1];
const [ddx, ddz] = DIR[bestFace];
const [ax, az] = ddz ? [1, 0] : [0, 1];
const doorState = { facing: NAME[bestFace], hinge: "left", open: "false", powered: "false" };
g.set(door.x, 1, door.z, "dark_oak_door", { ...doorState, half: "lower" });
g.set(door.x, 2, door.z, "dark_oak_door", { ...doorState, half: "upper" });
for (const s of [-1, 0, 1]) {
  const e = env.get(k(door.x + ax * s, door.z + az * s));
  if (e && e.outFace === bestFace) g.set(e.x, 3, e.z, "polished_granite");
}
if (!ddx && !ddz) throw new Error("no face");
g.set(door.x - ddx, 3, door.z - ddz, "lantern", { hanging: "true" });

// Roof: a plant room on the tower, a solid 3 x 3 box with a cap, set where the tower's roof is clear of the edge.
const tower = [...H].filter(([, h]) => h === 36).map(([key]) => key.split(",").map(Number));
const cx = tower.reduce((s, [x]) => s + x, 0) / tower.length, cz = tower.reduce((s, [, z]) => s + z, 0) / tower.length;
let best = null;
for (let x0 = 0; x0 + 3 <= W; x0++) for (let z0 = 0; z0 + 3 <= D; z0++) {
  let ok = true;
  for (let i = 0; i < 3 && ok; i++) for (let j = 0; j < 3 && ok; j++) {
    const kk = k(x0 + i, z0 + j);
    if (hAt(x0 + i, z0 + j) !== 36 || env.has(kk)) ok = false;
  }
  if (!ok) continue;
  const d = Math.hypot(x0 + 1 - cx, z0 + 1 - cz);
  if (!best || d < best.d) best = { x0, z0, d };
}
if (best) {
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    for (let y = 36; y < 39; y++) g.set(best.x0 + i, y, best.z0 + j, "smooth_quartz");
    g.set(best.x0 + i, 39, best.z0 + j, "stone");
  }
}

const out = g.save(`${SRC}.nbt`);
console.log(JSON.stringify({ footprint: cells.length, tiers: [...new Set(H.values())].sort((a, b) => a - b), ...out, door: [door.x, door.z, bestFace], plant: best }));
