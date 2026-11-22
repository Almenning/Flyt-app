# Visuell avviksrapport

## P0 – kritisk

| Skjerm | Dokumentert problem | Teknisk årsak | Løsning | Omfang |
|---|---|---|---|---|
| Publisert Hjem | Live app viser eldre Basecamp/dashboard i stedet for den sammenhengende Grovanova-retningen. | `main` er `d6aa465`; PR #268 er ikke merget/publisert. | Velg og verifiser én godkjent investor-kandidat før demo. Ikke presenter åpne PR-er som live produkt. | Release/prosess |
| Global demonstrasjon | Investor får ulike visuelle produkter avhengig av inngang: Basecamp, fagscene, eldre spillflate og nye iPad-piloter. | Flere aktive renderere og CSS-generasjoner lever side om side. | Fase 2 må innføre en felles app-shell og route-kontrakt før lokal polering. | Global |
| Geografi | Nordlysleiren mangler en godkjent, høyoppløselig UI-fri scene for oppgaveflater; eksisterende test av oppskalering er avvist. | Release-gaten dokumenterer manglende 1600×900-kilde. | Ikke kosmetisk oppskalering. Skaff godkjent kilde før visuell samordning. | Fagspesifikk |

## P1 – premiumbrudd

| Skjerm/aktivitet | Problem | Sannsynlig årsak | Foreslått løsning | Omfang |
|---|---|---|---|---|
| Hjem, fag og aktiviteter | Tilbakeknapp og «Hjem»-tilbakeflyt har flere uttrykk: rund ikonknapp, tekstknapp, malte hot-spots og aktivitetsspesifikke knapper. | Parallelle moduler: Basecamp, locked journey, task scene, spillmoduler. | Én `LariaBackControl` med varianter bare der illustrasjonen krever malt hotspot. Felles plassering, 44 px mål, fokus og returkontrakt. | Global |
| Toppmeny | Klassetrinn, profil og innstillinger konkurrerer visuelt med forskjellige skall og enkelte historiske profiler/rev-komponenter. | Overlappende CSS: foundation, home, fox/troll runtime og modul-CSS. | Én `TopUtilityBar` med prioriteringsregler og iPad-sikker sone. | Global |
| Matte | Standard oppgaver, Gangemagi, Brøklab og Gangetabellen har fortsatt ulike overflater. PR #268 løser Tallvika-bakgrunn og overlapper, men ikke systemmessig samordning. | Hver aktivitet har egen CSS-epoke og eget navigasjonsskall. | Del task-shell, retur, toppbar, kort, feedback og type-/farge-token. Behold aktivitetenes egne spillflater. | Matte-familie |
| Engelsk | Kinnaklova-fagscene er illustrert; Words/Sentences/Reading bruker felles oppgavekort. Dette er nå visuelt nærmere etter #268, men overgang og komponenter er fortsatt separate systemer. | `kinnaklova.css` + `laria-task-scene-v15.css`. | Samme oppgaveshell som Norsk/Matte, med fag-token og kontrollert sceneovergang. | Global + fag-token |
| Norsk | Bokskogen/Eggenipa og Lesekroken har egne narrativ-/kortkomponenter ved siden av den generiske oppgavescenen. | Egne moduler og eldre onboarding/journey-renderere. | Standardiser chrome og feedback; behold fortellingsspesifikke elementer lokalt. | Norsk |
| Troll | Troll er separate i nyere scener, men runtime må også håndtere eldre rev-/avatarregler og `!important`-overstyringer. | `laria-fox-presence.css`, `laria-troll-runtime-v1.css`, historiske avatarflater. | Etabler én TrollHost-kontrakt. Ingen ny animasjon i denne fasen. | Global |
| Responsivitet | iPad har målrettede grønne tester, men iPhone/desktop er ikke visuelt godkjent på samme kandidat. | Portrett/landskap behandles ofte i individuelle moduler. | Etter iPad-konsolidering: en liten, felles responsiv matrise for hver shell. | Global |

## P2 – polering

- Harmoniser skygger, hjørner, typografisk skala og mellomrom for oppgavekort.
- Reduser synlige «fallback»- og statusflater i demo-ruter; bevar fail-closed teknisk, men gjør veiledning barnevennlig.
- Stabiliser plass og proporsjon for valgt troll per scene, med én sikker sone per fag.
- Samle knappetekst og ikonografi: «Hjem», «Tilbake», «Fortsett», «Prøv igjen» og «Få hint».

## Skjermbildegrunnlag

Se [EVIDENCE.md](EVIDENCE.md). Bildene er reelle appkjøringer i WebKit/Chromium-enhetsemulering, ikke fysisk iPad. Fysisk Safari/iPad-kontroll gjenstår.
