import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540300014";
const W = 27, D = 9, H = 23;

// Record: 27 x 9 footprint, roof ~11 blocks above lowest ground (about 2 storeys).
// Reading: a low, mid-century/1980s Taipei commercial block: stone plinth, pale
// facade with quartz pilasters, shopfront at street level (z=0 is the street side),
// punched window bays above, cornice and parapet, a roof deck with plant boxes.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gc] of cells) ground.set(`${x},${z}`, gc);
const minG = Math.min(...ground.values());

const g = new Voxels([W, H, D]);
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const put = (x, y, z, id, p) => {
  if (!has(x, z) || y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Direction into the building from an edge cell (for lit-window interiors).
const inward = (x, z) => {
  if (!has(x - 1, z)) return [1, 0];
  if (!has(x + 1, z)) return [-1, 0];
  if (!has(x, z - 1)) return [0, 1];
  return [0, -1];
};

// Pane connection props: glazing runs along the facade direction.
const paneProps = (x, z) => {
  const alongX = has(x - 1, z) && has(x + 1, z);
  return {
    east: alongX ? "true" : "false",
    west: alongX ? "true" : "false",
    north: alongX ? "false" : "true",
    south: alongX ? "false" : "true",
    waterlogged: "false",
  };
};

// Choose the entrance: a street-side (z=0) cell, preferring a non-pilaster column near the middle.
const frontXs = cells.filter(([x, z]) => z === 0).map(([x]) => x).sort((a, b) => a - b);
const doorCands = frontXs.filter((x) => x % 3 === 1).sort((a, b) => Math.abs(a - 13) - Math.abs(b - 13));
const doorX = doorCands.length ? doorCands[0] : (frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : null);

for (const [x, z, gc] of cells) {
  // Storey lines: ground storey runs gc..f1-1, upper storey f1..deck-1.
  const f1 = Math.max(minG + 5, gc + 5);
  const deck = f1 + 5;          // roof deck level (top of building body)
  const edge = isEdge(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  // Interior floor slab at each storey line.
  put(x, f1, z, "smooth_stone");

  // Roof deck.
  put(x, deck, z, "gray_concrete");

  if (!edge) continue;

  // Perimeter: wall body from the base course up to the deck.
  put(x, gc, z, "stone_bricks");                 // base course
  for (let y = gc + 1; y < deck; y++) put(x, y, z, "white_concrete");

  // String course at f1 and cornice + parapet at the roof.
  put(x, f1, z, "smooth_quartz");
  put(x, deck, z, "smooth_quartz");
  put(x, deck + 1, z, "smooth_quartz");          // parapet

  // Ground storey.
  const isFront = z === 0;
  if (isFront) {
    // Shopfront: full glass between quartz pilasters, lintel above.
    for (let y = gc + 1; y <= gc + 3; y++) {
      if (x % 3 === 0) put(x, y, z, "smooth_quartz");
      else put(x, y, z, "glass");
    }
    put(x, gc + 4, z, "smooth_quartz");           // lintel
    if (x === doorX) {
      put(x, gc + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gc + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    }
  } else {
    windowed(x, z, gc);
  }

  // Upper storey.
  if (f1 < deck) windowed(x, z, f1);
}

// Window bay on one storey: slab s, sill s+1, glass s+2..s+3, header s+4.
function windowed(x, z, s) {
  const pillar = x % 3 === 0;
  for (let y = s + 1; y <= s + 4; y++) {
    if (pillar) { put(x, y, z, "smooth_quartz"); continue; }
    if (y === s + 1 || y === s + 4) { put(x, y, z, "smooth_quartz"); continue; }
    put(x, y, z, "glass_pane", paneProps(x, z));
  }
  // Warm lights behind some panes (interior cell one step inside).
  const lit = (x * 5 + s * 3 + z * 7) % 6 === 0;
  if (lit && !pillar) {
    const [dx, dz] = inward(x, z);
    const ix = x + dx, iz = z + dz;
    if (has(ix, iz)) put(ix, s + 2, iz, "glowstone");
  }
}

// Roof plant: two AC boxes and a lightning rod, all on the deck, interior only.
const deckOf = (x, z) => {
  const f1 = Math.max(minG + 5, G(x, z) + 5);
  return f1 + 5;
};
for (const [x0, x1] of [[6, 8], [18, 20]]) {
  for (let x = x0; x <= x1; x++) {
    for (let z = 3; z <= 5; z++) {
      if (!has(x, z) || isEdge(x, z)) continue;
      const dk = deckOf(x, z);
      put(x, dk + 1, z, "light_gray_concrete");
      put(x, dk + 2, z, "light_gray_concrete");
    }
  }
}
{
  const rx = 13, rz = 4;
  if (has(rx, rz) && !isEdge(rx, rz)) {
    const dk = deckOf(rx, rz);
    put(rx, dk + 1, rz, "lightning_rod");
  }
}

g.save(`${DIR}/${ID}.nbt`);
