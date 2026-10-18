// Compose a place's layers into a Minecraft structure and a manifest: the output contract the design pipeline reads.
//   ground     relaxed between contours (or flat at 0 with none), grass over dirt over stone; the box's edges reach the
//              floor as a diorama's walls
//   streets    12 m of road and 4.5 m of sidewalk either side of each centreline (outside parks)
//   water      two blocks deep at the ground's level; paths 2 m wide; playgrounds as packed mud
//   buildings  each footprint as a plain mass from the lowest ground under it to its roof height, one colour each:
//              massing for the design pipeline to replace, never the finished look
//   trees      from the canopy map when there is one (trees.mjs), else the mapped tree points as simple trees
// The manifest lists every building (id, footprint cells, base, height, peak) in the structure's frame, the streets
// and the sources with their licences, so a kit build can take the footprints as its plots.
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { cellsIn, distanceTo, along } from "./raster.mjs";
import { groundFromContours } from "./ground.mjs";
import { canopyTrees } from "./trees.mjs";

const COLOURS = ["white", "light_gray", "pink", "light_blue", "yellow", "lime", "orange", "cyan", "magenta", "brown"];
const ROAD = 6, WALK = 10.5;

export function buildPlace(place, frame, L) {
  const { N } = frame, I = (x, z) => z * N + x;
  const H = L.ground ? groundFromContours(frame, L.ground, { field: L.ground.field, unit: L.ground.unit * (frame.scale ?? 1) }) : new Float64Array(N * N);
  const park = new Uint8Array(N * N), water = new Uint8Array(N * N), path = new Uint8Array(N * N), play = new Uint8Array(N * N);
  for (const f of L.parks?.features ?? []) for (const [x, z] of cellsIn(frame, f.geometry)) park[I(x, z)] = 1;
  for (const f of L.water?.features ?? []) for (const [x, z] of cellsIn(frame, f.geometry)) water[I(x, z)] = 1;
  for (const f of L.playgrounds?.features ?? []) for (const [x, z] of cellsIn(frame, f.geometry)) play[I(x, z)] = 1;
  for (const [fx, fz] of along(frame, L.paths?.features ?? [])) for (const [dx, dz] of [[0, 0], [0.7, 0], [-0.7, 0], [0, 0.7], [0, -0.7]]) {
    const x = Math.floor(fx + dx), z = Math.floor(fz + dz); if (x >= 0 && z >= 0 && x < N && z < N) path[I(x, z)] = 1; }
  const road = distanceTo(frame, (L.streets?.features ?? []).map((f) => f.geometry), WALK + 2);

  let lo = Infinity, hi = -Infinity; for (const h of H) { lo = Math.min(lo, h); hi = Math.max(hi, h); }
  const floor = Math.floor(lo) - 4, ground = (x, z) => Math.round(H[I(x, z)]) - floor;
  const buildings = (L.buildings?.features ?? []).map((f, k) => {
    const cells = cellsIn(frame, f.geometry).filter(([x, z]) => road[I(x, z)] > ROAD); if (!cells.length) return null;
    const p = f.properties, base = Math.min(...cells.map(([x, z]) => ground(x, z)));
    return { id: p.id, parcel: p.parcel ?? null, name: p.name ?? null, cells, base, height: Math.max(3, Math.round(p.height * (frame.scale ?? 1))), peak: p.peak, k };
  }).filter(Boolean);
  const isB = new Uint8Array(N * N); for (const b of buildings) for (const [x, z] of b.cells) isB[I(x, z)] = 1;
  const canopyTop = L.canopy ? Math.max(...L.canopy.data) : 8;
  const top = Math.max(...buildings.map((b) => b.base + b.height), Math.round(hi) - floor) + Math.ceil(canopyTop) + 3;
  const g = new Grid([N, top, N], { dataVersion: 3955 });

  for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
    const y = ground(x, z), i = I(x, z); let low = y - 3;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, nz = z + dz; low = nx < 0 || nz < 0 || nx >= N || nz >= N ? 0 : Math.min(low, ground(nx, nz) - 1); }
    for (let yy = Math.max(0, low); yy < y; yy++) g.set(x, yy, z, y - yy <= 3 ? "dirt" : "stone");
    const d = road[i];
    if (water[i] && d > WALK && !isB[i]) { g.set(x, y - 2, z, "clay"); g.set(x, y - 1, z, "water", { level: "0" }); g.set(x, y, z, "water", { level: "0" }); continue; }
    g.set(x, y, z, d <= ROAD ? "gray_concrete" : d <= WALK && !park[i] ? "smooth_stone" : isB[i] ? "stone" : path[i] ? "andesite" : play[i] ? "packed_mud" : "grass_block");
  }
  for (const b of buildings) { const c = `${COLOURS[b.k % COLOURS.length]}_concrete`;
    for (const [x, z] of b.cells) for (let y = ground(x, z) + 1; y <= b.base + b.height; y++) g.set(x, y, z, c); }

  const open = (x, z) => { const i = I(x, z); return !isB[i] && !water[i] && road[i] > ROAD; };
  let trees;
  if (L.canopy) trees = canopyTrees(g, { chm: L.canopy.data, n: N, ground, open });
  else { trees = { trees: [] };
    for (const f of L.trees?.features ?? []) { const [fx, fz] = frame.toBlock(...f.geometry.coordinates), x = Math.floor(fx), z = Math.floor(fz);
      if (x < 2 || z < 2 || x >= N - 2 || z >= N - 2 || !open(x, z)) continue; const y0 = ground(x, z);
      for (let y = 1; y <= 5; y++) g.set(x, y0 + y, z, "oak_log", { axis: "y" });
      for (let dy = 3; dy <= 6; dy++) for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (Math.abs(dx) + Math.abs(dz) <= (dy === 6 ? 1 : 3) && !g.get(x + dx, y0 + dy, z + dz)) g.set(x + dx, y0 + dy, z + dz, "oak_leaves", { persistent: "true", distance: "1", waterlogged: "false" });
      trees.trees.push({ at: [x, z] }); } }

  const manifest = { place: place.id, name: place.name, size: g.size, metresPerBlock: 1 / (frame.scale ?? 1), floorElevation: floor, box: frame.box, ground: [+lo.toFixed(1), +hi.toFixed(1)],
    streets: [...new Set((L.streets?.features ?? []).map((f) => f.properties.name))], trees: trees.trees.length,
    buildings: buildings.map(({ cells, k, ...b }) => ({ ...b, footprint: cells })) };
  return { grid: g, manifest };
}
