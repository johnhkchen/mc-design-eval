// 201006.0000989: a two-storey Spanish Colonial Revival barrack block on the Main Post (no record; chosen from the
// lidar roof height, about 5 blocks, and the Presidio's 1920s-30s stucco-and-red-tile look). A cream stucco ring with a
// stone plinth and sandstone belt courses, dark-framed glass in a three-bay grid, two arched-hood doors (east facade at
// z 30, west at z 44), a red clay roof deck with a brick parapet cap, a stepped hip tower on the north wing, chimneys and
// roof boxes. Interiors are air behind the glass with a floor slab per storey; some windows have glowstone behind them.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/sf/presidio-tunnel-tops/fill/201006.0000989.cells.json", "utf8"));
const ground = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, gr]));
const inF = (x, z) => ground.has(`${x},${z}`);
const DIRS = { west: [-1, 0], east: [1, 0], north: [0, -1], south: [0, 1] };
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !inF(x + DIRS[d][0], z + DIRS[d][1]));

const WALL = "white_terracotta", BELT = "smooth_sandstone", PLINTH = "stone_bricks", FLOOR = "smooth_stone";
const GLASS = "glass_pane", FRAME = "dark_oak_planks", ROOF = "red_terracotta", BRICK = "bricks",CAP = "brick_slab";
const HOOD = "brick_stairs", FOUND = "stone", GLOW = "glowstone", LAMP = "shroomlight";

const g = new Voxels([15, 17, 57]);
const solid = new Set();
const put = (x, y, z, block, state) => { g.set(x, y, z, block, state); if (block !== "air") solid.add(`${x},${y},${z}`); };
const paneState = (face) => (face === "east" || face === "west")
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const pane = (x, y, z, face) => put(x, y, z, GLASS, paneState(face));
const stairs = (x, y, z, facing, half) => put(x, y, z, HOOD, { facing, half, shape: "straight", waterlogged: "false" });

// Doors on the perimeter: a cell and the face it opens to. Windows keep clear of them.
const doors = [{ x: 14, z: 30, face: "east" }, { x: 4, z: 44, face: "west" }];
const along = (face, x, z) => (face === "east" || face === "west" ? z : x);   // index along that facade
const nearDoor = (x, z, face) => doors.some((d) => d.face === face && Math.abs(along(face, x, z) - along(face, d.x, d.z)) <= 1);
const isDoor = (x, z) => doors.find((d) => d.x === x && d.z === z);

// The tower: a 4 x 4 stepped hip on the north wing, interior air for its storey, panes on the middle two of each face.
const inTower = (x, z) => x >= 3 && x <= 6 && z >= 2 && z <= 5;
const towerRing = (x, z) => inTower(x, z) && (x === 3 || x === 6 || z === 2 || z === 5);

for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);              // foundation up to the cell's ground
  const b = gr;                                                  // storey 1 floor line
  const ex = exposed(x, z);

  if (ex.length > 0) {
    const corner = ex.length > 1;
    const face = ex[0];
    const door = isDoor(x, z);
    const win = !corner && !door && along(face, x, z) % 3 === 1 && !nearDoor(x, z, face);

    put(x, b, z, door ? "dark_oak_door" : PLINTH, door ? { facing: door.face, half: "lower", hinge: "left", open: "false", powered: "false" } : undefined);
    if (door) put(x, b + 1, z, "dark_oak_door", { facing: door.face, half: "upper", hinge: "left", open: "false", powered: "false" });
    else if (win) pane(x, b + 1, z, face); else put(x, b + 1, z, WALL);

    if (door) stairs(x, b + 2, z, door.face, "top");               // hood over the door
    else if (win) put(x, b + 2, z, FRAME);
    else put(x, b + 2, z, BELT);

    if (win) pane(x, b + 3, z, face); else put(x, b + 3, z, WALL);
    put(x, b + 4, z, BELT);                                        // cornice
    put(x, b + 5, z, CAP, { type: "bottom", waterlogged: "false" }); // parapet cap, tiled
  } else {
    put(x, b, z, FLOOR);                                           // ground-floor slab
    put(x, b + 2, z, FLOOR);                                       // storey 2 slab
    put(x, b + 4, z, ROOF);                                        // roof deck over the interior

    if (towerRing(x, z)) {
      // north and south faces of the tower take windows at x 4-5, east and west faces at z 3-4
      const onNS = z === 2 || z === 5, onEW = x === 3 || x === 6;
      const midNS = x === 4 || x === 5, midEW = z === 3 || z === 4;
      const tw = (onNS && midNS) || (onEW && midEW);
      const tface = onNS ? (z === 2 ? "north" : "south") : (x === 3 ? "west" : "east");
      const corner = onNS && onEW;
      for (const y of [b + 5, b + 6]) {
        if (tw && !corner) pane(x, y, z, tface); else put(x, y, z, WALL);
      }
      // stepped roof: stairs low at the outside, rising into the 2 x 2 ceiling
      const facing = corner ? (z === 2 ? "north" : "south") : tface;
      stairs(x, b + 7, z, facing, "bottom");
    } else if (inTower(x, z)) {
      put(x, b + 5, z, FLOOR);                                     // tower floor
      if (x >= 4 && x <= 5 && z >= 3 && z <= 4) {
        put(x, b + 7, z, ROOF);                                    // tower ceiling
        put(x, b + 8, z, CAP, { type: "top", waterlogged: "false" });
      }
    }
  }
}

// Roof plant: two brick chimneys with cap slabs, two stone boxes for ventilation.
for (const [x, z] of [[4, 20], [10, 44]]) {
  put(x, 5, z, BRICK); put(x, 6, z, BRICK);
  put(x, 7, z, CAP, { type: "top", waterlogged: "false" });
}
for (const [x, z] of [[8, 22], [9, 22], [8, 23], [9, 23], [5, 38], [6, 38]]) put(x, 5, z, "stone");

// Warm light: glowstone behind a share of the glass (the air cell inward of each pane), shroomlight in the entrance hall.
for (const [x, z, gr] of cells) {
  const ex = exposed(x, z);
  if (ex.length !== 1) continue;
  const [dx, dz] = DIRS[ex[0]];
  for (const y of [gr + 1, gr + 3]) {
    const ix = x - dx, iz = z - dz;                              // the air cell inward of the pane
    if (!inF(ix, iz) || solid.has(`${ix},${y},${iz}`) || !solid.has(`${x},${y},${z}`)) continue;
    if ((x * 5 + z * 7 + y) % 4 === 0) put(ix, y, iz, GLOW);
  }
}
const d0 = doors[0];
put(d0.x - 1, ground.get(`${d0.x},${d0.z}`) + 1, d0.z, LAMP);    // shroomlight in the hall behind the east door

// Lit tower windows: glowstone on the tower's air cells behind the upper panes.
const tb = ground.get("4,3");
for (const [x, z] of [[4, 3], [5, 4]]) put(x, tb + 6, z, GLOW);

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/sf/presidio-tunnel-tops/fill/201006.0000989.nbt");
console.log(JSON.stringify(out));
