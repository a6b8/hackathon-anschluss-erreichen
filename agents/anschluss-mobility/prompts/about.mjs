const content = `
# Anschluss-Mobilitaet — Dein Reise-Agent fuer Deutschland

Ein Agent, fuenf Experten. Egal ob du ein guenstiges Ticket suchst, deinen Anschluss zu verpassen drohst, nachts an einem fremden Bahnhof stehst, oder sicheres Radparken brauchst.

## Module

### Ticketkauf
"Berlin nach Freiburg, moeglichst guenstig" → Sparpreis vs FlixBus Vergleich

### Anschluss-Navigator
"RE1 hat 15 Min Verspaetung, schaffe ich die S1?" → Echtzeit-Anschluss-Check

### Bahnhofs-Ueberleben
"23 Uhr Leipzig, Zug ausgefallen" → Toilette, Waerme, Hotel, naechster Zug

### Stadt-Navigator
"Frankfurt Sued, kenne die Stadt nicht" → OEPNV, Sharing, Orientierung

### Radparken
"Ueberdachtes Radparken am Jannowitzbruecke?" → 950 Stellplaetze, Typ, Kapazitaet

## Datenquellen

95+ APIs und Datenbanken, darunter:
- Deutsche Bahn (Fahrplan, Preise, Stationen)
- OpenStreetMap (Toiletten, Cafes, Hotels, Radparken, Barrierefreiheit)
- nextbike + Dott (Fahrrad- und E-Scooter-Sharing)
- DWD Wetter (Temperatur, Regen, Wind)
- FlixBus (Fernbus-Preise)
- infraVelo (Berliner Radinfrastruktur)
- NINA (Warnungen: Unwetter, Hochwasser, Streik)
`


export const prompt = {
    name: 'about',
    version: 'flowmcp-prompt/1.0.0',
    agent: 'anschluss-mobility',
    description: 'Master agent description — 5 modules for German train travel',
    testedWith: 'anthropic/claude-sonnet-4-5-20250929',
    dependsOn: [
        'transportrestdb/tool/planJourney',
        'transportrestdb/tool/getDepartures',
        'overpassmobility/tool/findStationAmenities',
        'overpassmobility/tool/findBikeInfrastructure',
        'brightsky/tool/getCurrentWeather'
    ],
    references: [],
    content
}
