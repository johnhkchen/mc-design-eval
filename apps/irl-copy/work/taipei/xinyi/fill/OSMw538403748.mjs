import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538403748";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 17 x 23 x 17 volume. y 0 = lowest ground under the footprint.
// Record: roof about 11 blocks above lowest ground, so a two-storey
// 1990s commercial block: shopfront ground floor, one upper storey of
// tinted-glass windows, a cornice and a parapet with a flat roof.
const W = 17, H = 23, D = 17;
const ROOF_Y = 10;      // roof deck layer; roof surface at y = 11
const STOREY_LINE = 5;  // storey band and upper floor slab
const SHOP_TOP = 3;     // shopfront glass runs ground..3, lintel at 4
const CORNICE_Y = 9;

const g = new Voxels([W, H, D]);

const k = (x, z) => `${x},${z}`;
const foot = new Map();
for (const [x, z, gr] of cells) foot.set(k(x, z), Math.round(gr));

const has = (x, z) => foot.has(k(x, z));
const groundOf = (x, z) => foot.get(k(x, z));

function faces(x, z) {
  return {
    n: !has(x, z - 1),
    s: !has(x, z + 1),
    w: !has(x - 1, z),
    e: !has(x + 1, z),
  };
}

// Pass 1: foundations, floors, walls, shopfronts, windows, roof.
for (const [x, z, gr] of cells) {
  const ground = Math.round(gr);
  const f = faces(x, z);
  const edge = f.n || f.s || f.w || f.e;
  const zFace = f.n || f.s;
  const c = zFace ? x : z; // position along the exposed face

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < ground && y < H; y++) {
    g.set(x, y, z, "stone_bricks");
  }

  // Above ground-level roof is only built where the cell is below the roof line.
  if (ground > ROOF_Y) continue;

  // Interior floor at the ground level (the walkable floor) and the storey slab.
  if (!edge) {
    g.set(x, ground, z, "smooth_stone");
    if (STOREY_LINE >= ground) g.set(x, STOREY_LINE, z, "light_gray_concrete");
    g.set(x, ROOF_Y, z, "light_gray_concrete");
    continue;
  }

  // Edge cells: facade.
  for (let y = ground; y < ROOF_Y; y++) {
    if (y === ground) {
      // Base course.
      g.set(x, y, z, "stone_bricks");
    } else if (y <= SHOP_TOP) {
      // Shopfront: quartz pillars, clear glass bays, entrance door at centre south.
      if (f.s && x === 8 && y === ground) {
        g.set(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (f.s && x === 8 && y === ground + 1) {
        g.set(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (c % 3 === 0) {
        g.set(x, y, z, "smooth_quartz");
      } else {
        g.set(x, y, z, "glass");
      }
    } else if (y === SHOP_TOP + 1) {
      // Lintel band over the shopfronts.
      g.set(x, y, z, "stone_bricks");
    } else if (y === STOREY_LINE) {
      // Storey band.
      g.set(x, y, z, "light_gray_concrete");
    } else if (y <= CORNICE_Y - 2) {
      // Upper-storey window grid: quartz mullions, tinted glass panes.
      if (c % 3 === 0) {
        g.set(x, y, z, "smooth_quartz");
      } else if (y === 8) {
        // Spandrel under each window.
        g.set(x, y, z, "light_gray_concrete");
      } else {
        const props = zFace
          ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
        g.set(x, y, z, "light_blue_stained_glass_pane", props);
      }
    } else if (y === CORNICE_Y) {
      // Cornice.
      g.set(x, y, z, "smooth_quartz");
    } else {
      // Parapet course.
      g.set(x, y, z, "smooth_quartz");
    }
  }

  // Roof deck at the top of the building. Parapet ring on edge cells.
  g.set(x, ROOF_Y, z, edge ? "smooth_quartz" : "light_gray_concrete");

  // Floor slab across the upper storey interior.
  if (STOREY_LINE >= ground) {
    g.set(x, STOREY_LINE, z, "light_gray_concrete");
  }
}

// Ground floor interior floor surface for non-edge cells already set above.

// Roof equipment: a small plant room and four condenser units, standing on the roof deck.
const roofOK = (x, z) => has(x, z) && groundOf(x, z) <= ROOF_Y;

for (let x = 6; x <= 9; x++) {
  for (let z = 6; z <= 9; z++) {
    if (!roofOK(x, z)) continue;
    const plantEdge = x === 6 || x === 9 || z === 6 || z === 9;
    for (let y = ROOF_Y + 1; y <= ROOF_Y + 2; y++) {
      if (plantEdge) g.set(x, y, z, "light_gray_concrete");
    }
    if (plantEdge === false) {
      // Roof of plant room.
      g.set(x, ROOF_Y + 3, z, "light_gray_concrete");
    }
  }
}
for (const [x, z] of [[3, 3], [3, 13], [13, 3], [13, 13]]) {
  if (!roofOK(x, z)) continue;
  g.set(x, ROOF_Y + 1, z, "iron_block");
}

// Pass 2: warm lights behind some upper windows (inside the building, behind the glass).
for (const [x, z, gr] of cells) {
  const ground = Math.round(gr);
  const f = faces(x, z);
  const edge = f.n || f.s || f.w || f.e;
  if (!edge) continue;
  const zFace = f.n || f.s;
  const c = zFace ? x : z;
  const y = 7;
  if (y < ground || c % 3 === 0) continue;
  if ((x * 5 + z * 3) % 4 !== 0) continue;

  const dx = f.w ? 1 : f.e ? -1 : 0;
  const dz = f.n ? 1 : f.s ? -1 : 0;
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz)) continue;
  if (groundOf(ix, iz) > y) continue;
  g.set(ix, y, iz, "shroomlight");
}

g.save(`${DIR}/${ID}.nbt`);
