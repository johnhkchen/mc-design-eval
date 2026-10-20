import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833607";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 23, D = 22;
const g = new Voxels([W, H, D]);

// Lookup of footprint cells and their ground heights
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

// Record: roof about 11 blocks above the lowest ground; ~2 storeys of 5 blocks, cornice and parapet.
const L = Math.min(...cells.map((c) => c[2]));
const ROOF = L + 11;          // first air block above the roof deck
const BELT = L + 5;           // storey line / belt course
const CAP = L + 10;           // cornice and roof deck level
const inBand = (y) => (y >= L + 1 && y <= L + 4) || (y >= L + 6 && y <= L + 9);
const DOOR_X = 10;            // entrance on the north (minimum z) face

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const faces = (x, z) => ({
  n: !has(x, z - 1),
  s: !has(x, z + 1),
  w: !has(x - 1, z),
  e: !has(x + 1, z),
});

const windowCandidates = [];
const interiorCells = [];

for (const [x, z, gr] of cells) {
  const f = faces(x, z);
  const ext = f.n || f.s || f.w || f.e;
  const corner = (f.n || f.s) && (f.w || f.e);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!ext) interiorCells.push([x, z, gr]);

  for (let y = gr; y < ROOF; y++) {
    if (!ext) {
      // Interior: no rooms, only floor slabs and roof deck; air otherwise
      if (y === gr) put(x, y, z, "smooth_stone");
      else if (y === BELT && BELT > gr) put(x, y, z, "smooth_stone");
      else if (y === CAP) put(x, y, z, "gray_concrete");
      continue;
    }

    // Entrance door on the north face
    if (f.n && x === DOOR_X && y >= gr + 1 && y <= gr + 2) {
      put(x, y, z, "dark_oak_door", {
        facing: "north",
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (f.n && x === DOOR_X && y === gr + 3) {
      put(x, y, z, "smooth_quartz");
      continue;
    }

    if (y === gr) { put(x, y, z, "stone_bricks"); continue; }          // base course
    if (y === CAP) { put(x, y, z, "smooth_quartz"); continue; }        // cornice and parapet cap
    if (y === BELT) { put(x, y, z, "light_gray_concrete"); continue; } // storey line

    if (inBand(y)) {
      if (corner) { put(x, y, z, "light_gray_concrete"); continue; }   // corner pier
      const onZ = f.n || f.s;
      const a = onZ ? x : z;
      if (a % 3 === 0) { put(x, y, z, "light_gray_concrete"); continue; } // mullion pier
      const props = onZ
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      put(x, y, z, "light_blue_stained_glass_pane", props);
      const dz = f.n ? 1 : f.s ? -1 : 0;
      const dx = onZ ? 0 : (f.w ? 1 : -1);
      windowCandidates.push({ x, y, z, gr, dx, dz, a });
      continue;
    }

    put(x, y, z, "white_concrete"); // wall
  }
}

// Warm light: glowstone one bay behind some windows, inside the air gap
for (const c of windowCandidates) {
  if ((c.a * 5 + c.y * 3) % 4 !== 0) continue;
  const tx = c.x + 2 * c.dx;
  const tz = c.z + 2 * c.dz;
  if (!has(tx, tz)) continue;
  const f = faces(tx, tz);
  if (f.n || f.s || f.w || f.e) continue; // must be interior
  const gt = groundAt(tx, tz);
  if (c.y <= gt) continue;
  if (c.y === BELT || c.y > CAP - 1) continue;
  put(tx, c.y, tz, "glowstone");
}

// Lantern just inside the entrance
for (const [x, z, gr] of cells) {
  if (x !== DOOR_X) continue;
  if (!faces(x, z).n) continue;
  if (has(DOOR_X - 1, z + 1) && !faces(DOOR_X - 1, z + 1).n) {
    put(DOOR_X - 1, groundAt(DOOR_X - 1, z + 1) + 1, z + 1, "lantern", {
      hanging: "false",
      waterlogged: "false",
    });
  }
}

// Roof equipment: HVAC plant sitting on the roof deck
for (const [x, z] of interiorCells.map(([cx, cz]) => [cx, cz])) {
  if (x % 6 === 3 && z % 6 === 3 && ROOF < H) {
    put(x, ROOF, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
