import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539950896";
const W = 32, H = 23, D = 17;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(10, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const isPerim = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

const put = (x, y, z, block, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// outward faces: [dx, dz, name]
const FACES = [
  { dx: 0, dz: -1, name: "north" },
  { dx: 0, dz: 1, name: "south" },
  { dx: -1, dz: 0, name: "west" },
  { dx: 1, dz: 0, name: "east" },
];
const outwardOf = (x, z) => FACES.filter((f) => !has(x + f.dx, z + f.dz));

// Entrance column: centre of the north-facing run of footprint cells
const northXs = [];
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  if (!has(x, z - 1)) northXs.push(x);
}
const doorX = northXs.length
  ? Math.floor((Math.min(...northXs) + Math.max(...northXs)) / 2)
  : -1;

const WALL = "smooth_quartz";
const FRAME = "light_gray_concrete";
const BASE = "stone_bricks";
const GLASS = "light_blue_stained_glass_pane";

const paneProps = (f) =>
  f.dz !== 0
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Returns [block, props] for the outward skin of a perimeter cell at height y, or null for plain wall.
function skin(x, z, y, gc, faces) {
  for (const f of faces) {
    const t = f.dz !== 0 ? x : z;
    if (f.name === "north" && x === doorX && gc <= 3 && (y === gc + 1 || y === gc + 2)) {
      return ["oak_door", {
        facing: f.name,
        half: y === gc + 1 ? "lower" : "upper",
        hinge: "left", open: "false", powered: "false",
      }];
    }
    if (y <= 4) {
      if (y === 4) return [FRAME, null];
      if (y >= gc + 1 && y <= gc + 3) {
        return t % 4 === 0 ? [FRAME, null] : [GLASS, paneProps(f)];
      }
      return null;
    }
    if (y === 5 || y === 6 || y === 10) return [FRAME, null];
    if (y >= 7 && y <= 9) {
      return t % 4 === 0 ? [FRAME, null] : [GLASS, paneProps(f)];
    }
  }
  return null;
}

// ---- 1. foundations, floor slabs, roof deck ----------------------------------
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  const gc = gnd(x, z);
  for (let y = 0; y < gc; y++) put(x, y, z, BASE);
  if (gc <= 5) put(x, 5, z, FRAME);          // first-floor slab
  put(x, 11, z, FRAME);                       // roof deck
}

// ---- 2. perimeter walls, facades, parapet ------------------------------------
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  if (!isPerim(x, z)) continue;
  const gc = gnd(x, z);
  const faces = outwardOf(x, z);

  for (let y = gc; y <= 10; y++) {
    if (y === gc) { put(x, y, z, BASE); continue; }   // base course
    const s = skin(x, z, y, gc, faces);
    if (s) put(x, y, z, s[0], s[1] ?? undefined);
    else put(x, y, z, WALL);
  }

  // parapet and cap
  put(x, 12, z, WALL);
  put(x, 13, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// ---- 3. warm lights behind some upper windows ---------------------------------
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  if (!isPerim(x, z)) continue;
  const gc = gnd(x, z);
  for (const f of outwardOf(x, z)) {
    const t = f.dz !== 0 ? x : z;
    if (t % 8 !== 2) continue;
    const ix = x - f.dx, iz = z - f.dz;
    if (!has(ix, iz) || isPerim(ix, iz)) continue;
    if (gnd(ix, iz) > 8) continue;
    put(ix, 8, iz, "shroomlight");
  }
}

// ---- 4. rooftop plant room and units -----------------------------------------
for (let x = 11; x <= 16; x++) {
  for (let z = 6; z <= 10; z++) {
    if (!has(x, z) || isPerim(x, z)) continue;
    put(x, 12, z, FRAME);
    put(x, 13, z, FRAME);
  }
}
for (const [x, z] of [[19, 6], [21, 6], [19, 10], [21, 10]]) {
  if (has(x, z) && !isPerim(x, z)) put(x, 12, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
