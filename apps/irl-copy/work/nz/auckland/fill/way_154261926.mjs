// Mid City Mall, Auckland CBD: a 1980s concrete-and-tinted-glass mall on a stone plinth. The lidar roof is snapped to
// 4-block storeys (roof tops at 7, 11, ..., 27) so each tier stands on the one below. Facades are one-block shells with
// an air gap behind the glazing and a floor slab per storey; interiors are air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154261926.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154261926.nbt";

const FLOOR = 2;                       // datum: the lowest floor line, above the highest ground under the footprint (2)
const STOREY = 4;                      // floor slab + three wall layers
const TIERS = [7, 11, 15, 19, 23, 27]; // roof tops: each is a storey line (FLOOR + 4k) plus one block
const DIRS = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];
const H = 42;

const M = {
  plinth: "stone_bricks", base: "polished_andesite", riser: "polished_andesite", coping: "polished_andesite",
  slab: "white_concrete", slabIn: "light_gray_concrete", spandrel: "white_concrete", wall: "light_gray_concrete",
  pier: "gray_concrete", pane: "light_blue_stained_glass_pane", parapet: "white_concrete",
  plant: "light_gray_concrete", plantTop: "gray_concrete",
};

// --- footprint and a lidar roof per cell, smoothed by a 5x5 median and snapped to the nearest tier -----------------
const RAW = new Map(); for (const [x, z, , r] of cells) RAW.set(`${x},${z}`, r);
const inF = (x, z) => RAW.has(`${x},${z}`);
const tier = (v) => TIERS.reduce((b, t) => (Math.abs(v - t) < Math.abs(v - b) ? t : b), TIERS[0]);
const TOP = new Map();
for (const [key] of RAW) {
  const [x, z] = key.split(",").map(Number); const vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inF(x + dx, z + dz)) vals.push(RAW.get(`${x + dx},${z + dz}`));
  vals.sort((a, b) => a - b);
  TOP.set(key, tier(vals[vals.length >> 1]));
}
const top = (x, z) => TOP.get(`${x},${z}`) ?? 0;

// A side is exposed at height y when the neighbour is outside the footprint or is air at y (its top is at or below y).
const exposed = (x, z, y, [dx, dz]) => !inF(x + dx, z + dz) || top(x + dx, z + dz) <= y;
const ring = (x, z, y) => DIRS.some((d) => exposed(x, z, y, d));
const outward = (x, z, y) => {
  const ds = DIRS.filter((d) => exposed(x, z, y, d));
  return ds.find((d) => !inF(x + d[0], z + d[1])) ?? ds[0];
};
// the parapet sits only on the roof's edge: a side that is outside the footprint or drops below the roof
const roofEdge = (x, z) => { const t = top(x, z); return DIRS.some(([dx, dz]) => !inF(x + dx, z + dz) || top(x + dx, z + dz) < t); };

// --- the entrance: the face with the most exposed cells, entered at the middle of its run ------------------------------
const faceCount = new Map(); const faceCells = new Map();
for (const [key] of RAW) {
  const [x, z] = key.split(",").map(Number);
  for (const d of DIRS) if (!inF(x + d[0], z + d[1])) {
    faceCount.set(d[2], (faceCount.get(d[2]) ?? 0) + 1);
    if (!faceCells.has(d[2])) faceCells.set(d[2], []);
    faceCells.get(d[2]).push([x, z]);
  }
}
const ed = DIRS.find((d) => d[2] === [...faceCount.entries()].sort((a, b) => b[1] - a[1])[0][0]);
const along = ([dx], x, z) => (dx !== 0 ? z : x);   // coordinate running along a facade with this outward normal
const aList = faceCells.get(ed[2]).map(([x, z]) => along(ed, x, z)).sort((a, b) => a - b);
const aC = aList[aList.length >> 1];
const isEntrance = (x, z, n, a) => n[2] === ed[2] && Math.abs(a - aC) <= 1;
const facingOf = ([dx, dz]) => DIRS.find((d) => d[0] === -dx && d[1] === -dz)[2];   // a door faces inward

