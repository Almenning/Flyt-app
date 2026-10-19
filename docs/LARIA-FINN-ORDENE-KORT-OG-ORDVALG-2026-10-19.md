# Læria: Finn ordene – likestilt aktivitet og ordvalg (19.10.2026)

## Produktbeslutning

Brukeren ønsker at **Finn ordene** skal være likestilt med øvrige «Utforsk og lek»-aktiviteter, ha **eget illustrert kort i identisk størrelse**, og gi en mer gjennomtenkt utfordring. Barnet skal **velge et ord først**, deretter finne riktig gjenstand i bildet. Å trykke tilfeldig i bildet skal aldri være nok til å få et ord godkjent.

## Gjort i denne utviklingsgrenen

Gren: `feat/laria-find-words-equal-card-select-first-20261019` (fra main `217947b2d5ef351242c6e806dfd5e186cad7ed33`).

- I `laria-navigation-v13.js`: Den tidligere lille knappen i fotnoten er fjernet. «Finn ordene» er et femte ordinært kort med eget sceneillustrasjonsbilde (`find-the-words-scene.svg`), egen tittel og korttekst. Fire etablerte kort kommer først og er uendret.
- I `laria-navigation-v13.css`: Fem kort legges 3+2, med to sentrerte kort nederst på store skjermer, og 2+2+1 med siste kort sentrert på smale skjermer. Hvert kort har samme bredde og høyde; innholdsrutenettet ruller selv på små skjermer uten å dekke navigasjonsfeltet.
- I `find-the-words.js`: Aktivt valgt ord markeres tydelig, leses høyt når tale er tilgjengelig og lagres. Bare riktig kombinasjon av valgt ord og trykkbar gjenstand gir fremgang. Feil kombinasjon eller trykk uten ord gir ingen funn, og en feil kombinasjon krever nytt bevisst ordvalg. Ny ordjakt fjerner valget. Hint fungerer bare for et konkret valgt ord, først tekstlig ledetråd, deretter visuell utheving. Opprinnelig funn- og fullføringslogikk beholdes.
- I `find-the-words.css`: Stor, kontraststerk markering av valgt ord, tydelig «2. Finn «ord» i bildet» og tilpassede mobilstørrelser. Barnets valgte rev er fortsatt aktiv veileder.
- `index.html` og `sw.js`: oppdaterte ressursversjoner for å unngå gammel JavaScript/CSS i Safari/PWA.

## Avgrensning

**Standard interaksjon er velg ord → trykk på gjenstanden.** Dette oppfyller den eksplisitte minimumsløsningen. Dra-og-slipp er ennå ikke lagt til, fordi trykkinteraksjonen er mer robust for små barn på iPhone/iPad og fungerer også med tastatur/skjermleser. Dragging kan legges til som *valgfri* ekstra interaksjon senere hvis testsituasjonen viser at det hever brukeropplevelsen.

## Tester oppdatert

- `laria-find-the-words.playwright.js`: FEM like kort, selvstendig illustrasjon, ingen score ved tilfeldig trykk, valgt ord med aria-pressed og utheving, hint knyttet til ordet, feil match uten poeng, ny valgt match for hvert riktig funn, lagret valgt ord etter omstart, original bokstav-Ordjakt med fem temaer.
- `laria-navigation-v13.playwright.js`: FEM Utforsk-destinasjoner og fire reisekort.
- `laria-home-subjects-v14.playwright.js`: FEM Utforsk-kort; fire hjemfag.
- `laria-premium-cards.playwright.js`: Bevarer verifikasjonen av de åtte opprinnelige godkjente 1024×704-WebP-bildene. «Finn ordene»-kortet bruker en eksisterende malt Bokskogen-WebP som eget motiv, med dekorativt forstørrelsesglass; filen er uavhengig av de åtte låste illustrasjonene. Selve spillscenen forblir den opprinnelige illustrerte SVG-en.
- `laria-navigation-v13.cjs`: inkluderer ny destinasjon.

## Kvalitetsport

1. Opprett PR, la Github Actions kjøre WebKit og Chromium på liten iPhone, vanlig iPhone og iPad stående/liggende.
2. Sikre fem like, faktisk synlige kort og riktig hit-testing, også når små skjermer må scrolle inne i Utforsk-vinduet.
3. Bekreft at feil eller tilfeldige trykk *aldri* gir fremgang og at hint ikke løser automatisk.
4. Se faktiske skjermbilder på kritiske enhetsstørrelser og korriger visuell kvalitet før merge.
5. Bekreft ingen regresjoner for Ordjakt, SuperKlode, reiser eller de fire tidligere aktivitetene.
6. Flett først når relevant eksakt-head-kvalitetssikring er grønn. Verifiser at endringen blir tilgjengelig på GitHub Pages.

## Fremdriftsstatus

**Fullført og publisert 19.10.2026.**

- PR [#191](https://github.com/Almenning/Flyt-app/pull/191) er flettet inn i `main` som merge-commit `7ad906db5442b8ed8ea5dc4f5537514bc9e17ffb`.
- Ny malerisk illustrasjon i det femte kortet: `bokskogen-reference-bg.webp` med eget forstørrelsesglass. Ingen av de åtte tidligere godkjente premiumkortfilene er erstattet eller redigert.
- GitHub Actions på eksakt PR-head `05902f7817c42b3ee758e3622d971b16a2de9446`: «Laria Finn ordene WebKit» #39228109341 = **SUCCESS**. Full scenetest og screenshotbevis på liten iPhone (320×568), vanlig iPhone (390×844), iPad stående og liggende, samt Chromium.
- Skjermbildene er inspisert: fem likestilte kort; valgt ord er tydelig, hintets markør peker på valgt gjenstand; ingen tap på feil objekt gir poeng. Den gamle bokstav-Ordjaktens fem temaer er fremdeles tilgjengelige i testen.
- PR-head «Continuous smoke checks» = **SUCCESS**, og relevant «Laria Dual Globes Release QA» = **SUCCESS**. Den omfattende «Laria QA»-arbeidsflyten var fortsatt i gang ved sammenslåing. Ikke oppgi den som fullført før status er kontrollert.
- Publisering via GitHub Pages (legacy) fra `main`-roten ble bekreftet av pages-source-jobben. GitHub Pages build og deploy på `7ad906d` besto.
- Post-merge GitHub Actions «Laria Finn ordene WebKit» #39230381554: picture-hunt **SUCCESS** og **pages-live SUCCESS**. Sistnevnte hentet offentlig Læria HTML, ordjakt-JS/CSS, spill-SVG, nytt kortbakgrunnsbilde, Utforsk JS/CSS og Safari-cache, og bekreftet versjonsmarkørene fra publisert side.
- Live adresse: https://almenning.github.io/Flyt-app/laer-litt-mer/?app=laria → Utforsk → Finn ordene.

**Bevisst ikke inkludert:** valgfri dra-og-slipp av ord, nye scener og total premiumredesign av selve spillscenen. Denne leveransen dekker oppgradert kort og ord-først-matching; ytterligere spillkunst krever egen avgrenset iterasjon.
