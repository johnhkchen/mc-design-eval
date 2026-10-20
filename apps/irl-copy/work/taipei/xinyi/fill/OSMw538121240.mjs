import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538121240";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 28, H = 23, D = 19;
const g = new Voxels([W, H, D]);

const ROOF_Y = 11;   // roof sits about 11 blocks above lowest ground
const FLOOR_Y = 5;   // storey line between the two storeys
const CORNICE_Y = 10;
const SHOP_TOP = 3;  // ground-floor glazing ends here
const AWNING_Y = 4;

const dirs = [
  { dx: 1, dz: 0, name: "east" },
  { dx: -1, dz: 0, name: "west" },
  { dx: 0, dz: 1, name: "south" },
  { dx: 0, dz: -1, name: "north" },
];

const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.min(gr, 8)));
const has = (x, z) => ground.has(`${x},${z}`);

// Edge cells: any side with no neighbour in the footprint.
const outsFor = (x, z) => dirs.filter((d) => !has(x + d.dx, z + d.dz));
const edgeSet = new Set();
for (const [x, z] of cells) if (outsFor(x, z).length) edgeSet.add(`${x},${z}`);

// Pick the south (front) face and its middle cell as the entrance.
const southFace = cells
  .filter(([x, z]) => outsFor(x, z).some((d) => d.name === "south"))
  .map(([x, z]) => [x, z])
  .sort((a, b) => a[0] - b[0]);
const doorCell = southFace.length ? southFace[Math.floor(southFace.length / 2)] : null;
const doorKey = doorCell ? `${doorCell[0]},${doorCell[1]}` : null;

function facade(x, z, gr, d, isDoor) {
  const t = d.dx !== 0 ? z : x;   // position along the face
  const bay = ((t % 3) + 3) % 3;  // 0 = pillar, 1 and 2 = glazing
  const pillar = bay === 0;

  // Ground floor: shopfront glazing with a dark awning band above it.
  for (let y = gr + 1; y <= SHOP_TOP; y++) {
    if (isDoor && (y === gr + 1 || y === gr + 2)) continue;
    if (pillar) put(x, y, z, "light_gray_concrete");
    else put(x, y, z, "glass_pane");
  }
  if (isDoor) {
    put(x, gr + 1, z, "oak_door", { facing: d.name, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "oak_door", { facing: d.name, half: "upper", hinge: "left", open: "false", powered: "false" });
  }
  put(x, AWNING_Y, z, pillar ? "light_gray_concrete" : "black_concrete");

  // Upper storey: window grid with mullions, storey bands handled in the cell loop.
  for (let y = 6; y <= 9; y++) {
    if (pillar) put(x, y, z, "light_gray_concrete");
    else put(x, y, z, "glass_pane");
  }

  // Warm light behind some upper windows, on the interior side of the glass.
  if (bay === 2 && t % 6 === 2) {
    const ix = x - d.dx, iz = z - d.dz;
    if (has(ix, iz) && !edgeSet.has(`${ix},${iz}`)) put(ix, 7, iz, "glowstone");
  }
}

for (const [x, z] of cells) {
  const gr = ground.get(`${x},${z}`);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const outs = outsFor(x, z);
  const edge = outs.length > 0;

  if (!edge) {
    // Interior: floor slab at the storey line and roof deck, air otherwise.
    if (gr <= FLOOR_Y) put(x, FLOOR_Y, z, "smooth_quartz");
    put(x, ROOF_Y, z, "light_gray_concrete");
    // Rooftop plant room block in the centre of the roof.
    if (x >= 8 && x <= 15 && z >= 6 && z <= 11) {
      put(x, ROOF_Y + 1, z, "smooth_stone");
    }
    continue;
  }

  // Perimeter: a one-block wall from ground to roof, white tiled concrete.
  for (let y = gr; y <= ROOF_Y; y++) put(x, y, z, "white_concrete");

  // Base course, storey line, cornice and parapet cap.
  put(x, gr, z, "stone_bricks");
  put(x, FLOOR_Y, z, "light_gray_concrete");
  put(x, CORNICE_Y, z, "light_gray_concrete");
  put(x, ROOF_Y, z, "light_gray_concrete");

  for (const d of outs) {
    facade(x, z, gr, d, d.name === "south" && doorKey === `${x},${z}`);
  }
}

g.save(`${DIR}/${ID}.nbt`);
