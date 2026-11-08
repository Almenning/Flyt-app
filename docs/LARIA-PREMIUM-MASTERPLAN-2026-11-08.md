# LÆRIA – bindende masterplan for Premium Beta
**Dato:** 8. november 2026  
**Status:** Arbeidsgrunnlag. **Ingen Premium-godkjenning, merge eller publisering.**  
**Utførelse:** PR #243 i `Almenning/Flyt-app`. Fortsett på eksisterende gren, ingen parallell redesign eller ny PR.

## 1. Produktets formål og ambisjon

> **Barn har lyst til å åpne Læria, foreldre har tillit.**

> **Ikke optimalisere for læreplanen; bruke læreplanen for faglig verdi i det barnet velger.**

- Første målgruppe: barn på **2. trinn**. Uttrykket kan tilpasses klassetrinn uten å bryte produktidentiteten.
- Barnet skal ville utforske, prøve, mestre og komme tilbake av egen lyst. Ikke gjøre appen til en digital oppgavebok.
- Foreldre skal kunne stole på innhold, funksjoner, progresjonslagring, personvern og fravær av manipulerende engasjementsgrep.
- Ambisjon: et kommersielt produkt med **minst 1 000 betalende kunder** over tid. Tallet er et forretningsmål, ikke et grunnlag for å presse barn til mer skjermbruk.
- Kvalitet defineres av **opplevd helhet, faktisk brukbarhet og læringsverdi**, ikke antall commits eller grønne kildekontroller.

## 2. Kanoniske, allerede låste beslutninger (må ikke omforhandles)

Følgende dokumenter gjelder foran tilfeldige nye designforslag:
- [Låst visuell identitet, utvidet 8. november](./LARIA-LOCKED-VISUAL-IDENTITY-2026-11-07.md)
- [iPad-first premiumkontrakt](./LARIA-IPAD-FIRST-PREMIUM-CONTRACT-2026-11-07.md)
- [Premium Beta visuell kontrakt](./LARIA-PREMIUM-BETA-VISUAL-CONTRACT-2026-11-06.md)

**Motiver:** Hjem = Grovanova/Kjøsnesfjorden (den visuelle fasiten), Norsk = Eggenipa, Matte = Tallvika, Engelsk = Kinnaklova, Geografi = Nordlysleiren. Originale låste filer/hashes er skrivebeskyttet. Historisk Tallvika-master er 3 503 795 byte. Ingen uautoriserte fjellbytter eller regenerering av originalscener.

**Karakterer:** Bare de tre allerede godkjente skogstrollene: storesøster (brunt bølgete hår, lilla hårbånd), lillesøster (to knuter) og lillebror (lyst hår, blå øyne). Bare valgt troll er synlig, som levende TrollActor (idle/vinke/tenke/hint/juble), ikke et maleri eller klistremerke. Ingen synlig rev eller «Min rev» i Premium Beta.

**Navigasjon:** Én felles Læria-logo, én rund Hjem-knapp på fagsider og én komponentfamilie for lyse treskilt med to stolper. På fagforsidene er skiltene én samlet, venstrestilt gruppe med samme rekkefølge, størrelseprinsipp og trykklogikk. Landskap varierer; navigasjonen gjør ikke det. Alle skilt er ekte DOM-kontroller. Ingen parallelle aktivitetskort eller nedre ekstrameny.

**Illustrasjon vs. UI:** Landskapene er kunst. Logo, skilt, knapper og TrollActor er separate funksjonelle UI-komponenter. Innmalte gamle logoer/skilt i Grovanova og Kinnaklova **må løses med en kontrollert, ren og uttrykkelig godkjent kunstvariant**. Ikke maskér, dekk til med nye skilt eller kall dobbel UI premium.

**Arkitektur:** Én delt presentasjons-/scenekomponent og felles stiler/variabler. Fjern motstridende legacy-overstyringer i stedet for å stable nye CSS-filer. Eksisterende læringsaktiviteter, ruter, historikk, lagret progresjon og barns valgte troll skal bevares.

## 3. Faste arbeidsporter (rekkefølgen er låst)

### Port 0 – Integritet og grunnlag
- [x] Låste visuelle kontrakter finnes i PR #243.
- [ ] Verifiser låste kunstfiler og lagrings-/progresjonskontrakter på aktuell HEAD.
- [ ] Registrer alle eksisterende visuelle blokkeringer, røde testkjøringer og teknisk gjeld før flere kosmetiske endringer.
- [ ] Én oversikt over hvert skjermbilde, status, gjenstående feil, korrekt commit og lenke til bevis.

### Port 1 – iPad liggende 1366 × 1024
- [ ] **Hjem, Norsk, Matte, Engelsk og Geografi**, reelle skjermbilder fra faktisk app i både WebKit og Chromium.
- [ ] Vis alle fem ved siden av hverandre. Kontroller originalt landskap, harmonisert logo, rund Hjem-knapp, samlet venstrestilt skiltgruppe, to stolper, valgt TrollActor og ingen malt UI-dobling.
- [ ] Ingen konkurrerende kort, tomme beige felter, skjulte landemerker, dekorative trollbilder, doble klikkflater eller feilplasserte skilt.
- [ ] Ekte skiltklikk inn og tilbake, min. 44 × 44 CSS-px, fokus, lesbarhet og valgt troll testet.
- [ ] **Eksplisitt visuell godkjenning fra produkteier** før Port 2.

### Port 2 – iPad stående 1024 × 1366
- [ ] Samme fem skjermer og to nettlesermotorer på **samme HEAD** som tester og bildebevis.
- [ ] Riktig fjell og hovedmotiv synlig, ikke deformert eller uakseptabelt beskåret. Ingen skjulte eller doble logoer/skilt.
- [ ] Uendret progresjon, navigasjon, oppgaver og TrollActor.
- [ ] **Eksplisitt visuell godkjenning** før aktiv mobil-/desktop-redesign.

