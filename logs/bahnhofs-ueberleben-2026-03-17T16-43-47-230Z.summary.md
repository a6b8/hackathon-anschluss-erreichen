# Debug Summary: bahnhofs-ueberleben

**Timestamp:** 2026-03-17T16-43-47-230Z
**Total Duration:** 92987ms
**Rounds:** 4
**Tokens:** 49221 in / 868 out

## Tool Usage

| Tool | Calls | Success | Errors | Avg Duration |
|------|-------|---------|--------|-------------|
| search_nominatim | 3 | 3 | 0 | 569ms |
| search_locations_transportrestdb | 2 | 2 | 0 | 149ms |
| get_current_weather_brightsky | 1 | 1 | 0 | 186ms |
| get_departures_transportrestdb | 1 | 1 | 0 | 493ms |
| find_station_amenities_overpassmobility | 1 | 1 | 0 | 5134ms |
| find_accommodation_overpassmobility | 1 | 1 | 0 | 5137ms |
| plan_journey_transportrestdb | 1 | 1 | 0 | 92ms |

## Round Details

### Round 1
- Tools: search_locations_transportrestdb(OK), get_current_weather_brightsky(OK), search_nominatim(OK)
- Tokens: 9680+254
- LLM said: Ich helfe Ihnen sofort! Lassen Sie mich die wichtigsten Informationen für Sie zusammenstellen....

### Round 2
- Tools: get_departures_transportrestdb(OK), find_station_amenities_overpassmobility(OK), find_accommodation_overpassmobility(OK)
- Tokens: 10773+263
- LLM said: (no text)...

### Round 3
- Tools: plan_journey_transportrestdb(OK), search_nominatim(OK)
- Tokens: 14238+196
- LLM said: (no text)...

### Round 4
- Tools: search_locations_transportrestdb(OK), search_nominatim(OK)
- Tokens: 14530+155
- LLM said: (no text)...

