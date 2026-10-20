import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE111-0249-24F";
const W = 40, H = 23, D = 55;

// Built 2022, two 5-block storeys on a white-concrete frame with blue-green glass,
// quartz cornice, a green roof and a light-grey roof deck with plant.
const ROOF_DECK = 10;   // top surface of the roof deck
const PARAPET = 11;     // single parapet course on the perimeter

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), gr);
const has = (x, z) => G.has(key(x, z));

const g = new Voxels([W, H, D]);
const set = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Classify cells and their outward normal.
const info = new Map();
for (const [x, z, gr] of cells) {
  const edge = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  const nx = !has(x - 1, z) ? -1 : !has(x + 1, z) ? 1 : 0;
  const nz = !has(x, z - 1) ? -1 : !has(x, z + 1) ? 1 : 0;
  const corner = nx !== 0 && nz !== 0;
  const along = nx !== 0 ? z : x;   // coordinate running along the facade
  info.set(key(x, z), { x, z, gr, edge, nx, nz, corner, along });
}

// Main straight facade gets the entrance.
const groups = { N: [], S: [], E: [], W: [] };
for (const c of info.values()) {
  if (!c.edge || c.corner) continue;
  if (c.nz === -1) groups.N.push(c);
  else if (c.nz === 1) groups.S.push(c);
  else if (c.nx === -1) groups.W.push(c);
  else if (c.nx === 1) groups.E.push(c);
}
let mainFacade = [];
for (const k of Object.keys(groups)) if (groups[k].length > mainFacade.length) mainFacade = groups[k];
const doorKeys = new Set();
const frameKeys = new Set();
if (mainFacade.length) {
  const sorted = [...mainFacade].sort((a, b) => a.along - b.along);
  const mid = sorted[Math.floor(sorted.length / 2)].along;
  for (const c of mainFacade) {
    const d = Math.abs(c.along - mid);
    if (d <= 1) doorKeys.add(key(c.x, c.z));
    else if (d === 2) frameKeys.add(key(c.x, c.z));
  }
}

// Pass 1: foundation, floor slabs, interior roof deck and green roof.
for (const c of info.values()) {
  const { x, z, gr } = c;
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");
  if (gr > ROOF_DECK) continue;
  set(x, gr, z, "smooth_stone");                 // ground-floor slab
  if (gr <= 5) set(x, 5, z, "smooth_stone");     // storey line slab
  if (!c.edge) {
    // green roof patches on the deck, the rest light-grey
    const green = (x % 7 >= 2 && x % 7 <= 4) && (z % 9 >= 3 && z % 9 <= 5);
    set(x, ROOF_DECK, z, green ? "moss_block" : "light_gray_concrete");
  }
}

// Pass 2: facade on the perimeter.
for (const c of info.values()) {
  if (!c.edge) continue;
  const { x, z, gr, along, corner } = c;
  if (gr > PARAPET) continue;
  const k = key(x, z);
  const isDoor = doorKeys.has(k);
  const isFrame = frameKeys.has(k);
  // Piers at corners and every fourth bay; glass in two-bay groups between.
  const isPier = corner || along % 4 === 0 || along % 4 === 3;

  for (let y = gr; y <= PARAPET; y++) {
    if (y === gr) {
      set(x, y, z, "polished_granite");                    // base course
    } else if (y <= 3) {
      // ground storey: shopfront or entrance
      if (isDoor) {
        // entrance: dark glass opening with a stone frame above
        set(x, y, z, y === 3 ? "smooth_quartz" : "black_stained_glass");
      } else if (isFrame) {
        set(x, y, z, "polished_granite");
      } else if (isPier) {
        set(x, y, z, "white_concrete");
      } else {
        set(x, y, z, "light_blue_stained_glass");
      }
    } else if (y === 4) {
      set(x, y, z, isDoor ? "glowstone" : "white_concrete"); // lintel, lit over the door
    } else if (y === 5) {
      set(x, y, z, "white_concrete");                      // storey line
    } else if (y === 6) {
      set(x, y, z, "light_gray_concrete");                 // spandrel
    } else if (y === 7 || y === 8) {
      set(x, y, z, isPier ? "white_concrete" : "light_blue_stained_glass");
    } else if (y === 9) {
      set(x, y, z, "white_concrete");                      // lintel
    } else if (y === 10) {
      set(x, y, z, "smooth_quartz");                       // cornice
    } else if (y === PARAPET) {
      set(x, y, z, "white_concrete");                      // parapet
    }
  }
}

// Pass 3: warm lights behind windows, and roof plant.
for (const c of info.values()) {
  if (c.edge || c.gr > ROOF_DECK) continue;
  const { x, z, gr } = c;
  const inward = [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]].find(([ax, az]) => {
    const e = info.get(key(ax, az));
    return e && e.edge && !e.corner;
  });
  if (inward) {
    const e = info.get(key(inward[0], inward[1]));
    if (!doorKeys.has(key(e.x, e.z)) && e.along % 8 === 2 && e.gr <= 4) {
      set(x, gr + 1, z, "glowstone");                      // ground storey, behind glass
    }
    if (!doorKeys.has(key(e.x, e.z)) && e.along % 8 === 5 && e.gr <= 5) {
      set(x, 6, z, "glowstone");                           // upper storey, behind glass
    }
  }
  // Roof plant units, sparse, on a 12-block grid away from the edge.
  if (gr <= ROOF_DECK && x % 12 === 6 && z % 12 === 6) {
    set(x, PARAPET, z, "iron_block");
  }
}

// Central mast on the roof.
{
  let sx = 0, sz = 0, n = 0;
  for (const c of info.values()) { sx += c.x; sz += c.z; n++; }
  const cx = Math.round(sx / n), cz = Math.round(sz / n);
  let best = null, bestD = Infinity;
  for (const c of info.values()) {
    if (c.edge || c.gr > ROOF_DECK) continue;
    const d = Math.abs(c.x - cx) + Math.abs(c.z - cz);
    if (d < bestD) { bestD = d; best = c; }
  }
  if (best) {
    for (let y = PARAPET; y <= PARAPET + 2; y++) set(best.x, y, best.z, "lightning_rod");
  }
}

g.save(`${DIR}/${ID}.nbt`);
