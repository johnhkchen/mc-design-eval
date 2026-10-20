import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542683421";
const W = 30, H = 23, D = 15;

// ---- footprint -------------------------------------------------------------
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells ?? []);
const cells = list.map((c) =>
  Array.isArray(c)
    ? { x: c[0], z: c[1], g: Math.round(c[2] ?? 0) }
    : { x: c.x, z: c.z, g: Math.round(c.ground ?? c.g ?? 0) }
);
const gmap = new Map(cells.map((c) => [`${c.x},${c.z}`, c.g]));
const inSet = (x, z) => gmap.has(`${x},${z}`);
const minG = Math.min(...cells.map((c) => c.g));

// ---- vertical datum (flat roof at absolute height, sloped base) ------------
// Mid-rise commercial block, two storeys over a shopfront ground floor.
const S1 = minG;          // ground floor slab
const S2 = minG + 5;      // first floor slab
const R = minG + 10;      // roof deck
const TOP = minG + 11;    // parapet cap

// ---- helpers ----------------------------------------------------------------
const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};
const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

function faces(x, z) {
  const out = [];
  for (const [name, [dx, dz]] of Object.entries(DIRS)) {
    if (!inSet(x + dx, z + dz)) out.push(name);
  }
  return out;
}

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const g = new Voxels([W, H, D]);

// ---- main shell -------------------------------------------------------------
for (const { x, z, g: gr } of cells) {
  const f = faces(x, z);
  const isExt = f.length > 0;
  const corner = f.length >= 2;
  const onNS = f.includes("north") || f.includes("south");

  // foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= TOP; y++) {
    let id = null;
    if (y === R) {
      id = isExt ? "smooth_quartz" : "gray_concrete";          // cornice / roof deck
    } else if (y === R + 1) {
      if (isExt) id = "smooth_quartz";                          // parapet
    } else if (y > R + 1) {
      // nothing above the parapet except rooftop kit added later
    } else if (y === S1 || y === S2) {
      id = isExt ? "light_gray_concrete" : "smooth_stone";     // storey line / floor slab
    } else if (y === gr) {
      id = isExt ? "polished_andesite" : "smooth_stone";        // base course / floor
    } else if (!isExt) {
      // interior air gap
    } else {
      const inGround = y < S2;
      const rel = y - (inGround ? S1 : S2);                    // 1..4 within storey
      const c = onNS ? x : z;
      const pier = corner || c % 3 === 0;
      if (rel === 4 || pier) id = "white_concrete";            // lintel / pier
      else if (!inGround && rel === 1) id = "white_concrete";  // spandrel sill
      else id = "light_blue_stained_glass";                    // glazing
    }
    if (id) put(x, y, z, id);
  }
}

// ---- entrance on the longest street-facing side -----------------------------
const faceCount = { north: [], south: [], west: [], east: [] };
for (const c of cells) {
  const f = faces(c.x, c.z);
  if (f.length === 1) faceCount[f[0]].push(c);
}
let primary = "south";
for (const k of Object.keys(faceCount)) {
  if (faceCount[k].length > faceCount[primary].length) primary = k;
}
{
  const cand = faceCount[primary].filter((c) => c.g === minG);
  if (cand.length) {
    const along = (c) => (primary === "north" || primary === "south" ? c.x : c.z);
    cand.sort((a, b) => along(a) - along(b));
    const door = cand[Math.floor(cand.length / 2)];
    const doorProps = (half) => ({
      facing: primary,
      half,
      hinge: "left",
      open: "false",
      powered: "false",
    });
    put(door.x, S1 + 1, door.z, "dark_oak_door", doorProps("lower"));
    put(door.x, S1 + 2, door.z, "dark_oak_door", doorProps("upper"));
  }
}

// ---- warm light behind glass -----------------------------------------------
{
  let n = 0;
  for (const c of cells) {
    const f = faces(c.x, c.z);
    if (f.length !== 1) continue;
    const face = f[0];
    const onNS = face === "north" || face === "south";
    const coord = onNS ? c.x : c.z;
    if (coord % 3 === 0) continue;                 // piers
    const [ix, iz] = INWARD[face];
    const ex = c.x + ix, ez = c.z + iz;
    if (!inSet(ex, ez) || faces(ex, ez).length) continue; // need interior cell behind

    const gIn = gmap.get(`${ex},${ez}`);
    // upper storey glowstone, alternating bays
    const yUp = S2 + 2;
    if (yUp > gIn && yUp < R && coord % 6 === 1) {
      put(ex, yUp, ez, "glowstone");
    }
    // ground storey lantern standing on the floor slab, every third bay
    const yLo = S1 + 1;
    if (yLo > gIn && n % 2 === 0) {
      put(ex, yLo, ez, "lantern", { hanging: "false", waterlogged: "false" });
    }
    n++;
  }
}

// ---- rooftop plant and parapet detail --------------------------------------
{
  for (const c of cells) {
    const f = faces(c.x, c.z);
    if (f.length) continue;
    if (c.x % 7 === 3 && c.z % 5 === 2) {
      // small plant room boxes
      put(c.x, R + 1, c.z, "light_gray_concrete");
      put(c.x, R + 2, c.z, "light_gray_concrete");
    } else if (c.x % 5 === 2 && c.z % 4 === 1) {
      // condenser units
      put(c.x, R + 1, c.z, "iron_block");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
