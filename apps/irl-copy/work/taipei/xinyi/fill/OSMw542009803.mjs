import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542009803";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 16 x 18, roof ~11 above lowest ground: a two-storey Xinyi-era
// commercial block of smooth quartz tile, tinted glass and a parapet.
const W = 16, H = 23, D = 18;
const ROOF = 11;      // roof slab level
const TOP = 10;       // top of wall course
const BELT = 5;       // storey line between the two floors
const SHOP_TOP = 4;   // top of shopfront glazing
const UP_LO = 6, UP_HI = 9; // upper-floor window band

const g = new Voxels([W, H, D]);

// Footprint: ground per cell, clamped to the wall band
const ground = new Map();
for (const c of cells) {
  const [x, z, gy] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.min(TOP, Math.max(0, Math.round(gy ?? 0))));
}
const inFp = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const missing = (x, z) => ({
  n: !inFp(x, z - 1), s: !inFp(x, z + 1), w: !inFp(x - 1, z), e: !inFp(x + 1, z),
});
const isEdge = (x, z) => { const m = missing(x, z); return m.n || m.s || m.w || m.e; };
const nearEdge = (x, z) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) =>
    inFp(x + dx, z + dz) && isEdge(x + dx, z + dz));

// Main entrance: middle of the south (max z) edge
let maxZ = -1;
for (const k of ground.keys()) maxZ = Math.max(maxZ, Number(k.split(",")[1]));
const southXs = [...ground.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => z === maxZ && isEdge(x, z))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const ex = southXs.length ? southXs[Math.floor(southXs.length / 2)] : -1;

const paneProps = (axis) =>
  axis === "ns"
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

for (const [key, gc] of ground) {
  const [x, z] = key.split(",").map(Number);
  const m = missing(x, z);
  const edge = isEdge(x, z);

  // Foundation under every footprint cell
  for (let y = 0; y < gc; y++) g.set(x, y, z, "polished_andesite");

  if (edge) {
    // Facade plane: east/west faces run along z, north/south faces along x
    const onSideFace = m.w || m.e;
    const axis = onSideFace ? "ns" : "ew";
    const along = onSideFace ? z : x;
    const mullion = along % 3 === 0;
    const isEntrance = z === maxZ && x === ex;

    for (let y = gc; y <= TOP; y++) {
      let id = "smooth_quartz";
      let props;
      if (y === gc) id = "polished_andesite";          // base course
      else if (y === BELT) id = "white_concrete";      // storey line

      if (isEntrance && y >= gc + 1 && y <= gc + 2 && gc + 2 <= SHOP_TOP) {
        const half = y === gc + 1 ? "lower" : "upper";
        g.set(x, y, z, "oak_door", {
          facing: "south", half, hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (!mullion && y > gc) {
        if (y <= SHOP_TOP) id = "light_blue_stained_glass";                  // shopfront
        else if (y >= UP_LO && y <= UP_HI) { id = "light_blue_stained_glass_pane"; props = paneProps(axis); }
      }
      if (isEntrance && y === SHOP_TOP + 1 - 0 && y <= TOP) id = "smooth_quartz"; // canopy head
      g.set(x, y, z, id, props);
    }

    // Parapet with capping
    g.set(x, ROOF, z, "smooth_quartz");
    g.set(x, ROOF + 1, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
  } else {
    // Interior core, with air gaps behind the facade glazing
    const ring = nearEdge(x, z);
    const penthouse = x >= 5 && x <= 10 && z >= 6 && z <= 11;
    for (let y = gc; y <= TOP; y++) {
      const airShop = ring && y > gc && y <= SHOP_TOP;
      const airUp = ring && y >= UP_LO && y <= UP_HI;
      if (airShop || airUp) continue;
      g.set(x, y, z, "light_gray_concrete");
    }
    // Roof slab
    g.set(x, ROOF, z, "light_gray_concrete");

    // Warm lights in the air gaps behind the glass
    if (ring) {
      if (gc + 2 <= SHOP_TOP && (x + z) % 4 === 0) g.set(x, gc + 2, z, "glowstone");
      if ((x + z) % 3 === 0) g.set(x, 7, z, "shroomlight");
    }

    // Roof penthouse and plant
    if (penthouse) {
      const perim = x === 5 || x === 10 || z === 6 || z === 11;
      for (let y = ROOF + 1; y <= ROOF + 2; y++) {
        g.set(x, y, z, perim ? "light_blue_stained_glass" : "smooth_quartz");
      }
      g.set(x, ROOF + 3, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
    } else if ((x * 3 + z) % 7 === 0) {
      g.set(x, ROOF + 1, z, "iron_block");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
