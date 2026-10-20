import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE91-0069-11F";
const W = 134, H = 66, D = 19;
const ROOF = 52;        // roof slab level
const PARAPET = ROOF + 3;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells ?? []);
const cells = list.map(c => (Array.isArray(c) ? c : [c.x, c.z, c.ground]))
  .map(([x, z, g]) => [x, z, Math.max(0, Math.min(40, Math.round(g ?? 0)))]);

const G = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const has = (x, z) => G.has(`${x},${z}`);
const groundAt = (x, z) => G.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
};

const PANE_Z = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_X = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const SLAB_BOTTOM = { type: "bottom", waterlogged: "false" };

// Pass 1: foundations and per-cell envelope
for (const [x, z, gr] of cells) {
  const per = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "minecraft:stone");

  // exposed face: z-facing (street/back) or x-facing (ends)
  const zFace = !has(x, z - 1) || !has(x, z + 1);
  const u = zFace ? x : z;
  const inX = zFace ? 0 : (x === 0 ? 1 : -1);
  const inZ = zFace ? (z === 0 ? 1 : -1) : 0;
  const paneProps = zFace ? PANE_Z : PANE_X;
  const nt = (Math.floor(gr / 5) + 1) * 5; // first storey line above ground
  const inwardOk = has(x + inX, z + inZ);
  const deepOk = has(x + 2 * inX, z + 2 * inZ);

  for (let y = gr; y <= ROOF; y++) {
    if (y === gr) {
      put(x, y, z, per ? "minecraft:polished_andesite" : "minecraft:light_gray_concrete");
      continue;
    }
    if (y === ROOF) {
      put(x, y, z, "minecraft:smooth_stone");
      continue;
    }
    if (y % 5 === 0) {
      // storey line: spandrel on facade, floor slab inside
      put(x, y, z, per ? "minecraft:white_concrete" : "minecraft:light_gray_concrete");
      continue;
    }
    if (!per) continue; // interior: open floor plate

    if (y < nt) {
      // ground-floor shopfront zone, recessed one block behind the frame
      if (y === nt - 1) {
        put(x, y, z, "minecraft:orange_terracotta");            // fascia sign band
      } else if (u % 4 === 0) {
        put(x, y, z, "minecraft:dark_oak_planks");              // shopfront mullion
      } else {
        put(x, y, z, "minecraft:gray_concrete");                // dark reveal
        if (inwardOk && y >= groundAt(x + inX, z + inZ)) {
          put(x + inX, y, z + inZ, "minecraft:glass");          // shopfront glass, recessed
        }
        if (u % 12 === 6 && y === gr + 2 && deepOk) {
          put(x + 2 * inX, y, z + 2 * inZ, "minecraft:glowstone"); // warm shop light
        }
      }
      continue;
    }

    const r = y % 5;
    if (r === 1) {
      put(x, y, z, "minecraft:light_gray_concrete");            // transom band (frame)
    } else if (u % 4 === 0) {
      put(x, y, z, "minecraft:white_concrete");                 // window mullion (proud)
    } else {
      put(x, y, z, "minecraft:gray_concrete");                  // dark reveal in the opening
      if (inwardOk && y >= groundAt(x + inX, z + inZ)) {
        put(x + inX, y, z + inZ, "minecraft:light_blue_stained_glass_pane", paneProps); // glass set back
      }
      if (u % 8 === 3 && r === 3 && deepOk) {
        put(x + 2 * inX, y, z + 2 * inZ, "minecraft:glowstone"); // lit office bay behind glass
      }
    }
  }
}

// Pass 2: parapet and cap on perimeter
for (const [x, z] of cells) {
  const per = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  if (!per) continue;
  put(x, ROOF + 1, z, "minecraft:white_concrete");
  put(x, ROOF + 2, z, "minecraft:white_concrete");
  put(x, PARAPET, z, "minecraft:stone_brick_slab", SLAB_BOTTOM);
}

// Pass 3: entrances (two glazed-door bays on the street face, recessed behind a canopy line)
for (const dx of [33, 93]) {
  const gr = G.get(`${dx},0`);
  if (gr === undefined) continue;
  const dProps = { facing: "north", hinge: "left", open: "false", powered: "false" };
  put(dx, gr + 1, 1, "minecraft:dark_oak_door", { ...dProps, half: "lower" });
  put(dx, gr + 2, 1, "minecraft:dark_oak_door", { ...dProps, half: "upper" });
  // lit canopy light above the door, under the fascia
  const nt = (Math.floor(gr / 5) + 1) * 5;
  if (nt - 1 > gr + 2) put(dx, nt - 2, 1, "minecraft:lantern", { hanging: "true", waterlogged: "false" });
}

// Pass 4: roof equipment - central mechanical penthouse and AC plant
for (const [x, z] of cells) {
  if (x >= 40 && x <= 93 && z >= 6 && z <= 12) {
    put(x, ROOF + 1, z, "minecraft:light_gray_concrete");
    put(x, ROOF + 2, z, "minecraft:light_gray_concrete");
    put(x, ROOF + 3, z, "minecraft:light_gray_concrete");
    put(x, ROOF + 4, z, "minecraft:smooth_stone_slab", SLAB_BOTTOM);
  }
  const acA = x >= 10 && x <= 15 && z >= 4 && z <= 7;
  const acB = x >= 112 && x <= 118 && z >= 11 && z <= 14;
  if (acA || acB) {
    put(x, ROOF + 1, z, "minecraft:stone_bricks");
    put(x, ROOF + 2, z, "minecraft:stone_bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
