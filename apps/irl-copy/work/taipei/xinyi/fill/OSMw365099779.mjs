import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw365099779";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 26, H = 23, D = 28;
const DECK = 9;      // roof deck occupies y=9
const PARAPET = 10;  // parapet course at y=10, top face 11 blocks above lowest ground

const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const OUT = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

function outwardOf(x, z) {
  return Object.keys(OUT).filter(f => !has(x + OUT[f][0], z + OUT[f][1]));
}

// Door on the south (street-side) face, at the middle of single-face south cells.
const southTs = cells
  .filter(([x, z]) => { const o = outwardOf(x, z); return o.length === 1 && o[0] === "south"; })
  .map(([x]) => x);
const doorT = southTs.length
  ? Math.floor((Math.min(...southTs) + Math.max(...southTs)) / 2)
  : -999;

function paneProps(face) {
  const ns = face === "north" || face === "south";
  return {
    north: ns ? "true" : "false",
    south: ns ? "true" : "false",
    east: ns ? "false" : "true",
    west: ns ? "false" : "true",
    waterlogged: "false",
  };
}

// Stair facing the outward direction, used for the door canopy and corner reveal.
function stairFacing(f) { return f; }

for (const [x, z, gr] of cells) {
  const base = gr;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < base; y++) g.set(x, y, z, "stone_bricks");

  const out = outwardOf(x, z);
  const perim = out.length > 0;
  const corner = out.length > 1;

  // Roof deck: light grey so the roof reads from the air.
  const deckAt = Math.max(DECK, base);
  g.set(x, deckAt, z, "light_gray_concrete");

  if (base <= DECK) {
    if (!perim) {
      g.set(x, base, z, "light_gray_concrete");              // ground floor slab
      if (base + 5 < DECK) g.set(x, base + 5, z, "light_gray_concrete"); // upper floor slab
    }
    if (perim) g.set(x, PARAPET, z, "white_concrete");
  }

  if (!perim || base >= DECK) continue;

  const top = DECK - 1 - base; // last wall row (relative)
  const f = out[0];
  const t = (f === "north" || f === "south") ? x : z;

  for (let y = base; y < DECK; y++) {
    const r = y - base;

    // Base course
    if (r === 0) {
      g.set(x, y, z, "polished_andesite");
      continue;
    }

    // Corner quoins: alternating stone brick and polished andesite, so the corners carry the massing.
    if (corner) {
      const quoin = (r + x + z) % 2 === 0 ? "stone_bricks" : "polished_andesite";
      if (r === top || r === 4 || r === 5) g.set(x, y, z, "smooth_stone");
      else g.set(x, y, z, quoin);
      continue;
    }

    // Cornice, fascia and storey line
    if (r === top) { g.set(x, y, z, "smooth_stone"); continue; }
    if (r === 4) { g.set(x, y, z, "smooth_stone"); continue; }
    if (r === 5) { g.set(x, y, z, "smooth_stone"); continue; }

    // Ground floor: shopfront with door, pilasters and glass bays
    if (r >= 1 && r <= 3) {
      const isDoor = f === "south" && t === doorT && (r === 1 || r === 2);
      if (isDoor) {
        g.set(x, y, z, "dark_oak_door", {
          facing: f,
          half: r === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      // Door canopy: a stair course over the entrance, outward-facing
      if (f === "south" && t === doorT && r === 3) {
        g.set(x, y, z, "stone_brick_stairs", {
          facing: stairFacing(f),
          half: "top",
          shape: "straight",
          waterlogged: "false",
        });
        continue;
      }
      if (t % 3 === 0) {
        g.set(x, y, z, "polished_andesite");              // pilaster
      } else {
        g.set(x, y, z, "glass_pane", paneProps(f));       // shopfront glass
        // Warm light just inside some shopfront bays
        if (r === 1 && t % 3 === 2) {
          const ix = x - OUT[f][0], iz = z - OUT[f][1];
          if (has(ix, iz) && outwardOf(ix, iz).length === 0 && base + 1 < DECK) {
            g.set(ix, base + 1, iz, "glowstone");
          }
        }
      }
      continue;
    }

    // Upper storey: window bays between white spandrel pilasters
    if (t % 3 === 1) {
      g.set(x, y, z, "glass_pane", paneProps(f));
      if (r === 6 && t % 6 === 4) {
        const ix = x - OUT[f][0], iz = z - OUT[f][1];
        if (has(ix, iz) && outwardOf(ix, iz).length === 0 && base + 6 < DECK) {
          g.set(ix, base + 6, iz, "glowstone");
        }
      }
    } else if (t % 3 === 0) {
      g.set(x, y, z, "polished_andesite");                // pilaster
    } else {
      g.set(x, y, z, "white_concrete");                   // spandrel
    }
  }
}

// Roof equipment: a central penthouse with a stepped top, if fully on the footprint.
const PH = [];
for (let x = 8; x <= 17; x++) for (let z = 9; z <= 18; z++) PH.push([x, z]);
if (PH.every(([x, z]) => has(x, z) && ground.get(`${x},${z}`) <= DECK)) {
  for (const [x, z] of PH) g.set(x, PARAPET, z, "stone_bricks");
  for (let x = 10; x <= 15; x++) for (let z = 11; z <= 16; z++) {
    g.set(x, PARAPET + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
