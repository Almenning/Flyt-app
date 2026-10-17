# Læria: Engelsk og Geografi kapittel 2, mobilinngang og umiddelbar respons
Dato: 17. oktober 2026. Arbeidsgren: `feat/laria-chapter2-easy-start-english-geography-20261017`, PR #169.

## Produktmål
Barnet skal komme direkte i gang med et valgt eventyr uten å måtte rulle gjennom et langt kart. Kartet forblir en fri utforskingsflate med fem tilgjengelige stopp. Når barnet allerede er i gang, skal «Fortsett» ikke erstattes av en knapp som starter på nytt.

Etter et svar må barnet se responsen uten å lete etter den under skjermkanten. Handlingen «Neste oppdagelse» skal være tilgjengelig med kort vei videre.

## Implementert i utviklingsgrenen
- Setningshavna og Kontinentseilasen viser personlig rev og frivillig start/fortsett i første skjermområde på iPhone.
- Kart og alle fem trykkbare landemerker beholdes, og de samme scenene støtter iPad landskap.
- Layout er samlet i én eksplisitt grid for hver scene, med mobilrekkefølge reveinvitasjon → kart → fremgang. Unødvendige etterfølgende CSS-overstyringer er fjernet.
- Etter et svar setter appen fokus på den synlige tilbakemeldingen og bruker `scrollIntoView` med `block: center`, fremfor å la responsen bli liggende utenfor skjermen. Geografirespons kan nå motta programmatisk fokus.
- Eksisterende datamodell, kapittel 1, globusen og de fire godkjente reisekartene er uendret.

## Reelle regresjonstester
- Playwright Chromium desktop og WebKit iPhone 320×640, iPhone 390×844, iPhone liggende 844×390, iPad stående 820×1180 og iPad liggende 1180×820.
- Begynn- og fortsettknapper, riktig startsted, fem separate kartstopp, minst 44 px trykkflater, ingen horisontal overflyt og lagret progresjon ved omlasting.
- Ny test kontrollerer at responsen og «Neste oppdagelse» vises i skjermområdet umiddelbart etter svar. CI-resultat må kontrolleres på eksakt head, ikke en eldre vellykket kjøring.

## Sperrer før publisering
- Kapittel 2 forblir utviklersperret; `published:false` og `artApproved:false` oppheves ikke her.
- Illustratoriske SVG-kart for Setningshavna og Kontinentseilasen er fortsatt interne kandidater. De er spillbare, men ikke godkjent på premium-nivå med de fire originalkartene.
- Kontrollér skjermbilder fra GitHub Actions på eksakt commit, spesielt lille iPhone, iPhone liggende og begge iPad-orienteringer.
- Kontroller at siste `main` er tatt hensyn til før fletting. Ikke overskriv magisk samlebok eller Gangemagi-oppdateringer fra andre parallelle arbeidsgrener.
- Ingen sammenslåing, publisering eller påstand om fysisk enhetstest før alle relevante kontroller er bestått.

## Siste kjente status ved opprettelse
- De dedikerte English/Geography-testene på forrige commit `e304b9f` var grønne, sammen med de øvrige ferdige løpene; QA og smoke kjørte fortsatt.
- Nye tester for tilbakemelding er startet på nyere commit `12901f9`. De regnes ikke som bestått før GitHub Actions bekrefter det.
