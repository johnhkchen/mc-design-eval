// Pavilion, signs and murals: the Aquarium entrance pavilion (modern glass, polished-deepslate base, flat roof and
// parapet), its canopy, doors, SEATTLE AQUARIUM sign, blue wave arch, the shed's sea-life murals, the promenade and
// bay-end rails, and the lamp posts. Air-only writes: an earlier part's block is kept, never overwritten.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import {
  PAVILION, SHED, LOW_DOCK, PLANTERS, SEAL_POOL, TIDE_POOL, groundAt, onFootprint,
  curtainWall, canopy, doorPair, waveArch, aquariumSign, fishMural, lampPost, lanternRow,
  POLISHED_DEEPSLATE, SMOOTH_STONE, SMOOTH_STONE_SLAB, IRON_BARS, SPRUCE_FENCE, WHITE_CONCRETE,
} from "../vocab.mjs";

const P = PAVILION;
// bannerWord letters the SEATTLE AQUARIUM sign with blue_wall_banner cells (no banner in palette.json): each letter
// cell becomes white_concrete, the closest palette block, so the sign keeps its white-on-black read
const BANNER_TO_PALETTE = { blue_wall_banner: WHITE_CONCRETE };
const inPavilion = (x, z) => x >= P.x0 && x <= P.x1 && z >= P.z0 && z <= P.z1;
const inShed = (x, z) => { const d = x - z, s = x + z; return d >= SHED.dLo && d <= SHED.dHi && s >= SHED.sLo && s <= SHED.sHi; };
const inDock = (x, z) => x >= LOW_DOCK.x0 && x <= LOW_DOCK.x1 && z >= LOW_DOCK.z0 && z <= LOW_DOCK.z1;
const inBox = (b, x, z) => x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1;
const inPool = (x, z) => [SEAL_POOL.rim, TIDE_POOL.rim].some((r) => inBox(r, x, z))
  || PLANTERS.some(([px, pz]) => x >= px - 1 && x <= px + 3 && z >= pz - 1 && z <= pz + 3);

// place only into air; a cell an earlier part owns is kept (counted in the return value as skipped)
function put(g, x, y, z, block, state) {
  if (!g.isAir(x, y, z)) return 0;
  g.set(x, y, z, block, state);
  return 1;
}

// rail (fence or bars) on a list of [x, y, z] cells, joined to its neighbours in the same list
function railCells(g, cells, block, y) {
  const key = (x, z) => `${x},${z}`;
  const set = new Set(cells.map(([x, z]) => key(x, z)));
  for (const [x, z] of cells) {
    const st = {
      north: set.has(key(x, z - 1)) ? "true" : "false",
      south: set.has(key(x, z + 1)) ? "true" : "false",
      east: set.has(key(x + 1, z)) ? "true" : "false",
      west: set.has(key(x - 1, z)) ? "true" : "false",
      waterlogged: "false",
    };
    put(g, x, y, z, block, st);
  }
}

// the pavilion's ring cells (the outer perimeter of its box)
function ring(x0, z0, x1, z1) {
  const out = [];
  for (let x = x0; x <= x1; x++) { out.push([x, z0]); out.push([x, z1]); }
  for (let z = z0 + 1; z < z1; z++) { out.push([x0, z]); out.push([x1, z]); }
  return out;
}

