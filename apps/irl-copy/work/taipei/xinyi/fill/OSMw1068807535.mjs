import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unknown record: 27 x 31 footprint, roof about 11 blocks above lowest ground.
// Read as a two-storey, early-2000s Taipei commercial block: a stone base course,
// a shopfront ground storey with a glazed bay rhythm, one upper storey, a white
// tiled cornice and parapet, and modest rooftop plant.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1068807535";
const W = 27, H = 23, D = 31;

const ROOF_SLAB = 10;   // roof structure top layer
const PARAPET = 11;     // parapet course
const FLOOR_1 = 5;      // slab / spandrel between the two storeys
const CORNICE = 10;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const occ = new Set(cells.map(([x, z]) => key(x, z)));
const groundOf = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));

const exposedFaces = (x, z) => {
  const f = [];
  if (!occ.has(key(x, z - 1))) f.push("n");
  if (!occ.has(key(x, z + 1))) f.push("s");
  if (!occ.has(key(x - 1, z))) f.push("w");
  if (!occ.has(key(x + 1, z))) f.push("e");
  return f;
};
const isEdge = (x, z) => exposedFaces(x, z).length > 0;

// Per-face minimum along-facade coordinate, used for bay rhythm.
const faceMin = { n: Infinity, s: Infinity, w: Infinity, e: Infinity };
const faceMax = { n: -Infinity, s: -Infinity, w: -Infinity, e: -Infinity };
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  for (const f of exposedFaces(x, z)) {
    const u = f === "n" || f === "s" ? x : z;
    faceMin[f] = Math.min(faceMin[f], u);
    faceMax[f] = Math.max(faceMax[f], u);
  }
}

// Front (entrance) faces the north (z-min) side; pick a bay centre near its middle.
let entU = null;
if (faceMin.n !== Infinity) {
  const centre = (faceMin.n + faceMax.n) / 2;
  let best = Infinity;
  for (const [x, z] of cells) {
    if (!exposedFaces(x, z).includes("n")) continue;
    if ((x - faceMin.n) % 3 !== 1) continue;
    const d = Math.abs(x - centre);
    if (d < best) { best = d; entU = x; }
  }
}

const pane = (f) =>
  f === "n" || f === "s"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Only set blocks above the cell's own ground (foundation handles the rest).
const put = (x, y, z, id, props) => {
  const gr = groundOf.get(key(x, z));
  if (gr === undefined || y <= gr || y >= H) return;
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
};

// 1. Foundation: solid from y 0 up to each cell's ground, base course on the edge.
for (const [x, z, gr] of cells) {
  for (let y = 0; y <= gr && y < H; y++) {
    const edge = isEdge(x, z);
    const id = y === gr && edge ? "polished_andesite" : "stone_bricks";
    g.set(x, y, z, id);
  }
}

// 2. Facades, floors, roof slab.
for (const [x, z, gr] of cells) {
  const faces = exposedFaces(x, z);
  if (faces.length) {
    const f = faces[0];
    const u = f === "n" || f === "s" ? x : z;
    const rel = u - faceMin[f];
    const bayCentre = rel % 3 === 1;
    const inward =
      f === "n" ? [x, z + 1] : f === "s" ? [x, z - 1] : f === "w" ? [x + 1, z] : [x - 1, z];

    for (let y = gr + 1; y <= PARAPET && y < H; y++) {
      // Entrance on the north face: door, lintel, flanking hanging lanterns.
      if (f === "n" && entU !== null) {
        if (x === entU && (y === gr + 1 || y === gr + 2)) {
          put(x, y, z, "dark_oak_door", {
            facing: "north",
            half: y === gr + 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
          continue;
        }
        if (Math.abs(x - entU) <= 1 && y === gr + 3) {
          put(x, y, z, "smooth_stone");
          continue;
        }
        if (Math.abs(x - entU) === 1 && y === gr + 2) {
          put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
          continue;
        }
      }

      let id, props;
      if (y === PARAPET) {
        id = "white_concrete";
      } else if (y === CORNICE) {
        id = "smooth_quartz";
      } else if (y === 9) {
        id = "white_concrete";                 // upper spandrel
      } else if (y === FLOOR_1) {
        id = "smooth_stone";                   // storey line
      } else if (rel % 3 === 0) {
        id = "white_concrete";                 // pier
      } else {
        id = "light_blue_stained_glass_pane";  // glazing, ground and upper storeys
        props = pane(f);
      }
      put(x, y, z, id, props);

      // Warm light behind the upper-storey glass at bay centres.
      if (y === 7 && bayCentre && rel % 3 === 1) {
        const [ix, iz] = inward;
        if (occ.has(key(ix, iz)) && !isEdge(ix, iz) && groundOf.get(key(ix, iz)) < 7) {
          put(ix, 7, iz, "glowstone");
        }
      }
    }
  } else {
    // Interior cell: floor slab at the storey line, then the roof slab.
    put(x, FLOOR_1, z, "smooth_stone");
  }

  // Roof slab over every cell (edges already set above).
  put(x, ROOF_SLAB, z, "smooth_quartz");
}

// 3. Rooftop plant: small AC units and a central penthouse on interior roof.
const interior = cells.filter(([x, z]) => !isEdge(x, z));
if (interior.length) {
  const minX = Math.min(...interior.map((c) => c[0]));
  const minZ = Math.min(...interior.map((c) => c[1]));
  const maxX = Math.max(...interior.map((c) => c[0]));
  const maxZ = Math.max(...interior.map((c) => c[1]));
  const cx = Math.round((minX + maxX) / 2);
  const cz = Math.round((minZ + maxZ) / 2);

  for (const [x, z, gr] of interior) {
    if (gr >= PARAPET) continue;
    const isPenthouse = Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 3;
    if (isPenthouse) {
      for (let y = PARAPET; y <= PARAPET + 2; y++) {
        const id = y === PARAPET + 1 ? "light_blue_stained_glass" : "smooth_quartz";
        put(x, y, z, id);
      }
    } else if ((x - minX) % 8 >= 3 && (x - minX) % 8 <= 4 && (z - minZ) % 8 >= 3 && (z - minZ) % 8 <= 4) {
      put(x, PARAPET, z, "gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