// --- build ----------------------------------------------------------------------------------------------------------
const g = new Voxels([87, H, 65]);
const panes = [];
let nLights = 0;

for (const [key] of RAW) {
  const [x, z] = key.split(",").map(Number); const t = top(x, z);

  // plinth: solid stone from y 0 up to the floor datum, so nothing floats on the slope
  for (let y = 0; y < FLOOR; y++) g.set(x, y, z, M.plinth);

  for (let y = FLOOR; y < t; y++) {
    const rg = ring(x, z, y);
    if ((y - FLOOR) % STOREY === 0) {                       // floor slab / base course, across the whole footprint
      g.set(x, y, z, y === FLOOR && rg ? M.base : rg ? M.slab : M.slabIn);
      continue;
    }
    if (!rg) continue;                                       // interior: air (no interiors), except the slabs above
    const k = Math.floor((y - FLOOR) / STOREY), o = (y - FLOOR) % STOREY;   // o: 1 spandrel/riser, 2 and 3 glazing
    const n = outward(x, z, y), a = along(n, x, z);
    const pier = a % 3 === 0;
    if (k === 0 && o === 3) { g.set(x, y, z, M.slab); continue; }             // shopfront head band
    if (k === 0 && o === 1) g.set(x, y, z, M.riser);
    if (k > 0 && o === 1) { g.set(x, y, z, M.spandrel); continue; }

    if (k === 0 && isEntrance(x, z, n, a) && n[2] === ed[2]) {
      if (a === aC) {
        if (o === 1) g.set(x, y, z, "iron_door", { facing: facingOf(n), half: "lower", hinge: "left", open: "false", powered: "false" });
        if (o === 2) g.set(x, y, z, "iron_door", { facing: facingOf(n), half: "upper", hinge: "left", open: "false", powered: "false" });
        if (o === 3) g.set(x, y, z, M.slab);
        if (o === 3 && !ring(x - n[0], z - n[1], y)) g.set(x - n[0], y, z - n[1], "lantern", { hanging: "true", waterlogged: "false" });
        continue;
      }
      if (o === 2) { g.set(x, y, z, M.pane); panes.push({ x, y, z, ns: n[0] !== 0 }); }
      if (o === 1) g.set(x, y, z, M.riser);
      continue;
    }
    if (o >= 2) {
      if (pier) g.set(x, y, z, M.pier);
      else { g.set(x, y, z, M.pane); panes.push({ x, y, z, ns: n[0] !== 0 }); }
      // warm light in some glazing: a block in the air gap behind the glass (inward cell, interior at this height)
      const ix = x - n[0], iz = z - n[1];
      if (o === 2 && inF(ix, iz) && top(ix, iz) > y && !ring(ix, iz, y) && (x * 31 + z * 17 + k * 7) % 13 === 0) {
        g.set(ix, y, iz, (x + z + k) % 2 ? "glowstone" : "shroomlight"); nLights++;
      }
    }
  }

  // parapet on the roof edge, with a coping; roof plant on the upper tiers, set back from the edge
  if (roofEdge(x, z)) { g.set(x, t, z, M.parapet); g.set(x, t + 1, z, M.coping); }
  else if (t >= 19 && x % 12 >= 3 && x % 12 <= 6 && z % 12 >= 3 && z % 12 <= 6) {
    g.set(x, t, z, M.plant); g.set(x, t + 1, z, M.plantTop);
  }
}

// pane connections follow the facade: a pane joins the neighbours along its wall, never the air gap behind it
for (const p of panes) {
  const dirs = p.ns ? DIRS.filter((d) => d[2] === "north" || d[2] === "south") : DIRS.filter((d) => d[2] === "east" || d[2] === "west");
  const st = { north: "false", south: "false", east: "false", west: "false" };
  for (const [dx, dz, name] of dirs) if (g.get(p.x + dx, p.y, p.z + dz)) st[name] = "true";
  g.set(p.x, p.y, p.z, M.pane, st);
}

const info = g.save(OUT);
console.log(JSON.stringify({ cells: cells.length, entrance: { face: ed[2], aC }, panes: panes.length, lights: nLights, ...info }));
