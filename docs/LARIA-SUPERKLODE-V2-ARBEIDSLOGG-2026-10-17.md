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

## Fortsatt arbeid – visuell kontroll av SuperKlode v2.1

- Oppdatert kode i `e59327c` besto [WebKit/Chromium-kjøring #39058420396](https://github.com/Almenning/Flyt-app/actions/runs/39058420396), inkludert alle fem skjermoppsett. Bilder fra denne kjøringen (artefakt `12111295059`) ble inspisert i faktiske iPad/iPhone-utsnitt.
- Den nedtonede varianten fjernet de kunstige stripene, **men ble for flat**, særlig i Amazonas, mens Alpene og Skandinavia manglet lesbart fjellrelieff.
- Ny renderer `8b2954b`: geografisk canopy-tekstur med overlappende tretopper i skogsoner, tydeligere fjelltopper, kraftigere men mykt utfasede naturtoner og moderert isolert jungelikon. Dette er en reell illustrasjonsendring, ikke et nytt fag eller en ny globus.
- [WebKit/Chromium-kjøring #39059742818](https://github.com/Almenning/Flyt-app/actions/runs/39059742818) **bestått i alle fem skjermoppsett**. Bilder fra artefakt `12109919787` ble visuelt sammenlignet med v2: mer skogtekstur i Brasil og Norden og mer synlig terreng. Fortsatt ikke full premiumgodkjenning, blant annet fordi noen elementer fremstår som separate kartillustrasjoner fremfor én sammenhengende verden.
- Mobil-skjermbildet avdekket i tillegg feil undertittel: `Oppdag` beholdt teksten om den klassiske globusen. Rettet i `ed7fbdf`, med ny regresjonstest av `Enkel → Oppdag → Enkel` i `6d21f3a`.
- [Siste QA-kjøring #39060129652](https://github.com/Almenning/Flyt-app/actions/runs/39060129652) kontrollerer tekstbytte sammen med kart, landvalg, zoom og de fem visningene. Denne kjøringen er ikke erklært bestått før et faktisk GitHub-resultat foreligger.

### Revidert kvalitetsbeslutning

**Teknisk funksjon:** verifisert for renderer `8b2954b`. **Visuell premiumfølelse:** forbedret, men fortsatt ikke godkjent. **Publisering:** nei. PR #179 beholdes i draft og bygger fortsatt på PR #178. Originalglobus og landdata er uendret.

### Neste arbeidsoppgaver

1. Kontroller grønt resultat fra QA på siste testcommit `6d21f3a` og at iPad/iPhone-skjermbildene ikke har ny overlapp eller feil undertittel.
2. Vurder målrettet mer sammenhengende vegetasjon og landskapsmaterialer uten overdekorering; skill visuelt mellom fjell, skog og ørken også i mellomzoom.
3. Før eventuelt senere publisering: oppdater gren mot gjeldende `main`, håndter avhengigheten til PR #178 og sammenlign mot låste referanseillustrasjoner. Brukerens godkjenning for visuell premium er fortsatt nødvendig.

## SuperKlode v3 – kontinuerlig terreng, bedre visuell kvalitet og feilretting

- Geografisk, cachet terrengraster på landflatene, avledet fra eksisterende globeInverse og verifiserte lon/lat-ruter for 27 biomer og 18 fjellkjeder. Dette er stilisert illustrasjon, ikke et faktisk globalt høyde- eller vegetasjonsdatasett.
- To visuelle iterasjoner gjennomført. Første shader ble for subtil; korrigert canopy-kontrast gir klart tettere regnskog og tydeligere fjellmassiver på WebKit iPad-bilder.
- Tidligere WebKit-test #39060983731 viste terrengberegninger vanligvis 40–200 ms, med noen større verdier. Terrengbufferen caches og beregnes ikke i hver stillestående frame.
- Årsaken til Tsjad-kortet ble funnet i eldre v25 `seed()`: Tsjad velges automatisk uten å snu kloden dit. Den nye Oppdag-rendereren kontrollerer synlig land etter tegning, men bevarer store land når synlige deler av polygonet fortsatt er innenfor globusen.
- Tester omfatter normal omtegning med Tsjad bak horisonten, Tsjad som er synlig, Russland med synlig europeisk polygon, landskapsfeltet, trykk, drag, zoom og bytte mellom Enkel/Oppdag.
- Nyeste `main` er inkludert uten å bytte ut annen utvikling. PWA-versjon er økt så Safari laster det nye JavaScript-feltet.
- **Release-gate:** Ingen publisering før siste eksakte PR-head WebKit, generell smoke, kontroll av landskapsbilder og vellykket GitHub Pages-deploy.

## Videreføring 17. oktober kl. 21:33: ytelse og siste kontroll

- Kontrollert PR #179 og gjeldende `main`: den aktive grenen var 31 commits foran, null bak, og opprinnelig Enkel-renderer er ikke berørt av denne økten.
- WebKit/Chromium-run #39060983731 for forrige terrengrenderer er bekreftet **grønn**, med skjermbildeartefakt #12111168595. Dette resultatet godkjenner ikke den nyeste koden automatisk.
- Siste eksakte pre-endrings-PR-commit `1504defc` hadde WebKit-run #39062149395 fortsatt i kø ved kontrollen. Den er **ikke** regnet som bestått.
- Ny optimalisering `4d3c98b`: bygget geografisk breddegradsindeks for biomer og fjellkjeder, slik at hvert terrengpiksel bare vurderer nærliggende kartankre. Indeksbånd overlapper med full søkeavstand; nøyaktig samme nærmeste-anker-beregning, datagrunnlag, landklipp og zoomberegning brukes fortsatt. Ingen endringer i Enkel.
- Statisk regresjonskontroll lagt til i `b234f45` som krever indeks og begge søkeavstander.
- **Ny release-gate:** Kontroller eksakt oppdatert PR-head i WebKit iPhone/iPad stående og liggende samt Chromium, faktisk rendertid og screenshot-forskjell, ordinær smoke og grønn Pages-deploy. Kun tidligere commits er hittil bekreftet. Ikke flett PR #179 før disse er grønne og visuell kvalitet vurdert.
