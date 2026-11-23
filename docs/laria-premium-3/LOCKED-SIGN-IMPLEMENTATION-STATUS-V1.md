# Læria Premium 3.0 – låst skiltstandard V1

## Kandidatstatus

Denne kandidaten importerer den uendrede visuelle fasiten som
`laer-litt-mer/assets/ui/locked-reference/laria-sign-master-v1.png`.

- SHA-256: `1b3cdb93f04b95b7b0850653827cb5e6235a69afc5c94e39ab5eba78640678db`
- Bruk: versjonert referanse for kvalitetssikring, aldri som ferdig menybilde.
- Runtime: `LariaWoodenSign` beholder eksisterende, tilgjengelige
  DOM-knapper og handlere og legger til felles planke-, nagle-, medaljong- og
  ikonbehandling på frie scene-UI-lag.

## Implementert i kandidaten

- Tallvika, Bokskogen og Nordlysleiren bruker den samme komponentkontrakten
  når den eksisterende scene-adapteren aktiveres på iPad.
- De opprinnelige handlings-ID-ene og lagret progresjon beholdes.
- Kinnaklova og Grovanova er bevisst ikke malt over med nye planker.

## Visuelle sperrer

| Scene | Faktisk tilstand | Konsekvens |
| --- | --- | --- |
| Grovanova / Hjem v16 | **Den opprinnelige brukerreferansen er et eksakt utsnitt av de allerede innmalte fire fagskiltene i denne låste v16-masteren.** | **FERDIG VISUELL REFERANSE:** Behold den eiergodkjente v16-kunsten og dens eksisterende fire ekte DOM-trykkflater **uendret**. IKKE krev UI-fri Grovanova for å rulle ut samme skiltstil i de andre fagene. |
| Kinnaklova / Engelsk | Aktiv master inneholder fortsatt innmalte skilt. | Nytt DOM-skilt rendres ikke over gammel kunst. Handlings-ID-ene `words`, `sentences` og `reading` beholdes. En ren, godkjent Kinnaklova-master kreves før pilotens visuelle port kan bestås. |

Dette er bevisste kvalitetssperrer. Å legge nye planker oppå gammel, innmalt
skiltkunst ville bryte den låste identitetsregelen og skape doble menyer.

## Viktig avklaring 22.11.2026: Grovanova var allerede fasiten

Brukerens første referanse `laria-originalreferanse.png` (564×886) er
**et faktisk utsnitt fra**
`laer-litt-mer/assets/home-v16/laria-grovanova-v16-landscape-original.png`
(1448×1086). Identiteten ble kontrollert ved SIFT + RANSAC, med
**969 geometrisk konsistente samsvar** og skala **0,6516**, forskyvning
x≈27,95, y≈298,50; etter perspektivjustering var gjennomsnittlig
per-kanal bildeavvik bare **5,54/255**. Det er samme malte skiltkunst,
ikke bare et lignende motiv.

**Konsekvens: Hjem har allerede den nøyaktig ønskede skiltformen.**
Bruk `laria-grovanova-v16.js` sine eksisterende `.bc15-v16-sign`
DOM-hitmål for Norsk/Matte/Engelsk/Geografi. De dekker de allerede
synlige, låste skiltflatene uten å tegne en ny grafikk.
Refaktorer `LariaWoodenSign` i fagene for å **matche Hjem-bildet**,
ikke omvendt. Hjem inngår i piloten som **visuell fasit og funksjonell
regresjonskontroll**, ikke som en kunstutskiftingsoppgave.

Den separate draft-PR #274 (Grovanova UI-fri kunstport) er nå et
**valgfritt framtidig moderniseringsspor**, ikke en sperre for å
implementere brukerens skiltønske. Maskert retusj av v16 ville endre
ca. **54 % av bildene** og ga uakseptabel utsmøring i
OpenCV Telea/Navier-Stokes-testene, selv om SHA og pikselvern bestod.
Disse utkastene er **forkastet** som produksjonskunst. Ingen original
er endret.

**Kinnaklova / Engelsk er annerledes:** Denne scenen må fortsatt
verifiseres for reell UI-fri kunst og dobbeltgjengere før nye
`Words`, `Sentences`, `Reading`-skilt rendres. Ingen underforstått
publisering eller kunstgodkjenning.