export function build(g) {
  // 1. the things that sit in the east wall's plane come first, so the curtain wall leaves them clear
  // base and lobby floor: polished deepslate plinth at y4 under the whole box
  for (let x = P.x0; x <= P.x1; x++) for (let z = P.z0; z <= P.z1; z++) put(g, x, 4, z, POLISHED_DEEPSLATE);

  // the SEATTLE AQUARIUM board (x117, y13..15, z133..149) and the arch mosaic (x117, z145..150, y5..12)
  // the sign is drawn through a view whose set() swaps each banner for its palette block as it is written
  const signTarget = new Proxy(g, {
    get(target, prop) {
      if (prop === "set") return (x, y, z, block, state, nbt) => {
        const id = BANNER_TO_PALETTE[String(block).replace("minecraft:", "")];
        return id ? target.set(x, y, z, id) : target.set(x, y, z, block, state, nbt);
      };
      const v = Reflect.get(target, prop);
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
  aquariumSign(signTarget, P.x1, 13, 141);
  waveArch(g, P.x1, 145, 150, 5, 12);

  // two double doors on the east face, z137..140, y5..6
  doorPair(g, [P.x1, 5, 137], "east");
  doorPair(g, [P.x1, 5, 139], "east");

  // slab ramp from the plaza deck (y3) up to the lobby threshold: half a step at x118..119, z136..141
  for (let x = P.x1 + 1; x <= P.x1 + 2; x++) for (let z = 136; z <= 141; z++)
    if (onFootprint(x, z)) put(g, x, 4, z, SMOOTH_STONE_SLAB, { type: "bottom", waterlogged: "false" });

  // canopy over the doors, 2 proud
  canopy(g, "east", { plane: P.x1, from: 137, to: 140 }, 12, { depth: 2 });

  // 2. the curtain wall on all four faces, y5..16 (air-only: the sign, arch, doors and canopy stay)
  curtainWall(g, P.x1, P.z0, P.z1, 5, 16, { face: "east" });
  curtainWall(g, P.x0, P.z0, P.z1, 5, 16, { face: "west" });
  curtainWall(g, P.z0, P.x0, P.x1, 5, 16, { face: "north" });
  curtainWall(g, P.z1, P.x0, P.x1, 5, 16, { face: "south" });

  // 3. the flat roof at y17 and the parapet ring at y18, with iron bars on it at y19
  for (let x = P.x0; x <= P.x1; x++) for (let z = P.z0; z <= P.z1; z++) put(g, x, P.roofY, z, SMOOTH_STONE);
  const parapet = ring(P.x0, P.z0, P.x1, P.z1);
  for (const [x, z] of parapet) put(g, x, P.parapetY, z, POLISHED_DEEPSLATE);
  railCells(g, parapet, IRON_BARS, P.parapetY + 1);

  // 4. the lobby's lanterns, hung from the roof
  lanternRow(g, [[104, 16, 136], [110, 16, 136], [104, 16, 146], [110, 16, 146]]);

  // 5. the shed's sea-life murals, flush in its east wall at s140..155 and s196..211, y5..9
  fishMural(g, "east", 140, 155, 5, 9);
  fishMural(g, "east", 196, 211, 5, 9);

  // 6. promenade and bay-end rails: spruce fence at y4 on every outer footprint edge, not on the shed, the pavilion,
  //    the low dock (its deck is y2) or the plaza (land: no rail). Lamp posts stand first, every 8 cells.
  const edge = [];
  for (let x = 0; x < 120; x++) for (let z = 0; z < 172; z++) {
    if (!onFootprint(x, z)) continue;
    const s = x + z;
    if (s >= 244) continue; // entrance plaza
    if (inShed(x, z) || inPavilion(x, z) || inDock(x, z) || inPool(x, z)) continue;
    const outside = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !onFootprint(x + dx, z + dz));
    if (outside) edge.push([x, z]);
  }
  const lamps = edge.filter(([x, z]) => (x + z) % 16 === 0);
  for (const [x, z] of lamps) if (g.isAir(x, 4, z) && g.isAir(x, 5, z) && g.isAir(x, 6, z) && g.isAir(x, 7, z)) lampPost(g, x, 4, z);
  const railed = edge.filter(([x, z]) => !lamps.some(([lx, lz]) => lx === x && lz === z));
  railCells(g, railed.map(([x, z]) => [x, z]), SPRUCE_FENCE, 4);

  // lamp posts on the entrance plaza
  for (let x = 110; x <= 119; x += 1) for (let z = 120; z <= 160; z += 1) {
    if ((x % 8 !== 3) || (z % 8 !== 4)) continue;
    if (!onFootprint(x, z) || x + z < 244 || inPavilion(x, z)) continue;
    if (g.isAir(x, 4, z) && g.isAir(x, 5, z) && g.isAir(x, 6, z) && g.isAir(x, 7, z)) lampPost(g, x, 4, z);
  }
}
