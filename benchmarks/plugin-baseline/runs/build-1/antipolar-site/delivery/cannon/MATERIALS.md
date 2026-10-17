# Materials for the cannons, in the order the files go on

Each file's blocks as `/give` commands, in **loads** of at most 36 stacks: one load fills an empty inventory. Run a load, empty it into that cannon's chest, run the next. Counts are exactly what the cannon has to place: the simulated world just before that paste, compared cell by cell. Cells already right are left out, and so is water (the cannon skips fluids).

Add gunpowder for the cannon's fuel as usual: it is not counted here.

The `fill-below` counts are the most you will need. Your export stops at the water's surface, so they assume water all the way down to y −4. Wherever the swamp's real bottom is already dirt, the cannon skips it and you get the rest back.

| File | Blocks | Loads |
|---|---|---|
| 0-staging.nbt | 390 | 1 |
| 1-A-fill.nbt | 2127 | 2 |
| 1-A-fill-below.nbt | 4140 | 2 |
| 1-B-fill.nbt | 2216 | 2 |
| 1-C-fill.nbt | 4747 | 3 |
| 1-C-fill-below.nbt | 12972 | 6 |
| 1-D-fill.nbt | 692 | 1 |
| 1-E-fill.nbt | 6011 | 3 |
| 1-E-fill-below.nbt | 15180 | 7 |
| 1-F-fill.nbt | 2782 | 2 |
| 1-G-fill.nbt | 698 | 1 |
| 1-H-fill.nbt | 464 | 1 |
| 2-A-dig.nbt | 10 | 1 |
| 2-C-dig.nbt | 16 | 1 |
| 2-E-dig.nbt | 26 | 1 |

## 0-staging.nbt

390 blocks, 1 load: 275 scaffolding, 108 pink wool, 7 magenta wool.

Load 1 of 1:

```
/give @s minecraft:scaffolding 275
/give @s minecraft:pink_wool 108
/give @s minecraft:magenta_wool 7
```

## 1-A-fill.nbt

2127 blocks, 2 loads: 723 dirt, 397 packed mud, 276 coarse dirt, 229 grass block, 200 dirt path, 96 gravel, 54 mud brick slab, 53 cobblestone, 31 mossy cobblestone, 27 stone, 23 andesite, 12 spruce planks, 2 scaffolding, 2 magenta wool, 2 stripped spruce log.

Load 1 of 2:

```
/give @s minecraft:dirt 723
/give @s minecraft:packed_mud 397
/give @s minecraft:coarse_dirt 276
/give @s minecraft:grass_block 229
/give @s minecraft:dirt_path 200
/give @s minecraft:gravel 96
/give @s minecraft:mud_brick_slab 54
/give @s minecraft:cobblestone 53
```

Load 2 of 2:

```
/give @s minecraft:mossy_cobblestone 31
/give @s minecraft:stone 27
/give @s minecraft:andesite 23
/give @s minecraft:spruce_planks 12
/give @s minecraft:scaffolding 2
/give @s minecraft:magenta_wool 2
/give @s minecraft:stripped_spruce_log 2
```

## 1-A-fill-below.nbt

4140 blocks, 2 loads: 2921 packed mud, 1090 dirt, 75 grass block, 16 cobblestone, 15 andesite, 8 mossy cobblestone, 8 dirt path, 7 stone.

Load 1 of 2:

```
/give @s minecraft:packed_mud 2304
```

Load 2 of 2:

```
/give @s minecraft:packed_mud 617
/give @s minecraft:dirt 1090
/give @s minecraft:grass_block 75
/give @s minecraft:cobblestone 16
/give @s minecraft:andesite 15
/give @s minecraft:mossy_cobblestone 8
/give @s minecraft:dirt_path 8
/give @s minecraft:stone 7
```

## 1-B-fill.nbt

2216 blocks, 2 loads: 966 dirt, 367 coarse dirt, 174 spruce planks, 155 stripped spruce log, 146 cobblestone, 108 mossy cobblestone, 91 dirt path, 69 stone, 54 andesite, 46 gravel, 32 grass block, 8 spruce slab.

Load 1 of 2:

