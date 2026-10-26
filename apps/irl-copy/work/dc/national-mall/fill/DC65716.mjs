// DC65716: 1309 9th St NW, Shaw. A 1910s-era brick flats block: a 2-storey podium with a 3-storey tower stepping
// in at the north-east, and a 1-storey wing on the west and south. The lidar roof is taken as three flat tiers (5, 7, 9),
// each a hollow shell: a brick envelope with a stone base course, storey bands and cornice, glass panes with brick
// piers, and air behind every pane. Floor slabs run across each storey and a roof slab caps each tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC65716.cells.json", "utf8"));

// Smooth the lidar roof into three flat tiers: wing 5, podium 7, tower 9 (roof 8 and 9 read as the tower).
const tierOf = (r) => (r <= 5 ? 5 : r <= 7 ? 7 : 9);
const foot = new Map();
for (const [x, z, ground, roof] of cells) foot.set(`${x},${z}`, { ground, H: tierOf(roof) });
const has = (x, z) => foot.has(`${x},${z}`);
const H = (x, z) => (has(x, z) ? foot.get(`${x},${z}`).H : 0);

const g = new Voxels([12, 21, 12]);

// Face directions; N is z-1, S is z+1 (the south face is the entrance side, the only one a door is set in).
const DIR = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, z, y, d) => {
  const [dx, dz] = DIR[d], nx = x + dx, nz = z + dz;
  if (!has(nx, nz)) return true;             // the open air beyond the footprint edge
  return y >= H(nx, nz);                      // or the neighbour's roof is lower than this height (a setback)
};
const exposedFaces = (x, z, y) => Object.keys(DIR).filter((d) => exposed(x, z, y, d));

// Storey bands: 0 plinth, 3 and 6 floor lines in brick, the top row is the roof (pale stone cornice). Windows sit in rows 1-2, 4-5 and 7.
const BAND = "smooth_stone", PLINTH = "stone_bricks", INTERIOR = "smooth_stone", WALL = "bricks", PANE = "glass_pane";
const DOOR = { x: 4, z: 11 };

// Lit windows: a hash of the position picks a few; hanging lanterns under a band, glowstone or shroomlight in the glass.
const lit = (x, y, z) => (x * 7 + z * 3 + y * 5) % 9 === 0;

for (const [key, { H: h }] of foot) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < h; y++) {
    const faces = exposedFaces(x, z, y);
    const perim = faces.length > 0;
    const roofRow = y === h - 1;
    const bandRow = y === 0 || y === 3 || roofRow || (y === 6 && h >= 7);
    const windowRow = !bandRow && [1, 2, 4, 5, 7].includes(y);

    // Floors, plinth and roof slabs run the full footprint; a shell cell on the outside carries the banded face.
    if (bandRow) {
      g.set(x, y, z, !perim ? INTERIOR : y === 0 ? PLINTH : roofRow ? BAND : WALL);
      // Entrance canopy: a dark lintel over the door
      if (x === DOOR.x && z === DOOR.z && y === 3) g.set(x, y, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
      if (x === DOOR.x - 1 && z === DOOR.z && y === 3) g.set(x, y, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
      continue;
    }
    if (!windowRow || !perim) continue;       // interior air, or a setback's shell is above the lower neighbour

    if (x === DOOR.x && z === DOOR.z && (y === 1 || y === 2)) {
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (x === DOOR.x - 1 && z === DOOR.z && y === 2) {
      g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }

    if (faces.length >= 2) { g.set(x, y, z, BAND); continue; }   // a corner: a stone quoin
    const d = faces[0];
    const p = d === "N" || d === "S" ? x : z;                     // position along the face
    if (p % 3 === 0) { g.set(x, y, z, WALL); continue; }          // brick pier between bays
    if (lit(x, y, z)) {
      if (y === 2 || y === 5) g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      else g.set(x, y, z, y === 1 ? "shroomlight" : "glowstone");
      continue;
    }
    const axis = d === "N" || d === "S"
      ? { north: "false", south: "false", east: "true", west: "true" }
      : { north: "true", south: "true", east: "false", west: "false" };
    g.set(x, y, z, PANE, { ...axis, waterlogged: "false" });
  }
}

// Roof plant on the podium and the tower roofs (light-grey boxes standing on the roof slab).
g.set(5, 7, 6, "light_gray_concrete");
g.set(6, 7, 6, "light_gray_concrete");
g.set(6, 9, 3, "light_gray_concrete");
g.set(7, 9, 3, "light_gray_concrete");

const r = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC65716.nbt");
console.log(JSON.stringify(r));
