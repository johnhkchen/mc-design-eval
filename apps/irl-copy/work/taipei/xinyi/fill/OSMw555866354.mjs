import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw555866354";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 85, H = 23, D = 24;
const ROOF = 11;      // roof deck sits at y = 11 (lidar: ~11 above lowest ground)
const SL = 5;         // storey line between the two storeys
const CORNICE = 10;   // top of the walls

const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, r] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(CORNICE, Math.round(r))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gr = (x, z) => ground.get(`${x},${z}`);

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};

function facesOf(x, z) {
  const f = [];
  for (const [name, [dx, dz]] of Object.entries(DIRS)) {
    if (!has(x + dx, z + dz)) f.push(name);
  }
  return f;
}
const isPerim = (x, z) => has(x, z) && facesOf(x, z).length > 0;
const isCorner = (x, z) => facesOf(x, z).length >= 2;

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Pass 1: foundations, shell, floors
for (const [x, z] of cells) {
  const gg = gr(x, z);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gg; y++) put(x, y, z, "stone_bricks");

  const perim = isPerim(x, z);
  if (perim) {
    const faces = facesOf(x, z);
    const corner = isCorner(x, z);
    const face = faces[0];
    const ns = face === "north" || face === "south";
    const idx = ns ? x : z;
    const pier = idx % 4 === 0;

    for (let y = gg; y <= CORNICE; y++) {
      let id = "white_concrete";
      let props;
      if (corner) {
        id = "white_concrete";
      } else if (y === gg) {
        id = "stone_bricks";                       // plinth / base course
      } else if (y === SL) {
        id = "light_gray_concrete";                // storey line
      } else if (y === CORNICE) {
        id = "white_concrete";                     // cornice
      } else if (y <= SL - 1) {
        // ground storey shopfront
        id = pier ? "white_concrete" : "light_blue_stained_glass";
      } else {
        // upper storey window grid of panes with concrete piers
        if (pier) {
          id = "white_concrete";
        } else {
          id = "glass_pane";
          props = ns
            ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
            : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
        }
      }
      put(x, y, z, id, props);
    }
  } else {
    // interior: floor slabs, air above (behind glass)
    if (gg <= CORNICE) put(x, gg, z, "smooth_stone");
    if (gg < SL) put(x, SL, z, "smooth_stone");
  }

  // Roof deck and parapet
  put(x, ROOF, z, "light_gray_concrete");
  if (perim) put(x, ROOF + 1, z, "white_concrete");
}

// Pass 2: entrances on the long north and south faces
for (const [x, z] of cells) {
  if (!isPerim(x, z) || isCorner(x, z)) continue;
  const faces = facesOf(x, z);
  const face = faces[0];
  if (face !== "north" && face !== "south") continue;
  const gg = gr(x, z);
  if (![12, 42, 72].includes(x)) continue;
  if (gg + 2 > SL - 1) continue;

  put(x, gg + 1, z, "dark_oak_door", {
    facing: face, half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(x, gg + 2, z, "dark_oak_door", {
    facing: face, half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // lintel / canopy band over the doorway
  put(x, gg + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Pass 3: warm lights in interior spaces, behind glass
for (const [x, z] of cells) {
  const gg = gr(x, z);
  if (isPerim(x, z)) {
    const faces = facesOf(x, z);
    if (isCorner(x, z)) continue;
    const face = faces[0];
    const ns = face === "north" || face === "south";
    const [odx, odz] = DIRS[face];
    const idx = ns ? x : z;
    const ix = x - odx;
    const iz = z - odz;
    if (!has(ix, iz) || isPerim(ix, iz)) continue;
    const igg = gr(ix, iz);

    // upper-storey glowstone behind window panes
    if (idx % 8 === 2 && igg <= 6) {
      put(ix, 7, iz, "glowstone");
    }
    // shopfront shroomlight behind ground-floor glass
    if (idx % 8 === 6 && gg + 2 <= SL - 1 && gg + 2 > igg) {
      put(ix, gg + 2, iz, "shroomlight");
    }
  } else {
    // interior ceiling lanterns / standing lanterns
    if (x % 12 === 6 && z % 8 === 4) {
      const ly = Math.max(gg + 1, 6);
      if (ly <= 9 && ly !== SL) put(x, ly, z, "lantern", { hanging: "false" });
    }
  }
}

// Pass 4: rooftop mechanical penthouse and antenna
let penthouseOk = true;
for (let x = 30; x <= 50 && penthouseOk; x++) {
  for (let z = 8; z <= 15; z++) {
    if (!has(x, z)) { penthouseOk = false; break; }
  }
}
if (penthouseOk) {
  for (let x = 30; x <= 50; x++) {
    for (let z = 8; z <= 15; z++) {
      const ring = x === 30 || x === 50 || z === 8 || z === 15;
      if (ring) {
        put(x, ROOF + 1, z, "light_gray_concrete");
        put(x, ROOF + 2, z, "light_gray_concrete");
      } else {
        if ((x + z) % 4 === 0) put(x, ROOF + 1, z, "iron_block");
      }
    }
  }
}
if (has(40, 12)) {
  for (let y = ROOF + 1; y <= ROOF + 6; y++) {
    put(40, y, 12, "iron_bars");
  }
}

g.save(`${DIR}/${ID}.nbt`);
