import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540893370";
const W = 28, H = 23, D = 17;
const ROOF_TOP = 11; // roof about 11 blocks above lowest ground

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...raw.map((c) => c[2]));
const ground = new Map();
for (const [x, z, gr] of raw) ground.set(`${x},${z}`, gr - minG);

const has = (x, z) => ground.has(`${x},${z}`);
const DIRS = [
  { dx: 0, dz: -1, name: "north" },
  { dx: 0, dz: 1, name: "south" },
  { dx: -1, dz: 0, name: "west" },
  { dx: 1, dz: 0, name: "east" },
];
const exposed = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));

const g = new Voxels([W, H, D]);
const set = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};
const air = (x, y, z) => set(x, y, z, "air");

// Entrance: middle of the south-facing exposed cells
const southCells = raw
  .map(([x, z]) => [x, z])
  .filter(([x, z]) => exposed(x, z).some((d) => d.name === "south"))
  .sort((a, b) => a[0] - b[0]);
const entrance = southCells.length
  ? southCells[Math.floor(southCells.length / 2)]
  : null;

function paneProps(face) {
  // pane plane follows the facade it sits in
  return face.dz !== 0
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

function facadeCell(x, z, y, gr, face) {
  const along = face.dz !== 0 ? x : z;
  const isEnt = entrance && entrance[0] === x && entrance[1] === z && face.name === "south";

  // Entrance opening and hanging lantern
  if (isEnt && y >= gr + 1 && y <= 3) {
    if (y === 3) set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
    else air(x, y, z);
    return;
  }

  // Ground storey (shopfront)
  if (y <= 4) {
    if (y === gr && gr < 4) return set(x, y, z, "polished_granite");
    if (y === 4) return set(x, y, z, "light_gray_concrete");
    if (along % 3 === 0) return set(x, y, z, "white_concrete");
    return set(x, y, z, "light_blue_stained_glass_pane", paneProps(face));
  }

  // Storey line
  if (y === 5) return set(x, y, z, "smooth_stone");

  // Upper storey windows
  if (y <= 9) {
    if (along % 3 === 0) return set(x, y, z, "white_concrete");
    if (y === 6 || y === 9) return set(x, y, z, "white_concrete");
    set(x, y, z, "light_blue_stained_glass_pane", paneProps(face));
    // warm light behind some glass, only when the inner cell is interior
    if (y === 7 && along % 6 === 2) {
      const ix = x - face.dx, iz = z - face.dz;
      if (has(ix, iz) && exposed(ix, iz).length === 0) {
        set(ix, y, iz, "glowstone");
      }
    }
    return;
  }

  // Cornice and parapet
  if (y === 10) return set(x, y, z, "smooth_stone");
  if (y === ROOF_TOP) return set(x, y, z, "white_concrete");
}

// Main pass over footprint
for (const [x, z] of raw.map(([x, z]) => [x, z])) {
  const gr = ground.get(`${x},${z}`);

  // Foundation from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");

  const faces = exposed(x, z);
  if (faces.length > 0) {
    // Perimeter: walls from ground to the parapet
    const face = faces[0];
    for (let y = gr; y <= ROOF_TOP; y++) {
      if (y < 0) continue;
      facadeCell(x, z, y, gr, face);
    }
  } else {
    // Interior: floors and roof deck only, air between
    if (gr <= 0) set(x, 0, z, "polished_andesite");
    else set(x, gr, z, "polished_andesite");
    if (5 > gr) set(x, 5, z, "smooth_stone");
    if (10 >= gr) set(x, 10, z, "gray_concrete");
  }
}

// Rooftop mechanical plant, placed on interior roof cells only
for (let x = 7; x <= 10; x++) {
  for (let z = 5; z <= 8; z++) {
    if (!has(x, z) || exposed(x, z).length > 0) continue;
    set(x, ROOF_TOP, z, "light_gray_concrete");
    set(x, ROOF_TOP + 1, z, "light_gray_concrete");
  }
}
// Small vent mast on the plant
if (has(8, 6) && exposed(8, 6).length === 0) {
  set(8, ROOF_TOP + 2, 6, "iron_bars");
}

g.save(`${DIR}/${ID}.nbt`);
