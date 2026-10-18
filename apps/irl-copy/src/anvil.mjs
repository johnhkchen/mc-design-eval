// A voxel volume as a Minecraft Java world (Anvil region files, 1.18+ chunk format), so world tools that only read
// worlds can open a place: Chunky's path tracer for the photographs, or a single-player save to walk around in.
//   writeWorld(dir, voxels, { name, dataVersion, versionName }) -> { chunks, regions }
// The volume's y 0 is the world's y 0; x and z start at 0 (chunk 0, 0). Sections are 16 high; each keeps its own block
// palette and a long array packed at max(4, ceil(log2 palette)) bits a block, entries not spanning longs.
import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync, gzipSync } from "node:zlib";

// just enough NBT to write chunks and level.dat
class W {
  constructor() { this.b = Buffer.alloc(1 << 20); this.o = 0; }
  need(n) { if (this.o + n > this.b.length) { const nb = Buffer.alloc(Math.max(this.b.length * 2, this.o + n)); this.b.copy(nb, 0, 0, this.o); this.b = nb; } }
  u8(v) { this.need(1); this.b.writeUInt8(v & 255, this.o++); }
  i32(v) { this.need(4); this.b.writeInt32BE(v, this.o); this.o += 4; }
  i64(v) { this.need(8); this.b.writeBigInt64BE(BigInt.asIntN(64, BigInt(v)), this.o); this.o += 8; }
  str(s) { const x = Buffer.from(s, "utf8"); this.need(2 + x.length); this.b.writeUInt16BE(x.length, this.o); this.o += 2; x.copy(this.b, this.o); this.o += x.length; }
  tag(t, name) { this.u8(t); this.str(name); }
  begin(name) { this.tag(10, name); } end() { this.u8(0); }
  byte(name, v) { this.tag(1, name); this.u8(v); }
  int(name, v) { this.tag(3, name); this.i32(v); }
  long(name, v) { this.tag(4, name); this.i64(v); }
  string(name, v) { this.tag(8, name); this.str(v); }
  longs(name, a) { this.tag(12, name); this.i32(a.length); this.need(8 * a.length); for (const v of a) { this.b.writeBigInt64BE(v, this.o); this.o += 8; } }
  list(name, type, n) { this.tag(9, name); this.u8(n ? type : 0); this.i32(n); }    // elements follow (compounds end with end())
  bytes() { return this.b.subarray(0, this.o); }
}

function chunkNbt(v, cx, cz, dataVersion) {
  const [X, Y, Z] = v.size, nSec = Math.ceil(Y / 16), sections = [];
  for (let sy = 0; sy < nSec; sy++) {
    const local = new Map(), ids = new Uint16Array(4096); let any = false;
    for (let y = 0; y < 16; y++) for (let z = 0; z < 16; z++) for (let x = 0; x < 16; x++) {
      const wx = cx * 16 + x, wy = sy * 16 + y, wz = cz * 16 + z;
      const p = wx < X && wy < Y && wz < Z ? v.data[(wz * Y + wy) * X + wx] : 0;
      if (p) any = true;
      if (!local.has(p)) local.set(p, local.size);
      ids[(y * 16 + z) * 16 + x] = local.get(p);
    }
    if (any) sections.push({ y: sy, local, ids });
  }
  if (!sections.length) return null;
  const w = new W();
  w.begin("");
  w.int("DataVersion", dataVersion); w.int("xPos", cx); w.int("zPos", cz); w.int("yPos", 0);
  w.string("Status", "minecraft:full"); w.long("LastUpdate", 0); w.long("InhabitedTime", 0);
  w.list("sections", 10, sections.length);
  for (const s of sections) {
    w.byte("Y", s.y);
    w.begin("block_states");
    const pal = [...s.local.keys()];
    w.list("palette", 10, pal.length);
    for (const p of pal) { const e = p ? v.palette[p] : { block: "minecraft:air", state: null }; w.string("Name", e.block);
      if (e.state) { w.begin("Properties"); for (const [k, val] of Object.entries(e.state)) w.string(k, String(val)); w.end(); } w.end(); }
    if (pal.length > 1) {
      const bits = Math.max(4, Math.ceil(Math.log2(pal.length))), per = Math.floor(64 / bits), longs = new Array(Math.ceil(4096 / per)).fill(0n);
      for (let i = 0; i < 4096; i++) longs[Math.floor(i / per)] |= BigInt(s.ids[i]) << BigInt((i % per) * bits);
      w.longs("data", longs.map((x) => BigInt.asIntN(64, x)));
    }
    w.end();
    w.begin("biomes"); w.list("palette", 8, 1); w.str("minecraft:plains"); w.end();
    w.end();
  }
  w.end();
  return w.bytes();
}

export function writeWorld(dir, v, { name = "irl-copy", dataVersion = 3955, versionName = "1.21.1" } = {}) {
  mkdirSync(`${dir}/region`, { recursive: true });
  const [X, , Z] = v.size, ncx = Math.ceil(X / 16), ncz = Math.ceil(Z / 16), regions = new Map();
  for (let cz = 0; cz < ncz; cz++) for (let cx = 0; cx < ncx; cx++) {
    const nbt = chunkNbt(v, cx, cz, dataVersion); if (!nbt) continue;
    const key = `${cx >> 5}.${cz >> 5}`; if (!regions.has(key)) regions.set(key, []);
    regions.get(key).push({ cx, cz, data: deflateSync(nbt) });
  }
  let chunks = 0;
  for (const [key, list] of regions) {
    const header = Buffer.alloc(8192), parts = []; let sector = 2;
    for (const c of list) {
      const body = Buffer.alloc(5 + c.data.length); body.writeUInt32BE(c.data.length + 1, 0); body.writeUInt8(2, 4); c.data.copy(body, 5);   // 2 = zlib
      const n = Math.ceil(body.length / 4096), padded = Buffer.alloc(n * 4096); body.copy(padded);
      const i = 4 * ((c.cx & 31) + (c.cz & 31) * 32); header.writeUIntBE(sector, i, 3); header.writeUInt8(n, i + 3); header.writeUInt32BE(Math.floor(Date.now() / 1000), 4096 + i);
      parts.push(padded); sector += n; chunks++;
    }
    writeFileSync(`${dir}/region/r.${key}.mca`, Buffer.concat([header, ...parts]));
  }
  const w = new W();
  w.begin(""); w.begin("Data");
  w.int("DataVersion", dataVersion); w.int("version", 19133); w.string("LevelName", name);
  w.int("SpawnX", Math.floor(X / 2)); w.int("SpawnY", 100); w.int("SpawnZ", Math.floor(Z / 2));
  w.int("GameType", 1); w.byte("hardcore", 0); w.byte("allowCommands", 1); w.long("LastPlayed", Date.now()); w.long("Time", 6000); w.long("DayTime", 6000);
  w.begin("Version"); w.int("Id", dataVersion); w.string("Name", versionName); w.byte("Snapshot", 0); w.string("Series", "main"); w.end();
  w.end(); w.end();
  writeFileSync(`${dir}/level.dat`, gzipSync(w.bytes()));
  return { chunks, regions: regions.size };
}
