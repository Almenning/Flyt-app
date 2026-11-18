# Læria – prosjektregler

Disse reglene gjelder ved arbeid i `Almenning/Flyt-app`. De er skrevet for å
beskytte den avtalte Læria-retningen mens appen ferdigstilles.

## Prioritet og avgrensning

- Når oppgaven gjelder Læria, er Læria førsteprioritet i dette repositoriet.
- Arbeid med Læria skal ikke endre HverdagsOss, med mindre oppgaven uttrykkelig
  ber om det.
- Start alltid fra oppdatert `main`. Ikke portér eller gjenoppliv eldre PR-er
  ukritisk; undersøk først om nyere `main` allerede har en bedre eller
  erstattende løsning.

## Visuell lås

- Låste illustrasjoner er kildekunst og skal ikke erstattes, regenereres,
  beskjæres eller fargebehandles ukritisk. Bevar originalfil, integritetstester
  og godkjent utsnitt.
- De tre skogstrollene er låste karakteridentiteter. Ikke bytt identitet,
  uttrykk eller underliggende karakterpakke uten uttrykkelig godkjenning.
- Trollene skal være levende, separate og interaktive karakterer. De skal ikke
  bakes inn i eller gjøres avhengige av bakgrunnsillustrasjoner.
- Hjem og fagforsidene skal oppleves som én rolig, sammenhengende premiumapp.
  Fagforsidene bruker samme premium-språk og én samlet, venstrestilt
  skiltlogikk; ikke legg til konkurrerende skilt eller dobbelt navigasjon.

## Kildetro visualisering og produktskille

- Les `docs/LARIA-LOCKED-VISUAL-IDENTITY-2026-11-07.md` og
  `docs/LARIA-HJEM-IPAD-PORTRAIT-ART-BRIEF-2026-11-18.md` før alle
  visuelle endringer av Læria Hjem. Disse dokumentene er bindende.
- Ved skisser og appvisninger av Hjem skal den låste Kjøsnesfjorden/Grovanova-
  illustrasjonen brukes som faktisk kilde, ikke som løs inspirasjon.
  Gjeldende originaler ligger under `laer-litt-mer/assets/home-v15/`
  (`kjosnes-home-tablet.webp` og `kjosnes-home-phone.webp`).
  Fotografier av Grovanova er geografiske kontrollreferanser, ikke
  tillatelse til å bytte ut den låste illustrasjonen.
- Ikke generer nye fjell, fjordsider, bygninger, skogstroll eller fri
  landskapskomposisjon og presenter det som Lærias godkjente motiv.
  Eventuell ny kunstproduksjon krever særskilt bestilling og deretter
  uttrykkelig visuell godkjenning før implementering.
- Vis bare funksjoner og navigasjon som faktisk finnes i Læria, verifisert
  mot appens kildekode. Ikke overfør UI, funksjoner, ordvalg eller
  designløsninger fra den separate appen HverdagsOss, heller ikke i
  konseptskisser. Ingen oppdiktede funksjoner i illustrasjoner.
- Skjermbilder fra faktisk app skal merkes med kildecommit, enhet og
  nettleser. Konseptskisser skal alltid merkes som konsepter, aldri
  presenteres som fungerende app. Hvis portrettillustrasjonen mangler,
  er Hjem på iPad stående fortsatt en dokumentert kunstblokkering,
  ikke en anledning til å skjule problemet med nye bilder eller CSS-fyll.
- Bruk eksisterende Læria-logo, skilt og valgt TrollActor som selvstendige
  interaktive elementer. En ny ren bakgrunn skal ikke ha disse malt inn.

## Enheter og kvalitet

- Prioriter iPad først, deretter iPhone og desktop. Kontroller både stående og
  liggende før en endring anses klar.
- Ikke løs et portrettproblem ved å strekke, speile eller tilfeldig fylle en
  låst illustrasjon. Dersom kildens format ikke kan gi en premium komposisjon
  uten beskårne viktige elementer, stopp ved en kontrollert kodeforbedring og
  dokumenter behovet for en ny, godkjent scenevariant.
- Bevar navigasjon, tilbakeflyt, valgt troll og lagret barneprogresjon. Kjør
  relevante Læria-QA-, smoke- og iOS-kontroller og foreta faktisk skjermkontroll
  på berørte iPad-visninger.

## Leveranse og GitHub

- Arbeid på en avgrenset arbeidsgren og opprett en smal pull request når
  skrivetilgang er tilgjengelig.
- Ikke merge, publiser eller distribuer uten eksplisitt godkjenning.
- I leveransen skal kodeendringer, teststatus, utestede forhold og eventuelle
  behov for ny godkjent bildekilde være tydelig skilt fra hverandre.
