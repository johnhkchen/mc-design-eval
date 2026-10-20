import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538034029";
const W = 18, H = 23, D = 32;
const TOP = 10;   // parapet/cornice layer; roof surface is at y = 11

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.min(9, Math.max(0, Math.round(gr))));
}
const inFp = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Street frontage is the north edge (z = 0); side facades are assigned by outward edge.
function facade(x, z) {
  if (!inFp(x, z - 1)) return "N";
  if (!inFp(x, z + 1)) return "S";
  if (!inFp(x - 1, z)) return "W";
  if (!inFp(x + 1, z)) return "E";
  return null;
}
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
const paneProps = (side) =>
  side === "N" || side === "S"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

function doorProps(half) {
  return { facing: "north", half, hinge: "left", open: "false", powered: "false" };
}

// Pass 1: foundation, floor slabs, roof deck for every footprint cell.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "stone");                                  // ground-floor slab
  if (gr < 5) put(x, 5, z, "stone");                       // second-floor slab
  if (gr < TOP) put(x, TOP, z, "gray_concrete");           // flat roof deck
}

// Pass 2: perimeter walls with articulation.
function wallCell(side, x, z, gr) {
  const [dx, dz] = inward[side];
  const u = side === "N" || side === "S" ? x : z;
  const maxU = side === "N" || side === "S" ? W - 1 : D - 1;
  const pillar = u === 0 || u === maxU || u % 3 === 0;

  for (let y = gr; y <= TOP; y++) {
    // Base course on the ground.
    if (y === gr) { put(x, y, z, "polished_andesite"); continue; }

    // Entrance door on the street frontage, centred on the bay at u = 8.
    if (side === "N" && u === 8 && y === gr + 1 && y <= 9) {
      put(x, y, z, "dark_oak_door", doorProps("lower"));
      continue;
    }
    if (side === "N" && u === 8 && y === gr + 2 && y <= 9) {
      put(x, y, z, "dark_oak_door", doorProps("upper"));
      continue;
    }

    // Storey lines and cornice.
    if (y === 5 || y === TOP) { put(x, y, z, "smooth_stone"); continue; }

    // Sills, heads and lintel in white concrete.
    if (y === 4 || y === 6 || y === 9) { put(x, y, z, "white_concrete"); continue; }

    // Ground-floor shopfront: full-height glass between pillars.
    if (y > gr && y <= 3) {
      if (pillar) { put(x, y, z, "white_concrete"); continue; }
      put(x, y, z, "glass");
      if (y === gr + 2 && u % 6 === 1) put(x + dx, y, z + dz, "shroomlight");
      continue;
    }

    // Upper-storey windows: glass panes with frames.
    if (y === 7 || y === 8) {
      if (pillar) { put(x, y, z, "white_concrete"); continue; }
      put(x, y, z, "glass_pane", paneProps(side));
      if (y === 7 && u % 6 === 4) put(x + dx, y, z + dz, "glowstone");
      continue;
    }
  }
}

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const side = facade(x, z);
  if (side) wallCell(side, x, z, gr);
}

// Pass 3: roof plant on the flat roof, standing on the roof deck.
for (let x = 4; x <= 7; x++)
  for (let z = 10; z <= 13; z++) {
    if (!inFp(x, z)) continue;
    put(x, TOP + 1, z, "light_gray_concrete");
    if (x >= 5 && x <= 6 && z >= 11 && z <= 12) put(x, TOP + 2, z, "iron_block");
  }

g.save(`${DIR}/${ID}.nbt`);
