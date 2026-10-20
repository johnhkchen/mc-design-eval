import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538461859";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 23, D = 16;
const g = new Voxels([W, H, D]);

// Layout (absolute y, ground per column = gr):
//   0..gr-1  stone foundation
//   gr       floor / base course
//   gr+1..gr+3  ground-floor shopfront glass, gr+4 transom
//   5        storey belt (ground-to-upper floor slab)
//   6..8     upper-floor window band
//   9        cornice / roof deck
//   10       parapet (roof reads 11 blocks above lowest ground)

const cellMap = new Map();
for (const [x, z, gr] of cells) cellMap.set(`${x},${z}`, gr);
const has = (x, z) => cellMap.has(`${x},${z}`);

const ROOF = 9;      // roof deck / cornice top
const PARAPET = 10;  // top block of building

for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;

  // Foundation from y=0 up to this column's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const fN = !has(x, z - 1);
  const fS = !has(x, z + 1);
  const fW = !has(x - 1, z);
  const fE = !has(x + 1, z);
  const edge = fN || fS || fW || fE;

  if (!edge) {
    // Interior: floor slabs and roof deck only, air between (no interiors).
    g.set(x, gr, z, "smooth_stone");
    if (gr < 5) g.set(x, 5, z, "smooth_stone");
    g.set(x, ROOF, z, "gray_concrete");

    // Warm lamps just behind the window bands (light behind glass).
    const nearRing = x === 1 || x === W - 2 || z === 1 || z === D - 2;
    if (nearRing && (x + z) % 4 === 0) {
      g.set(x, gr + 2, z, "glowstone");
      g.set(x, 7, z, "glowstone");
    }

    // Roof plant: two AC boxes on the deck.
    if ((x === 5 || x === 6) && z === 5) g.set(x, ROOF + 1, z, "iron_block");
    continue;
  }

  // Edge cell: solid wall column from ground to the cornice.
  g.set(x, gr, z, "polished_granite");               // base course
  for (let y = gr + 1; y <= ROOF; y++) g.set(x, y, z, "quartz_block");
  if (gr < 5) g.set(x, 5, z, "smooth_quartz");       // storey belt
  g.set(x, ROOF, z, "smooth_quartz");                // cornice
  g.set(x, PARAPET, z, "quartz_block");              // parapet

  // Along-face index and face orientation.
  const onNS = fN || fS;
  const a = onNS ? x : z;
  const isPier = a % 3 === 0;

  // Entrance on the north face.
  const isDoor = fN && x === 10;
  if (isDoor) {
    g.set(x, gr + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    continue;
  }

  // Glass panes with connection states matching the wall they sit in.
  const paneProps = onNS
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

  if (!isPier) {
    // Ground-floor shopfront glass.
    for (let y = gr + 1; y <= gr + 3; y++) g.set(x, y, z, "glass_pane", paneProps);
    // Upper-floor window band.
    for (let y = 6; y <= 8; y++) g.set(x, y, z, "glass_pane", paneProps);
  }
}

g.save(`${DIR}/${ID}.nbt`);
