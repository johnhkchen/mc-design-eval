import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw827011418";
const W = 28, H = 38, D = 8;
const ROOF = 26;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

const vox = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) vox.set(x, y, z, id, p);
  else vox.set(x, y, z, id);
};

// Glass pane orientation: runAlongX = true for panes in a face running along x (front/back)
const pane = (runAlongX) => runAlongX
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const N = has(x, z - 1), S = has(x, z + 1), Wd = has(x - 1, z), E = has(x + 1, z);
  const zFace = !N || !S;          // front or back exposed face (runs along x)
  const xFace = !Wd || !E;         // side exposed face (runs along z)
  const perim = zFace || xFace;
  const corner = zFace && xFace;
  const u = zFace ? x : z;         // position along the face

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Body: ground to roof
  for (let y = gr; y < ROOF; y++) {
    const s = y % 5;
    if (s === 0) {
      // storey slab / storey line; plinth course at the base on the perimeter
      const id = (y === 0 && perim) ? "stone_bricks" : "light_gray_concrete";
      put(x, y, z, id);
      continue;
    }
    if (!perim) {
      // interior: air gap, with warm lights behind the front and back glass
      if (z === 1 && has(x, 0) && s === 2 && x % 3 === 1) put(x, y, z, "glowstone");
      else if (z === D - 2 && has(x, D - 1) && s === 3 && x % 3 === 2) put(x, y, z, "shroomlight");
      continue;
    }
    if (corner) {
      put(x, y, z, "white_concrete");           // corner pilaster
      continue;
    }
    if (y < 5) {
      // ground floor: shopfront
      if (s === 4) {
        put(x, y, z, zFace && !N ? "red_concrete" : "white_concrete"); // sign band
        continue;
      }
      // y 1..3
      if (zFace && !N && u >= 12 && u <= 14 && y <= 2) continue;   // entrance opening
      if (u % 3 === 0) put(x, y, z, "white_concrete");              // shopfront mullion
      else put(x, y, z, "glass");
      // entrance lantern just inside the doorway
      if (zFace && !N && u === 13 && y === 3 && z === 0) {
        // placed in the interior row below handled by the interior pass
      }
      continue;
    }
    // upper storeys
    if (s === 1 || s === 4) {
      put(x, y, z, "white_concrete");           // lintel / sill spandrel
    } else {                                    // s === 2 or 3: window band
      if (u % 3 === 0) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass_pane", pane(zFace));
    }
  }

  // Roof slab (cornice course on perimeter)
  put(x, ROOF, z, perim ? "white_concrete" : "light_gray_concrete");
  // Parapet
  if (perim) put(x, ROOF + 1, z, "white_concrete");
}

// Entrance lanterns just inside the front doorway
for (let x = 12; x <= 14; x++) {
  if (has(x, 1)) {
    if (x === 13) put(x, 3, 1, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Rooftop mechanical penthouse, centred, on the roof slab
for (let x = 9; x <= 18; x++) {
  for (let z = 2; z <= 5; z++) {
    if (!has(x, z)) continue;
    const edgeX = x === 9 || x === 18;
    const edgeZ = z === 2 || z === 5;
    for (let y = ROOF + 1; y <= 30; y++) {
      if (!(edgeX || edgeZ)) continue;       // interior air
      if (y === 27 || y === 30) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass_pane", pane(!edgeX));
    }
    put(x, 31, z, "light_gray_concrete");    // penthouse roof
  }
}

// Small roof plant on the north-east corner
for (const [x, z] of [[23, 2], [24, 2], [23, 3], [24, 3]]) {
  if (has(x, z)) put(x, ROOF + 1, z, "iron_block");
}

vox.save(`${DIR}/${ID}.nbt`);
