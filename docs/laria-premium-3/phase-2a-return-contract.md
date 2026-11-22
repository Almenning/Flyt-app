# Læria Premium 3.0 – Fase 2A: returkontrakt

Kandidat: `feat/laria-premium-3-navigation-2a-20261122` fra `main` `d6aa4651127c520f4058ce9cc310a863dfc531cc`.

## Felles regel

`LariaBackControl` er den ene synlige tilbakehandlingen på aktive helskjermsider. Den bruker eksisterende rutehandlere slik at oppgavestatus, lagret progresjon og Basecamp-opprinnelse ikke skrives om.

| Fra | Tilbake går til | Sikker fallback |
| --- | --- | --- |
| Hjem | Ingen tilbakeknapp | Ikke relevant |
| Fagforside | Åpnet panel: Reisen / Utforsk / Hjem | Hjem |
| Aktivitet i et fag | Riktig fagforside | Hjem |
| Kloden | Geografi, Verdensdelen eller opprinnelig Basecamp-panel | Geografi |
| Geografireise | Nordlysleiren først, deretter opprinnelig panel/Hjem | Hjem |
| Gangemagi, Gangetabellen, Brøklab | Tallvika når den var inngangen, ellers Matte | Matte |
| Oppgaveøkt / resultat | Faget som startet økten | Hjem |
| Foreldrevisninger | Foreldreområdet / Hjem | Hjem |
| Dialog | Samme skjerm og samme tilstand | Dialogen lukkes |

## Input-kontrakt

- Trykk: én sentral knapp per aktiv helskjerm.
- Tastatur: `Escape` utfører samme retur; åpen dialog lukkes først.
- Nettleser tilbake: kun intern Læria-tilstand spores; ukjent nettleserhistorikk blir ikke brukt som blind retur ut av appen.
- Venstrekantsveip fortsetter å bruke samme `appBack()`-rute.

## Visuell kontrakt

Kontrollen har eike-/pergamentpaletten fra Lærias etablerte wayfinding, minimum 44 × 44 CSS-piksler, synlig tastaturfokus og safe-area-plassering. Eldre scene-spesifikke hjemmeknapper beholdes som adaptere, men skjules når den felles kontrollen er synlig.
