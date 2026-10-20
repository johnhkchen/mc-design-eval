import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw827011414";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Record: 24 x 11 footprint, roof ~26 blocks above lowest ground, five storeys of ~5 blocks.
// Reads as a late-1990s/2000s Taipei office block: granite base, white concrete storey lines,
// light-grey piers and spandrels, blue-tinted glazing, a shopfront on the street (south) face,
// a rooftop plant penthouse and a lightning-rod mast.
const W = 24, H = 38, D = 11;
const TOP = 26;     // roof surface
const STOREY = 5;   // storey lines at y % 5 == 0

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => (p ? g.set(x, y, z, id, p) : g.set(x, y, z, id));

const ground = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, gr]));
const has = (x, z) => ground.has(`${x},${z}`);
const xs = cells.map(c => c[0]);
const zs = cells.map(c => c[1]);
const minx = Math.min(...xs), maxx = Math.max(...xs);
const minz = Math.min(...zs), maxz = Math.max(...zs);
const cx = Math.floor((minx + maxx) / 2);

// Glass pane connection states: panes on north/south faces join east-west, others north-south.
const PANE_NS_FACE = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_EW_FACE = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const miss = { n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z) };
  const nMiss = Object.values(miss).filter(Boolean).length;
  const perim = nMiss > 0;
  const corner = (miss.n || miss.s) && (miss.w || miss.e);
  const face = nMiss === 1 ? Object.keys(miss).find(k => miss[k]) : null;
  const along = (face === "n" || face === "s") ? x - minx : z - minz;
  const pier = corner || along % 3 === 0;
  const isEntrance = face === "s" && x === cx;
  const shopBay = face === "s" && Math.abs(x - cx) <= 2;
  const inward = face === "n" ? [x, z + 1]
    : face === "s" ? [x, z - 1]
    : face === "w" ? [x + 1, z]
    : face === "e" ? [x - 1, z] : null;
  const paneProps = (face === "n" || face === "s") ? PANE_NS_FACE : PANE_EW_FACE;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y < TOP; y++) {
    const sub = y % STOREY;

    // Interior cells: only floor slabs and the lowest floor; the rest is air behind the glass.
    if (!perim) {
      if (y === gr || sub === 0) put(x, y, z, "smooth_stone");
      continue;
    }

    // Facade shell.
    if (y === gr) { put(x, y, z, "polished_granite"); continue; }          // base course
    if (sub === 0) { put(x, y, z, "white_concrete"); continue; }            // storey line

    if (isEntrance && (y === gr + 1 || y === gr + 2)) continue;             // door placed later
    if (shopBay && y === gr + 3) { put(x, y, z, "polished_granite"); continue; } // shop fascia
    if (shopBay && y > gr && y <= gr + 2) {                                 // shopfront glazing
      put(x, y, z, "light_blue_stained_glass_pane", paneProps);
      continue;
    }

    if (corner || pier || sub === 4) { put(x, y, z, "light_gray_concrete"); continue; } // piers, spandrels

    // Window pane with air behind it.
    put(x, y, z, "light_blue_stained_glass_pane", paneProps);

    // Warm light behind some windows (odd storeys, every sixth bay, mid-height).
    const k = Math.floor(y / STOREY);
    if (inward && sub === 2 && k % 2 === 1 && along % 6 === 1) {
      const [ix, iz] = inward;
      if (has(ix, iz) && ground.get(`${ix},${iz}`) <= y) {
        put(ix, y, iz, "shroomlight");
      }
    }
  }

  // Roof surface and parapet (perimeter only), standing on the body below.
  put(x, TOP, z, perim ? "white_concrete" : "smooth_stone");
  if (perim) put(x, TOP + 1, z, "white_concrete");
}

// Entrance doors on the street face.
const gd = ground.get(`${cx},${maxz}`);
if (gd !== undefined) {
  put(cx, gd + 1, maxz, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(cx, gd + 2, maxz, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Warm lantern inside the lobby, standing on the lowest interior floor.
const gl = ground.get(`${cx},${maxz - 1}`);
if (gl !== undefined) {
  put(cx, gl + 1, maxz - 1, "lantern", { hanging: "false", waterlogged: "false" });
}

// Rooftop plant penthouse, centred on the roof, 4 storeys of ring walls with air inside.
const pa = minx + 8, pb = minx + 15, pza = minz + 3, pzb = minz + 7;
for (let x = pa; x <= pb; x++) {
  for (let z = pza; z <= pzb; z++) {
    if (!has(x, z)) continue;
    put(x, 31, z, "smooth_stone"); // cap
    const ring = x === pa || x === pb || z === pza || z === pzb;
    if (!ring) continue;
    const corner2 = (x === pa || x === pb) && (z === pza || z === pzb);
    for (let y = 27; y <= 30; y++) {
      if (corner2 || y === 27 || y === 30) {
        put(x, y, z, "light_gray_concrete");
      } else {
        put(x, y, z, "light_blue_stained_glass");
      }
    }
  }
}

// Lightning-rod mast on the penthouse.
const mx = minx + 12, mz = minz + 5;
if (has(mx, mz)) {
  for (let y = 32; y <= 35; y++) {
    put(mx, y, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
