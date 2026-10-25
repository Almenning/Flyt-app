# Tallenga: visuell rekonstruksjon – fase 1–4 (25.10.2026)

Status: **klar for visuell godkjenning, ikke merge/publiser.** Arbeidet er
begrenset til draft-PR #220 og aktiveres fortsatt bare med
`?tallenga=prototype`.

## Fase 1 – kontrollert utgangspunkt

- PR #220 ble kontrollert på `eb107d00a473a8b1f1c5b1f1bede188f9c02c181`.
- PR #208, #211, #218 og #219 ble gjennomgått. De viser samme mønster:
  originale trollfiler er gjenbrukt som helfigur-bilder over en uavhengig
  bakgrunn. De skal ikke brukes som bevis på at karakterintegrasjon eller
  rigging er løst.
- Navigasjonen til Gangemagi, Brøklab, Gangetabellen, gammelt kart og neste
  oppdrag er beholdt. Ingen oppdrags-ID, læringsmotor eller lagringsformat er
  endret.

## Fase 2 – ressursrevisjon og hard stopp for figurer

De tre godkjente filene er byte-identiske med de tidligere PR-ene:

| Fil | Git-blob | Raster | Begrensning |
| --- | --- | ---: | --- |
| `storesoster.webp` | `5d5f80c15e367bbd4600013057c7820a7b2e2adb` | 271 × 420 | Ett flatt bilde, innebygget gressfot og kantutjevning |
| `lillesoster.webp` | `661107cd231a72b14aeca4f7bc3c826130734576` | 281 × 420 | Ett flatt bilde, innebygget gressfot og kantutjevning |
| `lillebror.webp` | `5f92c89319ec372b980c75eb3d538a4f4f851a7c` | 304 × 420 | Ett flatt bilde, innebygget gressfot og kantutjevning |

Alle har gjennomsiktighet, men **ingen separate lag** for ansikt, hår, kropp,
armer, klær, skygge, gressfot eller lys. Det finnes heller ingen nøytral
stående positur. De kan derfor ikke settes i et nytt landskap med ren
bakkekontakt og scene-lys uten å fremstå som pålimte utklipp. Å maskere dette
med skygge, fargetoning eller bevegelse ville være akkurat den typen falsk
reparasjon som er avvist.

**Beslutning:** Figurimplementeringen i Tallenga er stoppet og de rå
trollbildene er fjernet fra hero og aktivitetskort. Ansikter, hår, klær og
proporsjoner er dermed ikke endret eller erstattet.

For å åpne karaktersporet trengs enten en redigerbar original med separate
lag, eller et godkjent tegningssett med minst: nøytral helfigur uten innebygget
bakke, separat hode/hår/overkropp/underkropp/armer, separat forgrunnsgress,
og lys-/skyggeinformasjon for samme retning som Tallenga.

## Fase 3 – sammenhengende Tallenga-scene

`tallenga-fjord-scene-v1.svg` er beholdt som ett illustrert miljø: himmel,
Ryssdalshorn-inspirert fjellrygg, fjord, landsby, vann, skog og forgrunnseng.
Heroen er ikke et foto med løse klistremerker oppå. Aktivitetskortene bruker
utsnitt av samme verden, slik at inngangene oppleves som steder i Tallenga
(Bærengen, Delingshagen og Tallstien), ikke tre generiske bokser.

## Fase 4 – funksjonell og visuell port

- Rå troll-`img`-elementer er eksplisitt forbudt i den nye Tallenga-scenen av
  den dedikerte Playwright-testen.
- Testen beholder kontroll av Chromium/WebKit, iPhone, iPad portrett og iPad
  liggende, navigasjon til de tre lekene, reell Gangemagi-handling, Brøklab,
  lagring gjennom reload og uendret standardflyt uten URL-flagget.
- Lokalt kunne nettlesermotorene ikke installeres i denne kjøringen (miljøets
  systempakke-rettigheter og avbrutt browser-nedlasting). Derfor er det **ikke
  hevdet** at bilder er godkjent. PR-arbeidsflyten skal kjøres på eksakt ny
  commit og artefaktene skal være de endelige iPhone/iPad-bildene før
  godkjenning.

## Visuell sammenligning og neste beslutning

Det nye resultatet oppfyller den viktige negative kontrollen: ingen synlige
figurkollasjer eller CSS-skygger som later som de er sceneintegrasjon. Det er
fortsatt en bevisst mellomtilstand: en helhetlig Tallenga-forside uten troll,
ikke en påstand om ferdige karakterer. Før videre arbeid må den visuelle
retningen godkjennes, og karakterressursene må avklares.
