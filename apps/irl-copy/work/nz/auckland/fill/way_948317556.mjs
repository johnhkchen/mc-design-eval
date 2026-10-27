// Way 948317556: a two-storey brick-and-plaster commercial block of the 1920s-30s main-street kind that the city's
// older streets are full of. Red brick walls, cream plaster string course and cornice, a volcanic (polished andesite)
// plinth, a dark-timber shopfront with a door under a hood, glass bays on the upper floor, a flat roof behind a parapet.
// Storey lines are absolute (the string course at y 4), so the downhill cells carry extra foundation under the same
// storeys and the uphill ground floor is the shorter one. Interiors are air behind the glass with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_948317556.cells.json`, "utf8"));   // [x, z, ground, roof]
const g = new Voxels([12, 22, 14]);

const STRING_Y = 4, SILL_Y = 5, ENTRY = [3, 0];
const M = {
  found: "polished_andesite", brick: "bricks", plaster: "smooth_quartz", frame: "dark_oak_planks",
  roof: "smooth_stone", floor: "oak_planks", glass: "glass_pane", glow: "glowstone", shroom: "shroomlight",
};
const DOOR_LO = { half: "lower", facing: "north", hinge: "left", open: "false", powered: "false" };
const DOOR_UP = { half: "upper", facing: "north", hinge: "left", open: "false", powered: "false" };
const HOOD = { facing: "north", half: "top", shape: "straight", waterlogged: "false" };

const has = (x, z) => cells.some(([cx, cz]) => cx === x && cz === z);
const faces = (x, z) => ({ n: !has(x, z - 1), s: !has(x, z + 1), e: !has(x + 1, z), w: !has(x - 1, z) });
const boundary = (x, z) => Object.values(faces(x, z)).some(Boolean);
const isEntry = (x, z) => x === ENTRY[0] && z === ENTRY[1];
// the stepped footprint makes most edge cells meet two faces, so there is no quoin rule: every wall cell is judged by
// its primary facade (north/south if it has one, else east/west), and two bays of glass sit to each pier along it
const isWindow = (x, z) => {
  if (isEntry(x, z)) return false;
  const f = faces(x, z), t = f.n || f.s ? x : z;
  return t % 3 !== 0;
};
// the inward neighbour of a single-face wall cell (for the light behind its glass)
const inward = (x, z) => {
  const f = faces(x, z);
  if (f.n) return [x, z + 1]; if (f.s) return [x, z - 1]; if (f.e) return [x - 1, z]; if (f.w) return [x + 1, z];
  return null;
};

const panes = [];   // glass positions, placed last so each pane can connect to its neighbours
const lights = [];  // [x, y, z, block]

for (const [x, z, G, R] of cells) {
  for (let y = 0; y < G; y++) g.set(x, y, z, M.found);                                  // foundation to the ground
  if (!boundary(x, z)) {                                                              // interior: floor slabs, air, roof
    g.set(x, G, z, M.floor);
    if (STRING_Y > G && STRING_Y < R - 1) g.set(x, STRING_Y, z, M.floor);
    g.set(x, R - 1, z, M.roof);
    continue;
  }
  const ent = isEntry(x, z), win = isWindow(x, z);
  const glazedUpper = R - 2 >= 6;
  for (let y = G; y < R; y++) {
    if (ent) {
      if (y === G) { g.set(x, y, z, "dark_oak_door", DOOR_LO); continue; }
      if (y === G + 1) { g.set(x, y, z, "dark_oak_door", DOOR_UP); continue; }
      if (y === G + 2) { g.set(x, y, z, "dark_oak_stairs", HOOD); continue; }   // the hood over the door
    }
    if (y === G) { g.set(x, y, z, M.found); continue; }                              // plinth course
    if (y === R - 1) { g.set(x, y, z, M.plaster); continue; }                        // cornice cap
    if (y === STRING_Y) { g.set(x, y, z, M.plaster); continue; }                      // string course
    if (y < STRING_Y) {                                                              // shopfront: glass bays, dark piers
      if (win && !ent) panes.push([x, y, z]); else g.set(x, y, z, M.frame);
      continue;
    }
    if (y === SILL_Y && win && glazedUpper) { g.set(x, y, z, M.frame); continue; }   // sill of an upper bay
    if (y > SILL_Y && y <= R - 2 && win && glazedUpper) { panes.push([x, y, z]); continue; }
    g.set(x, y, z, M.brick);
  }
}

// glass panes connect to any glass neighbour in the plane of the facade
const paneSet = new Set(panes.map(([x, y, z]) => `${x},${y},${z}`));
const link = (x, y, z) => paneSet.has(`${x},${y},${z}`) ? "true" : "false";
for (const [x, y, z] of panes) {
  g.set(x, y, z, M.glass, { north: link(x, y, z - 1), south: link(x, y, z + 1), east: link(x + 1, y, z), west: link(x - 1, y, z), waterlogged: "false" });
}

// warm light just inside some bays: shroomlight on the shopfront floor, glowstone on the upper floor
for (const [x, z, G, R] of cells) {
  if (!boundary(x, z) || isEntry(x, z) || !isWindow(x, z)) continue;
  const inn = inward(x, z); if (!inn || !has(...inn) || boundary(...inn)) continue;
  const [ix, iz] = inn;
  if ((x * 7 + z * 5 + G) % 4 === 0) g.set(ix, G + 1, iz, M.shroom);
  else if ((x * 3 + z * 11) % 5 === 0 && R - 2 >= 6) g.set(ix, SILL_Y, iz, M.glow);
}

const { blocks, palette } = { blocks: g.count(), palette: g.palette.length };
g.save(`${DIR}/way_948317556.nbt`);
console.log(`way_948317556: ${blocks} blocks, ${palette} palette entries`);
