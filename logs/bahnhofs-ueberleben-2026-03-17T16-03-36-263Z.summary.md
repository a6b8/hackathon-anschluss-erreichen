# Debug Summary: bahnhofs-ueberleben

**Timestamp:** 2026-03-17T16-03-36-263Z
**Total Duration:** 65725ms
**Rounds:** 3
**Tokens:** 37295 in / 593 out

## Tool Usage

| Tool | Calls | Success | Errors | Avg Duration |
|------|-------|---------|--------|-------------|
| search_locations_transportrestdb | 2 | 2 | 0 | 197ms |
| get_current_weather_brightsky | 1 | 1 | 0 | 121ms |
| search_nominatim | 1 | 1 | 0 | 263ms |
| get_departures_transportrestdb | 1 | 1 | 0 | 238ms |
| find_station_mobility_overpassmobility | 1 | 1 | 0 | 5456ms |
| plan_journey_transportrestdb | 1 | 1 | 0 | 340ms |

## Round Details

### Round 1
- Tools: get_current_weather_brightsky(OK), search_locations_transportrestdb(OK), search_nominatim(OK)
- Tokens: 9568+258
- LLM said: Ich schaue sofort nach den aktuellen Verbindungen für dich!...

### Round 2
- Tools: search_locations_transportrestdb(OK), get_departures_transportrestdb(OK), find_station_mobility_overpassmobility(OK)
- Tokens: 11906+241
- LLM said: (no text)...

### Round 3
- Tools: plan_journey_transportrestdb(OK)
- Tokens: 15821+94
- LLM said: (no text)...

