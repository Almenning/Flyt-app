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
