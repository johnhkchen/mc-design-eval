import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833625";
const W = 18, H = 23, D = 22;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height of that cell
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

// Common storey datum = lowest ground under the footprint (roof ~11 above it)
const F = Math.min(...cells.map((c) => c[2]));

const DIRS = [
  { dx: 0, dz: -1, name: "north" },
  { dx: 0, dz: 1, name: "south" },
  { dx: 1, dz: 0, name: "east" },
  { dx: -1, dz: 0, name: "west" },
];
const outs = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));
const isB = (x, z) => outs(x, z).length > 0;

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Glass pane connections follow the wall they sit in
const paneProps = (o) =>
  o.dz !== 0
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Returns [id, props?] for a boundary (exterior) cell at storey offset r
function faceBlock(x, z, r, os) {
  const o = os[0];
  const corner = os.length > 1;
  const front = os.some((d) => d.name === "south");
  const t = o.dx === 0 ? x : z; // coordinate running along the facade

  if (r === 0) return ["stone_bricks"];
  if (r === 4 || r === 5 || r === 9 || r === 10) return ["smooth_quartz"];
  if (r === 11) return ["smooth_quartz_slab", { type: "bottom", waterlogged: "false" }];
  if (r === 3 && front) return ["light_gray_concrete"]; // shopfront lintel band
  if (corner) return ["light_gray_concrete"];

  if (front && (r === 1 || r === 2)) {
    if (x === 8 || x === 9) {
      return ["oak_door", {
        facing: "south",
        half: r === 1 ? "lower" : "upper",
        hinge: x === 8 ? "left" : "right",
        open: "false",
        powered: "false",
      }];
    }
    if (x === 0 || x === 17) return ["smooth_quartz"];
    if (x % 4 === 0) return ["light_gray_concrete"]; // shopfront mullions
    return ["glass_pane", paneProps(o)];
  }

  // Upper storey and non-front ground-storey windows: pane, pane, frame
  if (t % 3 === 0) return ["light_gray_concrete"];
  return ["glass_pane", paneProps(o)];
}

// ---- Main pass: foundations, then storeys per footprint cell ----
for (const [x, z, gc] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  const os = outs(x, z);
  const bnd = os.length > 0;

  for (let y = gc; y < H; y++) {
    const r = y - F;
    if (r < 0 || r > 11) continue;

    if (!bnd) {
      // Interior: floor and ceiling slabs across the whole footprint, air between
      if ([0, 4, 5, 9, 10].includes(r)) put(x, y, z, "light_gray_concrete");
      continue;
    }

    const blk = faceBlock(x, z, r, os);
    if (blk) put(x, y, z, blk[0], blk[1]);
  }
}

// ---- Roof equipment on the interior roof (r = 11) ----
for (let x = 5; x <= 7; x++) {
  for (let z = 6; z <= 8; z++) {
    if (!has(x, z) || isB(x, z)) continue;
    const y = F + 11;
    if (groundAt(x, z) <= y) put(x, y, z, "iron_block");
  }
}

// ---- Warm lights behind some windows (upper storey r=7, shopfront r=2) ----
for (const [x, z, gc] of cells) {
  if (!isB(x, z)) continue;
  const os = outs(x, z);
  if (os.length !== 1) continue; // skip corners
  const o = os[0];
  const front = o.name === "south";
  const t = o.dx === 0 ? x : z;

  let rr = null;
  if (front && x % 4 === 2 && x !== 8 && x !== 9) rr = 2;          // shopfront display light
  else if (!front && t % 3 !== 0 && t % 6 === 1) rr = 7;           // upper-storey window light

  if (rr === null) continue;

  const ix = x - o.dx, iz = z - o.dz;
  if (!has(ix, iz) || isB(ix, iz)) continue;
  const y = F + rr;
  if (groundAt(ix, iz) <= y) put(ix, y, iz, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