```
/give @s minecraft:dirt 966
/give @s minecraft:coarse_dirt 367
/give @s minecraft:spruce_planks 174
/give @s minecraft:stripped_spruce_log 155
/give @s minecraft:cobblestone 146
/give @s minecraft:mossy_cobblestone 108
/give @s minecraft:dirt_path 91
/give @s minecraft:stone 64
```

Load 2 of 2:

```
/give @s minecraft:stone 5
/give @s minecraft:andesite 54
/give @s minecraft:gravel 46
/give @s minecraft:grass_block 32
/give @s minecraft:spruce_slab 8
```

## 1-C-fill.nbt

4747 blocks, 3 loads: 2285 coarse dirt, 886 dirt, 470 packed mud, 406 grass block, 192 dirt path, 154 cobblestone, 94 gravel, 84 mossy cobblestone, 59 stone, 54 spruce planks, 41 andesite, 12 stripped spruce log, 8 mud brick slab, 1 magenta wool, 1 scaffolding.

Load 1 of 3:

```
/give @s minecraft:coarse_dirt 2285
```

Load 2 of 3:

```
/give @s minecraft:dirt 886
/give @s minecraft:packed_mud 470
/give @s minecraft:grass_block 406
/give @s minecraft:dirt_path 192
/give @s minecraft:cobblestone 154
/give @s minecraft:gravel 64
```

Load 3 of 3:

```
/give @s minecraft:gravel 30
/give @s minecraft:mossy_cobblestone 84
/give @s minecraft:stone 59
/give @s minecraft:spruce_planks 54
/give @s minecraft:andesite 41
/give @s minecraft:stripped_spruce_log 12
/give @s minecraft:mud_brick_slab 8
/give @s minecraft:magenta_wool 1
/give @s minecraft:scaffolding 1
```

## 1-C-fill-below.nbt

12972 blocks, 6 loads: 6818 dirt, 4162 packed mud, 1404 grass block, 155 coarse dirt, 111 mud, 92 dirt path, 74 gravel, 59 cobblestone, 30 stone, 26 mossy cobblestone, 23 andesite, 18 stone bricks.

Load 1 of 6:

```
/give @s minecraft:dirt 2304
```

Load 2 of 6:

```
/give @s minecraft:dirt 2304
```

Load 3 of 6:

```
/give @s minecraft:dirt 2210
/give @s minecraft:packed_mud 64
```

Load 4 of 6:

```
/give @s minecraft:packed_mud 2304
```

Load 5 of 6:

```
/give @s minecraft:packed_mud 1794
/give @s minecraft:grass_block 448
```

Load 6 of 6:

```
/give @s minecraft:grass_block 956
/give @s minecraft:coarse_dirt 155
/give @s minecraft:mud 111
/give @s minecraft:dirt_path 92
/give @s minecraft:gravel 74
/give @s minecraft:cobblestone 59
/give @s minecraft:stone 30
/give @s minecraft:mossy_cobblestone 26
/give @s minecraft:andesite 23
/give @s minecraft:stone_bricks 18
```

## 1-D-fill.nbt

692 blocks, 1 load: 295 spruce planks, 155 stripped spruce log, 131 dirt, 95 coarse dirt, 16 spruce slab.

Load 1 of 1:

```
/give @s minecraft:spruce_planks 295
/give @s minecraft:stripped_spruce_log 155
/give @s minecraft:dirt 131
/give @s minecraft:coarse_dirt 95
/give @s minecraft:spruce_slab 16
```

## 1-E-fill.nbt

6011 blocks, 3 loads: 2310 coarse dirt, 1549 dirt, 935 packed mud, 449 grass block, 362 dirt path, 161 gravel, 89 cobblestone, 46 mossy cobblestone, 38 stone, 38 mud brick slab, 23 andesite, 5 spruce planks, 3 scaffolding, 2 magenta wool, 1 stripped spruce log.

Load 1 of 3:

```
/give @s minecraft:coarse_dirt 2304
```

Load 2 of 3:

```
/give @s minecraft:coarse_dirt 6
/give @s minecraft:dirt 1549
/give @s minecraft:packed_mud 640
```

Load 3 of 3:

