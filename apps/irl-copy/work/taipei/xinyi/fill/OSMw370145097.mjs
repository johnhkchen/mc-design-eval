import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Footprint 30 x 55, roof about 69 blocks above the lowest ground.
// A 2000s Xinyi-district office tower: 13 storeys of 5 blocks, a four-tier
// setback from storey 9, blue-tinted glass in white-concrete spandrels and
// mullions, a street-level shopfront with a centre entrance, a solid interior
// core so the massing reads as mass rather than a hollow shell, and a crown
// with a mast.
const W = 30, H = 81, D = 55;
const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw370145097.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw370145097.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inFp = (x, z) => ground.has(`${x},${z}`);
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Distance from the outside edge of the footprint (1 = perimeter cell).
const dist = new Map();
const queue = [];
for (const [x, z] of cells) {
  if (NB.some(([dx, dz]) => !inFp(x + dx, z + dz))) {
    dist.set(`${x},${z}`, 1);
    queue.push([x, z]);
  }
}
for (let qi = 0; qi < queue.length; qi++) {
  const [x, z] = queue[qi];
  const d = dist.get(`${x},${z}`);
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    const k = `${nx},${nz}`;
    if (inFp(nx, nz) && !dist.has(k)) {
      dist.set(k, d + 1);
      queue.push([nx, nz]);
    }
  }
}
const distOf = (x, z) => (inFp(x, z) ? (dist.get(`${x},${z}`) ?? 99) : 0);
const outwardOf = (x, z, inset) => NB.filter(([dx, dz]) => distOf(x + dx, z + dz) < inset);

const L0 = Math.min(...cells.map(c => c[2]));
const CX = Math.floor(W / 2);
const CZ = Math.floor(D / 2);
const LEVELS = 13;

// Storeys 0..12 are 5 high (setback to inset 4 from storey 9); the crown is 4 high.
function info(i) {
  if (i < LEVELS) return { base: L0 + 5 * i, h: 5, inset: i < 9 ? 1 : 4 };
  return { base: L0 + 65, h: 4, inset: 7 };
}
function levelAt(y) {
  const r = y - L0;
  if (r < 0) return -1;
  if (r < 65) return Math.floor(r / 5);
  if (r < 69) return 13;
  return -1;
}

const lit = new Set(); // positions reserved for warm light, kept out of the core
const key3 = (x, y, z) => `${x},${y},${z}`;

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const paneProps = (outward) => {
  const alongX = outward.some(([, dz]) => dz !== 0); // wall runs along x
  return {
    north: alongX ? "false" : "true",
    south: alongX ? "false" : "true",
    east: alongX ? "true" : "false",
    west: alongX ? "true" : "false",
    waterlogged: "false",
  };
};

// Pass 1: foundations, storeys, setbacks, roofs, facades.
for (const [x, z, g0] of cells) {
  const d = distOf(x, z);
  const s = g0 > L0 ? L0 + 5 * Math.ceil((g0 - L0) / 5) : g0;

  for (let y = 0; y <= Math.min(H - 1, L0 + 70); y++) {
    if (y < g0) { put(x, y, z, "stone_bricks"); continue; }
    if (y < s) { put(x, y, z, "stone_bricks"); continue; }

    if (y === L0 + 69) {
      if (d >= 7) put(x, y, z, "light_gray_concrete");
      continue;
    }
    if (y === L0 + 70) {
      if (d === 7 && outwardOf(x, z, 7).length) put(x, y, z, "white_concrete");
      continue;
    }

    const i = levelAt(y);
    if (i < 0) continue;
    const L = info(i);
    const off = y - L.base;
    const inside = d >= L.inset;

    if (!inside) {
      // Roof of the tier below, with equipment and a parapet on its edge.
      if (i > 0 && off === 0 && d >= info(i - 1).inset) {
        put(x, y, z, "light_gray_concrete");
        if (x % 6 === 3 && z % 6 === 3 && d !== info(i - 1).inset) {
          put(x, y + 1, z, "iron_block");
        }
      } else if (i > 0 && off === 1 && d === info(i - 1).inset) {
        put(x, y, z, "white_concrete");
      }
      continue;
    }

    const outward = outwardOf(x, z, L.inset);
    const facade = d === L.inset && outward.length > 0;

    if (off === 0) {
      if (facade) put(x, y, z, i === 0 ? "polished_andesite" : "white_concrete");
      else put(x, y, z, "light_gray_concrete");
      continue;
    }

    if (off >= 1 && off <= 4 && !facade) {
      // Interior: air close to the facade (room for warm light), solid core further in.
      if (off <= 4 && d >= 4 && d > L.inset + 1 && off <= 4 && !lit.has(key3(x, y, z)) && off !== 0) {
        if (off <= 3) put(x, y, z, "light_gray_concrete");
        else put(x, y, z, "light_gray_concrete");
      }
      continue;
    }

    if (!facade) continue;

    const front = outward.some(([dx, dz]) => dx === 0 && dz === -1);
    const dxC = x - CX;

    if (off >= 1 && off <= 3) {
      // Centre entrance on the front (low-z) face, ground storey only.
      if (i === 0 && front && Math.abs(dxC) <= 3) {
        if (Math.abs(dxC) <= 1) {
          put(x, y, z, "glass");                          // glass doors
        } else if (Math.abs(dxC) === 2) {
          if (off === 3) put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
          else put(x, y, z, "white_concrete");            // door frame
        } else {
          put(x, y, z, "glass");                          // shopfront either side
        }
        continue;
      }
      const corner = outward.length > 1;
      const alongX = outward.some(([, dz]) => dz !== 0);
      const coord = alongX ? x : z;
      if (corner || coord % 3 === 0) {
        put(x, y, z, "white_concrete");                  // mullion
      } else if (i === 0) {
        put(x, y, z, "glass");
      } else {
        // Bays of three alternate between two glass tints for rhythm.
        const bayTint = Math.floor(coord / 3) % 2 === 1 ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane";
        put(x, y, z, bayTint, paneProps(outward));
        if (off === 2 && ((x * 7 + z * 3 + i * 5) % 7 === 0)) {
          const [ox, oz] = outward[0];
          const ix = x - ox, iz = z - oz;
          if (inFp(ix, iz) && distOf(ix, iz) > L.inset) {
            lit.add(key3(ix, y, iz));
            put(ix, y, iz, "shroomlight");
          }
        }
      }
      continue;
    }

    if (off === 4) {
      if (i === 0 && front && Math.abs(dxC) <= 3) put(x, y, z, "smooth_quartz"); // entrance canopy
      else put(x, y, z, "white_concrete");                                     // spandrel
    }
  }
}

// Pass 2: mast on the crown, at the crown cell nearest the centre.
let best = null;
for (const [x, z] of cells) {
  if (distOf(x, z) < 7) continue;
  const dd = Math.hypot(x - CX, z - CZ);
  if (!best || dd < best.dd) best = { x, z, dd };
}
if (best) {
  put(best.x, L0 + 70, best.z, "iron_block");
  for (let y = L0 + 71; y <= Math.min(H - 1, L0 + 76); y++) {
    put(best.x, y, best.z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(OUT);
