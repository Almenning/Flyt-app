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

## Oppfølging etter faktisk CI-feil (samme arbeidsøkt)
- På merge-commit `50289b3` fant den dedikerte Setningshavna-testen en reell mangel: responsen var synlig, men «Neste oppdagelse» falt utenfor iPhone-skjermen etter setningsbygging.
- Begge visningene retter nå først fokus og scroll på responsen, og sørger deretter for at neste-handlingen også scrolles inn med minimal bevegelse (`block: nearest`).
- Nye WebKit-skjermbilder av engelsk svar/tilbakemelding inngår i CI-artifaktene for å verifisere den reelle plasseringen.
- Playwrights iPhone/iPad-kontekster er endret til `isMobile:true` med touch og enhetsnær pikselratio. Dette kontrollerer mer enn bare størrelsen til et desktopvindu.
- Etter omleggingen er alle fire CSS/JS-referansene for disse to kapitlene versjonsoppdatert i `index.html`, slik at Safari ikke gjenbruker gamle ressurser fra tidligere implementeringer.
- `main` med den godkjente Markedsbok og den magiske samleboken er integrert i PR-grenen via en ekte merge-commit, uten å publisere kapittel 2.
- **Åpen testport:** alt må kontrolleres på siste SHA etter disse rettelsene. Ingen påstand om grønn test før GitHub Actions bekrefter det.

## Gjentatt karttrykk uten tap av utkast
- Det ble avdekket at et nytt trykk på **samme** stopp i kartet startet det aktive oppdraget på nytt. Dette er rettet i både Setningshavna og Kontinentseilasen: en påbegynt aktivitet gjenopptas, med valgte ordbrikker eller kompass-steg bevart.
- Egen WebKit/Chromium-regresjon gjenåpner det aktive kartstoppet og kontrollerer at delvis progresjon ikke blir overskrevet. Ordinær avspilling av et fullført sted er uendret.
- Besøk på et **annet** sted er fortsatt et bevisst valg som følger kapittelmodellens nåværende én-aktivitet-om-gangen-struktur. Arbeidet påstår ikke å bevare flere samtidige utkast fra forskjellige steder.
- Begge JS-referansene har fått ny versjon i `index.html` etter denne rettelsen. Kontroller igjen på eksakt siste SHA; tidligere grønne kjøringer kan ikke gjenbrukes som godkjenning.

## Første skjermbilde i liggende iPhone
- Ekte WebKit-artifakt fra Setningshavna viste at startknappen nesten forsvant under skjermkanten i 844×390. Begge kartintroene har nå en målrettet, kompakt landskaps-layout for 721–899 px bredde og maks 480 px høyde.
- Playwright krever nå at både «Begynn» og «Fortsett» er fullt synlige og minst 44 px høye på samtlige liggende testformater.
- Dette er ennå intern QA; ingen kapittel 2-illustrasjon er premiumgodkjent eller publisert.


## Kartopplevelse: samlet ledsagerdel og synlige oppdagelser
- Rotårsak: Det høye kartet strakk seg over to automatiske CSS-grid-rader, mens reven og fremdriften lå i hver sin rad i sidekolonnen. Det gav et stort tomrom mellom dem på iPad.
- Engelsk og geografi har nå ett sammenhengende `story-aside` med personlig rev, frivillig start/fortsett, progresjon og rolig veiledning. Mobil beholder visuell rekkefølge rev → kart → fremdrift, ved `display:contents` på en nøytral wrapper.
- Reven snakker i en lysere og enklere boble, mens veiledningen er roligere uten enda et stort innrammet infokort.
- Kun ett av fem kartstopp får en subtil anbefalingsmarkering. Besøkte stopp får et eget uttrykk. Dette er kun veiledning, og alle fem stedene kan velges eller gjentas fritt.
- Nye Playwright-sjekker krever én sammenhengende ledsagerkolonne, ett anbefalt sted, mobilrekkefølge og fremdrift synlig ved reven på iPad-landskap.
- Arbeidet endrer **ikke** originalkartene, SVG-kartillustrasjonene, den klassiske globusen eller arbeidet med Oppdagelsesglobusen. `published:false` / `artApproved:false` beholdes.
- Ingen lanseringsgodkjenning før CI på ny commit og manuell kontroll av faktiske WebKit-skjermbilder. Grafikken er fortsatt en intern kandidat og trenger egen premiumgodkjenning.
