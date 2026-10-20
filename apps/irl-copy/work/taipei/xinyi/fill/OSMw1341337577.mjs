import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1341337577";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 7, H = 19, D = 8;
const g = new Voxels([W, H, D]);

// ---- footprint lookups -------------------------------------------------
const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, gr);
const has = (x, z) => gmap.has(`${x},${z}`);
const gnd = (x, z) => gmap.get(`${x},${z}`);

const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const maxGr = Math.max(...cells.map(c => c[2]));

// flat roof: 7 blocks above the lowest ground (cap row = index 6);
// downhill cells gain storeys because their floors start lower
const ROOF = Math.max(6, maxGr + 6);

const faces = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];
const exposed = (x, z) => faces.filter(f => !has(x + f.dx, z + f.dz));
const isInterior = (x, z) => has(x, z) && exposed(x, z).length === 0;

// main entrance: middle of the south (max z) street front
const doorX = Math.floor((minX + maxX) / 2);
const isDoor = (x, z) => x === doorX && z === maxZ;

// ---- build each column -------------------------------------------------
for (const [x, z, gr] of cells) {
  const exp = exposed(x, z);
  const perim = exp.length > 0;

  // foundation up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= ROOF; y++) {
    const rel = y - gr;
    const s = Math.floor(rel / 5);
    const r = rel % 5;

    // roof surface
    if (y === ROOF) {
      if (perim) g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      else g.set(x, y, z, "gray_concrete");
      continue;
    }

    // interior: floor slabs at storey starts, air in between
    if (!perim) {
      if (r === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }

    // exterior shell
    if (y === ROOF - 1) {
      g.set(x, y, z, "smooth_quartz");                       // parapet
      continue;
    }
    if (rel === 0) {
      g.set(x, y, z, s === 0 ? "stone_bricks" : "red_terracotta"); // base course / storey line
      continue;
    }
    if (r === 4) {
      g.set(x, y, z, "red_terracotta");                      // storey band
      continue;
    }
    if (r === 0) {
      g.set(x, y, z, "red_terracotta");                      // storey band
      continue;
    }

    // window zone (r = 1..3)
    if (isDoor(x, z) && (rel === 1 || rel === 2)) {
      g.set(x, y, z, "oak_door", {
        facing: "south",
        half: rel === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (exp.length >= 2) {
      // corners read as piers
      g.set(x, y, z, "polished_andesite");
      continue;
    }

    const f = exp[0];
    const along = f.dx !== 0 ? z - minZ : x - minX;
    const span = f.dx !== 0 ? maxZ - minZ : maxX - minX;
    const pier = along % 3 === 0 || along === span;

    if (pier) {
      g.set(x, y, z, "polished_andesite");
      continue;
    }

    const paneProps = f.dz !== 0
      ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    g.set(x, y, z, "glass_pane", paneProps);

    // warm light behind the glass, in the air cell just inside
    if (s === 0 && rel === 2 && along % 6 === 1) {
      const ix = x - f.dx, iz = z - f.dz;
      if (isInterior(ix, iz) && y > gnd(ix, iz) && (y - gnd(ix, iz)) % 5 !== 0 && y < ROOF - 1) {
        g.set(ix, y, iz, "glowstone");
      }
    }
  }
}

// ---- roof plant: a small screened box with a lantern ----------------------
if (ROOF + 2 < H) {
  for (let x = 2; x <= 3; x++) {
    for (let z = 2; z <= 4; z++) {
      if (isInterior(x, z)) g.set(x, ROOF + 1, z, "white_concrete");
    }
  }
  if (isInterior(2, 3)) g.set(2, ROOF + 2, 3, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
