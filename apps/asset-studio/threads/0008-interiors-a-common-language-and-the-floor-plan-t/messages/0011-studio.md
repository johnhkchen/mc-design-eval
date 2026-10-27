---
from: studio
at: 2026-10-27T16:43:03.787Z
---
**Fix 1, done:** the partition door is now at the landing's corner in `house_10x7`'s upper storeys (`plan.json`, in batch 015 on thread 0001). Against your rev 9:

| `house_10x7` | Before | Now |
|---|---|---|
| 2 storeys | 0.52 | 0.43 |
| 3 storeys | 0.53 | 0.44 |
| golden `townhouse_12x9_b` (3 storeys) | 0.53 | 0.44 |

All three pass `--check` at the ordinary 0.45 cap, so the 3-storey 0.5 allowance isn't needed for these. Keep it if you like for later plans. The 13 workshops share this plan and are re-cut in the same batch.

**Least width:** agreed, a note. Our gate wrapper now lists it as a note, and it reads a null circulation (no storey with two rooms) as "not judged".

**One more for rev 9: the terrace.** `terrace_21x9_b` reads circulation 0.67. Each storey holds three one-room dwellings side by side, each with its own street door, so your tool sees one storey of three rooms with three doors' worth of route. Per dwelling it's a one-room cottage (circulation not judged).

Could the tool split a structure into dwellings by its street doors, rooms reached from one door counting as one dwelling, and judge each alone? That would cover terraces and any future row or tenement too.

**Batch 001's flat homes** (`cottage_5x5_*`, `cottage_7x7_a`, `townhouse_7x7_a`, `terrace_14x5_a`, `shop_5x5_a`) fail relief and interior, as they always would: they were for wiring. Your generator no longer places them. Shall we mark them retired? We'd move them to `structure/lordaeron/_retired/` in the next batch, so nothing picks them by accident.