```
/give @s minecraft:packed_mud 295
/give @s minecraft:grass_block 449
/give @s minecraft:dirt_path 362
/give @s minecraft:gravel 161
/give @s minecraft:cobblestone 89
/give @s minecraft:mossy_cobblestone 46
/give @s minecraft:stone 38
/give @s minecraft:mud_brick_slab 38
/give @s minecraft:andesite 23
/give @s minecraft:spruce_planks 5
/give @s minecraft:scaffolding 3
/give @s minecraft:magenta_wool 2
/give @s minecraft:stripped_spruce_log 1
```

## 1-E-fill-below.nbt

15180 blocks, 7 loads: 7274 dirt, 6122 packed mud, 747 grass block, 624 mud, 142 coarse dirt, 79 dirt path, 66 gravel, 33 cobblestone, 33 mossy cobblestone, 25 stone, 18 stone bricks, 17 andesite.

Load 1 of 7:

```
/give @s minecraft:dirt 2304
```

Load 2 of 7:

```
/give @s minecraft:dirt 2304
```

Load 3 of 7:

```
/give @s minecraft:dirt 2304
```

Load 4 of 7:

```
/give @s minecraft:dirt 362
/give @s minecraft:packed_mud 1920
```

Load 5 of 7:

```
/give @s minecraft:packed_mud 2304
```

Load 6 of 7:

```
/give @s minecraft:packed_mud 1898
/give @s minecraft:grass_block 384
```

Load 7 of 7:

```
/give @s minecraft:grass_block 363
/give @s minecraft:mud 624
/give @s minecraft:coarse_dirt 142
/give @s minecraft:dirt_path 79
/give @s minecraft:gravel 66
/give @s minecraft:cobblestone 33
/give @s minecraft:mossy_cobblestone 33
/give @s minecraft:stone 25
/give @s minecraft:stone_bricks 18
/give @s minecraft:andesite 17
```

## 1-F-fill.nbt

2782 blocks, 2 loads: 1285 dirt, 534 coarse dirt, 357 stripped spruce log, 188 spruce planks, 121 grass block, 87 dirt path, 71 cobblestone, 42 gravel, 34 mossy cobblestone, 29 stone, 22 andesite, 12 spruce slab.

Load 1 of 2:

```
/give @s minecraft:dirt 1285
/give @s minecraft:coarse_dirt 534
/give @s minecraft:stripped_spruce_log 357
```

Load 2 of 2:

```
/give @s minecraft:spruce_planks 188
/give @s minecraft:grass_block 121
/give @s minecraft:dirt_path 87
/give @s minecraft:cobblestone 71
/give @s minecraft:gravel 42
/give @s minecraft:mossy_cobblestone 34
/give @s minecraft:stone 29
/give @s minecraft:andesite 22
/give @s minecraft:spruce_slab 12
```

## 1-G-fill.nbt

698 blocks, 1 load: 205 dirt path, 176 coarse dirt, 116 gravel, 103 dirt, 93 mud brick slab, 4 grass block, 1 scaffolding.

Load 1 of 1:

```
/give @s minecraft:dirt_path 205
/give @s minecraft:coarse_dirt 176
/give @s minecraft:gravel 116
/give @s minecraft:dirt 103
/give @s minecraft:mud_brick_slab 93
/give @s minecraft:grass_block 4
/give @s minecraft:scaffolding 1
```

## 1-H-fill.nbt

464 blocks, 1 load: 256 dirt, 54 mud brick slab, 46 dirt path, 43 coarse dirt, 41 grass block, 24 gravel.

Load 1 of 1:

```
/give @s minecraft:dirt 256
/give @s minecraft:mud_brick_slab 54
/give @s minecraft:dirt_path 46
/give @s minecraft:coarse_dirt 43
/give @s minecraft:grass_block 41
/give @s minecraft:gravel 24
```

## 2-A-dig.nbt

10 blocks, 1 load: 10 mud brick slab.

Load 1 of 1:

```
/give @s minecraft:mud_brick_slab 10
```

## 2-C-dig.nbt

16 blocks, 1 load: 15 spruce planks, 1 mud brick slab.

Load 1 of 1:

```
/give @s minecraft:spruce_planks 15
/give @s minecraft:mud_brick_slab 1
```

## 2-E-dig.nbt

26 blocks, 1 load: 15 spruce planks, 11 mud brick slab.

Load 1 of 1:

```
/give @s minecraft:spruce_planks 15
/give @s minecraft:mud_brick_slab 11
```
