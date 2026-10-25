import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499760";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 7, H = 18, D = 7;
const g = new Voxels([W, H, D]);
const cap = (y) => Math.min(y, H - 1);

const byXZ = new Map();
for (const [x, z, gr, rf] of cells) byXZ.set(`${x},${z}`, { gr, rf });

const grounds = cells.map((c) => c[2]);
const gmin = Math.min(...grounds);
const gmax = Math.max(...grounds);
const rfAvg = cells.reduce((s, c) => s + c[3], 0) / cells.length;

// One storey-and-a-half massing shared by the whole block so walls and roof read as one building.
const eave = cap(Math.max(gmin + 4, gmax + 3));          // wall top, uniform
const ridge = cap(Math.max(eave + 2, Math.round(rfAvg))); // ridge, uniform, ~6 above lowest ground

for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    const c = byXZ.get(`${x},${z}`);
    if (!c) continue;
    const gr = c.gr;
    const d = Math.min(x, 6 - x, z, 6 - z); // 0 = perimeter ring

    // Foundation: solid from y 0 up to this cell's ground
    for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

    if (d === 0) {
      // Continuous perimeter wall from ground to eave
      for (let y = gr; y < eave; y++) {
        g.set(x, y, z, y === gr ? "stone_bricks" : "stone");
      }

      let side = null, idx = 0;
      if (z === 0) { side = "north"; idx = x; }
      else if (z === 6) { side = "south"; idx = x; }
      else if (x === 0) { side = "west"; idx = z; }
      else if (x === 6) { side = "east"; idx = z; }

      const corner = (x === 0 || x === 6) && (z === 0 || z === 6);
      const isWindow = side !== null && !corner && [1, 3, 5].includes(idx);

      if (isWindow) {
        const pane = side === "north" || side === "south"
          ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
          : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
        for (const y of [gr + 1, gr + 2]) {
          if (y >= eave) continue;
          if (side === "south" && idx === 3 && y <= gr + 1) continue; // doorway
          g.set(x, y, z, "glass_pane", pane);
        }
        // Sill course under each window on the front (south) and north faces
        if (side === "south" && idx !== 3) g.set(x, gr + 1, z, "glass_pane", pane);
        // Warm light behind two north-face windows
        if (side === "north" && (idx === 1 || idx === 5)) {
          g.set(x, gr + 1, 1, "glowstone");
        }
      }

      // Entrance on the south face, centre bay
      if (side === "south" && idx === 3) {
        g.set(x, gr, z, "spruce_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        g.set(x, gr + 1, z, "spruce_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        // Lintel above the door
        g.set(x, gr + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      }
      // Lanterns flanking the door
      if (side === "south" && (idx === 2 || idx === 4)) {
        g.set(x, gr + 2, z, "lantern", { hanging: "false", waterlogged: "false" });
      }

      // Cornice band just under the roof
      g.set(x, eave - 1, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    } else {
      // Interior: floor slab at ground, air above, ceiling at eave
      g.set(x, gr, z, "stone_bricks");
      for (let y = eave; y < eave + 1 && y < H; y++) g.set(x, y, z, "deepslate_tiles");
    }

    // Hipped slate roof, stair-stepped on slopes, flat at the ridge
    const roofTop = cap(Math.min(ridge, eave + d + 1));
    for (let y = eave; y < roofTop; y++) {
      const sloped = roofTop === eave + d + 1 && roofTop <= ridge && d < 3;
      if (y === roofTop - 1 && sloped) {
        let facing;
        if (x === d) facing = "west";
        else if (x === 6 - d) facing = "east";
        else if (z === d) facing = "north";
        else facing = "south";
        g.set(x, y, z, "deepslate_tile_stairs", { facing, half: "bottom", shape: "straight", waterlogged: "false" });
      } else {
        g.set(x, y, z, "deepslate_tiles");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
