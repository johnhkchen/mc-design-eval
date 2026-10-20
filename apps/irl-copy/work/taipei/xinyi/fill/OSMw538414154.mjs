import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538414154";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 23, D = 27;
const vox = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground y
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const groundAt = (x, z) => G.get(`${x},${z}`);

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

// outward offsets per face
const OFF = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};
const PRIORITY = ["north", "south", "west", "east"];

function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
}

// choose the main street face: south-facing perimeter cell nearest the middle of the footprint
const southCells = cells.filter(([x, z]) => !has(x, z + 1) && z === maxZ);
let doorKey = null;
if (southCells.length) {
  const meanX = southCells.reduce((s, [x]) => s + x, 0) / southCells.length;
  southCells.sort((a, b) => Math.abs(a[0] - meanX) - Math.abs(b[0] - meanX));
  doorKey = `${southCells[0][0]},${southCells[0][1]}`;
} else {
  const any = cells.find(([x, z]) => faces(x, z).length > 0);
  if (any) doorKey = `${any[0]},${any[1]}`;
}

const paneProps = (face) =>
  face === "north" || face === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const GLASS = "light_blue_stained_glass_pane";

for (const [x, z, gy] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gy; y++) vox.set(x, y, z, "stone_bricks");

  const f = faces(x, z);
  const perim = f.length > 0;

  if (!perim) {
    // interior: floor slabs only, air gap otherwise
    for (const r of [0, 5, 10]) vox.set(x, gy + r, z, "smooth_stone");
    // a few roof units on a sparse grid
    if ((x + z) % 5 === 0 && (x * 3 + z) % 2 === 0) {
      vox.set(x, gy + 11, z, "light_gray_concrete");
      vox.set(x, gy + 12, z, "iron_block");
    }
    continue;
  }

  const face = PRIORITY.find((p) => f.includes(p));
  const along = face === "north" || face === "south" ? x : z;
  const alongMin = face === "north" || face === "south" ? minX : minZ;
  const alongMax = face === "north" || face === "south" ? maxX : maxZ;
  const isPier = along % 3 === 0 || along === alongMin || along === alongMax;
  const isDoorCell = `${x},${z}` === doorKey;
  const [ox, oz] = OFF[face];
  const ix = x - ox, iz = z - oz; // inward neighbour
  const inwardInside = has(ix, iz) && faces(ix, iz).length === 0;

  // base course
  vox.set(x, gy, z, "polished_granite");

  // ground floor shopfront (r 1..4)
  for (let r = 1; r <= 4; r++) {
    const y = gy + r;
    if (isDoorCell && r <= 2) {
      const half = r === 1 ? "lower" : "upper";
      vox.set(x, y, z, "dark_oak_door", {
        facing: face, half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (isDoorCell && r === 3) { vox.set(x, y, z, "white_concrete"); continue; }
    if (isDoorCell && r === 4) { vox.set(x, y, z, "black_concrete"); continue; }
    if (isPier) { vox.set(x, y, z, "light_gray_concrete"); continue; }
    if (r === 4) { vox.set(x, y, z, "smooth_stone"); continue; }
    vox.set(x, y, z, GLASS, paneProps(face));
  }

  // storey line
  vox.set(x, gy + 5, z, isPier ? "white_concrete" : "smooth_stone");

  // upper storey: sill, window band, lintel
  vox.set(x, gy + 6, z, isPier ? "white_concrete" : "smooth_quartz");
  for (const r of [7, 8]) {
    if (isPier) { vox.set(x, gy + r, z, "white_concrete"); continue; }
    vox.set(x, gy + r, z, GLASS, paneProps(face));
  }
  vox.set(x, gy + 9, z, "white_concrete");

  // warm light behind some upper windows (air gap is interior)
  if (!isPier && inwardInside && along % 6 === 2) {
    vox.set(ix, gy + 7, iz, "glowstone");
  }

  // roof cap and parapet
  vox.set(x, gy + 10, z, "smooth_stone");
  vox.set(x, gy + 11, z, "white_concrete");
}

vox.save(`${DIR}/${ID}.nbt`);
