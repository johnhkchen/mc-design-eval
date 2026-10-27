// Viaduct Point: a flat-topped waterfront block on the lidar roof record (~21 blocks). Solid plinth to y4 on the
// slope, four storeys of 4 blocks on one datum (shopfront ground floor, glass upper storeys with spandrels), a
// cornice and parapet to y22 on the main block, lower wings that stop at their own storey line, a plant room on the
// roof. Floor slabs span the footprint; the interior between them is air, so the glass has an air gap behind it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${dir}/way_154089899.cells.json`, "utf8"));
const g = new Voxels([84, 34, 80]);

const F = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inF = (x, z) => F.has(`${x},${z}`);
const FLOOR = 4;                       // ground-floor slab; the plinth is solid below it
const DECKS = [4, 8, 12, 16, 20];      // storey lines: each is a floor slab (or the roof deck at 20)
const MAIN = 20;                       // roof deck of the main block; lidar 19-21 all smooth to it

// the faces a footprint cell has to the outside (north = -z, west = -x)
const sides = (x, z) => [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]].filter(([, dx, dz]) => !inF(x + dx, z + dz));
// two cells of footprint all round: far enough from the outside to hold roof plant
const deep = (x, z) => { for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (!inF(x + dx, z + dz)) return false; return true; };
// a deterministic ~1 in 11 pick for the lit windows
const lit = (x, z, y) => ((Math.imul(x, 73856093) ^ Math.imul(z, 19349663) ^ Math.imul(y, 83492791)) >>> 0) % 11 === 0;
// the deck of a cell: the main block rises to 20; a lower wing stops at the highest storey line under its roof
const deckOf = (roof) => (roof >= 19 ? MAIN : DECKS.filter((s) => s < MAIN && s + 1 <= roof).pop());

// one entrance: on the north face, between mullions, nearest the middle of the north side
const north = cells.filter(([x, z, , r]) => sides(x, z).map((s) => s[0]).join() === "north" && x % 4 === 2 && deckOf(r) === MAIN);
const mx = north.reduce((a, c) => a + c[0], 0) / north.length;
const [ex, ez] = north.sort((a, b) => Math.abs(a[0] - mx) - Math.abs(b[0] - mx))[0] ?? [-1, -1];

// wall block at a perimeter cell, row y of storey s
function wall(x, z, y, s, ext) {
  if (ext.length > 1) {                                                   // a corner: windows on the face that has room for them
    const pick = ext.find(([, dx]) => (dx ? z : x) % 4 !== 0);
    if (!pick) return ["smooth_quartz"];                                  // corner pier, full height
    ext = [pick];
  }
  const [face, dx] = ext[0];
  const along = dx ? z : x;
  if (along % 4 === 0) return ["gray_concrete"];                          // mullion: the dark frame
  if (s === FLOOR && y === 7) return ["polished_andesite"];               // shopfront fascia
  if (s === FLOOR && x === ex && z === ez && y <= 6) return [null, y === 5 ? "lower" : "upper"];   // door
  if (s !== FLOOR && y === s + 1) return ["white_concrete"];             // spandrel under each window band
  if (lit(x, z, y)) return ["glowstone"];                                // warm light behind the glass
  const sideways = face === "north" || face === "south";                  // a pane runs along the face
  return ["light_blue_stained_glass_pane", sideways
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }];
}

for (const [x, z, ground, roof] of cells) {
  const D = deckOf(roof);
  const ext = sides(x, z);
  const edge = ext.length > 0;

  // foundation to the cell's ground, then the solid plinth up to the ground-floor slab
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone");
  for (let y = ground; y < FLOOR; y++) g.set(x, y, z, edge ? "polished_andesite" : "stone");

  // floor slabs, one per storey line; the top one is the roof deck (membrane inside, cornice on the edge)
  for (const s of DECKS) {
    if (s > D) break;
    g.set(x, s, z, edge ? "smooth_quartz" : s === D ? "light_gray_concrete" : "gray_concrete");
  }
  if (!edge) continue;

  // the facade: storeys stand on their slab, rows s+1..s+3 (the ground floor: shopfront glass and a fascia)
  for (const s of DECKS) {
    if (s >= D) break;
    for (let y = s + 1; y <= s + 3; y++) {
      const [name, state] = wall(x, z, y, s, ext);
      if (name === null) {
        g.set(x, y, z, "oak_door", { facing: ext[0][0], half: state, hinge: "left", open: "false", powered: "false" });
      } else {
        g.set(x, y, z, name, state);
      }
    }
  }
  if (D === MAIN) g.set(x, 21, z, "smooth_quartz");                       // parapet to y22
}

// roof plant: a room in the middle of the main roof, on the deck
const main = cells.filter(([, , , r]) => deckOf(r) === MAIN);
const cx = Math.round(main.reduce((a, c) => a + c[0], 0) / main.length);
const cz = Math.round(main.reduce((a, c) => a + c[1], 0) / main.length);
for (const [x, z, , r] of main) {
  if (!deep(x, z) || Math.abs(x - cx) > 4 || Math.abs(z - cz) > 3) continue;
  const ring = Math.abs(x - cx) === 4 || Math.abs(z - cz) === 3;
  g.set(x, 21, z, "smooth_stone");
  g.set(x, 22, z, ring ? "light_gray_concrete" : "iron_bars");
}

const out = g.save(`${dir}/way_154089899.nbt`);
console.log(`way_154089899.nbt: ${out.blocks} blocks, ${out.palette} palette entries; entrance at ${ex},${ez}`);
