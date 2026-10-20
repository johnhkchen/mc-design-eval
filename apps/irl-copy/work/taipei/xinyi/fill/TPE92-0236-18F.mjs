import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE92-0236-18F";
const W = 47, H = 100, D = 22;

// 冠德領袖, 2003: 18-storey reinforced-concrete office/residential tower on a
// white-painted concrete frame with tinted glass curtain walls, a stone-clad
// two-storey podium, a white parapet and a central mechanical penthouse.
const TOP = 84;          // top of 18th storey (roof slab), absolute y
const N_STOREYS = 18;
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
function put(x, y, z, name, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
}

// Outward faces of a footprint cell (cells with a missing neighbour).
function edgeFaces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
}

// Storey base lines (about 4.67 blocks each, 18 storeys to y=84).
const L = [];
for (let i = 0; i <= N_STOREYS; i++) L.push(Math.round((i * TOP) / N_STOREYS));

// 1. Foundations: solid from y 0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

// 2. Storeys: floor slabs, facade, glazing, mullions, spandrels, a few lights.
for (let i = 0; i < N_STOREYS; i++) {
  const b = L[i], t = L[i + 1], hh = t - b;
  for (const [x, z, gr] of cells) {
    const start = Math.max(b, gr);
    if (start >= t) continue;
    const faces = edgeFaces(x, z);
    const isEdge = faces.length > 0;

    for (let y = start; y < t; y++) {
      const rel = y - b;

      // Floor slab (cornice band every sixth storey on the outer ring).
      if (rel === 0 && b >= gr) {
        const band = isEdge && i > 0 && i % 6 === 0;
        put(x, y, z, band ? "white_concrete" : "light_gray_concrete");
        continue;
      }
      if (!isEdge) continue; // interior air behind the glass

      const face = faces[0];
      const u = face === "N" || face === "S" ? x : z;
      const mullion = u % 3 === 0;

      if (rel === hh - 1) {
        put(x, y, z, "light_gray_concrete"); // spandrel under the slab above
        continue;
      }
      if (i === 2) {
        // podium upper band: stone with white pilasters
        put(x, y, z, mullion ? "white_concrete" : "stone_bricks");
        continue;
      }
      if (mullion) {
        put(x, y, z, "white_concrete");
        continue;
      }
      put(x, y, z, "light_blue_stained_glass");

      // Warm light behind some glass on the tower floors.
      if (i >= 3 && rel === 2 && (u + i) % 4 === 0) {
        let ix = x, iz = z;
        if (face === "N") iz = z + 1;
        else if (face === "S") iz = z - 1;
        else if (face === "W") ix = x + 1;
        else ix = x - 1;
        if (has(ix, iz) && edgeFaces(ix, iz).length === 0) {
          put(ix, y, iz, "glowstone");
        }
      }
    }
  }
}

// 3. Roof: roof slab on every cell, white parapet on the outer ring.
for (const [x, z, gr] of cells) {
  if (TOP < gr) continue;
  if (edgeFaces(x, z).length > 0) {
    put(x, TOP, z, "light_gray_concrete");
    put(x, TOP + 1, z, "white_concrete");
  } else {
    put(x, TOP, z, "gray_concrete");
  }
}

// 4. Central mechanical penthouse on the roof.
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of [...ground.keys()].map((k) => k.split(",").map(Number))) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const w = maxX - minX, dd = maxZ - minZ;
const px0 = minX + Math.round(w * 0.3), px1 = maxX - Math.round(w * 0.3);
const pz0 = minZ + Math.round(dd * 0.3), pz1 = maxZ - Math.round(dd * 0.3);
const inPH = (x, z) => x >= px0 && x <= px1 && z >= pz0 && z <= pz1 && has(x, z) && TOP >= gAt(x, z);

for (let x = px0; x <= px1; x++) {
  for (let z = pz0; z <= pz1; z++) {
    if (!inPH(x, z)) continue;
    put(x, TOP + 1, z, "light_gray_concrete"); // penthouse floor
    const edgeX = x === px0 || x === px1;
    const edgeZ = z === pz0 || z === pz1;
    const corner = edgeX && edgeZ;
    for (let y = TOP + 2; y <= TOP + 4; y++) {
      if (edgeX || edgeZ) {
        put(x, y, z, corner || y === TOP + 4 ? "white_concrete" : "light_blue_stained_glass");
      }
    }
    put(x, TOP + 5, z, "light_gray_concrete"); // penthouse roof
    if (corner) put(x, TOP + 6, z, "lantern");
  }
}

// 5. Entrance: a stone-framed bay on the north (lowest-z) face, centred on the
// median cell of that row. Two dark oak doors flank a glazed centre bay under a
// white lintel, with a hanging lantern for warmth at dusk.
const northRow = cells.filter(([, z]) => z === minZ).sort((a, b) => a[0] - b[0]);
if (northRow.length) {
  const [dx, dz, dg] = northRow[Math.floor(northRow.length / 2)];
  const lintelY = dg + 3;

  for (let k = -2; k <= 2; k++) {
    const x = dx + k;
    if (!has(x, dz)) continue;
    // Stone jambs at the outer bays of the entrance.
    if (k === -2 || k === 2) {
      for (let y = dg; y <= lintelY - 1; y++) put(x, y, dz, "stone_bricks");
    }
    // White lintel over the whole entrance.
    put(x, lintelY, dz, "white_concrete");
  }

  // Doors on either side of the centre glazed bay.
  for (const k of [-1, 1]) {
    const x = dx + k;
    if (!has(x, dz)) continue;
    const hinge = k < 0 ? "left" : "right";
    put(x, dg, dz, "dark_oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
    put(x, dg + 1, dz, "dark_oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
  }

  // Glazed centre bay, with a hanging lantern hung from the lintel.
  put(dx, dg, dz, "light_blue_stained_glass");
  put(dx, dg + 1, dz, "light_blue_stained_glass");
  put(dx, dg + 2, dz, "lantern", { hanging: "true" });
}

g.save(`${DIR}/${ID}.nbt`);
