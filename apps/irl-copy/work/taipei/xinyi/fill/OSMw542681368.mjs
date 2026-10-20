import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542681368";

// Footprint: [x, z, ground] per cell. Lowest ground is y 0.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 12, H = 23, D = 11;
const ROOF_Y = 10;     // cornice / roof deck level
const PARAPET_Y = 11;  // top of parapet, about 11 blocks above lowest ground

// Two-storey late-20th-century Xinyi commercial block:
// granite base, quartz-tile walls, shopfront glazing with a red fascia,
// upper-floor glass bays, flat roof with parapet and rooftop plant.
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const groundOf = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const paneProps = (alongX) =>
  alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Edge test for a footprint cell (any side open to the outside).
const isEdge = (x, z) =>
  !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

// Choose the entrance: a south-facing (z max) edge cell, not a pier, nearest x = 6.
let doorKey = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    if (has(x, z + 1)) continue; // not on the south face
    const alongX = true;
    const corner = (!has(x, z - 1) || !has(x, z + 1)) && (!has(x - 1, z) || !has(x + 1, z));
    if (corner || x % 3 === 0) continue;
    const d = Math.abs(x - 6);
    if (d < best) { best = d; doorKey = `${x},${z}`; }
  }
}

for (const [x, z, gr] of cells) {
  const g0 = Math.max(0, gr);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= g0; y++) put(x, y, z, "polished_andesite");

  const edgeN = !has(x, z - 1);
  const edgeS = !has(x, z + 1);
  const edgeW = !has(x - 1, z);
  const edgeE = !has(x + 1, z);
  const edge = edgeN || edgeS || edgeW || edgeE;

  if (!edge) {
    // Interior: storey-2 floor slab and roof deck, air between (no interiors).
    put(x, 5, z, "smooth_quartz");
    put(x, ROOF_Y, z, "light_gray_concrete");
    // Rooftop plant boxes.
    if (x % 4 === 2 && z % 4 === 2) put(x, PARAPET_Y, z, "smooth_stone");
    continue;
  }

  // Perimeter wall.
  const alongX = edgeN || edgeS;
  const corner = (edgeN || edgeS) && (edgeE || edgeW);
  const u = alongX ? x : z;
  const pier = corner || u % 3 === 0;
  const isDoor = doorKey === `${x},${z}`;

  // Inward neighbour for interior glow.
  let ix = x, iz = z;
  if (edgeS) iz = z - 1;
  else if (edgeN) iz = z + 1;
  else if (edgeE) ix = x - 1;
  else ix = x + 1;
  const inwardOk = has(ix, iz) && !isEdge(ix, iz);

  for (let y = g0 + 1; y <= PARAPET_Y; y++) {
    if (y === PARAPET_Y) {
      put(x, y, z, "quartz_block");
    } else if (y === ROOF_Y) {
      put(x, y, z, "smooth_quartz"); // cornice
    } else if (y === 5) {
      put(x, y, z, "smooth_quartz"); // storey line
    } else if (y >= 1 && y <= 4) {
      // Ground-floor shopfront.
      if (y === 4) {
        put(x, y, z, pier ? "quartz_pillar" : "red_terracotta"); // red fascia
      } else if (pier) {
        put(x, y, z, "quartz_pillar");
      } else if (isDoor && y <= 2) {
        put(x, y, z, "dark_oak_door", {
          facing: "south",
          half: y === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else {
        put(x, y, z, "light_gray_stained_glass_pane", paneProps(alongX));
        if (y === 2 && inwardOk && u % 6 === 1) put(ix, y, iz, "glowstone");
      }
    } else if (y >= 6 && y <= 9) {
      // Upper storey bays.
      if (pier) {
        put(x, y, z, "quartz_pillar");
      } else if (y === 6 || y === 9) {
        put(x, y, z, "smooth_quartz"); // sill / head
      } else {
        put(x, y, z, "light_gray_stained_glass_pane", paneProps(alongX));
        if (y === 7 && inwardOk && u % 6 === 4) put(ix, y, iz, "glowstone");
      }
    }
  }
}

// Ensure the entrance cell's transom glass is in place (y 3 above door).
if (doorKey) {
  const [dx, dz] = doorKey.split(",").map(Number);
  put(dx, 3, dz, "light_gray_stained_glass_pane", paneProps(true));
}

g.save(`${DIR}/${ID}.nbt`);
