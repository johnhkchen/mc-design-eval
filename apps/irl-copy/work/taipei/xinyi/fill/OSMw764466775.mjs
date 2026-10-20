import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw764466775";
const W = 14, H = 38, D = 22;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...cells.map((c) => c[2]));
const S0 = minG + 1;          // first storey line, shared by every cell
const CX = (W - 1) / 2;

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Entrance: a south-facing perimeter cell nearest the middle of the front.
let doorX = -1, doorZ = -1, best = Infinity;
for (const [x, z] of cells) {
  if (has(x, z + 1)) continue;
  const d = Math.abs(x - CX);
  if (d < best) { best = d; doorX = x; doorZ = z; }
}

const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gr && y < H; y++) put(x, y, z, y === gr ? "smooth_stone" : "stone_bricks");

  const faces = [];
  if (!has(x, z - 1)) faces.push("N");
  if (!has(x, z + 1)) faces.push("S");
  if (!has(x - 1, z)) faces.push("W");
  if (!has(x + 1, z)) faces.push("E");
  const perim = faces.length > 0;
  const corner = faces.length >= 2;
  const inCentre = x >= 4 && x <= 9 && z >= 7 && z <= 14;

  for (let rel = 0; rel <= 28; rel++) {
    const y = S0 + rel;
    if (y <= gr || y >= H) continue;
    const storey = Math.floor(rel / 5);
    const row = rel % 5;

    // Roof deck / cornice line.
    if (rel === 25) { put(x, y, z, "light_gray_concrete"); continue; }

    // Parapet and roof equipment.
    if (rel > 25) {
      if (perim && rel <= 27) {
        if (rel === 27) put(x, y, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
        else put(x, y, z, "white_concrete");
        continue;
      }
      if (inCentre) {
        put(x, y, z, rel === 28 ? "light_gray_concrete" : "white_concrete");
      }
      continue;
    }

    // Floor slab at the start of each storey (interior and perimeter).
    if (row === 0) { put(x, y, z, "light_gray_concrete"); continue; }

    if (!perim) continue; // interior air behind the glass

    // Solid spandrel rows and corner piers.
    if (corner || row === 4) { put(x, y, z, "white_concrete"); continue; }

    // Window rows 1-3 on a single face.
    const f = faces[0];
    const idx = (f === "N" || f === "S") ? x : z;
    const mullion = idx % 3 === 0;

    // Entrance door with hanging lantern above.
    if (storey === 0 && f === "S" && x === doorX && z === doorZ) {
      if (row === 1 || row === 2) {
        put(x, y, z, "oak_door", {
          facing: "south",
          half: row === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (row === 3) {
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      }
      continue;
    }

    // Shopfront on the ground storey: dark frames and large glass.
    if (storey === 0) {
      if (mullion) put(x, y, z, "dark_oak_planks");
      else putPane(x, y, z, f);
      continue;
    }

    // Upper storeys: glass grid with concrete mullions.
    if (mullion) {
      put(x, y, z, "light_gray_concrete");
    } else {
      putPane(x, y, z, f);
      // Warm light behind some panes (interior cell just inside the glass).
      if (row === 2 && (idx + storey) % 4 === 1) {
        const [dx, dz] = INWARD[f];
        if (has(x + dx, z + dz)) put(x + dx, y, z + dz, "glowstone");
      }
    }
  }
}

function putPane(x, y, z, face) {
  if (face === "N" || face === "S") {
    put(x, 0 + 0, z, "air"); // no-op placeholder removed below
  }
}

g.save(`${DIR}/${ID}.nbt`);
