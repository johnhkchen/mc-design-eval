import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075543";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 16, D = 9;
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const minX = Math.min(...cells.map(c => c[0])), maxX = Math.max(...cells.map(c => c[0]));
const minZ = Math.min(...cells.map(c => c[1])), maxZ = Math.max(...cells.map(c => c[1]));
const cx = Math.floor((minX + maxX) / 2), cz = Math.floor((minZ + maxZ) / 2);

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p === undefined) g.set(x, y, z, b);
  else g.set(x, y, z, b, p);
};

// outward faces: north = street side (z min)
const FACES = [
  { n: "north", dx: 0, dz: -1, axis: "x" },
  { n: "south", dx: 0, dz: 1, axis: "x" },
  { n: "west", dx: -1, dz: 0, axis: "z" },
  { n: "east", dx: 1, dz: 0, axis: "z" },
];
const outFaces = (x, z) => FACES.filter(f => !has(x + f.dx, z + f.dz));
const faceT = (f, x, z) =>
  f.axis === "x"
    ? { t: x - minX, len: maxX - minX + 1 }
    : { t: z - minZ, len: maxZ - minZ + 1 };
const isWindow = (t, len) => t > 0 && t < len - 1 && t % 3 === 1;

for (const [x, z, gr] of cells) {
  // foundation up to ground, floor surface at ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
  put(x, gr, z, "smooth_stone");

  const out = outFaces(x, z);

  // interior cells: floor, roof deck, optional hanging lantern and roof plant
  if (out.length === 0) {
    put(x, gr + 4, z, "light_gray_concrete");
    if (x === cx && z === cz) put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    // small roof plant unit (interior, on the deck)
    if ((x === cx - 3 || x === cx - 2) && z === cz) put(x, gr + 5, z, "iron_block");
    continue;
  }

  // cornice / parapet on the perimeter
  put(x, gr + 4, z, "quartz_slab", { type: "bottom", waterlogged: "false" });

  // ground storey: shopfront on north face, base course elsewhere
  const northF = out.find(f => f.n === "north");
  let doorHere = false;
  if (northF) {
    const { t, len } = faceT(northF, x, z);
    doorHere = t === Math.floor(len / 2);
    if (doorHere) {
      put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    } else if (t > 0 && t < len - 1) {
      put(x, gr + 1, z, "glass_pane");
    } else {
      put(x, gr + 1, z, "stone_bricks");
    }
  } else {
    put(x, gr + 1, z, "stone_bricks");
  }

  // upper wall band with window grid (storey level gr+2 and gr+3)
  let winFace = null, winT = -1;
  for (const f of out) {
    const { t, len } = faceT(f, x, z);
    if (isWindow(t, len)) { winFace = f; winT = t; break; }
  }
  if (!doorHere) {
    for (const y of [gr + 2, gr + 3]) {
      put(x, y, z, winFace ? "glass_pane" : "white_concrete");
    }
  }

  // warm light behind some windows (inside air cell next to the glass)
  if (winFace && winT % 6 === 1) {
    const ix = x - winFace.dx, iz = z - winFace.dz;
    if (has(ix, iz) && outFaces(ix, iz).length === 0) {
      put(ix, gr + 2, iz, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
