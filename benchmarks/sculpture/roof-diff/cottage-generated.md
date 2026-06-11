# roof-diff — cottage (generated)

Band floor 14; regions {"ridge":78,"slopes":283,"ends":81,"eaves":33}

| view | IoU | mismatch px | top region (px) |
|---|---|---|---|
| +x+z (45°) | 0.869 | 1362 (extra 768 / missing 594) | wall 1080 |
| +x-z (135°) | 0.859 | 1560 (extra 732 / missing 828) | wall 1122 |
| -x-z (225°) | 0.871 | 1311 (extra 298 / missing 1013) | wall 785 |
| -x+z (315°) | 0.87 | 1404 (extra 464 / missing 940) | wall 984 |

Cross-azimuth: 5637 px, roof share 29.555%, worst view +x-z.

- **gable-roof-0-roof-4** ridge Δ(eave-rel) rmse 0.809 max 2.061; rakes: lo@-14 rmse 2.875, hi@13 rmse 2.483
- **gable-roof-2-roof-3** ridge Δ(eave-rel) rmse 0.401 max -0.401; rakes: lo@-1 (unfitted) rmse 1.008, hi@10 rmse 0.865

Reproducible: byte-identical ×2 (sha256 730b886f826b…).
