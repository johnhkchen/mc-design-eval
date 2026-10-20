import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538121669";
const W = 17, H = 23, D = 25;
const ROOF = 11;     // roof deck layer; lidar says roof ~11 above lowest ground
const PARAPET = 12;  // parapet course on the perimeter

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) {
    ground.set(`${x},${z}`, Math.max(0, Math.min(ROOF - 2, Math.floor(gr))));
  }
}
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

const FACES = [
  ["north", 0, -1],
  ["south", 0, 1],
  ["west", -1, 0],
  ["east", 1, 0],
];
const exposedOf = (x, z) => FACES.filter(([, dx, dz]) => !has(x + dx, z + dz));
const isPerim = (x, z) => exposedOf(x, z).length > 0;

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Pane connection states: panes on an E-W wall connect east/west, N-S wall connect north/south.
const paneFor = (face) =>
  face === "north" || face === "south"
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Entrance: exposed north-facing cell nearest the middle of the footprint.
let entryKey = null;
{
  const northCells = [];
  for (const [key] of ground) {
    const [x, z] = key.split(",").map(Number);
    if (!has(x, z - 1)) northCells.push([x, z]);
  }
  if (northCells.length) {
    const xs = [...ground.keys()].map((k) => Number(k.split(",")[0]));
    const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
    northCells.sort((a, b) => Math.abs(a[0] - midX) - Math.abs(b[0] - midX));
    entryKey = `${northCells[0][0]},${northCells[0][1]}`;
  }
}

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const exposed = exposedOf(x, z);
  const perim = exposed.length > 0;
  const corner = exposed.length >= 2;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab / base course.
  put(x, gr, z, perim ? "stone_bricks" : "smooth_stone");

  // Floor 2 slab (storey line) at gr+5.
  if (gr + 5 <= ROOF - 1) put(x, gr + 5, z, perim ? "light_gray_concrete" : "smooth_stone");

  // Roof deck across the whole footprint.
  put(x, ROOF, z, "light_gray_concrete");

  // Interior structural columns on a grid, standing on the ground floor and carrying the slabs.
  if (!perim && x % 4 === 2 && z % 4 === 2) {
    for (let y = gr + 1; y <= ROOF - 1; y++) put(x, y, z, "stone_bricks");
  }

  if (perim) {
    // Parapet on the roof edge.
    put(x, PARAPET, z, "light_gray_concrete");

    for (let y = gr + 1; y <= ROOF - 1; y++) {
      const rel = y - gr;
      if (y === gr + 5) continue; // storey band already placed

      let block;
      let pane = null;
      if (corner) {
        block = "white_concrete";
      } else {
        const [face] = exposed[0];
        const idx = face === "north" || face === "south" ? x : z;
        if (rel >= 1 && rel <= 3) {
          // Shopfront: glazing between stone piers.
          if (idx % 3 === 0) block = "stone_bricks";
          else { block = "light_blue_stained_glass_pane"; pane = face; }
        } else if (rel >= 6 && rel <= 9) {
          // Upper storey: window grid with white concrete piers.
          if (idx % 3 === 0) block = "white_concrete";
          else { block = "light_blue_stained_glass_pane"; pane = face; }
        } else {
          block = "white_concrete";
        }
      }
      if (pane) put(x, y, z, block, paneFor(pane));
      else put(x, y, z, block);
    }

    // Warm lights behind some glass, inside the air gap.
    if (!corner) {
      const [face, dx, dz] = exposed[0];
      const idx = face === "north" || face === "south" ? x : z;
      const ix = x - dx, iz = z - dz;
      if (has(ix, iz) && !isPerim(ix, iz)) {
        if (idx % 6 === 1) put(ix, gr + 7, iz, "glowstone");
        if (idx % 6 === 2) put(ix, gr + 2, iz, "glowstone");
      }
    }
  } else {
    // Roof equipment on interior roof cells.
    if (x % 5 === 2 && z % 5 === 2) {
      put(x, ROOF + 1, z, "gray_concrete");
      put(x, ROOF + 2, z, "gray_concrete");
    }
  }

  // Entrance door, canopy light and lantern on the street-facing wall.
  if (key === entryKey) {
    put(x, gr + 1, z, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
