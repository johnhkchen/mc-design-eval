import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw540888743";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 13, H = 23, D = 12;
const g = new Voxels([W, H, D]);

// Record: roof ~11 above lowest ground, so two storeys of ~5 blocks, a band at
// y=5 (storey line), flat roof deck at y=10 (top face 11). Late-1990s/2000s
// Taipei mid-rise commercial: white tiled concrete piers, glass curtain panes,
// granite base, quartz cornice, shopfront ground floor with a dark canopy.
const ROOF_Y = 10;
const BAND_Y = 5;
const TOP_WALL = 9;

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gy] of cells) {
  G.set(key(x, z), Math.min(9, Math.max(0, Math.round(gy))));
}
const has = (x, z) => G.has(key(x, z));
const gnd = (x, z) => G.get(key(x, z));

function exposure(x, z) {
  return {
    n: !has(x, z - 1),
    s: !has(x, z + 1),
    w: !has(x - 1, z),
    e: !has(x + 1, z),
  };
}

function paneProps(face) {
  if (face === "ns") {
    return { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
  }
  return { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

// Pass 1: foundations, base course, storey slabs, roof deck and cornice.
for (const [x, z] of G.keys().map ? [...G.keys()].map((k) => k.split(",").map(Number)) : []) {
  const gc = gnd(x, z);
  const ex = exposure(x, z);
  const perim = ex.n || ex.s || ex.w || ex.e;

  for (let y = 0; y < gc; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, gc, z, perim ? "polished_granite" : "smooth_stone");

  if (gc <= 4) g.set(x, BAND_Y, z, "smooth_quartz");

  g.set(x, ROOF_Y, z, perim ? "smooth_quartz" : "gray_concrete");
}

// Pass 2: facade walls, piers, glass panes and ground-floor shopfront.
for (const [x, z] of [...G.keys()].map((k) => k.split(",").map(Number))) {
  const gc = gnd(x, z);
  const ex = exposure(x, z);
  const nExp = [ex.n, ex.s, ex.w, ex.e].filter(Boolean).length;
  if (nExp === 0) continue;

  const isNS = ex.n || ex.s;
  const primaryFace = isNS ? "ns" : "ew";
  const idx = isNS ? x : z;
  const corner = nExp >= 2;
  const isPier = corner || idx % 2 === 0;

  for (let y = gc + 1; y <= TOP_WALL; y++) {
    if (y === BAND_Y || y === ROOF_Y) continue;
    if (isPier) {
      g.set(x, y, z, "white_concrete");
    } else {
      g.set(x, y, z, "glass_pane", paneProps(primaryFace));
    }
  }
}

// Pass 3: entrance on the south-most exposed face, with door and canopy.
{
  const southCells = [...G.keys()]
    .map((k) => k.split(",").map(Number))
    .filter(([x, z]) => exposure(x, z).s);
  if (southCells.length) {
    const xs = southCells.map(([x]) => x).sort((a, b) => a - b);
    const midX = xs[Math.floor(xs.length / 2)];
    const ent = southCells.find(([x]) => x === midX);
    if (ent) {
      const [ex0, ez0] = ent;
      const gc = gnd(ex0, ez0);
      const doorLow = gc + 1;
      const doorUp = gc + 2;
      if (doorUp <= TOP_WALL && doorUp !== BAND_Y) {
        g.set(ex0, doorLow, ez0, "dark_oak_door", {
          facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
        });
        g.set(ex0, doorUp, ez0, "dark_oak_door", {
          facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
        });
      }
      // Canopy: dark slabs across the entrance bay, at the head of the door.
      const canopyY = gc + 3;
      if (canopyY <= TOP_WALL && canopyY !== BAND_Y) {
        for (const dx of [-1, 0, 1]) {
          const cx = ex0 + dx;
          if (has(cx, ez0) && exposure(cx, ez0).s) {
            g.set(cx, canopyY, ez0, "dark_oak_slab", { type: "top", waterlogged: "false" });
          }
        }
      }
    }
  }
}

// Pass 4: warm light behind some upper-storey windows (glowstone on the interior side).
for (const [x, z] of [...G.keys()].map((k) => k.split(",").map(Number))) {
  const gc = gnd(x, z);
  const ex = exposure(x, z);
  const nExp = [ex.n, ex.s, ex.w, ex.e].filter(Boolean).length;
  if (nExp !== 1) continue;
  const isNS = ex.n || ex.s;
  const idx = isNS ? x : z;
  if (idx % 6 !== 1) continue;
  const y = 7;
  if (y <= gc || y > TOP_WALL) continue;

  let ix = x, iz = z;
  if (ex.n) iz = z + 1;
  else if (ex.s) iz = z - 1;
  else if (ex.w) ix = x + 1;
  else if (ex.e) ix = x - 1;

  if (!has(ix, iz)) continue;
  const inner = exposure(ix, iz);
  if (inner.n || inner.s || inner.w || inner.e) continue;
  g.set(ix, y, iz, "glowstone");
}

// Pass 5: small roof plant box on the deck, centred on the footprint.
for (let x = 5; x <= 7; x++) {
  for (let z = 4; z <= 6; z++) {
    if (!has(x, z)) continue;
    const ex = exposure(x, z);
    if (ex.n || ex.s || ex.w || ex.e) continue;
    g.set(x, ROOF_Y + 1, z, "light_gray_concrete");
  }
}

g.save(`${dir}/${id}.nbt`);
