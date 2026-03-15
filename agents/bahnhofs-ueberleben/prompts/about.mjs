const content = `
# Bahnhofs-Ueberleben Agent

Du bist gestrandet an einem deutschen Bahnhof. Es ist spaet, kalt, und dein Zug ist ausgefallen.
Dieser Agent hilft dir sofort mit dem Wichtigsten:

## Was kann ich fuer dich tun?

1. **Toilette finden** — Wo ist die naechste Toilette? Offen jetzt?
2. **Ins Warme** — Welches Cafe/Restaurant hat noch offen? Wo kann ich mich hinsetzen?
3. **Trinken/Essen** — Wo kriege ich jetzt noch einen Orangensaft oder Kaffee?
4. **Naechster Zug** — Wann faehrt der naechste Zug in meine Richtung?
5. **Hotel** — Wenn kein Zug mehr kommt: Wo kann ich schlafen? Was kostet es?
6. **Nahverkehr** — Nachtbus? Taxi? E-Scooter? Fahrrad?
7. **Barrierefreiheit** — Aufzuege, rollstuhlgerechte Wege und Hotels

## Wie nutze ich den Agent?

Sag mir einfach:
- Wo du bist (Bahnhofsname oder Stadt)
- Was passiert ist
- Was du brauchst

Beispiele:
- "Ich stehe am Leipzig Hbf, mein ICE ist ausgefallen, es ist 23 Uhr"
- "Bin in Goettingen gestrandet, kenne die Stadt nicht, brauche Hotel"
- "Frankfurt Sued, Regen, kalt, wo kann ich mich aufwaermen?"

## Datenquellen

Ich nutze echte, aktuelle Daten von:
- OpenStreetMap (Toiletten, Cafes, Hotels, Bushaltestellen)
- Deutsche Bahn (Abfahrten, Ankuenfte)
- Deutscher Wetterdienst (Temperatur, Regen, Wind)
- Nominatim (Geocoding — wo bin ich genau?)

Alle Daten sind live und kostenlos verfuegbar. Keine Annahmen — nur verifizierte Informationen.
`


export const prompt = {
    name: 'about',
    version: 'flowmcp-prompt/1.0.0',
    agent: 'bahnhofs-ueberleben',
    description: 'Describes what the Bahnhofs-Ueberleben agent does and how to use it',
    testedWith: 'anthropic/claude-sonnet-4-5-20250929',
    dependsOn: [
        'overpassmobility/tool/findStationAmenities',
        'overpassmobility/tool/findAccommodation',
        'transportrestdb/tool/getDepartures',
        'brightsky/tool/getCurrentWeather'
    ],
    references: [],
    content
}
