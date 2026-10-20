import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1153980198";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 18, H = 43, D = 19;
const g = new Voxels([W, H, D]);

// Era/type: late-1990s to 2000s Xinyi mid-rise office block, six storeys of
// 5 blocks, pale tiled-concrete facade, blue glass bands, dark mullions,
// a 1-block setback at storey 6, terrace railing, a plant penthouse and a mast.
const TIER = 25;   // setback terrace level (top of body, footprint-wide slab)
const ROOF = 30;   // roof slab over the setback tier
const PARAPET = 31;

const ground = new Map();
for (const [x, z, gc] of cells) ground.set(`${x},${z}`, gc);

const inFoot = (x, z) => x >= 0 && x < W && z >= 0 && z < D && ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);
const inner = (x, z) =>
  inFoot(x, z) &&
  inFoot(x + 1, z) && inFoot(x - 1, z) && inFoot(x, z + 1) && inFoot(x, z - 1);

// Building volume: full footprint up to the terrace, inner footprint above it.
const present = (x, z, y) =>
  inFoot(x, z) && y >= G(x, z) && y <= ROOF && (y <= TIER || inner(x, z));

// Solid for face-culling purposes: foundation below a neighbour's ground counts as solid.
const solid = (x, z, y) => {
  if (!inFoot(x, z)) return false;
  return y < G(x, z) || present(x, z, y);
};

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

const exteriorFaces = (x, z, y) =>
  Object.entries(DIRS)
    .filter(([, [dx, dz]]) => !solid(x + dx, z + dz, y))
    .map(([n]) => n);

const paneProps = (alongX) =>
  alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

function wallBlock(x, y, z, faces, gc) {
  const alongX = faces.includes("north") || faces.includes("south");
  const cornerXZ = alongX && (faces.includes("west") || faces.includes("east"));
  const u = alongX ? x : z;
  const r = y % 5;

  // Main entrance: centre of the north face, ground floor.
  if (z === 0 && x === 9 && faces.includes("north") && (y === gc || y === gc + 1)) {
    const half = y === gc ? "lower" : "upper";
    g.set(x, y, z, "dark_oak_door", {
      facing: "north", half, hinge: "left", open: "false", powered: "false",
    });
    return;
  }
  // Base course at the ground line.
  if (y === gc) { g.set(x, y, z, "polished_andesite"); return; }
  // Storey belt courses.
  if (r === 0) { g.set(x, y, z, "smooth_quartz"); return; }
  // Corner pilasters.
  if (cornerXZ) { g.set(x, y, z, "white_concrete"); return; }
  // Spandrels.
  if (r === 4) { g.set(x, y, z, "white_concrete"); return; }
  // Window rows (r = 1..3): mullions, lit glass, or glass panes.
  if (u % 3 === 0) { g.set(x, y, z, "gray_concrete"); return; }
  const floorIdx = Math.floor(y / 5);
  if (y >= 5 && r === 2 && (u * 3 + floorIdx * 5) % 11 === 0) {
    g.set(x, y, z, "glowstone");
    return;
  }
  g.set(x, y, z, "light_blue_stained_glass_pane", paneProps(alongX));
}

for (const [x, z, gc] of cells) {
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gc; y++) g.set(x, y, z, "stone_bricks");

  // Body, setback tier and roof slabs.
  for (let y = gc; y <= ROOF; y++) {
    if (!present(x, z, y)) continue;
    const faces = exteriorFaces(x, z, y);
    if (faces.length === 0) {
      if (y % 5 === 0 || y === gc) g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    wallBlock(x, y, z, faces, gc);
  }

  // Terrace railing on the footprint ring at the setback.
  if (gc <= TIER && !inner(x, z)) g.set(x, TIER + 1, z, "iron_bars");

  // Parapet ring on the inner roof edge.
  if (inner(x, z) && !(inner(x + 1, z) && inner(x - 1, z) && inner(x, z + 1) && inner(x, z - 1))) {
    g.set(x, PARAPET, z, "white_concrete");
  }
}

// Plant penthouse on the setback roof, with a lightning-rod mast on top.
for (let x = 6; x <= 11; x++) {
  for (let z = 6; z <= 12; z++) {
    if (!inner(x, z)) continue;
    const edge = x === 6 || x === 11 || z === 6 || z === 12;
    for (let y = PARAPET; y <= 34; y++) {
      if (edge) g.set(x, y, z, "light_gray_concrete");
    }
    g.set(x, 35, z, "light_gray_concrete");
  }
}
if (inner(8, 9)) {
  for (let y = 36; y <= 41; y++) g.set(8, y, 9, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
