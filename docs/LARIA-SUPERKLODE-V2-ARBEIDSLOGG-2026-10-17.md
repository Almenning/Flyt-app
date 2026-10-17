# SuperKlode v2: arbeidslogg og kvalitetsport

Dato: 17. oktober 2026

## Gren og avhengighet
- Aktiv utvikling: `feat/laria-discovery-landscapes-v2-20261017`
- Visuell draft-PR: #179, mot feilrettingsgrenen `fix/laria-discovery-selection-offscreen-20261017`
- Feilrettings-PR #178: beholder konsistent landkort ved snurring av Oppdag
- Ingen endring på publisert `main` fra denne v2-arbeidsøkten
- Ingen endringer i opprinnelig globus, felles geodata, progresjon eller andre fag

## Implementert v2-tegnemodell
1. **Sammenhengende natursoner:** 27 omtrentlig georefererte korridorer for regnskog, temperert skog, savanne, ørken, tundra og is. De bruker samme projeksjon og landklipp som eksisterende globe, ikke skjermfaste illustrasjoner.
2. **Fjell og høyland:** 18 geografiske fjellkjeder, inkludert den skandinaviske fjellkjeden, Alpene, Atlas, Andes, Himalaya og japanske fjell. Regional terrengdybde med lys/skygge og snø der det er relevant.
3. **Vannløp:** 5 stiliserte, geografisk ankret ruter (Amazonas, Nilen, Mississippi, Donau, Yangtze); ikke erstatning for faktiske elvegeodata.
4. **Tre nivåer:** På verdensnivå er landskapsmassene synlige uten å dominere. Ved regionzoom vises mer relieff. Ved nærzoom vises detaljer knyttet til lokale biomer.
5. **Berøringsytelse:** Dyre, klippede natur- og detaljlag fjernes midlertidig under aktiv rotasjon og gjenopprettes når fingeren slipper.
6. **QA-metadata:** Canvas eksponerer antall geografiske natursoner, relieffelementer og zoomdetaljer for kontroll, uten endring i den ordinære globusen.

## Visuell evaluering etter første WebKit-kjøring
- Første v2 ved commit `0f31a913`: teknisk WebKit/Chromium-QA bestått på fem skjermstørrelser (Actions #39057869104).
- Visuell svakhet funnet i ekte bilder: brede fargestriper og konsentriske belter i regnskog/skog og for kraftige, rørformede fjellkjeder.
- Implementert raffinering: natursoner er nå myke overlappende landskapsflater med radiale pigmentoverganger; fjellkjedene består av mykere relieffmassser og tynnere, diskrete høyderygger; elvebredder er tegnet smalere.
- Oppdatert renderer i kodecommit `e59327c648be0a8be5c4349b867c93a6153cfe76`. Ny WebKit-kjøring #39058420396 er bestilt. Den er ikke godkjent før nye bilder er vurdert.

## Teknisk aksept
- [x] Egen branch og draft-PR, originalglobusen uendret
- [x] Alle regioner anker seg i longitude/latitude og klippes til geografisk land
- [x] Kontroller for lesbare norsk/UTF-8-etiketter, at originalrenderer bevares, og at view-toggle er isolert
- [x] Første v2 WebKit/Chromium-run bestått, inkludert valg, zoom, drag og 5 utsnitt
- [ ] Oppdatert, raffinert v2 må bestå på iPad/iPhone WebKit stående/liggende og Chromium
- [ ] Faktiske bilder i Verden, Europa, Norge, Japan og Brasil skal sammenlignes med godkjente illustrasjoner
- [ ] Bekreft visuelt at Sahara ikke er et gulaktig bånd, at Alpene/Skandinavia ikke er rør, og at Amazonas fremstår som sammenhengende skog
- [ ] Stressprøve ytelse og orientering i faktisk Safari før senere integrasjon
- [ ] Integrer med siste `main` først etter visuell kvalitetsport og eksplisitt publiseringsbeslutning

## Neste konkrete oppgave
Innhent og inspiser bildene fra den oppdaterte WebKit-kjøringen. Forbedre eventuelle fremdeles synlige kunstige naturbånd. Deretter vurderer vi stedsspesifikke oppdagelser og revehint uten å redusere geografisk treffsikkerhet.

**Produktregel:** Hver aktivitet skal gi barnet noe morsomt å gjøre, noe meningsfullt å oppdage og en grunn til å komme tilbake. Læring er en naturlig del av opplevelsen.
