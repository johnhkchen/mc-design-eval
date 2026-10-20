import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 蔡萬才癌症大樓 (TPE106-0038-7F), built 2017.
// 7-storey medical block: 2-storey glass-fronted podium with a moss terrace
// on its roof, setback tower of white precast-look concrete and light-blue
// glass, a widened glass vestibule with a lintel on the street (north) face,
// light piers for relief, flat roof with a plant box and a lightning rod.
// Warm shroomlights sit behind some windows.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE106-0038-7F";
const W = 60, H = 47, D = 49;
const ROOF_Y = 35;          // roof cap sits on top of storey 6
const PODIUM_TOP = 10;      // podium roof / tower base
const TOWER_INSET = 5;      // setback from the podium edge
const ENT_HALF = 2;         // vestibule half-width (cells either side of door)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const K = (x, z) => `${x},${z}`;

// footprint cell -> ground height under it
const G = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  G.set(K(x, z), Math.max(0, Math.round(gr)));
}
const F = new Set(G.keys());

// tower footprint: podium eroded by TOWER_INSET on every side
const T = new Set();
for (const k of F) {
  const [x, z] = k.split(",").map(Number);
  let ok = true;
  for (let dx = -TOWER_INSET; dx <= TOWER_INSET && ok; dx++)
    for (let dz = -TOWER_INSET; dz <= TOWER_INSET && ok; dz++)
      if (!F.has(K(x + dx, z + dz))) ok = false;
  if (ok) T.add(k);
}

// perimeter: in the set, with at least one 4-neighbour outside it
const perim = (S, x, z) =>
  S.has(K(x, z)) &&
  (!S.has(K(x + 1, z)) || !S.has(K(x - 1, z)) || !S.has(K(x, z + 1)) || !S.has(K(x, z - 1)));

// bounding box of the tower (for roof plant)
let tx0 = Infinity, tx1 = -Infinity, tz0 = Infinity, tz1 = -Infinity;
for (const k of T) {
  const [x, z] = k.split(",").map(Number);
  tx0 = Math.min(tx0, x); tx1 = Math.max(tx1, x);
  tz0 = Math.min(tz0, z); tz1 = Math.max(tz1, z);
}
const tcx = Math.round((tx0 + tx1) / 2), tcz = Math.round((tz0 + tz1) / 2);

// street face: north edge (min z), door nearest to its mid x
let zmin = Infinity;
for (const k of F) zmin = Math.min(zmin, Number(k.split(",")[1]));
const northCells = [...F].map((k) => k.split(",").map(Number)).filter(([, z]) => z === zmin);
const midX = northCells.reduce((a, [x]) => a + x, 0) / northCells.length;
northCells.sort((a, b) => Math.abs(a[0] - midX) - Math.abs(b[0] - midX));
const [ex] = northCells[0];

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  const ground = gr;
  const isDoor = x === ex && z === zmin;
  const inVestibule = z === zmin && Math.abs(x - ex) <= ENT_HALF;

  for (let y = 0; y < ROOF_Y; y++) {
    // foundation: fill solid from the lowest ground up to this cell's ground
    if (y < ground) { put(x, y, z, "stone_bricks"); continue; }

    const S = y >= PODIUM_TOP ? T : F;

    // podium roof level outside the tower: terrace with a parapet at the edge
    if (y === PODIUM_TOP && !T.has(k)) {
      if (perim(F, x, z)) put(x, y, z, "white_concrete");
      else put(x, y, z, "moss_block");
      continue;
    }
    if (!S.has(k)) continue;

    // podium slab / ceiling over storey 1, solid across the whole podium
    if (y === 9) { put(x, y, z, "light_gray_concrete"); continue; }

    const s = Math.floor(y / 5);
    const yy = y - 5 * s;
    const pm = perim(S, x, z);

    if (!pm) {
      // interior: only a floor slab at each storey line (and at ground level)
      if (yy === 0 || y === ground) put(x, y, z, "light_gray_concrete");
      continue;
    }

    // ----- facade -----
    // base course at ground level (vestibule keeps a stone plinth too)
    if (y === ground || (s === 0 && yy === 0)) { put(x, y, z, "smooth_stone"); continue; }
    // spandrel at storey line
    if (yy === 0) { put(x, y, z, "white_concrete"); continue; }
    // header band under the storey line above; vestibule gets a white lintel
    if (yy === 4) {
      put(x, y, z, inVestibule ? "white_concrete" : "light_gray_concrete");
      continue;
    }

    // vestibule: wider glass entrance with the door at the centre
    if (inVestibule && s === 0) {
      if (isDoor && y === ground + 1) {
        put(x, y, z, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (isDoor && y === ground + 2) {
        put(x, y, z, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (Math.abs(x - ex) === ENT_HALF) { put(x, y, z, "white_concrete"); continue; }
      put(x, y, z, "light_blue_stained_glass_pane", {
        north: "false", south: "false", east: "true", west: "true", waterlogged: "false",
      });
      continue;
    }

    // light vertical piers every six blocks, otherwise mullions every three
    if ((x + z) % 6 === 0) { put(x, y, z, "light_gray_concrete"); continue; }
    if ((x + z) % 3 === 0) { put(x, y, z, "white_concrete"); continue; }

    const conn = (dx, dz) => S.has(K(x + dx, z + dz)) && perim(S, x + dx, z + dz);
    put(x, y, z, "light_blue_stained_glass_pane", {
      north: String(conn(0, -1)),
      south: String(conn(0, 1)),
      east: String(conn(1, 0)),
      west: String(conn(-1, 0)),
      waterlogged: "false",
    });

    // warm light just behind some windows (inward neighbour is interior air)
    if (yy === 2 && (x + z) % 9 === 4) {
      const inward = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([dx, dz]) =>
        S.has(K(x + dx, z + dz)) && !perim(S, x + dx, z + dz));
      if (inward) put(x + inward[0], y, z + inward[1], "shroomlight");
    }
  }
}

// roof: cornice and parapet on the tower edge, roof deck, plant box, lightning rod
for (const k of T) {
  const [x, z] = k.split(",").map(Number);
  const pm = perim(T, x, z);
  put(x, ROOF_Y, z, pm ? "white_concrete" : "light_gray_concrete");
  if (pm) put(x, ROOF_Y + 1, z, "white_concrete");

  const inPlant = !pm && Math.abs(x - tcx) <= 8 && Math.abs(z - tcz) <= 6;
  if (inPlant) {
    put(x, ROOF_Y + 1, z, "light_gray_concrete");
    put(x, ROOF_Y + 2, z, "light_gray_concrete");
    put(x, ROOF_Y + 3, z, "light_gray_concrete");
    put(x, ROOF_Y + 4, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}
put(tcx, ROOF_Y + 5, tcz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
put(tcx, ROOF_Y + 6, tcz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);
