import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw826989994";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 38, D = 18;
const g = new Voxels([W, H, D]);

// ---- footprint helpers -------------------------------------------------
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const midX = (minX + maxX) / 2;

// edge = any side open to the outside of the footprint
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// along-wall coordinate and corner detection for pillar rhythm
function facadeInfo(x, z) {
  const onZFace = !has(x, z - 1) || !has(x, z + 1); // north/south face: runs along x
  const onXFace = !has(x - 1, z) || !has(x + 1, z); // east/west face: runs along z
  const corner = onZFace && onXFace;
  const along = onZFace ? x : z;
  return { corner, along, pillar: corner || (((along % 3) + 3) % 3 === 0) };
}

// door: on the south (max z) face, nearest to the middle
let doorKey = null;
{
  let best = null;
  for (const [x, z] of cells) {
    if (z === maxZ && isEdge(x, z)) {
      const d = Math.abs(x - midX);
      if (!best || d < best.d) best = { x, z, d };
    }
  }
  if (!best) {
    for (const [x, z] of cells) if (isEdge(x, z)) { best = { x, z }; break; }
  }
  if (best) doorKey = `${best.x},${best.z}`;
}

// window cell: edge, above ground floor band spandrel rules, not pillar, not door
function isWindow(x, y, z) {
  if (!has(x, z) || !isEdge(x, z)) return false;
  const gr = gAt(x, z);
  if (y < gr) return false;
  const r = y % 5;
  if (r < 1 || r > 3) return false;
  if (y === 25 || y === 26) return false;
  if (facadeInfo(x, z).pillar) return false;
  if (`${x},${z}` === doorKey && y <= gr + 2) return false;
  return true;
}

function isDoor(x, y, z) {
  if (`${x},${z}` !== doorKey) return false;
  const gr = gAt(x, z);
  return y === gr || y === gr + 1;
}

// pane connections to neighbouring panes along the same facade
function paneProps(x, y, z) {
  const c = (dx, dz) => (isWindow(x + dx, y, z + dz) ? "true" : "false");
  return {
    north: c(0, -1), south: c(0, 1), east: c(1, 0), west: c(-1, 0),
    waterlogged: "false",
  };
}

// ---- build cells -------------------------------------------------------
for (const [x, z, gr] of cells) {
  const edge = isEdge(x, z);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= 25; y++) {
    // floor slabs and roof slab, full footprint
    if (y === 25) { g.set(x, y, z, "smooth_quartz"); continue; }
    if (y % 5 === 0) {
      g.set(x, y, z, y === 0 ? "stone_bricks" : "smooth_quartz");
      continue;
    }
    if (!edge) continue; // interior stays air behind the glass

    // door and its lintel
    if (`${x},${z}` === doorKey && isDoor(x, y, z)) {
      const lower = y === gr;
      g.set(x, y, z, "dark_oak_door", {
        facing: "south",
        half: lower ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (`${x},${z}` === doorKey && y === gr + 2) {
      g.set(x, y, z, "smooth_quartz");
      continue;
    }

    const r = y % 5;
    if (r === 4) { g.set(x, y, z, "light_gray_concrete"); continue; }
    if (facadeInfo(x, z).pillar) { g.set(x, y, z, "white_concrete"); continue; }
    if (isWindow(x, y, z)) {
      const tint = ((x + y + z) % 7 === 0) ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane";
      g.set(x, y, z, tint, paneProps(x, y, z));
      continue;
    }
    g.set(x, y, z, "white_concrete");
  }

  // parapet on the perimeter
  if (edge) g.set(x, 26, z, "white_concrete");
}

// ---- warm lights behind some windows (in the air gap) ------------------
for (const [x, z] of cells) {
  if (!isEdge(x, z)) continue;
  const { along } = facadeInfo(x, z);
  if (((along % 6) + 6) % 6 !== 1) continue;
  for (const k of [1, 2, 3, 4]) {
    const y = 5 * k + 2;
    if (!isWindow(x, y, z)) continue;
    const inward = [[1, 0], [-1, 0], [0, 1], [0, -1]]
      .map(([dx, dz]) => [x + dx, z + dz])
      .find(([nx, nz]) => has(nx, nz) && !isEdge(nx, nz));
    if (inward) g.set(inward[0], y, inward[1], "glowstone");
  }
}

// ---- roof plant and mast -----------------------------------------------
const cx = Math.round(midX);
const cz = Math.round((minZ + maxZ) / 2);
for (let x = cx - 3; x <= cx + 3; x++) {
  for (let z = cz - 3; z <= cz + 3; z++) {
    if (!has(x, z) || isEdge(x, z)) continue;
    g.set(x, 26, z, "light_gray_concrete");
    g.set(x, 27, z, "light_gray_concrete");
    g.set(x, 28, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}
if (has(cx, cz)) {
  for (let y = 29; y <= 32; y++) {
    g.set(cx, y, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
