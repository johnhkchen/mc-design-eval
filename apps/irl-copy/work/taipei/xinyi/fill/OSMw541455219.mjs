import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541455219";
const W = 9, H = 23, D = 20;

// Materials: low-rise Taipei commercial block, c. 1980s-90s. White tiled walls,
// granite-look base, quartz cornice, aluminium-framed glazing, shopfront on the street face.
const FOUND = "stone_bricks";
const PLINTH = "light_gray_concrete";
const WALL = "white_concrete";
const STOREY = "light_gray_concrete";
const CORN = "smooth_quartz";
const DECK = "smooth_stone";
const GLASS = "glass";
const PANE = "light_blue_stained_glass_pane";
const FRAME = "polished_andesite";
const LIGHT = "glowstone";
const TANK = "iron_block";
const AC = "gray_concrete";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.min(H - 1, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const outwardFaces = (x, z) => {
  const out = [];
  if (!has(x - 1, z)) out.push("W");
  if (!has(x + 1, z)) out.push("E");
  if (!has(x, z - 1)) out.push("N");
  if (!has(x, z + 1)) out.push("S");
  return out;
};
const isPerim = (x, z) => outwardFaces(x, z).length > 0;

const vox = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || !has(x, z)) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
};
const pane = (x, y, z, runsAlongX) =>
  runsAlongX
    ? put(x, y, z, PANE, { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" })
    : put(x, y, z, PANE, { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// Perimeter and interior columns
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const gr = gAt(x, z);
  const out = outwardFaces(x, z);
  const perim = out.length > 0;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  if (!perim) {
    // Interior: ground floor slab, storey slabs, roof deck; air between (no interiors)
    put(x, gr, z, DECK);
    put(x, 5, z, DECK);
    put(x, 10, z, DECK);
    continue;
  }

  const face = out.includes("W") ? "W" : out[0];
  const xFace = face === "W" || face === "E";
  const along = xFace ? z : x;
  const win = along % 2 === 1;
  const front = face === "W";
  const entrance = front && (z === 9 || z === 10);

  for (let y = gr; y <= 11; y++) {
    // base course at ground
    if (y === gr) { put(x, y, z, PLINTH); continue; }

    if (y <= 4) {
      // Ground storey
      if (front) {
        if (y === 0) { put(x, y, z, WALL); continue; }
        if (y === 4) { put(x, y, z, STOREY); continue; }
        if (entrance) {
          if (y === 1 || y === 2) continue;      // doorway opening (air)
          put(x, y, z, STOREY);                  // lintel
          continue;
        }
        if (along % 3 === 0) put(x, y, z, FRAME); // shopfront mullion
        else put(x, y, z, GLASS);
      } else {
        if (y === 4) { put(x, y, z, STOREY); continue; }
        if (y === 0) { put(x, y, z, WALL); continue; }
        if (win) pane(x, y, z, xFace === false);  // windows at y 1..3
        else put(x, y, z, WALL);
      }
      continue;
    }

    // Upper storey
    if (y === 5) { put(x, y, z, STOREY); continue; }       // storey line
    if (y === 6 || y === 9) { put(x, y, z, WALL); continue; } // sill and head
    if (y === 7 || y === 8) {
      if (win) pane(x, y, z, xFace === false);
      else put(x, y, z, WALL);
      continue;
    }
    if (y === 10) { put(x, y, z, CORN); continue; }         // cornice
    if (y === 11) { put(x, y, z, WALL); continue; }         // parapet
  }
}

// Warm light behind glazing on the street face and upper windows
for (let z = 0; z < D; z++) {
  if (!has(1, z) || isPerim(1, z)) continue;
  const gr = gAt(1, z);
  if (z % 5 === 2 && gr + 2 <= 4) put(1, gr + 2, z, LIGHT);   // shopfront glow
  if (z % 6 === 3) put(1, 7, z, LIGHT);                       // upper floor glow
}

// Roof plant: water tank and air-conditioning condenser on the roof deck (y 10 top, plant from 11)
for (let x = 2; x <= 4; x++)
  for (let z = 13; z <= 14; z++)
    for (let y = 11; y <= 13; y++) put(x, y, z, TANK);
for (let x = 5; x <= 6; x++)
  for (let z = 4; z <= 5; z++)
    for (let y = 11; y <= 12; y++) put(x, y, z, AC);

vox.save(`${DIR}/${ID}.nbt`);
