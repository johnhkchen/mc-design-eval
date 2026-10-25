import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Église Saint-Pierre: Romanesque/Gothic parish church. Stone walls, slate roofs,
// west bell tower on the street face, gabled nave, side annexes, glazed apse.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499670";
const W = 23, H = 35, D = 31;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cell = new Map();
for (const [x, z, gr, rf] of raw) cell.set(`${x},${z}`, { gr: Math.round(gr), rf: Math.round(rf) });
const has = (x, z) => cell.has(`${x},${z}`);
const gAt = (x, z) => cell.get(`${x},${z}`)?.gr ?? 0;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

// ---- Levels from lidar -----------------------------------------------------
let maxGr = -1e9, maxRf = -1e9;
for (const c of cell.values()) { maxGr = Math.max(maxGr, c.gr); maxRf = Math.max(maxRf, c.rf); }
const TOP = Math.min(maxRf, 26);                 // tower top / nave ridge
let E = Math.max(maxGr + 5, TOP - 8);            // nave eaves / ceiling line
if (TOP - E < 3) E = TOP - 3;
const rise = TOP - E;
const ANX = Math.max(maxGr + 4, E - 4);          // annex roof level
const halfW = 11.5;
const surf = (x) => E + Math.floor(rise * (halfW - Math.abs(x - 11)) / halfW);

const inTower = (x, z) => x >= 8 && x <= 14 && z <= 6;
// Edge test: footprint border, a missing neighbour, or the nave's front/apse faces.
const isEdge = (x, z) =>
  x === 0 || x === W - 1 || z === 0 || z === D - 1 || z === 7 ||
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// ---- Pass 1: massing -------------------------------------------------------
for (const [key, { gr }] of cell) {
  const [x, z] = key.split(",").map(Number);

  // foundation + floor, always solid to ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
  put(x, gr, z, "stone_bricks");

  const edge = isEdge(x, z);

  if (inTower(x, z)) {
    const perim = x === 8 || x === 14 || z === 0 || z === 6 || edge;
    if (perim) for (let y = gr + 1; y < TOP; y++) put(x, y, z, y === gr + 1 ? "granite" : "stone_bricks");
    put(x, TOP, z, "stone_bricks");
  } else if (z >= 7) {
    // nave: gabled roof; edge columns solid from ground to roof, interior air under the ceiling
    const s = surf(x);
    if (edge) {
      for (let y = gr + 1; y <= s - 1; y++)
        put(x, y, z, y === gr + 1 ? "granite" : y === E - 1 ? "chiseled_stone_bricks" : "stone_bricks");
    } else {
      for (let y = E; y <= s - 1; y++) put(x, y, z, "stone_bricks");
    }
    if (x === 11) {
      put(x, s, z, "deepslate_tiles");
    } else {
      put(x, s, z, "deepslate_tile_stairs", {
        facing: x < 11 ? "west" : "east", half: "bottom", shape: "straight", waterlogged: "false",
      });
    }
  } else {
    // side annexes: solid low massing with a flat stone roof
    for (let y = gr + 1; y < ANX; y++)
      put(x, y, z, edge && y === gr + 1 ? "granite" : "stone_bricks");
    put(x, ANX - 1, z, "chiseled_stone_bricks");
    put(x, ANX, z, "stone_bricks");
  }
}

// ---- Pass 2: spire ---------------------------------------------------------
[3, 3, 2, 2, 1, 1, 0].forEach((r, k) => {
  const y = TOP + 1 + k;
  for (let x = 11 - r; x <= 11 + r; x++)
    for (let z = 3 - r; z <= 3 + r; z++) put(x, y, z, "deepslate_tiles");
});

// ---- Pass 3: openings, glazing, doors, lights ------------------------------
const paneNS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const paneEW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const lanternHang = { hanging: "true", waterlogged: "false" };

// Nave lancet windows on the side walls, air pocket behind each
for (const zc of [10, 15, 20, 25]) {
  for (const face of [0, W - 1]) {
    if (!has(face, zc)) continue;
    const ys = gAt(face, zc) + 3, yt = ys + 5;
    if (yt > E - 2) continue;
    for (let dz = -2; dz <= 2; dz++) {
      put(face, ys, zc + dz, "polished_andesite");
      put(face, yt, zc + dz, "polished_andesite");
    }
    for (let y = ys; y <= yt; y++) {
      put(face, y, zc - 2, "polished_andesite");
      put(face, y, zc + 2, "polished_andesite");
    }
    for (let y = ys + 1; y <= ys + 4; y++)
      for (let dz = -1; dz <= 1; dz++) put(face, y, zc + dz, "glass_pane", paneNS);
    const ix = face === 0 ? 1 : W - 2;
    for (let y = ys + 1; y <= ys + 4; y++)
      for (let dz = -1; dz <= 1; dz++) put(ix, y, zc + dz, "air");
    put(ix, E - 1, zc, "lantern", lanternHang);
  }
}

// Apse rose window on the far end
{
  const gr = gAt(11, D - 1);
  if (gr + 8 <= E - 2 && has(11, D - 1)) {
    for (let x = 9; x <= 13; x++) {
      put(x, gr + 3, D - 1, "polished_andesite");
      put(x, gr + 8, D - 1, "polished_andesite");
    }
    for (let y = gr + 3; y <= gr + 8; y++) {
      put(9, y, D - 1, "polished_andesite");
      put(13, y, D - 1, "polished_andesite");
    }
    for (let y = gr + 4; y <= gr + 7; y++)
      for (let x = 10; x <= 12; x++) put(x, y, D - 1, "glass_pane", paneEW);
    put(11, E - 1, D - 3, "lantern", lanternHang);
  }
}

// Tower portal on the street face: double oak door, glazed light above
{
  const gz = gAt(11, 0);
  const dp = { facing: "north", hinge: "left", open: "false", powered: "false" };
  put(11, gz + 1, 0, "oak_door", { ...dp, half: "lower" });
  put(11, gz + 2, 0, "oak_door", { ...dp, half: "upper" });
  for (let x = 10; x <= 12; x++)
    for (let y = gz + 4; y <= gz + 5; y++) put(x, y, 0, "glass_pane", paneEW);
  put(11, gAt(11, 3) + 1, 3, "lantern", { hanging: "false", waterlogged: "false" });
  put(11, TOP - 1, 3, "lantern", lanternHang);
}

// Belfry openings
for (let y = TOP - 5; y <= TOP - 2; y++) {
  for (let x = 10; x <= 12; x++) put(x, y, 0, "air");
  for (let z = 2; z <= 4; z++) { put(8, y, z, "air"); put(14, y, z, "air"); }
}

// Annex windows with air pockets behind
{
  const annexWin = (x, z, along) => {
    if (!has(x, z)) return;
    const y1 = gAt(x, z) + 2, y2 = y1 + 1;
    if (y2 >= ANX - 1) return;
    for (let y = y1; y <= y2; y++) put(x, y, z, "glass_pane", along === "z" ? paneEW : paneNS);
    const bx = along === "x" ? (x === 0 ? 1 : x - 1) : x;
    const bz = along === "z" ? (z === 0 ? 1 : z - 1) : z;
    for (let y = y1; y <= y2; y++) put(bx, y, bz, "air");
  };
  annexWin(0, 3, "x");
  annexWin(W - 1, 3, "x");
  annexWin(3, 0, "z");
  annexWin(19, 0, "z");
}

g.save(`${DIR}/${ID}.nbt`);
