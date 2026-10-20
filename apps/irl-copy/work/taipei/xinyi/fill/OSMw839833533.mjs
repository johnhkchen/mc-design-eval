import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record has no tags. Read as a 1990s Xinyi-district commercial block: two storeys
// (about 5 blocks each) on a foundation, pale tiled/concrete facade, dark fascia,
// glass shopfront at grade, a single entrance, and a rooftop plant box.
// Roof cap sits at y=10, so the top is 11 blocks above the lowest ground, matching the lidar.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833533";
const W = 23, H = 23, D = 24;
const ROOF = 10;          // roof cap course
const TOP_ROOF_DECK = ROOF; // interior roof deck sits at the same level as the cap

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const fp = new Map();
for (const [x, z, gr] of raw) {
  fp.set(`${x},${z}`, Math.min(8, Math.max(0, Math.round(gr))));
}
const inFp = (x, z) => fp.has(`${x},${z}`);
const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const OPP = { north: "south", south: "north", east: "west", west: "east" };
const exposed = (x, z) =>
  Object.keys(DIRS).filter((f) => {
    const [dx, dz] = DIRS[f];
    return !inFp(x + dx, z + dz);
  });

const cells = [...fp.entries()].map(([k, gr]) => {
  const [x, z] = k.split(",").map(Number);
  return { x, z, g: gr, key: k, faces: exposed(x, z) };
});
const cx = cells.reduce((s, c) => s + c.x, 0) / cells.length;
const cz = cells.reduce((s, c) => s + c.z, 0) / cells.length;

// Entrance: a single-face edge cell on the south (or failing that north/east/west) side, nearest centre.
const pref = { south: 0, north: 1, east: 2, west: 3 };
const entCands = cells.filter((c) => c.faces.length === 1);
entCands.sort((a, b) => {
  const pa = pref[a.faces[0]], pb = pref[b.faces[0]];
  if (pa !== pb) return pa - pb;
  return Math.abs(a.x - cx) - Math.abs(b.x - cx);
});
const entCell = entCands[0] ?? null;
const entKey = entCell?.key ?? null;
const entFace = entCell?.faces[0] ?? null;

// Pick the rooftop plant location: interior cell nearest centre with a 3x3 footprint clear.
const interiorCells = cells.filter((c) => c.faces.length === 0);
const plantCandidates = interiorCells.filter((c) => {
  for (let dx = -2; dx <= 2; dx++)
    for (let dz = -2; dz <= 2; dz++)
      if (!inFp(c.x + dx, c.z + dz)) return false;
  return true;
});
plantCandidates.sort(
  (a, b) => Math.hypot(a.x - cx, a.z - cz) - Math.hypot(b.x - cx, b.z - cz)
);
const plant = plantCandidates[0] ?? null;

const g3 = new Voxels([W, H, D]);
const put = (x, y, z, name, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g3.set(x, y, z, name, props);
  else g3.set(x, y, z, name);
};

// Facade logic for one exposed wall cell at height y.
function wallBlock(c, y) {
  const face = c.faces[0];
  const corner = c.faces.length > 1;
  const isNS = face === "north" || face === "south";
  const u = isNS ? c.x : c.z;
  const pier = corner || u % 3 === 0;
  const isEnt = c.key === entKey;
  const isEntFace = isEnt && face === entFace;

  // Ground storey (above the base course up to the fascia at y=4)
  if (y <= 4) {
    if (isEntFace) {
      if (y === c.g + 1 || y === c.g + 2) {
        const half = y === c.g + 1 ? "lower" : "upper";
        return { name: "dark_oak_door", props: { facing: OPP[face], half, hinge: "left", open: "false", powered: "false" } };
      }
      if (y === 4) return { name: "gray_concrete" };
      return { name: "glass" };
    }
    if (pier) return { name: "white_concrete" };
    if (y === 4) return { name: "gray_concrete" };
    return { name: "glass" };
  }

  // Storey line, upper storey, frieze
  if (y === 5) return { name: "light_gray_concrete" };
  if (y === 6) return { name: "white_concrete" };
  if (y === 9) return { name: "light_gray_concrete" };
  // y = 7, 8: upper-storey windows between piers
  if (pier) return { name: "white_concrete" };
  const conn = isNS
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  return { name: "glass_pane", props: conn };
}

// 1. Foundation, base course and floor slab per cell
for (const c of cells) {
  for (let y = 0; y < c.g; y++) put(c.x, y, c.z, "stone_bricks");
  put(c.x, c.g, c.z, c.faces.length ? "polished_andesite" : "smooth_stone");
}

// 2. Walls, interior air gaps, storey floor slab, roof
for (const c of cells) {
  const edge = c.faces.length > 0;
  for (let y = c.g + 1; y < ROOF; y++) {
    if (edge) {
      const b = wallBlock(c, y);
      put(c.x, y, c.z, b.name, b.props);
    } else if (y === 5) {
      put(c.x, y, c.z, "smooth_stone"); // storey-2 floor slab
    }
    // else air gap
  }
  // Roof level
  if (edge) put(c.x, ROOF, c.z, "smooth_stone");
  else put(c.x, TOP_ROOF_DECK, c.z, "light_gray_concrete");
}

// 3. Warm lights behind some upper-storey glass (interior cell just inside the pane)
for (const c of cells) {
  if (c.faces.length === 0) continue;
  const face = c.faces[0];
  if (c.faces.length > 1) continue;
  const [dx, dz] = DIRS[face];
  const ix = c.x - dx, iz = c.z - dz;
  if (!inFp(ix, iz)) continue;
  if (exposed(ix, iz).length) continue;
  const u = face === "north" || face === "south" ? c.x : c.z;
  if (u % 3 === 0) continue;
  if ((c.x * 5 + c.z * 3 + u) % 7 === 0) {
    put(ix, 7, iz, "glowstone");
  }
}

// 4. Rooftop plant: 3x3 box on the roof and a small AC unit beside it
if (plant) {
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++) {
      const x = plant.x + dx, z = plant.z + dz;
      put(x, ROOF + 1, z, "white_concrete");
      put(x, ROOF + 2, z, dx === 0 && dz === 0 ? "light_gray_concrete" : "white_concrete");
    }
  const acX = plant.x + 2, acZ = plant.z;
  if (inFp(acX, acZ)) put(acX, ROOF + 1, acZ, "iron_block");
}

g3.save(`${DIR}/${ID}.nbt`);
