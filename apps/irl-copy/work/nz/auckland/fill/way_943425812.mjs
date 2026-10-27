// Newland House, Auckland: a 1970s reinforced-concrete office block, 6 storeys on the podium, a 7-storey core and an
// 8-storey lift tower on the west edge (lidar roof 26 / 29 / 32 above y 0, smoothed to three flat tiers). White-concrete
// piers and spandrels, dark glass in 3-block bays, storey bands, a coping on each parapet, plant on the roofs, an
// entrance on the lowest (west) face with a lobby lantern, and warm glowstone behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_943425812.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_943425812.nbt";

const g = new Voxels([30, 45, 22]);
const occ = new Map();                       // "x,y,z" -> block name, so the rules can look at neighbours
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => { g.set(x, y, z, block, state); occ.set(key(x, y, z), block); };
const blockAt = (x, y, z) => occ.get(key(x, y, z));

// Three flat tiers: the wall top (the last storey's band ends here) and the parapet top (the lidar roof, +1 or +2).
const TIER = {
  main: { wallTop: 24, roofTop: 26 },        // 6 storeys: the podium and most of the plan
  core: { wallTop: 28, roofTop: 30 },        // 7 storeys: the lidar's 28-29 band, stepping back in
  tower: { wallTop: 32, roofTop: 33 },       // 8 storeys: the lift tower on the west edge, about 33 above the lowest ground
};

const foot = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { x, z, ground, roof }]));
const inFoot = (x, z) => foot.has(`${x},${z}`);

// The lidar roof smoothed over the 3x3 footprint neighbourhood (median), then sorted into a tier.
const medianRoof = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const c = foot.get(`${x + dx},${z + dz}`); if (c) v.push(c.roof); }
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tierOf = (r) => (r < 28 ? TIER.main : r < 31 ? TIER.core : TIER.tower);

const cols = [...foot.values()].map((c) => {
  const exW = !inFoot(c.x - 1, c.z), exE = !inFoot(c.x + 1, c.z), exN = !inFoot(c.x, c.z - 1), exS = !inFoot(c.x, c.z + 1);
  const corner = (exW || exE) && (exN || exS);
  // a pier every third block along the exposed face (the run is z on east/west faces, x on north/south)
  const pier = corner || ((exW || exE) ? c.z % 3 === 0 : c.x % 3 === 0);
  return { ...c, tier: tierOf(medianRoof(c.x, c.z)), perim: exW || exE || exN || exS, corner, pier };
});
const colAt = new Map(cols.map((c) => [`${c.x},${c.z}`, c]));
const col = (x, z) => colAt.get(`${x},${z}`);

const panes = [];
for (const c of cols) {
  const { x, z, ground: G, tier: T } = c;
  for (let y = 0; y < T.roofTop; y++) {
    if (y < G) { put(x, y, z, "stone_bricks"); continue; }                      // foundation up to this cell's ground
    if (!c.perim) {                                                              // inside: floor slab per storey, air behind the glass
      if (y >= T.wallTop) { if (y === T.wallTop) put(x, y, z, "stone"); continue; }   // roof membrane, light enough not to read as a black hole
      if (y % 4 === 0) put(x, y, z, "light_gray_concrete");
      continue;
    }
    if (y >= T.wallTop) { put(x, y, z, y === T.roofTop - 1 ? "smooth_stone" : "white_concrete"); continue; }   // parapet and coping
    if (y % 4 === 0) { put(x, y, z, "smooth_stone"); continue; }                // storey band
    if (y % 4 === 3) { put(x, y, z, "white_concrete"); continue; }              // spandrel
    if (c.pier) { put(x, y, z, "white_concrete"); continue; }                   // pier
    put(x, y, z, "gray_stained_glass_pane", { east: "false", north: "false", south: "false", west: "false", waterlogged: "false" });
    panes.push({ x, y, z, c });
  }
}

// Warm light behind some panes: a glowstone in the room just inside the glass (never in the entrance lobby).
const lobby = new Set(["1,9", "1,10", "1,11"]);
for (const { x, y, z, c } of panes) {
  if ((x * 5 + z * 3 + y) % 4 !== 0) continue;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const ic = col(x + dx, z + dz);
    if (!ic || ic.perim) continue;
    if (y < ic.ground || y >= ic.tier.wallTop || y % 4 === 0 || y % 4 === 3) continue;
    if (lobby.has(`${x + dx},${z + dz}`) || blockAt(x + dx, y, z + dz)) continue;
    put(x + dx, y, z + dz, "glowstone");
    break;
  }
}

// Entrance on the west face (the lowest ground): an iron door in the glass, a metal hood over it, a lantern in the lobby.
const door = { facing: "west", hinge: "left", open: "false", powered: "false" };
put(0, 1, 10, "iron_door", { ...door, half: "lower" });
put(0, 2, 10, "iron_door", { ...door, half: "upper" });
for (const z of [9, 10, 11]) put(0, 3, z, "iron_block");
put(1, 3, 10, "lantern", { hanging: "true", waterlogged: "false" });

// Roof plant on the tiers' decks (interior cells only), and the lift-tower overrun.
for (const c of cols) {
  if (c.perim) continue;
  if ((c.x * 3 + c.z * 5) % 11 === 0 && c.tier !== TIER.tower) put(c.x, c.tier.wallTop + 1, c.z, "iron_block");
  if (c.tier === TIER.tower && c.x % 5 === 1 && c.z % 5 === 1) { put(c.x, 33, c.z, "light_gray_concrete"); put(c.x, 34, c.z, "light_gray_concrete"); }
}

// Pane connections: a pane joins any neighbour that is solid or a pane (not light, glass-less door or lantern).
const joins = (b) => b && !/door|lantern|glowstone/.test(b);
for (const { x, y, z } of panes) {
  if (blockAt(x, y, z) !== "gray_stained_glass_pane") continue;
  g.set(x, y, z, "gray_stained_glass_pane", {
    east: String(joins(blockAt(x + 1, y, z))), west: String(joins(blockAt(x - 1, y, z))),
    north: String(joins(blockAt(x, y, z - 1))), south: String(joins(blockAt(x, y, z + 1))), waterlogged: "false",
  });
}

const info = g.save(OUT);
console.log(`Newland House: ${cols.length} cells, ${info.blocks} blocks, ${info.palette} palette entries, ${panes.length} panes -> ${OUT}`);
