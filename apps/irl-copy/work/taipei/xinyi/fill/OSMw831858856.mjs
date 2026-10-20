import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw831858856";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 32 x 14 footprint, roof about 11 blocks above lowest ground.
// Read as a two-storey 1980s-90s Xinyi commercial block: quartz-tiled facade,
// smooth stone cornices and lintels, shopfront glass with aluminium (iron) door,
// red awning on the street face, parapet and rooftop plant.
const W = 32, H = 23, D = 14;
const g = new Voxels([W, H, D]);

const TOP = 10;     // top layer of the parapet (roof reads as 11 above lowest ground)
const CORNICE = 5;  // storey line
const LINTEL = 9;   // top of upper storey windows

const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.min(Math.round(gr), 4)));
}
const has = (x, z) => ground.has(`${x},${z}`);
const faceOf = (x, z) => ({
  N: !has(x, z - 1),
  S: !has(x, z + 1),
  W: !has(x - 1, z),
  E: !has(x + 1, z),
});
const isPerim = (x, z) => { const f = faceOf(x, z); return f.N || f.S || f.W || f.E; };

// Pick the entrance: street (south) face cell nearest the middle of the frontage.
const southCells = [];
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (faceOf(x, z).S) southCells.push([x, z]);
}
let door = null;
if (southCells.length) {
  const xs = southCells.map(c => c[0]).sort((a, b) => a - b);
  const mid = xs[Math.floor(xs.length / 2)];
  southCells.sort((a, b) => Math.abs(a[0] - mid) - Math.abs(b[0] - mid));
  door = southCells[0];
}

const paneAlong = (axis) => axis === "xz"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: solid body, storeys and facade on every footprint cell.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const f = faceOf(x, z);
  const perim = isPerim(x, z);

  // foundation up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!perim) {
    // interior: floor slabs per storey, roof deck, no interior fit-out
    g.set(x, gr, z, "smooth_stone");
    g.set(x, CORNICE, z, "smooth_stone");
    g.set(x, TOP, z, "gray_concrete");
    if (x % 7 === 3 && z % 5 === 2) g.set(x, TOP + 1, z, "iron_block"); // rooftop plant
    continue;
  }

  const corner = (f.N + f.S + f.W + f.E) >= 2;
  // street-facing wall axis, and along-wall index for mullion rhythm
  const onNS = f.N || f.S;
  const idx = onNS ? x : z;
  const isDoor = door && door[0] === x && door[1] === z && f.S;

  for (let y = gr; y <= TOP; y++) {
    let id = "quartz_block";
    let st = null;

    if (y === gr) {
      id = "polished_andesite"; // base course
    } else if (y === TOP) {
      id = corner ? "quartz_pillar" : "smooth_quartz"; // parapet
      if (corner) st = { axis: "y" };
    } else if (y === LINTEL || y === CORNICE) {
      id = "smooth_stone"; // storey line / lintel band
    } else if (y <= 4) {
      // ground-floor shopfront band
      if (isDoor && (y === gr + 1 || y === gr + 2)) {
        id = "iron_door";
        st = { facing: "south", half: y === gr + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
      } else if (y === gr + 3 && f.S && !corner) {
        id = "red_concrete"; // awning on street face
      } else if ((y === gr + 1 || y === gr + 2) && !corner) {
        if (idx % 4 === 0) { id = "quartz_pillar"; st = { axis: "y" }; }
        else { id = "light_blue_stained_glass_pane"; st = paneAlong(onNS ? "xz" : "zx"); }
      } else if (corner && (y === gr + 1 || y === gr + 2)) {
        id = "quartz_pillar"; st = { axis: "y" };
      }
    } else if (y >= 6 && y <= 8) {
      // upper storey windows with quartz mullions
      if (corner || idx % 3 === 0) { id = "quartz_pillar"; st = { axis: "y" }; }
      else { id = "light_blue_stained_glass_pane"; st = paneAlong(onNS ? "xz" : "zx"); }
    }

    if (corner && id === "quartz_block") { id = "quartz_pillar"; st = { axis: "y" }; }
    g.set(x, y, z, id, st ?? undefined);
  }
}

// Pass 2: warm light behind some upper-storey windows (in the air gap, interior cells only).
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  const f = faceOf(x, z);
  if (!isPerim(x, z) || (f.N + f.S + f.W + f.E) >= 2) continue;
  const idx = (f.N || f.S) ? x : z;
  if (idx % 6 !== 1) continue;
  let ix = x, iz = z;
  if (f.N) iz = z + 1; else if (f.S) iz = z - 1; else if (f.W) ix = x + 1; else if (f.E) ix = x - 1;
  if (has(ix, iz) && !isPerim(ix, iz)) g.set(ix, 7, iz, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
