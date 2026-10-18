# Læria Ordjakt: nattkontroll av WebKit på liten iPhone

## Faktisk feilsignal
- GitHub nattkontroll på main `1a01db7456f9ae2ad01347ea721571188c27852a`, [run #39097119142](https://github.com/Almenning/Flyt-app/actions/runs/39097119142), 18. oktober.
- `logs/ordjakt.log` i artefakt `laria-nattkontroll-39097119142` viser PASS i Chromium iPhone 390/320, iPad og Mac, samt WebKit iPhone 390.
- Første stopp er WebKit 320x568, før et spillbrett vises: `locator.click: Timeout 30000ms exceeded` ved `[data-word-theme="mixed"]`, mens Playwright rapporterer at knappens DOM-element er funnet og venter på at det er «visible, enabled and stable».
- Den tidligere nattkontrollen [run #39077703289](https://github.com/Almenning/Flyt-app/actions/runs/39077703289) bestod på samme `main`. Dette peker mot en mulig WebKit/Playwright-layout- eller scroll-ustabilitet, men er ikke bevis for at et fysisk barnetrykk feiler.

## Avgrenset rettelse i egen testgren
- Ingen produksjonskode endres.
- `tests/laria-word-hunt-phase4.playwright.js` tester at temakortet faktisk ligger innenfor startvisningen, har minst 44x44 px trykkflate, er aktivt og er det synlige elementet ved berøringspunktet (`elementFromPoint`).
- Testen bruker ekte mobilberøring på kontrollert koordinat med `page.touchscreen.tap`, ikke tvungen DOM-`click`. Etterpå krever den fremdeles at velgeren lukkes og at det spillbare brettet vises. Andre krav til rev, ordjakt, respons og progresjon beholdes.

## Kvalitetssperre
- Ikke lukk nattfeilen som rettet før ny nøyaktig PR-commit bestått WebKit 320/390, Chrome 320/390, iPad og øvrige test- og tilgjengelighetskrav.
- Ved ny feil må skjermbildet og faktisk hit-test analyseres, ikke omgås med force-click.
- Ingen automatisk publisering av andre uferdige kapitler.
