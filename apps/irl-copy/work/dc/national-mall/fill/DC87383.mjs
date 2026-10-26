import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87383.cells.json`, "utf8"));

// Vacant one-storey neoclassical pavilion in pale stone: flat smoothed roof,
// cornice and parapet, pilastered walls, glazed bays, framed south entrance.
const W = 9, H = 16, D = 10;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const C = cells.map(c => [Math.round(c[0]), Math.round(c[1]), Math.round(c[2]), Math.round(c[3])]);
const inF = new Set(C.map(([x, z]) => key(x, z)));
const has = (x, z) => inF.has(key(x, z));

// One clean roof level for the whole building: median of lidar roofs, clamped to
// sit at least four courses above the highest ground under the footprint.
const roofs = C.map(c => c[3]).sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];
const maxGround = Math.max(...C.map(c => c[2]));
const ROOF = Math.max(medRoof, maxGround + 4);

// Entrance: middle-most exposed cell on the south (+z) face.
const southCells = C
  .filter(([x, z]) => !has(x, z + 1))
  .sort((a, b) => a[0] - b[0]);
const door = southCells.length ? southCells[Math.floor(southCells.length / 2)] : null;
const doorX = door ? door[0] : -99;
const doorZ = door ? door[1] : -99;

// Pilaster columns on the south face flanking the door.
const pilasterXs = new Set([doorX - 2, doorX + 2]);

for (const [x, z, ground] of C) {
  const roof = ROOF;
  const Wedge = !has(x - 1, z);
  const Eedge = !has(x + 1, z);
  const Nedge = !has(x, z - 1);
  const Sedge = !has(x, z + 1);
  const perim = Wedge || Eedge || Nedge || Sedge;
  const corner = (Wedge || Eedge) && (Nedge || Sedge);
  const isDoor = x === doorX && z === doorZ && Sedge;
  const onSouth = Sedge && !corner;

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  // Base course / floor slab at ground.
  g.set(x, ground, z, perim ? "polished_andesite" : "smooth_stone");

  // Walls and interior air.
  for (let y = ground + 1; y <= roof - 1; y++) {
    if (!perim) continue; // interior air, no interiors

    // Corners: full-height quartz pillars.
    if (corner) {
      g.set(x, y, z, "quartz_pillar", { axis: "y" });
      continue;
    }

    // Entrance: framed doorway with lintel course above.
    if (isDoor) {
      if (y <= ground + 2) {
        const half = y === ground + 1 ? "lower" : "upper";
        g.set(x, y, z, "dark_oak_door", {
          facing: "south", half, hinge: "left", open: "false", powered: "false",
        });
      } else if (y === ground + 3) {
        g.set(x, y, z, "chiseled_quartz_block");
      } else {
        g.set(x, y, z, "smooth_quartz");
      }
      continue;
    }

    // Pilasters flanking the entrance on the south face.
    if (onSouth && pilasterXs.has(x)) {
      g.set(x, y, z, y === roof - 1 ? "chiseled_quartz_block" : "quartz_pillar", { axis: "y" });
      continue;
    }

    // Glazed bays in the middle band with quartz sill and lintel.
    const inBand = y >= ground + 1 && y <= roof - 2;
    if (inBand && (x + z) % 3 === 1) {
      const onNS = Nedge || Sedge; // face runs east-west: pane connects east/west
      g.set(x, y, z, "glass_pane", onNS
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
    } else {
      // Recessed panels alternate with a lighter smooth face for relief.
      g.set(x, y, z, (x + z + y) % 2 === 0 ? "quartz_block" : "smooth_quartz");
    }
  }

  // Cornice band at the top of the wall, under the roof cap.
  if (perim && roof - 1 >= ground + 1 && !corner) {
    if (!(isDoor && roof - 1 <= ground + 3)) {
      g.set(x, roof - 1, z, "quartz_slab", { type: "top", waterlogged: "false" });
    }
  }

  // Flat roof cap, shared level across the footprint.
  g.set(x, roof, z, "smooth_quartz");

  // Parapet on the perimeter.
  if (perim) {
    g.set(x, roof + 1, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/DC87383.nbt`);
