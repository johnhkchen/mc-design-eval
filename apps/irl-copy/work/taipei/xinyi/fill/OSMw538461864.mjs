import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record has no era or use data. Read from the lidar roof height (~11 blocks) and the
// 9 x 15 footprint: a two-storey, mid-century reinforced-concrete shophouse with a
// cream render facade, a stone base course, light-grey storey bands, a parapet,
// a ground-floor shopfront and a rooftop water tank on a plinth.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538461864";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 9, H = 23, D = 15;
const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const minX = Math.min(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));

// outward faces: dx/dz point out of the building
const FACES = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "west", dx: -1, dz: 0 },
  { n: "east", dx: 1, dz: 0 },
];
const exposed = (x, z) => FACES.filter((f) => !has(x + f.dx, z + f.dz));
// position along a face (for window bays every 3 blocks)
const along = (f, x, z) => (f.dz !== 0 ? x - minX : z - minZ);
const isWinFace = (f, x, z) => along(f, x, z) % 3 === 1;

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Door: prefer the south face, then north, east, west. Take the middle bay.
let door = null;
for (const name of ["south", "north", "east", "west"]) {
  const f = FACES.find((q) => q.n === name);
  const cands = cells
    .filter(([x, z]) => exposed(x, z).some((q) => q.n === name))
    .sort((a, b) => along(f, a[0], a[1]) - along(f, b[0], b[1]));
  if (cands.length) {
    const [dx, dz] = cands[Math.floor(cands.length / 2)];
    door = { x: dx, z: dz, face: f };
    break;
  }
}

const paneProps = (faces) => {
  const p = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  for (const f of faces) {
    if (f.dz !== 0) { p.east = "true"; p.west = "true"; }
    else { p.north = "true"; p.south = "true"; }
  }
  return p;
};

for (const [x, z, gr] of cells) {
  const ex = exposed(x, z);
  const perim = ex.length > 0;

  // foundation fill from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!perim) {
    // interior: ground-floor slab, storey slabs, air gaps between
    put(x, gr, z, "polished_andesite");
    for (const yy of [5, 10]) if (yy >= gr) put(x, yy, z, "light_gray_concrete");
    // warm light in some upper rooms
    if (gr <= 5 && (x * 7 + z * 3) % 6 === 0) put(x, 6, z, "shroomlight");
    // warm lanterns standing on the ground-floor slab
    if (gr + 1 <= 4 && (x + 2 * z) % 7 === 0)
      put(x, gr + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
    continue;
  }

  // perimeter wall column
  const winFaces = ex.filter((f) => isWinFace(f, x, z));
  const win = winFaces.length > 0;
  const isDoor = door && door.x === x && door.z === z;

  for (let y = gr; y <= 11; y++) {
    if (isDoor && (y === gr || y === gr + 1)) {
      put(x, y, z, "oak_door", {
        facing: door.face.n,
        half: y === gr ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (y === 11) { put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" }); continue; } // parapet cap
    if (y === 10) { put(x, y, z, "light_gray_concrete"); continue; }                                       // cornice
    if (y === 9 || y === 5 || y === 4) { put(x, y, z, "light_gray_concrete"); continue; }                 // lintels, storey band
    if (y === gr) { put(x, y, z, "stone_bricks"); continue; }                                             // base course
    if (y === 6) { put(x, y, z, win ? "light_gray_concrete" : "white_concrete"); continue; }               // sills
    if ((y >= 1 && y <= 3) || y === 7 || y === 8) {
      if (win) put(x, y, z, "glass_pane", paneProps(winFaces));
      else put(x, y, z, "white_concrete");
      continue;
    }
    put(x, y, z, "white_concrete");
  }
}

// Rooftop plinth and water tank, placed on the interior roof deck nearest the centre.
const interiorCells = cells.filter(([x, z]) => exposed(x, z).length === 0);
const pool = interiorCells.length ? interiorCells : cells;
const cx0 = cells.reduce((s, c) => s + c[0], 0) / cells.length;
const cz0 = cells.reduce((s, c) => s + c[1], 0) / cells.length;
const [tx, tz] = pool.reduce((best, c) =>
  Math.hypot(c[0] - cx0, c[1] - cz0) < Math.hypot(best[0] - cx0, best[1] - cz0) ? c : best
);
for (const [x, z] of interiorCells) {
  if (Math.abs(x - tx) <= 1 && Math.abs(z - tz) <= 1) put(x, 11, z, "gray_concrete");
}
if (interiorCells.length) {
  put(tx, 12, tz, "iron_block");
  put(tx, 13, tz, "iron_block");
  put(tx, 14, tz, "iron_block");
  put(tx, 15, tz, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
