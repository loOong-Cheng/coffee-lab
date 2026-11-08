# Provenance — Culture Explorer world map

| File | Origin | License |
|---|---|---|
| `worldOutline.ts` | **Original work** authored for Coffee Lab (2026-11-08). Coarse coastline rings typed by hand as `[longitude, latitude]` points from general geographic knowledge (positions of capes, gulfs, river mouths). No third-party map file, tile, shapefile, GeoJSON, image or SVG was copied, traced or downloaded. | Same as the Coffee Lab project |

Notes
- Facts about where coastlines are cannot be owned; the specific simplified point lists are ours.
- The outlines are deliberately low-detail and decorative: no political borders, small islands omitted, Antarctica and the far Arctic cropped (`LAT_TOP`/`LAT_BOTTOM` in `../projection.ts`). Do not use them as a reference map.
- Nothing is fetched at runtime; the map works offline.
- If a more detailed outline is ever needed, Natural Earth (public domain, naturalearthdata.com) is the suggested source: vendor a heavily simplified copy here and update this table.
