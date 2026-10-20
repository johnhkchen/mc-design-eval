import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1341337627";
const W = 41, H = 19, D = 13;
const ROOF = 6;      // roof deck / cornice level
const PARAPET = 7;   // parapet course on the edge
const LAST_WALL = 5; // top of the storey walls

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.min(H - 1, Math.max(0, Math.round(gr))));
}

const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const set = (x, y, z, id, p) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const PANE_X = { east: "true", west: "true", north: "false", south: "false" };  // panes on north/south faces
const PANE_Z = { north: "true", south: "true", east: "false", west: "false" };  // panes on east/west faces

for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const base = gnd(x, z);

  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < base; y++) set(x, y, z, "stone_bricks");

  const nExp = !has(x, z - 1);
  const sExp = !has(x, z + 1);
  const wExp = !has(x - 1, z);
  const eExp = !has(x + 1, z);
  const edge = nExp || sExp || wExp || eExp;

  if (!edge) {
    // Interior: ground-floor slab, upper floor slab, roof deck; air between
    set(x, base, z, "smooth_stone");
    if (base < 3) set(x, 3, z, "smooth_stone");
    if (base <= ROOF) {
      set(x, ROOF, z, "light_gray_concrete");
      // roof plant: small AC units on the deck
      if (x % 9 === 4 && z === 6) set(x, ROOF + 1, z, "iron_block");
    }
    continue;
  }

  const xFacade = nExp || sExp; // long street faces run along x
  const outsideNorth = nExp;

  // Plinth course at ground
  set(x, base, z, "polished_granite");

  // Storey walls
  for (let y = base + 1; y <= LAST_WALL && y < H; y++) {
    let id = "white_concrete";
    let p;

    if (y === 3) {
      // string course between storeys
      id = "smooth_stone";
    } else if (y < 3) {
      // shopfront band (ground floor)
      if (xFacade) {
        if (outsideNorth && x === 20 && (y === base + 1 || y === base + 2)) {
          id = "dark_oak_door";
          p = {
            facing: outsideNorth ? "south" : "north",
            half: y === base + 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          };
        } else if (x % 4 === 0) {
          id = "polished_andesite"; // shopfront pier
        } else {
          id = "glass_pane";
          p = PANE_X;
        }
      } else {
        if (z % 3 === 1) { id = "glass_pane"; p = PANE_Z; }
        else id = "polished_andesite";
      }
    } else {
      // upper windows, y = 4..5
      if (xFacade) {
        if (x % 3 === 0) {
          id = "white_concrete";
        } else {
          id = "glass_pane";
          p = PANE_X;
          // warm light behind some glass, inside the air gap
          if (y === 4 && x % 6 === 1) {
            const dz = outsideNorth ? 1 : -1;
            const nz = z + dz;
            if (has(x, nz) && gnd(x, nz) < 4) set(x, 4, nz, "glowstone");
          }
        }
      } else {
        if (z % 3 === 1) {
          id = "glass_pane";
          p = PANE_Z;
        } else {
          id = "light_gray_concrete";
        }
      }
    }

    // Keep the storey-line course at y=3 over any ground floor pier
    if (y === 3 && base < 3) id = "smooth_stone";
    set(x, y, z, id, p);
  }

  // Roof cornice and parapet
  if (base <= ROOF) {
    set(x, ROOF, z, "smooth_stone");
    set(x, PARAPET, z, "white_concrete");
  } else {
    // ground already above roof level: plain cap
    set(x, base, z, "smooth_stone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
