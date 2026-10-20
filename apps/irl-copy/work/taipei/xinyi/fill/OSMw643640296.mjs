import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw643640296";
const W = 22, H = 38, D = 20;
const TOP = 25; // roof deck; parapet tops out at y 25, roughly 26 above lowest ground

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(TOP - 6, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const outward = (x, z) =>
  !has(x, z - 1) ? "north" :
  !has(x, z + 1) ? "south" :
  !has(x - 1, z) ? "west" :
  !has(x + 1, z) ? "east" : null;
const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

// Entrance: on the south face (or north if none), away from corners, nearest the middle.
const perimList = [...ground.keys()].map(k => k.split(",").map(Number)).filter(([x, z]) => isPerim(x, z));
const alongOK = (x, z) => {
  const f = outward(x, z);
  return (f === "north" || f === "south") ? (has(x - 1, z) && has(x + 1, z)) : (has(x, z - 1) && has(x, z + 1));
};
let pool = perimList.filter(([x, z]) => outward(x, z) === "south" && alongOK(x, z));
if (!pool.length) pool = perimList.filter(([x, z]) => outward(x, z) === "north" && alongOK(x, z));
if (!pool.length) pool = perimList.filter(([x, z]) => outward(x, z) !== null);
let door = null;
if (pool.length) {
  pool.sort((a, b) => Math.abs(a[0] - W / 2) - Math.abs(b[0] - W / 2));
  const [dx, dz] = pool[0];
  door = { x: dx, z: dz, face: outward(dx, dz) };
}

const g = new Voxels([W, H, D]);

// Main body: foundation, floor decks, facade, roof.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const perim = isPerim(x, z);
  const face = outward(x, z);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Storey decks every 5 blocks from this cell's ground, and the roof deck.
  for (let y = gr; y <= TOP - 2; y++) {
    const r = (y - gr) % 5;
    if (r === 0) { g.set(x, y, z, "smooth_quartz"); continue; }
    if (!perim) continue;

    const along = (face === "north" || face === "south")
      ? (!has(x - 1, z) || !has(x + 1, z))
      : (!has(x, z - 1) || !has(x, z + 1));
    const idx = (face === "north" || face === "south") ? x : z;
    const pier = along || idx % 3 === 0;
    const isDoor = door && door.x === x && door.z === z;
    const ground1 = y < gr + 5; // ground storey
    const paneProps = (face === "north" || face === "south")
      ? { north: "false", south: "false", east: "true", west: "true" }
      : { north: "true", south: "true", east: "false", west: "false" };

    if (isDoor && ground1) {
      if (r === 1 || r === 2) {
        g.set(x, y, z, "dark_oak_door", {
          facing: face, half: r === 1 ? "lower" : "upper",
          hinge: "left", open: "false", powered: "false",
        });
      } else if (r === 3) {
        g.set(x, y, z, "smooth_quartz");
      } else {
        g.set(x, y, z, "stone_bricks");
      }
      continue;
    }

    let isWindow = false;
    if (ground1) {
      if (r === 1) g.set(x, y, z, "polished_granite");
      else if (r === 4) g.set(x, y, z, "smooth_stone");
      else if (pier) g.set(x, y, z, "polished_granite");
      else { g.set(x, y, z, "glass"); }
    } else {
      if (r === 4) g.set(x, y, z, "light_gray_concrete");
      else if (pier) g.set(x, y, z, "white_concrete");
      else { g.set(x, y, z, "glass_pane", paneProps); isWindow = true; }
    }

    // Warm light behind some upper windows (interior air cell just inside).
    if (isWindow && r >= 1 && r <= 3 && (x * 3 + z * 5 + y) % 9 === 0) {
      const [ox, oz] = INWARD[face];
      const ix = x + ox, iz = z + oz;
      if (has(ix, iz) && !isPerim(ix, iz)) g.set(ix, y, iz, "shroomlight");
    }
  }

  // Cornice course just below the parapet.
  if (perim) g.set(x, TOP - 1, z, "white_concrete");
  // Roof deck, with a quartz parapet on the edge.
  g.set(x, TOP, z, perim ? "smooth_quartz" : "gray_concrete");
}

// Entrance lantern on the inside of the door.
if (door) {
  const [ox, oz] = INWARD[door.face];
  const ix = door.x + ox, iz = door.z + oz;
  if (has(ix, iz) && !isPerim(ix, iz)) {
    g.set(ix, ground.get(`${door.x},${door.z}`) + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Rooftop plant room with louvred walls and an antenna.
const BOX = { x0: 7, x1: 14, z0: 6, z1: 13 };
for (let x = BOX.x0; x <= BOX.x1; x++) {
  for (let z = BOX.z0; z <= BOX.z1; z++) {
    if (!has(x, z)) continue;
    const edge = x === BOX.x0 || x === BOX.x1 || z === BOX.z0 || z === BOX.z1;
    for (const y of [TOP + 1, TOP + 2]) {
      if (!edge) continue;
      if (y === TOP + 2 && ((x + z) % 2 === 0)) g.set(x, y, z, "iron_bars");
      else g.set(x, y, z, "light_gray_concrete");
    }
    g.set(x, TOP + 3, z, "stone_bricks");
  }
}
if (has(11, 10)) {
  for (let y = TOP + 4; y <= TOP + 6; y++) {
    g.set(11, y, 10, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
