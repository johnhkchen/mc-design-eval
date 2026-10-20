import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538414141";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 23, D = 20;
const vox = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground level for that cell
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inFp = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const perim = (x, z) => !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);

// Outward facing direction of a perimeter cell (first missing neighbour)
function outward(x, z) {
  if (!inFp(x - 1, z)) return [-1, 0];
  if (!inFp(x + 1, z)) return [1, 0];
  if (!inFp(x, z - 1)) return [0, -1];
  return [0, 1];
}

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
}

// Pane connection state for a facade: panes run along the wall they sit in
function paneProps(x, z) {
  const [dx] = outward(x, z);
  const alongZ = dx !== 0; // facade on east/west side runs north-south
  return {
    north: String(alongZ),
    south: String(alongZ),
    east: String(!alongZ),
    west: String(!alongZ),
    waterlogged: "false",
  };
}

// Body block for a footprint cell at height y, or null for air
function bodyAt(x, z, y, gr) {
  const pe = perim(x, z);
  if (y === gr) return pe ? ["stone_bricks"] : ["smooth_stone"];          // base course / ground floor slab
  if (y === 5) return [pe ? "light_gray_concrete" : "light_gray_concrete"]; // storey line
  if (y === 10) return [pe ? "smooth_quartz" : "light_gray_concrete"];    // roof slab / cornice
  if (y === 11) return pe ? ["smooth_quartz"] : null;                    // parapet
  if (!pe) return null;                                                  // interior air

  const entranceFace = z === D - 1 && x >= 9 && x <= 11;

  // Spandrel band above ground floor
  if (y === 4) {
    if (entranceFace && x === 10) return ["smooth_quartz"];
    if (entranceFace) return ["light_gray_concrete"]; // lanterns placed later
    return ["light_gray_concrete"];
  }

  // Entrance door on ground storey
  if (entranceFace && x === 10 && (y === gr + 1 || y === gr + 2)) {
    return { door: y === gr + 1 ? "lower" : "upper" };
  }

  const ground1 = y > gr && y < 4;   // shopfront
  const upper = y > 5 && y < 10;     // storey 2 windows
  if (ground1 || upper) {
    if ((x + z) % 3 === 0) return ["smooth_quartz"]; // mullion
    return { pane: true };
  }
  return null;
}

// Foundations and body
const glow = [];
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const pe = perim(x, z);
  const [odx, odz] = pe ? outward(x, z) : [0, 0];

  for (let y = gr; y <= 11; y++) {
    const b = bodyAt(x, z, y, gr);
    if (!b) continue;
    if (Array.isArray(b)) {
      put(x, y, z, b[0]);
    } else if (b.pane) {
      put(x, y, z, "light_blue_stained_glass_pane", paneProps(x, z));
    } else if (b.door) {
      put(x, y, z, "dark_oak_door", {
        facing: "south",
        half: b.door,
        hinge: "left",
        open: "false",
        powered: "false",
      });
    }
  }

  // Warm light just behind some storey-2 windows
  if (pe && (x + z) % 9 === 4 && 6 < 10 && !((x + z) % 3 === 0)) {
    const ix = x - odx, iz = z - odz; // inward cell
    if (inFp(ix, iz) && !perim(ix, iz)) glow.push([ix, 6, iz]);
  }
}

for (const [x, y, z] of glow) put(x, y, z, "glowstone");

// Entrance lanterns hanging under the storey-2 slab, flanking the door
for (const x of [9, 11]) {
  if (inFp(x, D - 1)) put(x, 4, D - 1, "lantern", { hanging: "true", waterlogged: "false" });
}

// Rooftop plant room on the roof slab (y 10), inset from the parapet
for (let x = 7; x <= 13; x++) {
  for (let z = 7; z <= 12; z++) {
    if (!inFp(x, z) || perim(x, z)) continue;
    put(x, 11, z, "light_gray_concrete");
    if (x >= 8 && x <= 12 && z >= 8 && z <= 11) {
      put(x, 12, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

vox.save(`${DIR}/${ID}.nbt`);
