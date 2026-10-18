// A compact voxel volume: each distinct block (name + state) once in a palette, and 2 bytes per cell. A 448 x 133 x 448
// place is 27M cells, about 53 MB, where the toolkit's grid (an object per block in a Map) needed gigabytes. It has the
// grid's set/get/size, so the build and the tree helper work on either, and it writes a vanilla structure file (.nbt,
// gzipped) itself, streaming the blocks out without making an object per block.
import { gzipSync } from "node:zlib";
import { writeFileSync } from "node:fs";

const ns = (b) => (String(b).includes(":") ? String(b) : `minecraft:${b}`);
const AIR = /(^|:)(cave_|void_)?air$/;

export class Voxels {
  constructor(size, { dataVersion = 3955 } = {}) {
    this.size = size; this.dataVersion = dataVersion;
    this.data = new Uint16Array(size[0] * size[1] * size[2]);    // 0 = nothing (left out of the file: missing cells are air)
    this.palette = [null]; this.index = new Map();
  }
  at(x, y, z) { const [X, Y, Z] = this.size; return x < 0 || y < 0 || z < 0 || x >= X || y >= Y || z >= Z ? -1 : (z * Y + y) * X + x; }
  inBounds(x, y, z) { return this.at(x, y, z) >= 0; }
  set(x, y, z, block, state) {
    const i = this.at(x, y, z); if (i < 0) return this;
    const name = ns(block); if (AIR.test(name)) { this.data[i] = 0; return this; }
    const st = state && Object.keys(state).length ? Object.fromEntries(Object.entries(state).map(([k, v]) => [k, String(v)]).sort()) : null;
    const key = name + (st ? JSON.stringify(st) : "");
    let p = this.index.get(key);
    if (p === undefined) { if (this.palette.length >= 65535) throw new Error("more than 65535 distinct blocks"); p = this.palette.length; this.palette.push({ block: name, state: st }); this.index.set(key, p); }
    this.data[i] = p; return this;
  }
  get(x, y, z) { const i = this.at(x, y, z); if (i < 0 || !this.data[i]) return null; const p = this.palette[this.data[i]]; return { pos: [x, y, z], block: p.block, state: p.state ?? undefined }; }
  count() { let n = 0; for (const v of this.data) if (v) n++; return n; }

  /** A vanilla structure file: size, palette, blocks (pos + state index), entities, DataVersion; gzipped. */
  save(file) {
    const used = new Uint8Array(this.palette.length); for (const v of this.data) used[v] = 1;
    const remap = new Int32Array(this.palette.length).fill(-1), pal = [];
    for (let p = 1; p < this.palette.length; p++) if (used[p]) { remap[p] = pal.length; pal.push(this.palette[p]); }
    const w = new NbtWriter();
    w.compoundStart("");
    w.listOfInt("size", this.size);
    w.listStart("palette", 10, pal.length);
    for (const p of pal) { w.string("Name", p.block); if (p.state) { w.compoundStart("Properties"); for (const [k, v] of Object.entries(p.state)) w.string(k, v); w.end(); } w.end(); }
    const n = this.count(), [X, Y] = this.size;
    w.listStart("blocks", 10, n);
    for (let i = 0; i < this.data.length; i++) { const v = this.data[i]; if (!v) continue;
      const x = i % X, y = Math.floor(i / X) % Y, z = Math.floor(i / (X * Y));
      w.listOfInt("pos", [x, y, z]); w.int("state", remap[v]); w.end(); }
    w.listStart("entities", 10, 0);
    w.int("DataVersion", this.dataVersion);
    w.end();
    writeFileSync(file, gzipSync(w.bytes()));
    return { blocks: n, palette: pal.length };
  }
}

// Just enough of NBT to write a structure: big-endian, named tags, a growing buffer.
class NbtWriter {
  constructor() { this.buf = Buffer.alloc(1 << 24); this.o = 0; }
  grow(n) { if (this.o + n <= this.buf.length) return; const b = Buffer.alloc(Math.max(this.buf.length * 2, this.o + n)); this.buf.copy(b, 0, 0, this.o); this.buf = b; }
  u8(v) { this.grow(1); this.buf.writeUInt8(v, this.o); this.o += 1; }
  i32(v) { this.grow(4); this.buf.writeInt32BE(v, this.o); this.o += 4; }
  str(s) { const b = Buffer.from(s, "utf8"); this.grow(2 + b.length); this.buf.writeUInt16BE(b.length, this.o); this.o += 2; b.copy(this.buf, this.o); this.o += b.length; }
  tag(type, name) { this.u8(type); this.str(name); }
  compoundStart(name) { this.tag(10, name); }
  end() { this.u8(0); }                                                  // TAG_End closes a compound (or a list element)
  int(name, v) { this.tag(3, name); this.i32(v); }
  string(name, v) { this.tag(8, name); this.str(v); }
  listOfInt(name, a) { this.tag(9, name); this.u8(3); this.i32(a.length); for (const v of a) this.i32(v); }
  listStart(name, type, n) { this.tag(9, name); this.u8(n ? type : 0); this.i32(n); }   // compound elements follow, each closed by end()
  bytes() { return this.buf.subarray(0, this.o); }
}
