> **NY OVERORDNET VISUELL FASIT 22.11.2026:** Brukeren har låst skiltarket `laria-sign-master-v1.png`. Eksakt SHA-256 og gjennomføringsporter ligger i [LOCKED-SIGN-DESIGN-V1.md](./LOCKED-SIGN-DESIGN-V1.md). Der dette eldre dokumentet sier at Hjem/Grovanova skal styre skiltets *form*, er det nå **den nye genererte skiltmasteren** som er fasit for form/materiale/medaljong/tekst. Hjem v16 er fortsatt fasit for **landskap og komposisjon**. Eksisterende pilformede 2B-prøver er ikke visuelt sluttgodkjent.\n\n# Læria Premium 3.0 | Fase 2B: Felles skiltstandard

**Status:** Designkontrakt godkjent som arbeidsretning 22.11.2026. **Ikke produksjonsklar, ikke visuell sluttgodkjenning.**
**Sak:** https://github.com/Almenning/Flyt-app/issues/271
**Avhengighet:** PR #270 dekker navigasjon og håndteres separat; denne grenen er opprettet fra `main`, uten å ta inn #270.

## Formål
Skiltene skal se ut som fysiske, tydelig lesbare objekter i samme illustrerte eventyrverden på Hjem, Norsk, Matte, Engelsk og Geografi. Materialfølelsen fra Hjem liggende og den ryddige venstremenyen fra fagene kombineres i **én felles skiltkomponent**.

## Visuelle invariants
1. **Én familie:** håndskåret eik/pergament, organisk ytterkant, varmt tre, samme skiltform, skyggetype, tekstfont, ikonvekt, ikonjustering, padding og vertikal avstand.
2. **Én gruppering:** skilt fra venstre, på nøyaktig to sammenhengende stolper. Ikke parallell høyremeny, dupliserte skilt, grønn legacy-pil eller separat moderne kortliste.
3. **Fysisk integrasjon:** stolpene slutter i et synlig og troverdig terrengpunkt, uten å krysse tak, vann, dyr, troll eller viktige motivdetaljer. Samme komponent kan ha egne koordinater og skala per scene og format.
4. **Informasjonshierarki:** Hjem fire fag; fag tre primære aktiviteter. Tallvika `Neste eventyr` er en sekundær handling inne i illustrasjonen og skal ikke være et fjerde likestilt primærskilt.
5. **Interaktivitet:** behold ekte DOM-knapper, riktig rute, tastaturfokus, tilstand og retur. Minst 44×44 px trefflate og ingen usynlig overlay som blokkerer barnet.
6. **Låst kunst:** aldri mal navigasjon eller troll inn i landskapsbildet, flytt fjell eller tegn over låst master. Ikke endre læringsmotor, progresjonsformat, fagidentitet eller figurenes opprinnelige kunst.

## Per scene
| Scene | Hovedproblem nå | Tiltak og krav til godkjenning |
|---|---|---|
| Hjem / Grovanova | Eldre v15-fallback har sidefelt; den eiergodkjente v16-portrettvarianten viser allerede helskjerm og fysisk forankrede skilt | **Behold v16 urørt som fasit.** Kontroller oppførsel på alle fem iPad-formatene. Ikke bruk v15-fallback som grunnlag for å redesigne v16. |
| Norsk / Eggenipa | Stolper foran fjernt vann/fjell mangler jordkontakt | Bruk naturlig vegetasjon/forgrunn, ikke visuell sveving. Behold Lesekroken og aktivitetsrutene. |
| Matte / Tallvika | Fjerde `Neste eventyr` konkurrerer med tre aktiviteter | Tre skilt samlet; `Neste eventyr` mindre og sekundært, fortsatt i illustrasjonen. Stolper ved realistisk stein/terreng. |
| Engelsk / Kinnaklova | Stolpene havner ved/på kirketak i portrett, skala problematisk | Forankre i forgrunn med tydelig bakke; kirken og låste fjell forblir synlige. |
| Geografi / Nordlysleiren | Skarpe skilt mot uskarp bakgrunn, dårlig terrengkontakt | Forankre ved leir/forgrunn; bakgrunnskvalitet er separat art-godkjenningsport, aldri bytt låst motiv uten eierens aksept. |

## Enhetsmatrise
- iPad stående: 820×1180, 1024×1366
- iPad liggende: 1180×820, 1024×768, 1366×1024
- Begge nettlesermotorer: Chromium og WebKit
- **Ingen telefon-/desktop-omdesign i denne fasen**, men eksisterende oppførsel må ikke forringes.

## QA: bevis før merge
For alle fem scenene i hvert format: før-/etter-skjermbilde på eksakt commit, kontroll av bildet, skiltposisjon, stolpeender, UI-frisoner, overlapp, lesbarhet, kontrast, fokus, safe-area og alle knapper. De fem formatene skal testes med både Chromium og WebKit. Testene må dokumentere:
- skiltet treffer ikke tak/vann/andre objekter og ser forankret ut (visuell gjennomgang);
- ingen hvit overscrollbakgrunn eller klipping av fjell/meny;
- ett sett stolper og skilt, ingen doble menyer;
- ingen endring i opprinnelige masterfiler eller kunstens integritetsverdier;
- riktig faktisk navigasjon, samme oppgavemotor, uendret lagret progresjon;
- eierens separate, uttrykkelige visuelle godkjenning av stående/liggende iPad.

**Grønn CI er nødvendig, men ikke tilstrekkelig.** Ikke merge eller publiser før både QA og visuell eiergodkjenning er dokumentert.

## Arbeidsrekkefølge
1. Kontroller `main` og hent reelle baseline-skjermbilder per scene/orientering.
2. Refaktorer til én standard for skilt/stolper/ikoner, ikke flere `!important`-lag.
3. Definer scenespesifikke, orienteringsspesifikke terrengankre etter bildeutsnitt.
4. Plasser sekundær Tallvika-knapp separat; behold én aktivitetsskiltrekke.
5. Mål reelle skjermbilder og navigasjonsflyter; iterer til kvalitet er godkjent.
6. Først etter eierens visuelle sign-off: vurder merge og publisering.

> Dette dokumentet låser **retning og akseptkrav**, ikke de endelige bildekoordinatene eller en utestet layout.


## Ny visuell baseline (22.11.2026)
Eksakt-head CI-artefakt `laria-home-v16-mac-4baef0de...`, spesielt `chromium-820x1180-v16-portrait.png` og `chromium-1024x1366-v16-portrait.png`, viser Grovanova v16 med gjennomgående illustrasjon helt ut i kantene og skiltstolper i vegetasjonen. Den eldre v15-testen var misvisende som mål for framtidig Hjem-komposisjon. **Ingen ombygging av Hjem v16 er nødvendig i 2B.**

Første implementerte kandidat ligger bak `?app=laria&lariaSigns2b=1`. Den endrer bare stil og posisjonering i fagene, i første omgang Kinnaklova portrett og Tallvika sekundært `Neste eventyr`. Normal URL er uendret. Dette er ikke en godkjent sluttplassering før reelle Chromium- og WebKit-skjermbilder er vurdert.
