# Læria iPad-first — akseptansekriterier (7. november 2026)

## Frosne verdier
- Grovanova/Kjøsnesfjorden Hjem: ingen redesign av godkjent motiv.
- Tre låste originaltroll: storesoster, lillesoster, lillebror. Aldri mal et troll inn i scenen.
- Låste motiver og lagret progresjon skal beholdes. Historisk Tallvika-illustrasjon fra 27. oktober er skrivebeskyttet.
- Én brukeropplevelse i samme kodebase for iPad, iPhone og PC. iPad er designprioritet.

## iPad-gate
- To oppløsninger: 1366×1024 (liggende) og 1024×1366 (stående), både Chromium og WebKit.
- Tallvika er visuell basis: full scene, Læria-logo, tre treskilt, kun ett valgte TrollActor, innvendig «Neste eventyr».
- Norsk, Engelsk og Geografi bruker samme toppvalg «Mine troll». Felles dialog er `LARIA_TROLL_ACTOR.openChooser`; den endrer lagret valgt troll, ikke oppgaveprogresjon.
- De tre destinasjonene i hvert fag er trykkbare, uten horisontal scrolling eller funksjonelle duplikater.
- Ingen påstander om premiumgodkjenning uten faktiske skjermbilder og gjennomgang. `tests/laria-ipad-premium-ui.playwright.js` produserer iPad-matrise.
- Uten nye utestede versjoner publiserer vi ikke. Eksisterende iPhone/PC-regresjoner skal bestå.

## Videre arbeidsrekkefølge
1. Tallvika: godkjenn iPad begge retninger, flyten inn/ut av Gangemagi/Brøklab/Gangetabellen og alle tre troll.
2. Norsk/Eggenipa: samme header/skilt og fungering på iPad.
3. Engelsk/Kinnaklova: fyll hele iPad uten å forvrenge/croppe godkjente landemerker eller skjule malte skilt. Dette er **åpent designarbeid**.
4. Geografi/Nordlysleiren: bedre illustrasjonskvalitet og samme kontrollregler.
5. Aktiviteter og belønninger: felles navigasjon, tastatur-/berøringsatferd og levendegjort følgesvenn.
6. Endelig visuell QA, null kritiske automatiske feil, privat barnetest, deretter merge/publisering.

Ikke juster godkjente asset-hasher for å omgå kvalitetstester.
