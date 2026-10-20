import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE111-0339-24F";

const cellsArr = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 2022 mid-rise commercial/office block in Xinyi: polished-granite base, blue-glass
// storeys with white-concrete mullions and solid spandrels, quartz corner piers,
// a quartz cornice and a flat roof with a plant box. Roof sits at y = 11 above the
// lowest ground (top block index 10).
const W = 38, H = 23, D = 38;
const ROOF_TOP = 10;      // highest block index used (cornice)
const STOREY_LINE = 5;    // floor slab / band between storeys
const ROOF_DECK = 9;      // roof slab level (parapet sits on it at the edges)

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const ground = new Map();
for (const [x, z, gr] of cellsArr) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const DIRS = [
  { dx: 1, dz: 0, name: "east" },
  { dx: -1, dz: 0, name: "west" },
  { dx: 0, dz: 1, name: "south" },
  { dx: 0, dz: -1, name: "north" },
];
const outward = (x, z) => DIRS.filter(d => !has(x + d.dx, z + d.dz));

// Entrance: south-facing frontage, centred on x = 19 (fallback: first south edge).
const southEdges = cellsArr.filter(([x, z]) => outward(x, z).some(d => d.name === "south"));
const entranceCell = southEdges.find(([x]) => x === 19) || southEdges[0] || null;
const isEntranceZone = (x, z) =>
  entranceCell && outward(x, z).some(d => d.name === "south") && Math.abs(x - entranceCell[0]) <= 1 && z === entranceCell[1];

// Pass 1: foundations, floors, walls, roof.
for (const [x, z, gr] of cellsArr) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const out = outward(x, z);

  if (out.length === 0) {
    // Interior cell: floor slabs at the ground, storey line and roof deck.
    for (const L of [gr, STOREY_LINE, ROOF_DECK]) {
      if (L >= gr) put(x, L, z, "light_gray_concrete");
    }
    // Roof plant: a 5x5 block of equipment, two blocks tall, with a vent cap.
    if (Math.abs(x - 18.5) <= 2.5 && Math.abs(z - 18.5) <= 2.5) {
      put(x, ROOF_DECK + 1, z, "stone_bricks");
      if (Math.abs(x - 18.5) <= 1 && Math.abs(z - 18.5) <= 1) {
        put(x, ROOF_DECK + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      }
    }
  } else {
    // Edge cell: the facade, one block thick, glass behind which is air.
    const isCorner = out.length > 1;
    const t = x + z;
    const ground1 = (out[0].name === "south" || out[0].name === "north");
    for (let y = gr; y <= 8; y++) {
      if (y === gr) {
        put(x, y, z, "polished_granite");                       // base course
      } else if (y === STOREY_LINE) {
        put(x, y, z, "smooth_stone");                           // storey line
      } else if (y === 8) {
        put(x, y, z, "smooth_quartz");                          // top spandrel band
      } else if (isCorner) {
        put(x, y, z, "white_concrete");                         // corner pier
      } else if (y <= 4) {
        // Shopfront storey: narrower mullions, glazed.
        put(x, y, z, t % 2 === 0 ? "white_concrete" : "light_blue_stained_glass");
      } else {
        // Upper storey: glazing with white concrete mullions every 4 blocks.
        put(x, y, z, t % 4 === 0 ? "white_concrete" : "light_blue_stained_glass");
      }
    }
    // Parapet and cornice.
    put(x, ROOF_DECK, z, "white_concrete");
    put(x, ROOF_TOP, z, isCorner ? "white_concrete" : "smooth_quartz");
  }
}

// Pass 2: warm lights behind glass, on interior air cells.
for (const [x, z, gr] of cellsArr) {
  const out = outward(x, z);
  if (out.length === 0) continue;
  const d = out[0];
  const t = x + z;
  const ix = x - d.dx, iz = z - d.dz;
  const interiorBehind = has(ix, iz) && outward(ix, iz).length === 0;
  if (!interiorBehind) continue;

  if (t % 8 === 2) {
    // Hanging lanterns under the storey slabs.
    if (4 > gr) put(ix, 4, iz, "lantern", { hanging: "true", waterlogged: "false" });
    if (8 > gr) put(ix, 8, iz, "lantern", { hanging: "true", waterlogged: "false" });
  } else if (t % 8 === 6) {
    // Glowstone resting on the second-floor slab, behind the glass.
    if (6 > gr) put(ix, 6, iz, "glowstone");
  }
}

// Pass 3: entrance on the south face - door, recessed glazing and a canopy lintel.
if (entranceCell) {
  const [ex, ez, egr] = entranceCell;
  const lowY = egr + 1, upY = egr + 2;
  if (upY <= 4) {
    put(ex, lowY, ez, "dark_oak_door", {
      facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(ex, upY, ez, "dark_oak_door", {
      facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
    });
  }
  // Canopy: a stone band over the entrance bay, three cells wide, at the lintel line.
  const lintelY = egr + 3;
  for (const [x, z, gr] of cellsArr) {
    if (!isEntranceZone(x, z)) continue;
    if (lintelY > gr && lintelY <= 4) {
      put(x, lintelY, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
    }
  }
  // Warm lanterns flanking the entrance, hung from the canopy.
  for (const [x, z, gr] of cellsArr) {
    if (!isEntranceZone(x, z) || Math.abs(x - ex) !== 1) continue;
    if (lintelY - 1 > gr && lintelY - 1 <= 4) {
      put(x, lintelY - 1, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
