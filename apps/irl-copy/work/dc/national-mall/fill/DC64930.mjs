import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC64930";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 51, H = 32, D = 27;
const g = new Voxels([W, H, D]);

// Palette: 1980s-90s Washington office block: pale precast wall, granite base
// and cornice, recessed tinted glazing with spandrel bands.
const WALL = "smooth_quartz";
const SPANDREL = "light_gray_concrete";
const BASE = "polished_granite";
const GLASS = "light_blue_stained_glass_pane";
const INTERIOR = "light_gray_concrete";
const PLANT = "smooth_quartz";
const PLANT_TRIM = "polished_granite";

const inB = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const S = (x, y, z, id, props) => { if (inB(x, y, z)) g.set(x, y, z, id, props); };

const map = new Map();
for (const [x, z, gr, r] of cells) {
  const ground = Math.max(0, Math.round(gr));
  const roof = Math.min(H - 2, Math.round(r));
  map.set(`${x},${z}`, { gr: ground, r: roof });
}
const has = (x, z) => map.has(`${x},${z}`);
const get = (x, z) => map.get(`${x},${z}`);

// Outward directions: [dx, dz, along-axis, name]
const FACES = [
  [-1, 0, "z", "W"],
  [1, 0, "z", "E"],
  [0, -1, "x", "N"],
  [0, 1, "x", "S"],
];

const exposed = (x, z) => FACES.filter(([dx, dz]) => !has(x + dx, z + dz));

// Pass 1: foundation, body, cornice, parapet, interior fill
for (const [k, { gr, r }] of map) {
  const [x, z] = k.split(",").map(Number);
  if (r <= gr) continue;
  const perim = exposed(x, z).length > 0;

  for (let y = 0; y < r; y++) {
    let id;
    if (y < gr) id = BASE;
    else if (y < gr + 1) id = perim ? BASE : INTERIOR;
    else if (y === r - 1) id = perim ? BASE : INTERIOR;
    else id = perim ? WALL : INTERIOR;
    S(x, y, z, id);
  }
  if (perim) S(x, r, z, PLANT);
}

// Pick the entrance: exposed north-face cell closest to the building's middle
const mid = Math.floor(W / 2);
let entrance = null;
for (const [k] of map) {
  const [x, z] = k.split(",").map(Number);
  if (!exposed(x, z).some(([dx, dz]) => dz === -1)) continue;
  if (!entrance || Math.abs(x - mid) < Math.abs(entrance.x - mid)) entrance = { x, z };
}

// Pass 2: facade articulation. Windows are recessed one block behind the wall
// face so the pilasters stand proud; spandrels stay flush.
for (const [k, { gr, r }] of map) {
  const [x, z] = k.split(",").map(Number);
  if (r <= gr) continue;

  for (const [dx, dz, axis] of exposed(x, z)) {
    const t = axis === "z" ? z : x;
    const ix = x - dx, iz = z - dz; // inward neighbour
    const pilaster = t % 3 === 0;
    const isEntrance = entrance && entrance.x === x && entrance.z === z && dz === -1;

    // Ground storefront (rel 1..2), with the entrance bay
    if (isEntrance) {
      // Door opening, flanked by glass; stone surround on the pilasters
      S(x, gr + 1, z, "air");
      S(x, gr + 2, z, "air");
      S(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      S(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      S(ix, gr + 1, iz, "air");
      S(ix, gr + 2, iz, "air");
      // Canopy-like lintel band above the door, inside the wall line
      S(x, gr + 3, z, PLANT_TRIM);
      continue;
    }

    for (let y = gr + 1; y < r - 1; y++) {
      const rel = y - gr;
      const isSpandrel = rel % 3 === 0;
      if (pilaster) {
        S(x, y, z, isSpandrel ? PLANT_TRIM : WALL);
      } else if (isSpandrel) {
        S(x, y, z, SPANDREL);
      } else {
        // Recessed glazing: outer block becomes air, glass set one block inside
        S(x, y, z, "air");
        S(ix, y, iz, GLASS);
      }
    }

    // Ground-floor base course stays solid above the granite line
    S(x, gr + 1, z, pilaster ? PLANT_TRIM : (isEntrance ? "air" : S_base(x, z)));
  }
}

function S_base(x, z) {
  return BASE;
}

// Pass 3: a few warm lights standing on the floor slab behind the glazing
for (const [k, { gr, r }] of map) {
  const [x, z] = k.split(",").map(Number);
  if (r <= gr + 4) continue;
  for (const [dx, dz, axis] of exposed(x, z)) {
    const t = axis === "z" ? z : x;
    const ix = x - dx, iz = z - dz;
    if (t % 3 === 1 && (t + gr) % 4 === 0) {
      for (let rel = 4; rel < r - gr - 1; rel += 3) {
        const y = gr + rel;
        if (inB(ix, y, iz) && has(ix, iz)) S(ix, y, iz, "shroomlight");
      }
    }
  }
}

// Pass 4: rooftop plant clustered in a few penthouse boxes, not scattered
for (const [k, { r }] of map) {
  const [x, z] = k.split(",").map(Number);
  if (exposed(x, z).length) continue;
  if (x % 11 === 5 && z % 9 === 4) {
    const cluster = [[0, 0], [1, 0], [0, 1], [1, 1]];
    const ok = cluster.every(([a, b]) => {
      const c = get(x + a, z + b);
      return c && c.r === r && exposed(x + a, z + b).length === 0;
    });
    if (ok) {
      for (const [a, b] of cluster) S(x + a, r, z + b, INTERIOR);
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
