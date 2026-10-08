# Læria Kloden — låst renderingskontrakt

Denne kontrakten gjelder **selve kloden og kartlaget** i Prompt 18. Den supplerer den låste helskjermreferansen for Kloden.

## Målbilde

Kloden skal leses som en illustrert, premium eventyrglobus for barn, ikke som et politisk GIS-kart med dekor oppå.

### 1. Hav og kuleform
- Havet skal være dypt blått/turkist med tydelig sfærisk lyssetting.
- Øvre/venstre del skal ha myk lysrefleks.
- Ytterkant skal være mørkere slik at kulen får reell dybde.
- Diskrete bredde-/lengdegrader kan brukes, men de skal ligge bak illustrasjonen visuelt.

### 2. Landflater
- Natur/biom er hovedinntrykket.
- Europa og Nord-/Sør-Amerika skal i hovedsak leses grønt/naturlig.
- Asia skal kombinere grønne skogområder og varme gylne steppe-/tørrområder.
- Afrika skal kombinere varm oransje/rød savanne med tydelig gyllen Sahara og grønnere belter.
- Grønland/polare områder skal være lyse/snødekte.
- Kontinentfarge må aldri gjøre kartet til et flatt skolekart.

### 3. Terreng
- Fjell, skog, jungel, savanne, ørken og snø skal være integrert i landflaten.
- Terrengsymbolene skal være mange nok til å skape malt dybde, men små nok til at kartet ikke ser ut som et brettspill.
- Fjell skal være varme/naturlige gråtoner med lyse snøtopper, ikke svarte polygoner.
- Skog og jungel skal ha flere grønntoner og variert tetthet.

### 4. Oppdagelsesdetaljer
- Skip, hval, øyer, skyer, landsbyer, dyr og andre detaljer skal føles integrert i globusen.
- Detaljene følger geografien når kloden roteres.
- De skal ikke være statiske bakgrunnsbilder som avslører feil når kloden snurres.

### 5. Landegrenser og valg
- Landegrenser skal være diskrete hjelpestreker.
- De skal ikke dominere over naturkartet.
- Valgt land kan fremheves tydelig i selve landpolygonet.
- Permanent radar-/målring over valgt land skal ikke brukes.

### 6. Interaktivitet
- Faktiske landgeometrier beholdes.
- Dra/snurr, pinch/zoom, zoomknapper, landvalg, småland-hit-testing og startposisjon beholdes.
- Visuell oppgradering må ikke erstattes av én statisk globusillustrasjon.

## Ferdigkriterium

Automatiske tester er bare minimumsgate. Prompt 18 Kloden er ikke visuelt ferdig før exact-head-skjermbilder på iPhone og iPad er sammenlignet mot det låste målbildet og helheten faktisk har samme type **illustrert naturatlas / eventyrglobus**-uttrykk.


### 7. Geografisk samsvar mellom malt kart og faktiske land (obligatorisk)

- Landflaten i selve Utforsk-/Min verden-kloden skal genereres fra samme `WORLD_COUNTRIES`-polygondatasett som landvalg og grensemarkering, i EPSG:4326 før ortografisk projeksjon.
- Fritt illustrerte eller perspektivtegnede verdenskart uten geografisk registrering må **ikke** brukes som den roterende klodens karttekstur. Et vakkert bilde er ikke et korrekt kart.
- Biomer, skog, fjell, byer og dyr legges oppå en geografisk korrekt landflate og følger koordinatene gjennom drag, pinch og zoom.
- Kloden skal bekreftes visuelt i Chromium og WebKit. Kontroller både land (Spania, Norge, Island, USA, Brasil, Japan og Sahara) og åpne havflater. Et markert land skal alltid samsvare med landformen under.
- Der geometri mangler (svært små land og øyer), beholdes egne valgmarkører. Fravær av polygon skal ikke føre til et tilfeldig landpolygon eller et falskt kystlandskap.
- Om det illustrerte kartlaget ikke kan bygges, vises den geografisk korrekte vektorkloden. Ingen fallback til det gamle feilregistrerte maleriet.
