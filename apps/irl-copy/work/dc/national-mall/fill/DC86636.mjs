import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86636";
const W = 31, H = 34, D = 42;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint and smoothed massing ----------------------------------------
const k = (x, z) => `${x},${z}`;
const base = new Map();
for (const [x, z, gr, roof] of raw) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  base.set(k(x, z), { x, z, g: Math.max(0, Math.min(H - 6, Math.round(gr))), roof: Number(roof) });
}
const inFp = (x, z) => base.has(k(x, z));

// 3x3 box average of lidar roof heights, then snap to 2-block tiers
const cmap = new Map();
for (const c of base.values()) {
  let sum = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const o = base.get(k(c.x + dx, c.z + dz));
    if (o) { sum += o.roof; n++; }
  }
  const avg = sum / n;
  const tier = Math.round(avg / 2) * 2;
  const R = Math.min(31, Math.max(c.g + 6, tier));
  cmap.set(k(c.x, c.z), { x: c.x, z: c.z, g: c.g, R });
}

const B = Math.min(...[...cmap.values()].map(c => c.g));

const DIRS = {
  N: { dx: 0, dz: -1, facing: "north" },
  S: { dx: 0, dz: 1, facing: "south" },
  W: { dx: -1, dz: 0, facing: "west" },
  E: { dx: 1, dz: 0, facing: "east" },
};
function facesOf(x, z) {
  const f = [];
  if (!inFp(x, z - 1)) f.push("N");
  if (!inFp(x, z + 1)) f.push("S");
  if (!inFp(x - 1, z)) f.push("W");
  if (!inFp(x + 1, z)) f.push("E");
  return f;
}

// entrance: middle of the south (+z) street face
const southCells = [...cmap.values()].filter(c => facesOf(c.x, c.z).includes("S"));
southCells.sort((a, b) => a.x - b.x);
const doorCell = southCells[Math.floor(southCells.length / 2)];
const doorKey = doorCell ? k(doorCell.x, doorCell.z) : null;

const lights = [];
const put = (x, y, z, id, props) => g.set(x, y, z, id, props);

// ---- build each footprint cell ---------------------------------------------
for (const c of cmap.values()) {
  const { x, z, g: gr, R } = c;
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const faces = facesOf(x, z);
  if (faces.length === 0) {
    // interior: floor slabs per storey and a light roof deck (no interiors)
    for (let y = gr; y <= R - 2; y++) {
      if (y === gr || (y > gr && y >= B && (y - B) % 4 === 0)) put(x, y, z, "smooth_stone");
    }
    put(x, R - 1, z, "light_gray_concrete");

    // roof plant on a sparse grid, sitting on the deck
    if (x % 8 === 3 && z % 8 === 3) {
      put(x, R, z, "stone_bricks");
      if (x % 16 === 3) put(x, R + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
    continue;
  }

  const corner = faces.length >= 2;
  const primary = faces[0];
  const idx = (primary === "N" || primary === "S") ? x : z;
  const pier = corner || idx % 3 === 0;
  const isDoor = k(x, z) === doorKey;
  const paneProps = (primary === "N" || primary === "S")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  for (let y = gr; y < R; y++) {
    if (y === R - 1) { put(x, y, z, "smooth_stone"); continue; }                 // cornice course
    if (y === R) {                                                               // parapet cap
      put(x, y, z, "stone_brick_wall", { north: "false", south: "false", east: "false", west: "false", up: "true", waterlogged: "false" });
      continue;
    }

    if (isDoor && y <= gr + 1) {
      put(x, y, z, "dark_oak_door", {
        facing: DIRS.S.facing,
        half: y === gr ? "lower" : "upper",
        hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (isDoor && y === gr + 2) {
      put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }

    if (corner) { put(x, y, z, "calcite"); continue; }

    if (y < B + 4) {
      // ground storey: stone base, shopfront glazing, transom band
      if (y === B) { put(x, y, z, "stone_bricks"); continue; }
      if (y === B + 3) { put(x, y, z, "calcite"); continue; }
      if (pier) { put(x, y, z, "calcite"); continue; }
      put(x, y, z, "glass_pane", paneProps);
      continue;
    }

    // upper storeys: 4-block module: spandrel / window / window / transom
    const f = B + 4 * Math.floor((y - B) / 4);
    const r = y - f;
    if (r === 0 || r === 3) { put(x, y, z, "calcite"); continue; }
    if (pier) { put(x, y, z, "calcite"); continue; }
    put(x, y, z, "glass_pane", paneProps);
    if (r === 1 && (x + z + y) % 5 === 0) {
      const inx = x - DIRS[primary].dx, inz = z - DIRS[primary].dz;
      if (inFp(inx, inz) && facesOf(inx, inz).length === 0) lights.push([inx, y, inz]);
    }
  }
  // ground-storey lights behind shopfront glass
  for (let y = B + 1; y <= B + 2 && y < R - 1; y++) {
    if (y < gr) continue;
    if (!corner && idx % 3 !== 0 && (x + z) % 4 === 0) {
      const inx = x - DIRS[primary].dx, inz = z - DIRS[primary].dz;
      if (inFp(inx, inz) && facesOf(inx, inz).length === 0) lights.push([inx, y, inz]);
    }
  }
}

for (const [x, y, z] of lights) put(x, y, z, "glowstone");

g.save(`${DIR}/${ID}.nbt`);
