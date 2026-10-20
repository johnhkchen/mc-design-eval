import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 台北市政府消防局: a two-storey red-banded white concrete fire headquarters
// with a tall apparatus-bay ground floor, a framed entrance, a drill tower on
// the NE roof, and a red-and-white parapet. Roof deck sits at y 10, parapet at y 11.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw321085243";
const W = 52, H = 23, D = 32;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.min(Math.max(0, gr), 10));
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const midX = Math.round((minX + maxX) / 2);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Which outward face a perimeter cell sits on (null when interior)
function faceOf(x, z) {
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  return null;
}
// Step from a perimeter cell into the building
const inward = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

// Drill tower on the north-east roof
const TX0 = 40, TX1 = 46, TZ0 = 3, TZ1 = 9;
const inTower = (x, z) => x >= TX0 && x <= TX1 && z >= TZ0 && z <= TZ1 && has(x, z);

// Window rows: storey 2 (6..8) and storey 1 above the ground floor
const isWindowRow = (y, gr) =>
  (y >= 6 && y <= 8) || (y > gr && y <= 3);

function wallBlock(x, z, face, y, gr) {
  const isNS = face === "north" || face === "south";
  const k = isNS ? x - minX : z - minZ;
  const len = isNS ? maxX - minX + 1 : maxZ - minZ + 1;
  const mid = isNS ? midX - minX : Math.round((minZ + maxZ) / 2) - minZ;

  // Apparatus bays on north face: 4 open, 2 pillar, ground floor only
  if (face === "north" && k >= 3 && k <= len - 4 && (k - 3) % 6 < 4 && y <= gr + 3) {
    put(x, y, z, y === gr + 3 ? "red_concrete" : "gray_concrete");
    return;
  }

  // Entrance on south face, centred: glass doors between red jambs
  if (face === "south" && y <= gr + 2) {
    if (Math.abs(k - mid) <= 1) {
      put(x, y, z, "light_blue_stained_glass");
      return;
    }
    if (Math.abs(k - mid) === 2) {
      put(x, y, z, "red_concrete");
      return;
    }
  }
  // Canopy over the entrance, five cells wide, stone slab
  if (face === "south" && Math.abs(k - mid) <= 2 && y === gr + 3) {
    put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    return;
  }

  // Window bays: pilaster (k%3==0), glass (k%3==1), spandrel (k%3==2)
  const isWin = isWindowRow(y, gr);
  const pilaster = k % 3 === 0;
  if (isWin && k % 3 === 1) {
    put(x, y, z, "light_blue_stained_glass_pane");
    // Warm light behind every other window at mid-storey
    if (k % 6 === 1 && y === 7) {
      const [dx, dz] = inward[face];
      const ix = x + dx, iz = z + dz;
      if (has(ix, iz) && !faceOf(ix, iz)) put(ix, y, iz, "glowstone");
    }
    return;
  }
  // Light-grey lintel row over each window band, pilasters run full height
  if (pilaster || y === 9 || y === 4 || (isWin && y === 5)) {
    put(x, y, z, "light_gray_concrete");
    return;
  }
  put(x, y, z, "white_concrete");
}

// Main body
for (const [x, z] of cells) {
  const gr = gAt(x, z);
  const face = faceOf(x, z);
  const perim = face !== null;

  // Foundation and ground floor
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, perim ? "stone_bricks" : "smooth_stone");

  // Storeys above ground
  for (let y = gr + 1; y <= 10; y++) {
    if (y === 10) {
      put(x, y, z, perim ? "light_gray_concrete" : "white_concrete"); // deck and cornice
    } else if (y === 5) {
      put(x, y, z, perim ? "red_concrete" : "white_concrete"); // storey band and slab
    } else if (perim) {
      wallBlock(x, z, face, y, gr);
    }
    // interior air otherwise
  }

  // Parapet on the roof perimeter, outside the tower
  if (perim && !inTower(x, z)) put(x, 11, z, "white_concrete");
}

// Entrance lantern just inside the south doors
for (const [x, z] of cells) {
  if (x === midX && z === maxZ) {
    const gr = gAt(x, z);
    const iz = z - 1;
    if (has(x, iz) && !faceOf(x, iz)) put(x, gr + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Roof equipment: HVAC plant boxes on the main roof
const acBoxes = [
  [14, 17, 12, 13],
  [30, 33, 20, 21],
  [22, 24, 4, 5],
];
for (const [x0, x1, z0, z1] of acBoxes) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!has(x, z)) continue;
    put(x, 11, z, "light_gray_concrete");
  }
}

// Drill tower: walls y 11..20, slab 16, deck 21, parapet 22
for (let x = TX0; x <= TX1; x++) for (let z = TZ0; z <= TZ1; z++) {
  if (!inTower(x, z)) continue;
  const ring = x === TX0 || x === TX1 || z === TZ0 || z === TZ1;
  const corner = (x === TX0 || x === TX1) && (z === TZ0 || z === TZ1);
  const k = (x === TX0 || x === TX1) ? z - TZ0 : x - TX0;

  // Deck and parapet
  put(x, 21, z, "white_concrete");
  if (ring) put(x, 22, z, "red_concrete");

  // Storey slab at 16
  put(x, 16, z, "white_concrete");

  for (let y = 11; y <= 20; y++) {
    if (y === 16) continue;
    if (!ring) continue; // interior air
    if (corner) { put(x, y, z, "red_concrete"); continue; }
    const winRow = (y >= 12 && y <= 14) || (y >= 17 && y <= 19);
    if (winRow && k % 3 === 1) {
      put(x, y, z, "light_blue_stained_glass_pane");
    } else {
      put(x, y, z, "white_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
