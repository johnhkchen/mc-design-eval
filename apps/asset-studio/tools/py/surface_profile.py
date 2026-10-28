# prof.py <world> z x0 x1: the surface along a row: x, ground y, top block, and the face below it (how many dirt blocks
# stand exposed above the next column's ground)
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from world_render import chunks_in, Chunk
world, z, x0, x1 = sys.argv[1], *map(int, sys.argv[2:5])
want = {(x >> 4, z >> 4) for x in range(x0, x1 + 1)}
ch = {}
for r in Path(world, "region").glob("*.mca"):
    for n in chunks_in(r):
        if (n.get("xPos"), n.get("zPos")) in want: c = Chunk(n); ch[(c.cx, c.cz)] = c
SKIP = ("air", "grass", "fern", "flower", "wheat", "carrots", "potatoes", "beetroots", "leaves", "torch", "lantern", "poppy", "dandelion", "fence", "wall", "sweet_berry", "sugar_cane", "log", "gate", "short", "tall", "bush")
prev = None
for x in range(x0, x1 + 1):
    c = ch[(x >> 4, z >> 4)]
    y = 200
    while y > -60 and any(s in c.block(x & 15, y, z & 15) for s in SKIP): y -= 1
    b = c.block(x & 15, y, z & 15).replace("minecraft:", ""); above = c.block(x & 15, y + 1, z & 15).replace("minecraft:", "")
    step = "" if prev is None else f"{y - prev:+d}"
    print(f"{x:5d} y{y:4d} {step:>4} {b:16s} {above}")
    prev = y
