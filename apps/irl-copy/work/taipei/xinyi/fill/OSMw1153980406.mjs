import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1153980406";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 22, H = 23, D = 16;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y (clamped so the 2-storey block + parapet fits in H)
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.min(11, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);

// Outward normals of exposed faces
const NORMALS = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];
const exposedFaces = (x, z) => NORMALS.filter(n => !has(x + n.dx, z + n.dz));
const isRing = (x, z) => exposedFaces(x, z).length > 0;

// Mean x of footprint, used to centre the entrance on a street face
let sumX = 0, cnt = 0;
for (const k of ground.keys()) { sumX += Number(k.split(",")[0]); cnt++; }
const meanX = cnt ? sumX / cnt : W / 2;

const GLASS = { north: "true", south: "true", east: "true", west: "true" };

// Pass 1: foundation, floor slabs, roof deck, walls
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const faces = exposedFaces(x, z);
  const ring = faces.length > 0;

  // Foundation from y=0 up to ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Storey 1 base at ground level
  g.set(x, gr + 0, z, ring ? "stone_bricks" : "smooth_stone");

  // Storey 1 interior air (y gr+1..gr+4) stays air for interior cells

  // Floor slab between storeys
  g.set(x, gr + 5, z, "smooth_stone");

  // Roof deck below parapet (ceiling of storey 2)
  g.set(x, gr + 10, z, ring ? "white_concrete" : "smooth_stone");

  if (!ring) {
    // Interior roof-top units on the flat roof
    if ((x * 3 + z * 5) % 11 === 0) g.set(x, gr + 11, z, "iron_block");
    continue;
  }

  // Facade: index along the primary exposed face
  const primary = faces[0];
  const idx = (primary.name === "north" || primary.name === "south") ? x : z;

  // Storey 1: shopfront with piers, awning band, lintel
  if (idx % 3 === 1) {
    g.set(x, gr + 1, z, "glass_pane", GLASS);
    g.set(x, gr + 2, z, "glass_pane", GLASS);
  } else {
    g.set(x, gr + 1, z, "white_concrete");
    g.set(x, gr + 2, z, "white_concrete");
  }
  g.set(x, gr + 3, z, "red_terracotta");   // awning band
  g.set(x, gr + 4, z, "white_concrete");   // lintel

  // Storey 2: window grid with piers
  for (let y = gr + 6; y <= gr + 8; y++) {
    if (idx % 3 === 1) g.set(x, y, z, "glass_pane", GLASS);
    else g.set(x, y, z, "white_concrete");
  }
  g.set(x, gr + 9, z, "smooth_stone");     // string course

  // Parapet with cornice
  g.set(x, gr + 10, z, "smooth_stone_slab", { type: "bottom" });
  g.set(x, gr + 11, z, "white_concrete");
}

// Pass 2: warm lights behind some storey-2 windows (in the interior cell just inside)
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const faces = exposedFaces(x, z);
  if (!faces.length) continue;
  const f = faces[0];
  const idx = (f.name === "north" || f.name === "south") ? x : z;
  if (idx % 3 !== 1 || idx % 6 !== 1) continue;
  const ix = x - f.dx, iz = z - f.dz;
  if (!has(ix, iz)) continue;
  if (isRing(ix, iz)) continue;
  g.set(ix, gr + 7, iz, "glowstone");
}

// Pass 3: entrance door on the south street face, nearest the centre
let best = null;
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (has(x, z + 1)) continue; // not on south face
  const d = Math.abs(x - meanX);
  if (!best || d < best.d) best = { x, z, gr, d };
}
if (best) {
  const { x, z, gr } = best;
  g.set(x, gr + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
