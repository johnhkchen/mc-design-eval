import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542681372";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 12, H = 23, D = 7;
const vox = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
};

// footprint lookup: key "x,z" -> ground
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const isPerim = (x, z) => !(has(x, z - 1) && has(x, z + 1) && has(x - 1, z) && has(x + 1, z));

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

// exterior faces, along-facade position, pillar/window classification
function info(x, z) {
  const f = { N: !has(x, z - 1), S: !has(x, z + 1), W: !has(x - 1, z), E: !has(x + 1, z) };
  const ds = Object.keys(f).filter((k) => f[k]);
  const n = ds.length;
  const dir = n === 1 ? ds[0] : null;
  const ns = dir === "N" || dir === "S";
  const u = dir ? (ns ? x - minX : z - minZ) : 0;
  const span = dir ? (ns ? maxX - minX : maxZ - minZ) : 0;
  const pillar = n >= 2 || u % 3 === 0 || u === span;
  return { n, dir, ns, u, span, pillar };
}

// entrance: the street-side (north, z=0) window bay nearest the middle
let doorKey = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    const i = info(x, z);
    if (i.n === 1 && i.dir === "N" && !i.pillar) {
      const d = Math.abs(i.u - i.span / 2);
      if (d < best) { best = d; doorKey = `${x},${z}`; }
    }
  }
}

const FACING = { N: "north", S: "south", W: "west", E: "east" };
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

const paneProps = (ns) => ns
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  // foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  // floor slab at ground level
  put(x, gr, z, "smooth_stone");

  const i = info(x, z);

  // interior cell: slabs per storey, roof deck, rooftop equipment
  if (i.n === 0) {
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 9, z, "smooth_stone");
    if (x % 5 === 2 && z === 3) put(x, gr + 10, z, "iron_block");
    continue;
  }

  const key = `${x},${z}`;
  const isDoor = key === doorKey;
  const ns = i.ns;

  // base course
  put(x, gr, z, "stone_bricks");

  // ground storey: shopfront glass, fascia, door and lanterns
  for (let y = gr + 1; y <= gr + 3; y++) {
    if (i.pillar) {
      put(x, y, z, "light_gray_concrete");
    } else if (isDoor && y <= gr + 2) {
      const props = { facing: FACING[i.dir], half: y === gr + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
      put(x, y, z, "dark_oak_door", props);
    } else if (y === gr + 3) {
      if (i.dir === "N" && i.u % 3 === 2 && !isDoor) {
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      } else {
        put(x, y, z, "smooth_quartz");
      }
    } else {
      put(x, y, z, "glass_pane", paneProps(ns));
    }
  }

  // canopy over the street entrance, pillars run through
  if (i.pillar) put(x, gr + 4, z, "light_gray_concrete");
  else if (i.dir === "N") put(x, gr + 4, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  else put(x, gr + 4, z, "smooth_quartz");

  // storey line
  put(x, gr + 5, z, "light_gray_concrete");

  // upper storey: tinted glass in frames
  for (let y = gr + 6; y <= gr + 8; y++) {
    if (i.pillar) put(x, y, z, "light_gray_concrete");
    else put(x, y, z, "light_blue_stained_glass_pane", paneProps(ns));
  }

  // warm light behind some upper windows
  if (!i.pillar && i.dir && i.u % 6 === 1) {
    const [ix, iz] = INWARD[i.dir];
    const xi = x + ix, zi = z + iz;
    if (has(xi, zi) && !isPerim(xi, zi)) put(xi, gr + 7, zi, "glowstone");
  }

  // cornice and parapet with coping
  put(x, gr + 9, z, "light_gray_concrete");
  put(x, gr + 10, z, i.pillar ? "smooth_stone" : "smooth_quartz");
}

vox.save(`${DIR}/${ID}.nbt`);
