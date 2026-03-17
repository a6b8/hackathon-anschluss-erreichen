# Debug Summary: bahnhofs-ueberleben

**Timestamp:** 2026-03-17T16-02-10-151Z
**Total Duration:** 86097ms
**Rounds:** 2
**Tokens:** 20246 in / 521 out

## Tool Usage

| Tool | Calls | Success | Errors | Avg Duration |
|------|-------|---------|--------|-------------|
| get_current_weather_brightsky | 1 | 1 | 0 | 158ms |
| search_locations_transportrestdb | 1 | 1 | 0 | 184ms |
| search_nominatim | 1 | 1 | 0 | 823ms |
| get_departures_transportrestdb | 1 | 1 | 0 | 521ms |
| find_accommodation_overpassmobility | 1 | 1 | 0 | 1432ms |
| find_station_amenities_overpassmobility | 1 | 1 | 0 | 5428ms |

## Round Details

### Round 1
- Tools: get_current_weather_brightsky(OK), search_locations_transportrestdb(OK), search_nominatim(OK)
- Tokens: 9584+260
- LLM said: Ich helfe dir sofort! Lass mich die aktuellen Informationen für Würzburg Hauptbahnhof abrufen....

### Round 2
- Tools: get_departures_transportrestdb(OK), find_accommodation_overpassmobility(OK), find_station_amenities_overpassmobility(OK)
- Tokens: 10662+261
- LLM said: (no text)...

