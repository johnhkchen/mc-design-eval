import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Footprint 31 x 17, roof about 26 blocks above lowest ground.
// Read as a five-storey 1980s Taipei commercial/office block: pale tiled
// concrete, tinted glass window bands, a granite plinth, a shopfront on the
// street (north) face with a central entrance, and a parapet with rooftop
// plant and lanterns.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw662834767";
const W = 31, H = 38, D = 17;
const ROOF_Y = 26;          // roof slab level (5 storeys of 5 blocks above y=1)
const PARAPET_TOP = 28;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
let minX = Infinity, maxX = -Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  minX = Math.min(minX, x);
  maxX = Math.max(maxX, x);
}
const cx = Math.round((minX + maxX) / 2);   // entrance column

const inside = (x, z) => ground.has(`${x},${z}`);
const DIRS = [
  { dx: 0, dz: -1, k: "n" },  // street / front face
  { dx: 0, dz: 1, k: "s" },
  { dx: -1, dz: 0, k: "w" },
  { dx: 1, dz: 0, k: "e" },
];
const outsOf = (x, z) => DIRS.filter((d) => !inside(x + d.dx, z + d.dz));
const isEdge = (x, z) => outsOf(x, z).length > 0;

function put(x, y, z, block, props) {
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Pre-pass: choose interior cells behind some upper-floor windows for warm light.
const glow = new Set();
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  const outs = outsOf(x, z);
  if (outs.length === 0 || outs.length >= 2) continue;
  const face = outs[0];
  const along = face.k === "n" || face.k === "s" ? x : z;
  for (let y = 1; y <= ROOF_Y - 1; y++) {
    const rel = (y - 1) % 5;
    const k = Math.floor((y - 1) / 5);
    if (rel !== 2 || k < 1) continue;
    if (along % 3 === 0) continue;
    if (((x * 7 + z * 5 + k * 3) % 4) !== 0) continue;
    const ix = x - face.dx, iz = z - face.dz;
    if (inside(ix, iz) && !isEdge(ix, iz)) glow.add(`${ix},${iz},${y}`);
  }
}

for (const [x, z, gr] of cells) {
  const outs = outsOf(x, z);
  const edge = outs.length > 0;
  const corner = outs.length >= 2;
  const face = outs.find((o) => o.k === "n") || outs[0];
  const front = outs.some((o) => o.k === "n");
  const along = face ? (face.k === "n" || face.k === "s" ? x : z) : 0;
  const paneProps = face && (face.k === "n" || face.k === "s")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  // Storeys: y 1..26.
  for (let y = gr + 1; y <= ROOF_Y; y++) {
    const rel = (y - 1) % 5;
    const k = Math.floor((y - 1) / 5);

    if (!edge) {
      if (rel === 0) put(x, y, z, "white_concrete");           // floor slab
      else if (rel === 2 && glow.has(`${x},${z},${y}`)) put(x, y, z, "glowstone");
      continue;
    }

    if (y === 1) { put(x, y, z, "granite"); continue; }        // plinth
    if (rel === 0) { put(x, y, z, "smooth_quartz"); continue; } // string course
    if (rel === 4) { put(x, y, z, "white_concrete"); continue; } // lintel / cornice

    // Entrance on the street face, ground floor.
    if (front && k === 0 && Math.abs(x - cx) <= 1) {
      if (x === cx && y <= 3) {
        const half = y === 2 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", {
          facing: "north", half, hinge: "left", open: "false", powered: "false",
        });
      } else if (x === cx && y === 4) {
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      } else {
        put(x, y, z, "glass");
      }
      continue;
    }

    // Piers at corners and every third cell along the wall.
    if (corner || along % 3 === 0) { put(x, y, z, "white_concrete"); continue; }

    // Shopfront glazing on the ground floor of the street face.
    if (front && k === 0) { put(x, y, z, "glass"); continue; }

    // Tinted window panes in the storey bands.
    put(x, y, z, "light_blue_stained_glass_pane", paneProps);
  }

  // Parapet and roof plant.
  if (edge) {
    put(x, ROOF_Y + 1, z, "smooth_quartz");
    put(x, PARAPET_TOP, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  } else if (((x * 7 + z * 3) % 11) === 0) {
    put(x, ROOF_Y + 1, z, "light_gray_concrete");
    put(x, ROOF_Y + 2, z, "light_gray_concrete");
    put(x, ROOF_Y + 3, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
