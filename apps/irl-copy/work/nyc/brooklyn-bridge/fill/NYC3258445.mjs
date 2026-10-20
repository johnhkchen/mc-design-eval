import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3258445";
const W = 8, H = 15, D = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const at = new Map();
for (const [x, z, gr, roof] of cells) {
  at.set(`${x},${z}`, { x, z, ground: Math.round(gr), roof: Math.round(roof) });
}
const has = (x, z) => at.has(`${x},${z}`);
const clampY = (v) => Math.max(0, Math.min(H - 1, v));
const set = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

const exFaces = (x, z) => ({
  N: !has(x, z - 1),
  S: !has(x, z + 1),
  W: !has(x - 1, z),
  E: !has(x + 1, z),
});

// Pass 1: foundation, brick walls, stone storey bands, windows, cornice, roof
const info = new Map();
for (const c of at.values()) {
  const { x, z } = c;
  const f = exFaces(x, z);
  const exCount = Object.values(f).filter(Boolean).length;
  const perim = exCount > 0;
  const gy = clampY(c.ground);
  const capY = Math.min(H - 2, Math.max(c.roof, c.ground + 4) - 1);
  info.set(`${x},${z}`, { f, exCount, perim, gy, capY });

  // Foundation and granite-look base course
  for (let y = 0; y < gy; y++) set(x, y, z, "stone_bricks");
  set(x, gy, z, "stone_bricks");

  for (let y = gy + 1; y < capY; y++) {
    const rel = y - gy;
    if (perim) {
      if (rel % 2 === 0) {
        // storey band in stone
        set(x, y, z, "stone_bricks");
      } else {
        // windows on exterior-only cells, alternating along the face
        const along = f.N || f.S ? x : z;
        const isWindow = exCount === 1 && along % 2 === 1;
        if (isWindow) {
          const zFace = f.N || f.S;
          const pane = zFace
            ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
            : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
          set(x, y, z, "glass_pane", pane);
        } else {
          set(x, y, z, "bricks");
        }
      }
    } else {
      // interior: air, with floor slabs at storey lines
      if (rel % 2 === 0) set(x, y, z, "smooth_stone");
    }
  }

  // Cornice course just under the parapet
  if (perim) set(x, capY - 1, z, "stone_bricks");
  set(x, capY, z, perim ? "stone_bricks" : "smooth_stone");
  if (perim && capY + 1 < H) {
    set(x, capY + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
  if (!perim && capY + 1 < H && (x * 2 + z) % 5 === 0) {
    set(x, capY + 1, z, "iron_bars", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  }
}

// Pass 2: entrance on the z-min face, nearest the centre
let door = null;
let best = Infinity;
for (const c of at.values()) {
  const inf = info.get(`${c.x},${c.z}`);
  if (!inf.f.N) continue;
  const score = Math.abs(c.x - 3.5) + (inf.exCount > 1 ? 10 : 0);
  if (score < best) { best = score; door = { x: c.x, z: c.z, dir: "north" }; }
}
if (!door) {
  for (const c of at.values()) {
    const inf = info.get(`${c.x},${c.z}`);
    if (!inf.perim) continue;
    const s = Math.abs(c.x - 3.5) + Math.abs(c.z - 2);
    if (s < best) {
      best = s;
      const f = inf.f;
      const dir = f.N ? "north" : f.S ? "south" : f.W ? "west" : "east";
      door = { x: c.x, z: c.z, dir };
    }
  }
}

if (door) {
  const inf = info.get(`${door.x},${door.z}`);
  const gy = inf.gy;
  const hinge = "left";
  // Stoop: a stone step on the footprint's ground row, in front of the door
  set(door.x, gy + 1, door.z, "iron_door", {
    facing: door.dir, half: "lower", hinge, open: "false", powered: "false",
  });
  set(door.x, gy + 2, door.z, "iron_door", {
    facing: door.dir, half: "upper", hinge, open: "false", powered: "false",
  });
  // Framed lintel and cap over the door
  set(door.x, gy + 3, door.z, "stone_bricks");
  set(door.x, gy + 4, door.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  // Warm light just inside the entrance
  let ix = door.x, iz = door.z;
  if (door.dir === "north") iz += 1;
  else if (door.dir === "south") iz -= 1;
  else if (door.dir === "west") ix += 1;
  else ix -= 1;
  if (has(ix, iz)) set(ix, gy + 2, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// Pass 3: warm lights behind some windows
for (const c of at.values()) {
  const { x, z } = c;
  const inf = info.get(`${x},${z}`);
  if (!inf.perim || inf.exCount !== 1) continue;
  if (door && x === door.x && z === door.z) continue;
  for (let y = inf.gy + 1; y < inf.capY; y++) {
    const rel = y - inf.gy;
    if (rel % 2 === 0) continue;
    const along = inf.f.N || inf.f.S ? x : z;
    if (along % 2 !== 1) continue;
    if ((x + z + y) % 4 !== 0) continue;
    let ix = x, iz = z;
    if (inf.f.N) iz = z + 1;
    else if (inf.f.S) iz = z - 1;
    else if (inf.f.W) ix = x + 1;
    else if (inf.f.E) ix = x - 1;
    const ii = info.get(`${ix},${iz}`);
    if (!ii || ii.perim || y >= ii.capY) continue;
    set(ix, y, iz, "shroomlight");
  }
}

g.save(`${DIR}/${ID}.nbt`);
