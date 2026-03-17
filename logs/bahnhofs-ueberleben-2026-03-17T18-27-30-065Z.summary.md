# Debug Summary: bahnhofs-ueberleben

**Timestamp:** 2026-03-17T18-27-30-065Z
**Total Duration:** 21989ms
**Rounds:** 2
**Tokens:** 20540 in / 457 out

## Tool Usage

| Tool | Calls | Success | Errors | Avg Duration |
|------|-------|---------|--------|-------------|
| search_locations_transportrestdb | 2 | 2 | 0 | 176ms |
| plan_journey_transportrestdb | 1 | 1 | 0 | 93ms |
| get_departures_transportrestdb | 1 | 1 | 0 | 312ms |
| find_station_amenities_overpassmobility | 1 | 1 | 0 | 5090ms |

## Round Details

### Round 1
- Tools: plan_journey_transportrestdb(OK), search_locations_transportrestdb(OK), search_locations_transportrestdb(OK)
- Tokens: 9625+252
- LLM said: Ich helfe dir sofort! Lass mich die Station Göttingen finden und die nächsten Züge nach Kassel check...

### Round 2
- Tools: get_departures_transportrestdb(OK), find_station_amenities_overpassmobility(OK)
- Tokens: 10915+205
- LLM said: Lass mich die genauen Abfahrten direkt von Göttingen checken:...

