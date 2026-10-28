# world_box.py <world dir> x0 z0 x1 z1 y0 y1 <out prefix>: a box of a world's blocks, full states, for the JS tools.
# Writes <out>.json (origin, size, palette as "name[k=v,...]" strings, index 0 = air) and <out>.bin (uint16 little-
# endian, index (z * Y + y) * X + x: the Voxels layout), so a grader or painter can load it into a Voxels and write it
# out again with irl-copy's writeWorld.
import json
import struct
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from world_render import chunks_in, unpacked

world, (x0, z0, x1, z1, y0, y1), out = sys.argv[1], map(int, sys.argv[2:8]), sys.argv[8]
X, Y, Z = x1 - x0 + 1, y1 - y0 + 1, z1 - z0 + 1
want = {(cx, cz) for cx in range(x0 >> 4, (x1 >> 4) + 1) for cz in range(z0 >> 4, (z1 >> 4) + 1)}
palette, index = ["minecraft:air"], {"minecraft:air": 0}
data = bytearray(2 * X * Y * Z)


def key(entry):
    name, props = entry["Name"], entry.get("Properties")
    if name in ("minecraft:cave_air", "minecraft:void_air"):
        name = "minecraft:air"
    return name + ("[" + ",".join(f"{k}={v}" for k, v in sorted(props.items())) + "]" if props else "")


for r in Path(world, "region").glob("*.mca"):
    for n in chunks_in(r):
        cx, cz = n.get("xPos"), n.get("zPos")
        if (cx, cz) not in want:
            continue
        for s in n.get("sections", []):
            bs, sy = s.get("block_states"), s["Y"]
            if not bs or "palette" not in bs or sy * 16 > y1 or sy * 16 + 15 < y0:
                continue
            pal = []
            for k in map(key, bs["palette"]):
                if k not in index:
                    index[k] = len(palette)
                    palette.append(k)
                pal.append(index[k])
            idx = [0] * 4096 if len(pal) == 1 else unpacked(bs.get("data", ()), max(4, (len(pal) - 1).bit_length()), 4096)
            for i in range(4096):
                y, z, x = sy * 16 + (i >> 8), cz * 16 + ((i >> 4) & 15), cx * 16 + (i & 15)
                if x0 <= x <= x1 and z0 <= z <= z1 and y0 <= y <= y1:
                    p = pal[idx[i]] if idx[i] < len(pal) else 0
                    if p:
                        struct.pack_into("<H", data, 2 * (((z - z0) * Y + (y - y0)) * X + (x - x0)), p)
Path(out + ".bin").write_bytes(data)
Path(out + ".json").write_text(json.dumps({"origin": [x0, y0, z0], "size": [X, Y, Z], "palette": palette}))
print(f"{X}x{Y}x{Z}, {len(palette)} block states -> {out}.bin")
