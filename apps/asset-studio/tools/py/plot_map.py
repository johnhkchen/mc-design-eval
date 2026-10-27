# plot_map.py <world dir> x0 z0 x1 z1 base: an ASCII height map round a plot: each cell is the ground's height minus base
# Finds where a placed site meets the land: run it round a plot (x0 z0 x1 z1, base = a few below the plot ground) to see
# its cuts, fills and courses before framing a render.
# (0-9, a-z above, - below), upper-case R where the top block is part of a retaining course (stone bricks, cobble walls).
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from world_render import chunks_in, Chunk
world, x0, z0, x1, z1, base = sys.argv[1], *map(int, sys.argv[2:7])
chunks = {}
for r in Path(world, "region").glob("*.mca"):
    rx, rz = map(int, r.name.split(".")[1:3])
    if rx * 512 > x1 or rx * 512 + 511 < x0 or rz * 512 > z1 or rz * 512 + 511 < z0: continue
    for n in chunks_in(r):
        c = Chunk(n); chunks[(c.cx, c.cz)] = c
STONE = ("stone_brick", "cobblestone", "mossy_stone", "cracked_stone", "andesite", "tuff", "mossy_cobble")
print("     " + "".join(str((x // 10) % 10) if x % 10 == 0 else " " for x in range(x0, x1 + 1)))
for z in range(z0, z1 + 1):
    row = ""
    for x in range(x0, x1 + 1):
        c = chunks.get((x >> 4, z >> 4))
        if not c or not c.ground: row += " "; continue
        h = c.ground[(z & 15) * 16 + (x & 15)] - 64 - 1
        y = h
        while y > h - 3 and any(w in c.block(x & 15, y, z & 15) for w in ("air", "grass", "fern", "flower", "torch", "lantern")): y -= 1
        name = c.block(x & 15, y, z & 15)
        d = h - base
        ch = "-" if d < 0 else str(d) if d < 10 else chr(87 + d) if d < 36 else "#"
        if any(w in name for w in STONE): ch = "R" if d >= 0 else "r"
        row += ch
    print(f"{z:5d}" + row)
