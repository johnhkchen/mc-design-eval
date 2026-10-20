import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Tower in a mid-2000s to 2010s Taipei office style: a three-storey podium, two
// setbacks, a flat roof at about 107 blocks, and a light stone-grey precast
// frame with glass curtain-wall bays. Storey lines fall every 5 blocks.

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw588109958.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw588109958.nbt";
const W = 47, H = 119, D = 64;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const groundOf = new Map();
let minG = Infinity;
for (const row of cells) {
  const [x, z, gr] = row;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  groundOf.set(key(x, z), gr);
  if (gr < minG) minG = gr;
}
if (!Number.isFinite(minG)) minG = 0;

const has = (x, z) => groundOf.has(key(x, z));
const gnd = (x, z) => groundOf.get(key(x, z));

const DIRS = [
  { name: "N", dx: 0, dz: -1 },
  { name: "S", dx: 0, dz: 1 },
  { name: "W", dx: -1, dz: 0 },
  { name: "E", dx: 1, dz: 0 },
];

// Edge distance from the footprint outline (edge cells = 1).
const edist = new Map();
const queue = [];
for (const k of groundOf.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (DIRS.some((d) => !has(x + d.dx, z + d.dz))) {
    edist.set(k, 1);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = edist.get(key(x, z));
  for (const dd of DIRS) {
    const nx = x + dd.dx, nz = z + dd.dz;
    const nk = key(nx, nz);
    if (has(nx, nz) && !edist.has(nk)) {
      edist.set(nk, d + 1);
      queue.push([nx, nz]);
    }
  }
}

// Roof about 107 blocks above the lowest ground; setback levels nest inside each other.
const ROOF = Math.min(minG + 107, 110);
const LV = {
  podium: ROOF - 93, // 3 storeys
  mid: ROOF - 48,
  upper: ROOF - 18,
  roof: ROOF,
};

const capMap = new Map();
for (const [x, z, gr] of cells) {
  if (!has(x, z)) continue;
  const e = edist.get(key(x, z)) ?? 1;
  let cap;
  if (e <= 2) cap = LV.podium;
  else if (e <= 7) cap = LV.mid;
  else if (e <= 11) cap = LV.upper;
  else cap = LV.roof;
  capMap.set(key(x, z), Math.min(H - 1, Math.max(cap, gr + 4)));
}

// Faces exposed at height y: outside the footprint, or the neighbour stops below y.
function faces(x, z, y) {
  const out = [];
  for (const d of DIRS) {
    const nx = x + d.dx, nz = z + d.dz;
    if (!has(nx, nz)) out.push(d);
    else if (capMap.get(key(nx, nz)) < y) out.push(d);
  }
  return out;
}

const paneProps = (d) =>
  d.name === "N" || d.name === "S"
    ? { east: "true", west: "true", north: "false", south: "false" }
    : { north: "true", south: "true", east: "false", west: "false" };

// Centre of the roof tier, for the crown and spire.
let rx = 0, rz = 0, rn = 0;
for (const [x, z] of [...groundOf.keys()].map((k) => k.split(",").map(Number))) {
  if (capMap.get(key(x, z)) === ROOF) { rx += x; rz += z; rn++; }
}
const cx = rn ? Math.round(rx / rn) : Math.floor(W / 2);
const cz = rn ? Math.round(rz / rn) : Math.floor(D / 2);

for (const [x, z] of [...groundOf.keys()].map((k) => k.split(",").map(Number))) {
  const gr = gnd(x, z);
  const cap = capMap.get(key(x, z));

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  for (let y = gr; y <= cap; y++) {
    const F = faces(x, z, y);

    if (F.length === 0) {
      // Interior: floor slab per storey, roof membrane on top, otherwise air.
      if (y === cap) g.set(x, y, z, "light_gray_concrete");
      else if (y === gr || y % 5 === 0) g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    const f = F[0];
    const along = f.name === "N" || f.name === "S" ? x : z;
    const pillar = along % 4 === 0;
    const shop = y < gr + 5;

    if (shop) {
      if (f.name === "N" && x === 23 && y <= gr + 1) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "north",
          half: y === gr ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (f.name === "N" && y === gr + 4 && x >= 21 && x <= 25) {
        g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      } else if (y === gr) {
        g.set(x, y, z, "polished_granite");
      } else if (y === gr + 4) {
        g.set(x, y, z, "white_concrete");
      } else if (pillar) {
        g.set(x, y, z, "polished_andesite");
      } else {
        g.set(x, y, z, "glass");
      }
      continue;
    }

    if (y % 5 === 0 || pillar) {
      g.set(x, y, z, "white_concrete");
      continue;
    }

    g.set(x, y, z, "light_blue_stained_glass_pane", paneProps(f));

    // Warm light just inside some windows, only where the room behind is open air.
    if ((along + y) % 9 === 0 && y < cap) {
      const ix = x - f.dx, iz = z - f.dz;
      if (has(ix, iz) && capMap.get(key(ix, iz)) > y && faces(ix, iz, y).length === 0) {
        g.set(ix, y, iz, "glowstone");
      }
    }
  }

  // Parapet on exposed roof and terrace edges.
  if (cap + 1 < H && faces(x, z, cap + 1).length > 0) {
    g.set(x, cap + 1, z, "white_concrete");
  }
}

// Crown on the roof tier: a stepped block and a lightning-rod spire.
for (const [x, z] of [...groundOf.keys()].map((k) => k.split(",").map(Number))) {
  if (capMap.get(key(x, z)) !== ROOF) continue;
  const d = Math.max(Math.abs(x - cx), Math.abs(z - cz));
  if (d <= 3) {
    g.set(x, ROOF + 1, z, "white_concrete");
    g.set(x, ROOF + 2, z, "white_concrete");
  }
  if (d <= 1) {
    g.set(x, ROOF + 3, z, "light_gray_concrete");
    g.set(x, ROOF + 4, z, "light_gray_concrete");
  }
}
if (has(cx, cz)) {
  for (let y = ROOF + 5; y <= 116; y++) g.set(cx, y, cz, "iron_bars");
  g.set(cx, 117, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(OUT);
