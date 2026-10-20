import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi commercial block, roughly two storeys over a ground-floor shopfront line.
// Record: 32 x 16 footprint, roof about 11 blocks above lowest ground.
// Storeys are 5 blocks. Roof deck sits at y 10, parapet at y 11, cap at y 12.
// Facade: white concrete spandrels, quartz piers, light-blue glass panes, dark kickplates.
// Entrance on the north (z = 0) street face at x 16, with a black canopy band above.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1038711367";
const W = 32, H = 23, D = 16;
const DECK = 10;     // roof deck layer; top surface of the building at 11
const PARAPET = 11;  // parapet course
const CAP = 12;      // cap slab on parapet

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inside = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// N = z-1 (street side), S = z+1, W = x-1, E = x+1
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const exposedFaces = (x, z) =>
  Object.keys(DIRS).filter((f) => !inside(x + DIRS[f][0], z + DIRS[f][1]));

const paneProps = (faces) =>
  faces.includes("N") || faces.includes("S")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const glowCandidates = [];

// Pass 1: foundations, floors, deck, facade
for (const [x, z, gr] of cells) {
  const faces = exposedFaces(x, z);
  const ext = faces.length > 0;
  const onNS = faces.includes("N") || faces.includes("S");
  const onEW = faces.includes("E") || faces.includes("W");
  const corner = onNS && onEW;
  const t = onNS ? x : z;

  // foundation below the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // ground floor plate
  put(x, gr, z, ext ? "polished_andesite" : "smooth_quartz");

  // intermediate storey slabs (storey lines every 5 blocks, up to the deck)
  for (let s = gr + 5; s <= DECK - 5; s += 5) {
    put(x, s, z, "smooth_quartz");
  }

  // roof deck
  if (gr <= DECK) put(x, DECK, z, "smooth_stone");

  if (!ext) continue;

  // facade columns from just above ground to just below the deck
  for (let y = gr + 1; y <= DECK - 1; y++) {
    const rel = y - gr;
    const r = rel % 5;
    const k = Math.floor(rel / 5);
    const pier = corner || t % 3 === 0;

    if (r === 0) {
      put(x, y, z, "light_gray_concrete");          // storey line band
    } else if (r === 4) {
      // spandrel; black canopy over the entrance on ground floor
      if (k === 0 && faces.includes("N") && x >= 15 && x <= 17) {
        put(x, y, z, "black_concrete");
      } else {
        put(x, y, z, "white_concrete");
      }
    } else if (pier) {
      put(x, y, z, "smooth_quartz");
    } else if (k === 0 && r === 1) {
      // shopfront kickplate, or the entrance door
      if (faces.includes("N") && x === 16) {
        put(x, y, z, "dark_oak_door", {
          facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
        });
      } else {
        put(x, y, z, "polished_andesite");
      }
    } else if (k === 0 && r === 2 && faces.includes("N") && x === 16) {
      put(x, y, z, "dark_oak_door", {
        facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
      });
    } else {
      // glass pane in a window or shopfront opening
      put(x, y, z, "light_blue_stained_glass_pane", paneProps(faces));
      if (k === 0 && r === 2 && t % 4 === 1) glowCandidates.push({ x, y, z, faces });
      if (k >= 1 && r === 2 && (t + k) % 3 === 0) glowCandidates.push({ x, y, z, faces });
    }
  }

  // parapet and cap on the exterior ring
  if (gr <= PARAPET) {
    put(x, PARAPET, z, "white_concrete");
    put(x, CAP, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Pass 2: warm light behind some glass, then a rooftop mechanical box
for (const { x, y, z, faces } of glowCandidates) {
  // inward neighbour is opposite the first exposed face
  const f = faces[0];
  const [dx, dz] = DIRS[f];
  const ix = x - dx, iz = z - dz;
  if (!inside(ix, iz)) continue;
  if (exposedFaces(ix, iz).length > 0) continue;
  if (y <= ground.get(`${ix},${iz}`)) continue;
  put(ix, y, iz, "glowstone");
}

for (const [x, z, gr] of cells) {
  if (exposedFaces(x, z).length > 0) continue;
  if (x < 20 || x > 26 || z < 4 || z > 11) continue;
  if (gr > DECK) continue;
  put(x, DECK + 1, z, "light_gray_concrete");
  put(x, DECK + 2, z, "light_gray_concrete");
  const corner = (x === 20 || x === 26) && (z === 4 || z === 11);
  if (corner) put(x, DECK + 3, z, "sea_lantern");
}

g.save(`${DIR}/${ID}.nbt`);
