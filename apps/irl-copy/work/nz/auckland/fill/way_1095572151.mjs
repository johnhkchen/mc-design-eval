// Way 1095572151, Mt Eden village: a single-storey brick shop with a shopfront on its street face, a fascia and a
// parapet. The lidar gives ground 0 and roof 6 across all 50 cells, so the envelope is 6 high: a 2-block shopfront,
// a lintel band with a striped awning over the door, a 1-block fascia, a flat roof membrane and a parapet.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572151.cells.json", "utf8"));
const g = new Voxels([9, 19, 10]);

const inside = new Set(cells.map(([x, z]) => `${x},${z}`));
const has = (x, z) => inside.has(`${x},${z}`);
const G = Math.min(...cells.map((c) => c[2]));
const R = Math.max(...cells.map((c) => c[3]));
if (cells.some((c) => c[2] !== G || c[3] !== R)) throw new Error("the cells are not one ground and one roof; the massing needs a tiered pass");

// Outward normals. North is -z, so the street face is the one with the most exposed cells.
const DIR = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const exposedFaces = (x, z) => Object.keys(DIR).filter((d) => !has(x + DIR[d][0], z + DIR[d][1]));
const count = Object.fromEntries(Object.keys(DIR).map((d) => [d, 0]));
for (const [x, z] of cells) for (const d of exposedFaces(x, z)) count[d]++;
const front = Object.keys(count).reduce((a, b) => (count[b] > count[a] ? b : a));
const along = (d, x, z) => (d === "north" || d === "south" ? x : z);     // coordinate running along a face
const inward = { north: "south", south: "north", west: "east", east: "west" };

// The street face's own exposed cells, sorted along it: the door sits in the middle of the run.
const frontRun = cells.filter(([x, z]) => exposedFaces(x, z).includes(front) && exposedFaces(x, z).length === 1)
  .sort((a, b) => along(front, a[0], a[1]) - along(front, b[0], b[1]));
const doorCell = frontRun.length >= 3 ? frontRun[Math.floor(frontRun.length / 2)] : null;

// Pane connections run along the wall: a window on a north/south face connects east and west, and the reverse.
const paneState = (d) => {
  const ew = d === "north" || d === "south";
  return { north: String(!ew), south: String(!ew), east: String(ew), west: String(ew) };
};

// 1. Plinth: a full base course of Auckland's volcanic stone under every cell.
for (const [x, z] of cells) g.set(x, 0, z, "polished_andesite");

// 2. Ground storey (y 1-2): brick piers, shopfront glass on the street face, a door, and lit windows.
for (const [x, z] of cells) {
  const faces = exposedFaces(x, z);
  if (!faces.length) continue;                                          // interior: air behind the glass
  const corner = faces.length > 1;
  for (const y of [1, 2]) {
    if (doorCell && x === doorCell[0] && z === doorCell[1]) {
      g.set(x, y, z, "oak_door", { facing: front, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const f = faces[0];
    if (corner || !f) { g.set(x, y, z, "bricks"); continue; }
    const c = along(f, x, z);
    const shopfront = f === front && !corner;
    const bay = c % 2 === 0;
    if (shopfront || bay) g.set(x, y, z, "glass_pane", paneState(f));
    else g.set(x, y, z, "bricks");
  }
}

// 3. Storey line and awning (y 3): the lintel band over the shopfront is a green-and-white striped awning, and
//    the rest of the band is stone. The floor slab over the interior sits in the same course.
for (const [x, z] of cells) {
  const faces = exposedFaces(x, z);
  if (!faces.length) { g.set(x, 3, z, "smooth_stone"); continue; }
  if (faces.length === 1 && faces[0] === front) {
    g.set(x, 3, z, along(front, x, z) % 2 === 0 ? "green_concrete" : "white_concrete");
  } else g.set(x, 3, z, "stone_bricks");
}

// 4. Fascia (y 4): a cornice of polished stone round the edge, a roof membrane over the interior.
for (const [x, z] of cells) g.set(x, 4, z, exposedFaces(x, z).length ? "polished_andesite" : "smooth_stone");

// 5. Parapet (y 5 up to the lidar roof): brick round the edge.
for (const [x, z] of cells) {
  if (exposedFaces(x, z).length) for (let y = 5; y < R; y++) g.set(x, y, z, "bricks");
}

// 6. Roof plant: two rooftop units on the interior roof, inside the parapet.
for (const [x, z] of cells.filter(([x, z]) => !exposedFaces(x, z).length).slice(0, 2)) g.set(x, 5, z, "iron_block");

// 7. Warm light behind the shopfront glass: a glowstone one step in, behind every pane on the street face.
if (doorCell) {
  for (const [x, z] of frontRun) {
    if (g.get(x, 1, z)?.block !== "minecraft:glass_pane") continue;       // the door and the piers have no pane
    const ix = x + DIR[inward[front]][0], iz = z + DIR[inward[front]][1];
    if (has(ix, iz) && !exposedFaces(ix, iz).length) g.set(ix, 1, iz, "glowstone");
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572151.nbt");
