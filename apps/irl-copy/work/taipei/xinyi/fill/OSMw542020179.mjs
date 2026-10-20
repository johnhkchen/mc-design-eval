import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 10 x 16 footprint, roof about 11 blocks above lowest ground.
// Read as a two-storey concrete shophouse, c. 1970s-80s Taipei: pale tiled
// facade, dark glass bays, red shop-sign band over a glazed ground floor,
// a parapet, and a rooftop water tank with AC units.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020179";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 10, H = 23, D = 16;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inS = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

const FACES = {
  N: { dx: 0, dz: -1, facing: "north" },
  S: { dx: 0, dz: 1, facing: "south" },
  W: { dx: -1, dz: 0, facing: "west" },
  E: { dx: 1, dz: 0, facing: "east" },
};
const faceList = (x, z) =>
  Object.keys(FACES).filter((f) => !inS(x + FACES[f].dx, z + FACES[f].dz));

const cellList = cells.map(([x, z, gr]) => ({ x, z, gr }));
const minX = Math.min(...cellList.map((c) => c.x));
const minZ = Math.min(...cellList.map((c) => c.z));

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Front face = the face with the most exposed cells (ties: N, S, W, E).
const faceCount = { N: 0, S: 0, W: 0, E: 0 };
for (const c of cellList) for (const f of faceList(c.x, c.z)) faceCount[f]++;
const front = ["N", "S", "W", "E"].reduce((best, f) => (faceCount[f] > faceCount[best] ? f : best), "N");

// Entrance: middle cell of the front face.
const frontCells = cellList
  .filter((c) => faceList(c.x, c.z).includes(front))
  .map((c) => ({ ...c, u: front === "N" || front === "S" ? c.x - minX : c.z - minZ }))
  .sort((a, b) => a.u - b.u);
const doorCell = frontCells.length ? frontCells[Math.floor(frontCells.length / 2)] : null;

// Pass 1: foundation, slabs, roof, walls.
for (const c of cellList) {
  const { x, z, gr: G } = c;
  const faces = faceList(x, z);
  const isEdge = faces.length > 0;

  // Foundation up to ground, ground slab at the ground line.
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");
  put(x, G, z, "smooth_stone");

  // Storey floor slab at y=5 (interior) and roof slab at y=10.
  if (G < 5) put(x, 5, z, "smooth_stone");
  put(x, 10, z, "light_gray_concrete");

  if (!isEdge) continue;

  const face = faces.includes(front) ? front : faces[0];
  const F = FACES[face];
  const u = face === "N" || face === "S" ? x - minX : z - minZ;
  const pillar = u % 3 === 0;
  const isDoorCell = doorCell && doorCell.x === x && doorCell.z === z;
  const northSouth = face === "N" || face === "S";
  const paneProps = northSouth
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  // Interior cell behind this wall (for warm lights behind glass).
  const ix = x - F.dx, iz = z - F.dz;
  const interiorBehind = inS(ix, iz) && faceList(ix, iz).length === 0;

  for (let y = G + 1; y <= 11; y++) {
    if (y === 10) {
      put(x, y, z, "smooth_stone"); // cornice
      continue;
    }
    if (y === 11) {
      put(x, y, z, "white_terracotta"); // parapet
      continue;
    }
    if (y === 5) {
      put(x, y, z, face === front ? "red_concrete" : "smooth_stone"); // storey line / sign band
      continue;
    }
    if (y <= 4) {
      // Ground storey (shopfront).
      if (y === G + 1) {
        if (isDoorCell) {
          put(x, y, z, "dark_oak_door", {
            facing: F.facing, half: "lower", hinge: "left", open: "false", powered: "false",
          });
        } else {
          put(x, y, z, "smooth_stone"); // base course
        }
        continue;
      }
      if (isDoorCell && y === G + 2) {
        put(x, y, z, "dark_oak_door", {
          facing: F.facing, half: "upper", hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (pillar) put(x, y, z, "white_terracotta");
      else put(x, y, z, "light_blue_stained_glass_pane", paneProps);
      continue;
    }
    // Upper storey (6..9).
    if (pillar) {
      put(x, y, z, "white_terracotta");
    } else {
      put(x, y, z, "gray_stained_glass_pane", paneProps);
      if (y === 7 && interiorBehind && u % 6 === 1) put(ix, y, iz, "glowstone");
    }
  }
}

// Pass 2: roof equipment on interior roof cells only.
const interiorCells = cellList.filter((c) => faceList(c.x, c.z).length === 0);
const isInterior = (x, z) => interiorCells.some((c) => c.x === x && c.z === z);

const midX = Math.floor((minX + Math.max(...cellList.map((c) => c.x))) / 2);
const midZ = Math.floor((minZ + Math.max(...cellList.map((c) => c.z))) / 2);

// Water tank: 3x3 minus corners, on the roof.
for (let dx = -1; dx <= 1; dx++) {
  for (let dz = -1; dz <= 1; dz++) {
    if (Math.abs(dx) === 1 && Math.abs(dz) === 1) continue;
    const x = midX + dx, z = midZ + dz;
    if (!isInterior(x, z)) continue;
    for (let y = 11; y <= 13; y++) put(x, y, z, "white_concrete");
    put(x, 14, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// AC units on interior roof cells.
for (const [x, z] of [[minX + 2, minZ + 2], [minX + W - 3, minZ + D - 3]]) {
  if (isInterior(x, z)) put(x, 11, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