### Port 3 – Læringsopplevelsen og levende verden
- [ ] Fire fagreiser har riktig integrerte aktivitetspunkter og innhold som barn faktisk vil utforske.
- [ ] Gangemagi, Brøklab, Gangetabellen, norsk, engelsk og geografi fungerer ved berøring; «Neste eventyr» ligger i scenen der låst.
- [ ] Ingen synlig rev, utdatert prototype-UI, lavoppløst oppblåst kunst eller tilfeldige belønningsmekanismer.
- [ ] TrollActor føles som én integrert, levende følgesvenn, gir ikke bort svaret og respekterer redusert bevegelse.
- [ ] Lagret progresjon overlever nytt besøk, reload og bytte mellom aktiviteter.

### Port 4 – iPhone og desktop
- [ ] iPhone stående, liggende, liten iPhone; Mac/laptop 1440 × 900 og desktop 1920 × 1080.
- [ ] Reelle Chromium-/WebKit-bilder og funksjonstester. Ingen avkuttede landemerker, troll over aktiviteter, horisontal scroll, dupliserte scener eller avskåret touch-UI.
- [ ] Alle kritiske tester grønne på eksakt releasekandidat-commit.

### Port 5 – Privat barnebeta og publiseringsbeslutning
- [ ] Barn i målgruppen kan åpne appen, velge troll/fag, starte og løse en aktivitet og finne tilbake uten vokseninstruksjon.
- [ ] Observer om barnet forstår grensesnittet og ønsker å utforske videre, uten ledende spørsmål.
- [ ] Forelder kan kontrollere faglig verdi, trygghet, fravær av kjøpspress og pålitelig progresjon.
- [ ] Alle åpne kritiske feil lukket; bevis og skjermbilder dokumentert.
- [ ] **Ingen merge/deploy/publisering uten eksplisitt godkjenning.**

## 4. Reelle åpne feil og kunstblokker (status 8. november, PR-head `fe4688d`)

| Blokk | Observert forhold | Bevis/status |
| --- | --- | --- |
| P0-1 | Grovanova og Kinnaklova har gammel logo/navigasjon innmalt i kunsten. Én ren, godkjent variant mangler. | Låst visuell kontrakt og PR-beskrivelse; ingen kunstgodkjenning. |
| P0-2 | Tallvika: valgt troll blokkerer en læringsaktivitet på iPhone liggende i **både Chromium og WebKit**. | [Feilet Actions-løp #42457389258](https://github.com/Almenning/Flyt-app/actions/runs/42457389258). |
| P0-3 | Reise-/navigasjonstest venter forgjeves på `#home-screen.active`. | [Feilet Laria QA #42457389229](https://github.com/Almenning/Flyt-app/actions/runs/42457389229). |
| P1-1 | Kinnaklova portrett har meldt beskåret kyst/innmalte elementer. | Åpen visuell blokk i PR #243. |
| P1-2 | Nordlysleiren-bilde 1024 × 704 blir oppskalert på iPad og har meldt myk/pikselert kvalitet. | Åpen kvalitetssak i PR #243. |
| P1-3 | Enkelte Ordjakt-temabilder er 160 × 169 og holder ikke for stor premium-visning. | Åpen kvalitetssak i PR #243. |

Disse er **status ved dokumentopprettelse**, ikke bekreftet komplette eller løst. Endringer skal sjekkes mot siste aktuelle PR-head.

## 5. Arbeidsdisiplin som hindrer «fortsett»-spiralen

1. **Arbeid i ett sammenhengende gjennomføringsoppdrag:** inspiser → fiks en reell blokk → test → ta bevis → sammenlign med låst fasit → dokumenter → ta neste innen samme arbeidsøkt. Ikke stopp etter hvert mikrosteg for å be om «fortsett».
2. **Én PR og én rekkefølge.** Fortsett i #243. Ingen ny PR, tilfeldig motivbytte, separat designsystem, uautorisert merge eller publisering.
3. **Små, sporbare commits.** Ikke force-push. Verifiser testkjøringen mot ny HEAD; gamle grønne resultater teller ikke.
4. **En feil er ikke lukket fordi tester er grønne.** Dokumenter også visuell vurdering av faktiske skjermbilder. Grønn kildekontroll = teknisk delbevis, ikke Premium.
5. **Ingen nye subjektive designvalg utenfor kontrakten.** Dokumenter hva som trenger kunstgodkjenning. Arbeid videre med sikre oppgaver mens dette er blokkert.
6. **Rapporter bare faktiske milepæler:** «kodet», «testet», «visuelt kontrollert», «godkjent» og «publisert» er ulike statuser. Oppgi commit, tester, skjermbilder, gjenstående feil og neste konkrete tiltak.
7. **Menneskelige beslutningsporter:** spør bare om ny kunst som avviker fra den låste originalen, visuell endelig iPad-godkjenning og senere merge/publisering. Verken statusmeldinger eller «fortsett» er del av arbeidskravet.

## 6. Ferdigdefinisjon

**Premium Beta er ikke ferdig** før den godkjente Grovanova-følelsen er gjennomført på alle fem inngangsscener, iPad begge veier er godkjent, trollene er levende og låste, samtlige kritiske læringsflyter fungerer, ingen synlig rev/legacy-doblinger gjenstår, mobil og desktop er kontrollert, regresjonstester er grønne og en reell barnetest er bestått.

**Hovedregel:** *Barnet skal oppleve et sammenhengende eventyrunivers, ikke en samling versjoner. Forelderen skal kunne stole på det som skjer bak illustrasjonene.*
