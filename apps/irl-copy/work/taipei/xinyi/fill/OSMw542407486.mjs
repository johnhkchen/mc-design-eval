import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542407486";
const W = 11, H = 23, D = 19;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const L = Math.min(...cells.map((c) => c[2])); // lowest ground under the building
const DECK = L + 10;                            // roof deck block; roof surface at L+11
const PARAPET = L + 11;

// Outward directions and their [dx, dz]
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const faces = (x, z) => Object.keys(DIRS).filter((d) => !has(x + DIRS[d][0], z + DIRS[d][1]));

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// 1. Foundation: solid from y 0 up to each cell's ground
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

// 2. Floor slab between storeys and roof deck, footprint-wide
for (const [x, z, gr] of cells) {
  if (L + 5 >= gr) put(x, L + 5, z, "smooth_quartz");
  if (DECK >= gr) put(x, DECK, z, "smooth_stone");
}

// 3. Facade: walls, base course, window bands, parapet
for (const [x, z, gr] of cells) {
  const e = faces(x, z);
  if (e.length === 0) continue; // interior cell: air behind the shell

  const corner = e.length >= 2;
  const f = e[0];
  const horiz = f === "north" || f === "south"; // wall runs along x
  const t = horiz ? x : z;                      // position along the face
  const pier = corner || t % 3 === 0;
  const paneProps = horiz
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const lit = !pier && t % 3 === 2 && Math.floor(t / 3) % 2 === 0;
  const [dx, dz] = DIRS[f];
  const ix = x - dx, iz = z - dz; // interior cell behind this wall

  for (let y = gr; y <= PARAPET; y++) {
    if (y === PARAPET) {
      put(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (y === gr) {
      put(x, y, z, "polished_andesite"); // base course
      continue;
    }
    // Ground storey: glass L+1..L+3, lintel L+4
    if (y >= L + 1 && y <= L + 3) {
      if (pier) put(x, y, z, "smooth_quartz");
      else put(x, y, z, "light_blue_stained_glass_pane", paneProps);
      if (lit && y === L + 2 && has(ix, iz)) put(ix, y, iz, "glowstone");
      continue;
    }
    if (y === L + 4) {
      put(x, y, z, "smooth_quartz");
      continue;
    }
    // Upper storey: sill L+6 (slab), glass L+7..L+8, lintel L+9
    if (y === L + 6) {
      if (pier) put(x, y, z, "smooth_quartz");
      else put(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (y >= L + 7 && y <= L + 8) {
      if (pier) put(x, y, z, "smooth_quartz");
      else put(x, y, z, "light_blue_stained_glass_pane", paneProps);
      if (lit && y === L + 8 && has(ix, iz)) put(ix, y, iz, "glowstone");
      continue;
    }
    // Plain wall (L+5 floor line, L+9 lintel, L+10 cornice course)
    put(x, y, z, "smooth_quartz");
  }
}

// 4. Entrance: door on the south face, centred along the run
const southCells = cells
  .filter(([x, z]) => faces(x, z).includes("south") && faces(x, z).length === 1)
  .sort((a, b) => a[0] - b[0]);
if (southCells.length) {
  const [dxp, dzp, dgr] = southCells[Math.floor(southCells.length / 2)];
  put(dxp, dgr, dzp, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dxp, dgr + 1, dzp, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Warm light flanking the entrance at head height
  for (const off of [-1, 1]) {
    const [lx, lz] = [dxp + off, dzp];
    if (has(lx, lz) && faces(lx, lz).length === 1 && faces(lx, lz).includes("south")) {
      put(lx, dgr + 3, lz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// 5. Roof equipment: a water tank on the deck, centred on the footprint
for (let x = 4; x <= 6; x++) {
  for (let z = 8; z <= 10; z++) {
    if (!has(x, z)) continue;
    put(x, DECK + 1, z, "white_concrete");
    put(x, DECK + 2, z, "white_concrete");
    put(x, DECK + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
