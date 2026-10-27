// Way 269465501 (Mt Eden / Eden Terrace): a 1920s two-storey brick commercial block over shops, plaster bands and a
// parapet, on the Maungawhau slope. Shopfronts face the +z and -x sides; the 10-block tier is the two-storey body,
// the 6-block tier is the single-storey wing to the south and south-west. Walls are a one-block shell; the inside is
// air with floor slabs per storey and a roof deck, so the glass has an air gap behind it.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269465501.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..50, z 0..39

const g = new Voxels([51, 23, 40]);
const BAND = 4, BAND2 = 8;                                   // storey lines (absolute y)
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];              // +x, -x, +z, -z
const key = (x, z) => x + "," + z;

// 1. massing: the lidar roof quantised to two flat tiers (10 = two storeys over shops, 6 = one-storey wing),
//    never below one storey above its own ground so no tier sits on nothing
const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(key(x, z), { x, z, ground, Rt: Math.max(roof >= 8 ? 10 : 6, ground + 4) });
const at = (x, z) => cell.get(key(x, z));

// 2. exposed faces: a neighbour outside the footprint, or a lower tier (the step wall of the taller tier)
for (const c of cell.values()) {
  c.faces = [];
  for (const [dx, dz] of DIRS) {
    const n = at(c.x + dx, c.z + dz);
    if (!n || n.Rt < c.Rt) c.faces.push({ dx, dz, outside: !n });
  }
  c.ext = c.faces.length > 0;
  // the street-facing side is +z and -x: shopfronts there when the face is outside the footprint
  c.face = c.faces.find((f) => f.outside && (f.dz === 1 || f.dx === -1)) ?? c.faces.find((f) => f.outside) ?? c.faces[0] ?? null;
  c.shop = !!c.face && c.face.outside && (c.face.dz === 1 || c.face.dx === -1);
}

// 3. doors: two shopfront bays on the street side, ground floor low enough for a two-block door
const doorCands = [...cell.values()].filter((c) => c.shop && c.ground <= 1);
const bayOf = (c) => (c.face.dz !== 0 ? c.x : c.z) % 3;
const doors = new Map();
for (const target of [14, 32]) {
  const cands = doorCands.filter((c) => bayOf(c) === 0 && !doors.has(key(c.x, c.z)));
  const pick = cands.sort((a, b) => Math.abs((a.face.dz !== 0 ? a.x : a.z) - target) - Math.abs((b.face.dz !== 0 ? b.x : b.z) - target))[0];
  if (pick) doors.set(key(pick.x, pick.z), pick);
}

const facing = (f) => (f.dz === 1 ? "south" : f.dz === -1 ? "north" : f.dx === 1 ? "east" : "west");
const pane = (f) => (f.dz !== 0
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// 4. the shell and the floors
for (const c of cell.values()) {
  const { x, z, ground: gr, Rt } = c;
  if (!c.ext) {
    // interior: foundation, ground-floor slab, storey slabs, roof deck; air between
    for (let y = 0; y < Rt - 1; y++) {
      if (y < gr) g.set(x, y, z, "stone");
      else if (y === gr) g.set(x, y, z, "smooth_stone");
      else if (y === Rt - 2) g.set(x, y, z, "stone");
      else if ((y === BAND || y === BAND2) && y < Rt - 2) g.set(x, y, z, "smooth_stone");
    }
    continue;
  }
  const door = doors.has(key(x, z)) ? c.face : null;
  for (let y = 0; y < Rt; y++) {
    if (y < gr) { g.set(x, y, z, "stone_bricks"); continue; }                 // plinth under the exposed face
    if (y === gr) { g.set(x, y, z, "stone_bricks"); continue; }               // base course
    if (y === Rt - 1) { g.set(x, y, z, "smooth_quartz"); continue; }          // cornice / parapet cap
    if (y === BAND || y === BAND2) { g.set(x, y, z, "smooth_quartz"); continue; } // plaster storey lines
    if (door && (y === gr + 1 || y === gr + 2) && y <= 3) {
      const half = y === gr + 1 ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", { facing: facing(c.face), half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const f = c.face ?? { dx: 0, dz: 0 };
    const shopRow = c.shop && y <= 3;
    if (bayOf(c) === 0) { g.set(x, y, z, shopRow ? "dark_oak_log" : "bricks"); continue; }   // piers and pilasters
    g.set(x, y, z, "glass_pane", pane(f));
    // warm light behind some upper-storey glass: glowstone one cell inside, in the air gap
    if (!shopRow && y === 6 && (x * 7 + z * 13) % 5 === 0) {
      const inner = at(x - f.dx, z - f.dz);
      if (inner && !inner.ext) g.set(x - f.dx, y, z - f.dz, "glowstone");
    }
  }
  // a lantern inside each door, standing on the ground-floor slab
  if (door) {
    const inner = at(x - door.dx, z - door.dz);
    if (inner && !inner.ext) g.set(x - door.dx, gr + 1, z - door.dz, "lantern", { hanging: "false" });
  }
}

// 5. roof plant room on the taller tier, set in from the parapet: bricks ring, a plaster roof
const box = { x0: 16, x1: 21, z0: 12, z1: 15 };
for (let x = box.x0; x <= box.x1; x++) for (let z = box.z0; z <= box.z1; z++) {
  const c = at(x, z);
  if (!c || c.Rt !== 10 || c.ext) throw new Error(`plant room cell ${x},${z} is not an interior 10-tier cell`);
  for (let y = 9; y <= 10; y++) {
    if (x === box.x0 || x === box.x1 || z === box.z0 || z === box.z1) g.set(x, y, z, "bricks");
  }
  g.set(x, 11, z, "smooth_quartz");
}
g.set(18, 9, box.z0, "glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
g.set(19, 9, box.z0, "glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269465501.nbt");
console.log(out, "doors:", [...doors.keys()].join(" "));
