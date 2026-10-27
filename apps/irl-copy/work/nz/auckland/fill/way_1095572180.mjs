// Way 1095572180, Mt Eden / Eden Terrace side of the CBD: a two-storey Edwardian brick commercial block with a
// shopfront, a stone string course and cornice, and a parapet. The lidar roof is flat at 10 over all 56 cells, so
// one deck level (y 9) carries the whole footprint; the parapet and a roof housing rise above it to y 12.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1095572180.cells.json`, "utf8"));

const X = 8, Z = 12, H = 23;
const DECK = 9;                                   // roof deck: top surface at 10, the lidar roof height
const FLOOR1 = 5;                                 // storey line between the two storeys
const PARAPET = 10;                               // one course of parapet above the deck
if (cells.some(([, , , r]) => r !== 10)) throw new Error("roof is not flat at 10; the storey levels need a rewrite");

const foot = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const inF = (x, z) => foot.has(`${x},${z}`);
const NORM = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const OPP = { N: "south", S: "north", E: "west", W: "east" };      // a door faces the way you walk in
const outward = (x, z) => Object.keys(NORM).filter((d) => !inF(x + NORM[d][0], z + NORM[d][1]));
const isPerim = (x, z) => inF(x, z) && outward(x, z).length > 0;

// Every block is written to a map first so the pane and wall connections can read their neighbours before saving.
const M = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => M.set(key(x, y, z), { block, state });
const has = (x, y, z) => M.has(key(x, y, z));

// the door: on the south (street) face, the cell nearest the middle of the footprint
const southFace = cells.filter(([x, z]) => outward(x, z).length === 1 && outward(x, z)[0] === "S");
const [dx0, dz0] = southFace.sort((a, b) => Math.abs(a[0] - 3.5) - Math.abs(b[0] - 3.5))[0];
const DOOR = key(dx0, 0, dz0);

// window bays along each face: two windows, then a brick pier (every third along-face cell is a pier)
const bayOf = (x, z, face) => (face === "N" || face === "S" ? x : z);
const isWindow = (x, z, face) => bayOf(x, z, face) % 3 !== 0;

const glass = [], lights = [];
let bay = 0;
for (const [x, z, g] of cells) {
  for (let y = 0; y < g; y++) put(x, y, z, "stone");                 // foundation under the ground (none here: g = 0)
  const face = outward(x, z), perim = face.length > 0, corner = face.length >= 2;
  const f = face[0];

  // floor slabs: the ground floor, the storey line and the roof deck run across the whole footprint
  put(x, 0, z, perim ? "stone_bricks" : "stone");
  put(x, FLOOR1, z, perim ? "stone_bricks" : "stone");
  put(x, DECK, z, perim ? "stone_bricks" : "smooth_stone");
  if (!perim) continue;                                               // interiors stay air between the slabs

  put(x, PARAPET, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });   // coping, not battlements

  // ground storey: plinth, shopfront with dark oak mullions, fascia
  const doorHere = key(x, 0, z) === DOOR;
  if (doorHere) {
    put(x, 1, z, "dark_oak_door", { facing: OPP[f], half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, 2, z, "dark_oak_door", { facing: OPP[f], half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, 3, z, "glass_pane", { waterlogged: "false" }); glass.push([x, 3, z, f]);   // transom
  } else {
    put(x, 1, z, "stone_bricks");
    for (const y of [2, 3]) {
      if (corner || !isWindow(x, z, f)) put(x, y, z, "dark_oak_log", { axis: "y" });
      else { put(x, y, z, "glass_pane", { waterlogged: "false" }); glass.push([x, y, z, f]); }
    }
  }
  put(x, 4, z, "dark_oak_planks");                                    // fascia over the shopfront

  // upper storey: sill, windows, brick piers, cornice course
  for (const y of [6, 7, 8]) {
    if (isWindow(x, z, f) || corner) {
      if (corner) { put(x, y, z, "bricks"); continue; }
      if (y === 6) put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      else { put(x, y, z, "glass_pane", { waterlogged: "false" }); glass.push([x, y, z, f]); }
    } else put(x, y, z, "bricks");
  }
  put(x, DECK, z, "stone_bricks");                                    // cornice
}

// warm light: a glowstone in some shopfront bays and a shroomlight in some upper windows. The walls are one block
// thick, so there is rarely a room cell behind the pane: where there is none, the light takes the pane's own cell.
for (const [x, y, z, f] of glass) {
  if (y === 3 || y === 6) continue;
  bay++;
  const ix = x - NORM[f][0], iz = z - NORM[f][1];
  const room = inF(ix, iz) && !isPerim(ix, iz);
  if (y === 2 && bay % 3 === 0) { put(room ? ix : x, 2, room ? iz : z, "glowstone"); lights.push(["glowstone", x, 2, z]); }
  if (y === 7 && bay % 4 === 1) { put(room ? ix : x, 7, room ? iz : z, "shroomlight"); lights.push(["shroomlight", x, 7, z]); }
}

// lanterns hanging from the storey-line slab in the ground-floor room
for (const [x, z] of cells) {
  if (isPerim(x, z) || (x + z) % 4 !== 0) continue;
  put(x, 4, z, "lantern", { hanging: "true", waterlogged: "false" });
}

// roof housing: a 2 x 2 stair-core in the middle of the deck, clear of the parapet
const cx = cells.reduce((s, [x]) => s + x, 0) / cells.length, cz = cells.reduce((s, [, z]) => s + z, 0) / cells.length;
let best = null;
for (const [x, z] of cells) {
  const sq = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!sq.every(([a, b]) => inF(a, b) && !isPerim(a, b))) continue;
  const d = Math.hypot(x + 0.5 - cx, z + 0.5 - cz);
  if (!best || d < best.d) best = { d, sq };
}
if (best) for (const [a, b] of best.sq) {
  put(a, PARAPET, b, "stone_bricks");
  put(a, PARAPET + 1, b, "stone_bricks");
  put(a, PARAPET + 2, b, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// pass 2: wall connections. A pane or parapet wall joins the neighbours along its own wall line only.
const solidAt = (x, y, z) => has(x, y, z) && M.get(key(x, y, z)).block !== "lantern";
for (const [x, y, z, f] of glass) {
  if (M.get(key(x, y, z)).block !== "glass_pane") continue;             // a light took this opening
  const along = f === "N" || f === "S" ? ["east", "west"] : ["north", "south"];
  const nb = { east: [1, 0], west: [-1, 0], north: [0, -1], south: [0, 1] };
  const st = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  for (const side of along) st[side] = solidAt(x + nb[side][0], y, z + nb[side][1]) ? "true" : "false";
  put(x, y, z, "glass_pane", st);
}

const g = new Voxels([X, H, Z]);
for (const [k, { block, state }] of M) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = g.save(`${DIR}/way_1095572180.nbt`);
console.log(JSON.stringify({ cells: cells.length, glass: glass.length, lights: lights.length, housing: !!best, ...out }));
