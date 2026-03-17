# Debug Summary: bahnhofs-ueberleben

**Timestamp:** 2026-03-17T16-41-51-003Z
**Total Duration:** 65939ms
**Rounds:** 3
**Tokens:** 33200 in / 470 out

## Tool Usage

| Tool | Calls | Success | Errors | Avg Duration |
|------|-------|---------|--------|-------------|
| search_nominatim | 1 | 1 | 0 | 96ms |
| search_locations_transportrestdb | 1 | 1 | 0 | 105ms |
| get_departures_transportrestdb | 1 | 1 | 0 | 125ms |
| find_accessibility_overpassmobility | 1 | 1 | 0 | 3739ms |
| find_station_amenities_overpassmobility | 1 | 1 | 0 | 843ms |

## Round Details

### Round 1
- Tools: search_nominatim(OK), search_locations_transportrestdb(OK)
- Tokens: 9619+191
- LLM said: Ich helfe dir sofort mit Informationen zu Barrierefreiheit am Hauptbahnhof Hannover....

### Round 2
- Tools: get_departures_transportrestdb(OK), find_accessibility_overpassmobility(OK)
- Tokens: 10229+177
- LLM said: (no text)...

### Round 3
- Tools: find_station_amenities_overpassmobility(OK)
- Tokens: 13352+102
- LLM said: (no text)...

