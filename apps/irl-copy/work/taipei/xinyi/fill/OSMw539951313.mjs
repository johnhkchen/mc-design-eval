import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539951313";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 14 x 19. Two-storey tiled commercial block, roof about 11 blocks up.
const W = 14, H = 23, D = 19;
const g = new Voxels([W, H, D]);

const TOP = 10;   // roof slab layer; parapet sits on 10..11
const MID = 6;    // upper floor line (spandrel course)

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Entrance: on the north edge (minimum z), at the mean x of that edge.
let minZ = Infinity;
for (const [, z] of cells) minZ = Math.min(minZ, z);
const frontXs = cells.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
const doorX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : -1;

for (const [x, z, rawGround] of cells) {
  const gr = Math.max(0, Math.min(Math.round(rawGround), H - 6));

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const perim = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  const corner = !has(x - 1, z) && !has(x, z - 1) || !has(x + 1, z) && !has(x, z - 1) ||
                 !has(x - 1, z) && !has(x, z + 1) || !has(x + 1, z) && !has(x, z + 1);
  const u = x + z;
  const mullion = corner || u % 3 === 0;
  const isFront = z === minZ;

  if (!perim) {
    // Interior: air behind glass, with a floor slab per storey and a roof slab.
    put(x, gr, z, "stone_bricks");
    if (MID >= gr) put(x, MID, z, "smooth_quartz");
    if (TOP > gr) put(x, TOP, z, "light_gray_concrete");
    continue;
  }

  // Perimeter: base course, walls, shopfront, windows, parapet.
  put(x, gr, z, "polished_andesite");

  for (let y = gr + 1; y <= TOP - 1; y++) {
    let id;
    if (y === MID) {
      id = "smooth_quartz";                       // floor line / spandrel
    } else if (y < MID) {
      // Ground storey: shopfront glass under a frame, with the entrance.
      const shopTop = Math.min(gr + 3, MID - 1);
      if (isFront && x === doorX && y <= gr + 2) {
        const half = y === gr + 1 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (y <= shopTop && !mullion) id = "light_blue_stained_glass_pane";
      else id = "dark_oak_planks";                 // shopfront frame
      if (y === Math.min(gr + 4, MID - 1) && isFront) id = "red_concrete"; // awning band
    } else {
      // Upper storey: 3-high window band between quartz mullions.
      if (mullion) id = "quartz_pillar";
      else if (y >= MID + 1 && y <= MID + 3) {
        id = "light_blue_stained_glass_pane";
        if (y === MID + 2 && (x * 7 + z * 13) % 5 === 0) id = "shroomlight"; // warm lit window
      } else id = "quartz_block";
    }
    put(x, y, z, id);
  }

  // Parapet and cornice on the perimeter.
  put(x, TOP, z, "smooth_quartz");
  put(x, TOP + 1, z, "smooth_quartz");
}

// Rooftop plant: a couple of mechanical boxes and a lightning rod on the interior roof.
const roofBoxes = [[3, 4], [4, 4], [3, 5]];
for (const [x, z] of roofBoxes) {
  if (has(x, z)) {
    put(x, TOP + 1, z, "gray_concrete");
    put(x, TOP + 2, z, "light_gray_concrete");
  }
}
const rodCell = cells.find(([x, z]) => x >= 6 && x <= 8 && z >= 8 && z <= 10);
if (rodCell) {
  put(rodCell[0], TOP + 1, rodCell[1], "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
