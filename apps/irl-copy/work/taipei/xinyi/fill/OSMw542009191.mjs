import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey cream-tiled commercial block with a shopfront, storey lines,
// a cornice-style parapet and light rooftop plant. Roof sits 11 blocks above
// the lowest ground (ROOF = L0 + 10 is the top course).
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542009191";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 15, H = 23, D = 20;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...cells.map((c) => c[2]));
const L0 = minG;
const ROOF = L0 + 10;

const put = (x, y, z, name, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
};

// Which outward face a footprint cell sits on (null = interior).
function faceOf(x, z) {
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  if (!has(x - 1, z)) return "W";
  if (!has(x + 1, z)) return "E";
  return null;
}
const NORMAL = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

// Entrance: north-facing cell nearest the middle of the north face.
let doorX = -1, doorZ = -1;
{
  const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
  const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
  const minZ = Math.min(...zs);
  const north = cells.filter(([x, z]) => z === minZ && faceOf(x, z) === "N");
  north.sort((a, b) => Math.abs(a[0] - mid) - Math.abs(b[0] - mid));
  const pick = north[0] ?? cells.find(([x, z]) => faceOf(x, z));
  if (pick) { doorX = pick[0]; doorZ = pick[1]; }
}

const lights = [];

for (const [x, z, gr] of cells) {
  const f = faceOf(x, z);

  // Foundation under every footprint cell.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  if (f === null) {
    // Interior: floor slab per storey, roof deck, air gap in between.
    if (gr >= L0 + 5) {
      for (let y = gr; y < ROOF; y++) put(x, y, z, "smooth_stone");
    } else {
      put(x, L0 + 5, z, "smooth_stone");
    }
    put(x, ROOF, z, "smooth_stone");
    // Light plant on the roof, a few units.
    if (x % 5 === 2 && z % 6 === 3 && ROOF + 1 < H) {
      put(x, ROOF + 1, z, "light_gray_concrete");
      if (ROOF + 2 < H) put(x, ROOF + 2, z, "light_gray_concrete");
    }
    continue;
  }

  // Perimeter walls.
  const [nx, nz] = NORMAL[f];
  const corner = [!has(x, z - 1), !has(x, z + 1), !has(x - 1, z), !has(x + 1, z)]
    .filter(Boolean).length >= 2;
  const a = f === "N" || f === "S" ? x : z;
  const colMull = corner || a % 3 === 0;
  const isNS = f === "N" || f === "S";
  const paneProps = isNS
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const isDoor = f === "N" && x === doorX && z === doorZ;
  const nearDoor = f === "N" && z === doorZ && Math.abs(x - doorX) <= 1;

  for (let y = gr; y <= ROOF && y < H; y++) {
    let b;
    if (y === gr) {
      b = ["stone_bricks"];                       // base course
    } else if (y === ROOF) {
      b = ["stone_brick_slab", { type: "top", waterlogged: "false" }]; // parapet cap
    } else if (y <= L0 + 4) {
      // Ground floor shopfront band (y = L0+1..L0+3), cornice at L0+4.
      if (y === L0 + 4) {
        b = ["polished_andesite"];
      } else if (isDoor && (y === gr + 1 || y === gr + 2)) {
        b = ["oak_door", {
          facing: "north",
          half: y === gr + 1 ? "lower" : "upper",
          hinge: "left", open: "false", powered: "false",
        }];
      } else if (nearDoor && y === gr + 3) {
        b = ["stone_brick_slab", { type: "bottom", waterlogged: "false" }]; // canopy lintel
      } else if (y > gr && y <= L0 + 3) {
        b = colMull
          ? ["quartz_pillar", { axis: "y" }]
          : ["glass_pane", paneProps];
      } else {
        b = ["smooth_quartz"];
      }
    } else if (y === L0 + 5) {
      b = ["quartz_block"];                        // storey line
    } else if (y === L0 + 6) {
      b = ["quartz_slab", { type: "bottom", waterlogged: "false" }]; // sill
    } else if (y <= L0 + 8) {
      b = colMull
        ? ["quartz_pillar", { axis: "y" }]
        : ["glass_pane", paneProps];
    } else if (y === L0 + 9) {
      b = ["quartz_block"];                        // frieze
    } else {
      b = ["smooth_quartz"];
    }
    put(x, y, z, b[0], b[1]);

    // Note warm windows; the glowstone goes in the room behind the glass.
    const isWindow = b[0] === "glass_pane";
    if (isWindow && ((x + z) % 4 === 0 && (y === L0 + 2 || y === L0 + 7))) {
      lights.push([x - nx, y, z - nz]);
    }
  }
}

// Warm lights behind glass, only where the cell behind is an interior air gap.
for (const [bx, y, bz] of lights) {
  const bg = ground.get(`${bx},${bz}`);
  if (bg === undefined || faceOf(bx, bz) !== null) continue;
  if (y < bg || y === L0 + 5 || y >= ROOF) continue;
  put(bx, y, bz, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
