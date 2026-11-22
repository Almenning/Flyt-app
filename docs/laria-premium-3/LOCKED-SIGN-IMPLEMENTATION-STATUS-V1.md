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
| Grovanova / Hjem v16 | Fire fagskilt er en del av den låste bakgrunnspikselen. | Ny geometri kan ikke implementeres uten en separat, godkjent UI-fri kunstmaster. De eksisterende tilgjengelige trykkflatene beholdes. |
| Kinnaklova / Engelsk | Aktiv master inneholder fortsatt innmalte skilt. | Nytt DOM-skilt rendres ikke over gammel kunst. Handlings-ID-ene `words`, `sentences` og `reading` beholdes. En ren, godkjent Kinnaklova-master kreves før pilotens visuelle port kan bestås. |

Dette er bevisste kvalitetssperrer. Å legge nye planker oppå gammel, innmalt
skiltkunst ville bryte den låste identitetsregelen og skape doble menyer.
