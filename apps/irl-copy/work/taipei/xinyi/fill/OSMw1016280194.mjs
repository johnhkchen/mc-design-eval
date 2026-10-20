import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise 1980s-90s commercial/residential block: four storeys of pale tiled
// concrete, stone plinth, dark-glass bays with quartz sills, a quartz cornice,
// a dark-oak entrance on the south (street) face and a rooftop water tank.
// Ground per cell is the third number of each [x, z, ground] entry.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280194";
const W = 23, H = 33, D = 21;
const STOREYS = 4;
const STOREY_H = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const GLASS = "light_blue_stained_glass";
const gk = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, gr]) => [gk(x, z), Math.round(gr)]));
const inF = (x, z) => ground.has(gk(x, z));
const gOf = (x, z) => ground.get(gk(x, z));

// Outward faces: n = -z, s = +z (street side), w = -x, e = +x
const FACES = [
  { n: "n", dx: 0, dz: -1 },
  { n: "s", dx: 0, dz: 1 },
  { n: "w", dx: -1, dz: 0 },
  { n: "e", dx: 1, dz: 0 },
];
const exts = (x, z) => FACES.filter((f) => !inF(x + f.dx, z + f.dz));

// Along-face coordinate: x for north/south faces, z for east/west faces
const alongOf = (f, x, z) => (f.dz !== 0 ? x : z);

// Bay ranges per face, so piers fall on the face's ends and every third column
const ranges = {};
for (const f of FACES) {
  const ts = cells
    .filter(([x, z]) => exts(x, z).includes(f))
    .map(([x, z]) => alongOf(f, x, z));
  if (ts.length) ranges[f.n] = { min: Math.min(...ts), max: Math.max(...ts) };
}
const isPier = (f, x, z) => {
  const r = ranges[f.n];
  const t = alongOf(f, x, z);
  return t === r.min || t === r.max || (t - r.min) % 3 === 0;
};

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Entrance: middle of the south face
const door = (() => {
  const xs = cells.filter(([x, z]) => !inF(x, z + 1)).map(([x]) => x).sort((a, b) => a - b);
  if (!xs.length) return null;
  const x = xs[Math.floor(xs.length / 2)];
  const zs = cells.filter(([cx, cz]) => cx === x && !inF(x, cz + 1)).map(([, cz]) => cz);
  return { x, z: Math.max(...zs) };
})();

for (const [x, z, gr] of cells) {
  const b = Math.round(gr);

  // Foundation under the cell
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  // Solid core up to the deck at b+20
  for (let y = b; y <= b + 20; y++) put(x, y, z, "white_concrete");

  const ex = exts(x, z);

  // Interior: floor slabs per storey and the deck
  if (!ex.length) {
    for (let k = 0; k <= STOREYS; k++) put(x, b + k * STOREY_H, z, "light_gray_concrete");
    continue;
  }

  // Perimeter: plinth, storey lines and spandrels
  put(x, b, z, "stone_bricks");
  for (let k = 0; k < STOREYS; k++) {
    const s = b + k * STOREY_H;
    if (k > 0) put(x, s, z, "light_gray_concrete");
    put(x, s + 4, z, "light_gray_concrete");
  }

  const isDoorCell = door && x === door.x && z === door.z;
  const piers = ex.some((f) => isPier(f, x, z));
  const f0 = ex[0];
  const ix = x - f0.dx;
  const iz = z - f0.dz;
  const inside = inF(ix, iz);

  if (isDoorCell) {
    const doorProps = { facing: "north", hinge: "left", open: "false", powered: "false" };
    put(x, b + 1, z, "dark_oak_door", { ...doorProps, half: "lower" });
    put(x, b + 2, z, "dark_oak_door", { ...doorProps, half: "upper" });
    put(x, b + 3, z, "dark_oak_planks");
    put(x, b + 4, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
    if (inside) {
      put(ix, b + 1, iz, "air");
      put(ix, b + 2, iz, "air");
    }
  } else if (door && ex.some((f) => f.n === "s") && Math.abs(x - door.x) <= 1) {
    // Entrance fascia flanking the door
    put(x, b + 3, z, "dark_oak_planks");
    put(x, b + 4, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  } else if (!piers) {
    // Window bays: sill, two glass rows, air gap behind, occasional warm light
    for (let k = 0; k < STOREYS; k++) {
      const s = b + k * STOREY_H;
      put(x, s + 1, z, "smooth_quartz");
      put(x, s + 2, z, GLASS);
      put(x, s + 3, z, GLASS);
      if (inside) {
        put(ix, s + 2, iz, "air");
        put(ix, s + 3, iz, "air");
        const h = (x * 5 + z * 3 + k * 7) % 5;
        if (h === 0) put(ix, s + 2, iz, "glowstone");
        else if (h === 2) put(ix, s + 2, iz, "shroomlight");
      }
    }
  }

  // Cornice and parapet
  put(x, b + 20, z, "smooth_quartz");
  put(x, b + 21, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// Rooftop water tank on a 3x3 patch of interior roof nearest the centroid
{
  const mx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
  const mz = cells.reduce((s, c) => s + c[1], 0) / cells.length;
  const dist = ([x, z]) => (x - mx) ** 2 + (z - mz) ** 2;
  let tank = null;
  for (const [x, z] of [...cells].sort((p, q) => dist(p) - dist(q))) {
    const b = gOf(x, z);
    let ok = true;
    for (let i = -1; i <= 1 && ok; i++) {
      for (let j = -1; j <= 1 && ok; j++) {
        const tx = x + i, tz = z + j;
        if (gOf(tx, tz) !== b) ok = false;
        else if (![[1, 0], [-1, 0], [0, 1], [0, -1]].every(([ox, oz]) => inF(tx + ox, tz + oz))) ok = false;
      }
    }
    if (ok) { tank = { x, z, b }; break; }
  }
  if (tank) {
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const tx = tank.x + i, tz = tank.z + j;
        if (i !== 0 || j !== 0) {
          for (let y = tank.b + 21; y <= tank.b + 23; y++) put(tx, y, tz, "iron_block");
        }
        put(tx, tank.b + 24, tz, "smooth_stone");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
