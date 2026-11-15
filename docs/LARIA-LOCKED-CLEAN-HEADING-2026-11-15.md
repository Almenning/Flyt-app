# LÆRIA PREMIUM – LÅST OVERSKRIFT UTEN STOR STEDSPLAKETT

**Låst:** 15. november 2026. **Gjelder:** eksisterende PR #243, iPad først.

## Godkjent visuell referanse

Brukeren godkjente en generert skisse med landskapet ved Eggenipa, Læria-logo,
en sentrert, ren overskrift **«Norsk»**, mindre undertittel **«Eggenipa»**,
og tre lys-eike treskilt **«Ordjakt», «Finn ordene», «Lesekroken»** samlet
på **to sammenhengende stolper til venstre**. Det store høyre steds-/treskiltet
er avvist og skal ikke komme tilbake. Grønn sirkelpil er også avvist.

Skissen er **en layoutreferanse, aldri et produksjonsbilde**. Den genererte
skissens bakgrunn og figur skal **ikke** inn som statisk art i appen.
Alle SHA-låste fag-/Hjem-landskapsbilder beholdes, inkludert Eggenipa.

## Særlig låst: levende skogstroll

**Valgt originalt skogstroll er en egen, levende DOM-komponent** (`TrollActor`)
med animasjoner, reaksjoner og interaksjon. Trollet er **aldri del av
landskapsillustrasjonen** og skal ikke males eller inpaintes inn i et nytt bilde.
Kun valgt troll vises, med eksisterende trollbilde/komponent/lagret valg.
Ingen reven, ingen nytt statisk klistremerke og ingen endring i trollfilene.

## Brukergrensesnitt og navigasjon

- Sentrert øverst beholdes den originale Læria-logoen. Under den vises
  **fagoverskrift i ren, mørk tekst**, med mindre stedsnavn og diskrete streker.
  Ingen bakgrunnsplakett, ramme, trestolper eller ekstra fargeskilt bak tittelen.
- Aktivitetsskiltene i venstrekolonnen vises **direkte ved åpning av faget**.
  De er de eksisterende tre ekte læringsknappene, med samme lyse
  Grovanova-inspirerte treskiltressurs og felles to-stolpesystem.
- Trykk på den tekstbaserte overskriften åpner de fem fagvalgene på samme
  venstreside. Trykk på valgt fag åpner aktivitetene igjen; **aldri to menyrader
  samtidig**. Den opprinnelige runde Hjem-knappen og dens faktiske navigasjon
  beholdes synlig.
- Det finnes ingen ekstra «Fagene»-treskiltknapp mellom de tre aktivitetene.
  Barnet når fagvalg via overskriften eller Hjem via runde Hjem-knappen.
- I Matte beholdes original «Neste eventyr»-funksjon i venstresiden.
- Skilt, logo, tittel og TrollActor er **separate DOM-lag** med fri interaksjon;
  ingen av dem er del av malt scene eller et generert helskjermbilde.
- Samme prinsipp gjelder Norsk/Eggenipa, Matte/Tallvika og
  Geografi/Nordlysleiren. Engelsk/Kinnaklova har fortsatt en separat
  godkjenningsport fordi kildekunsten har innmalte UI-elementer.
- iPad 1366×1024 og 1024×1366 testes først i Chromium og WebKit, så
  iPhone stående/liggende, desktop og ruter tilbake til øvelsene.
- Bevar progresjon, oppgaveknapper, foreldre-gate, valgt troll og HverdagsOss.

## Godkjenningsporter

Dette er en **låst designbeslutning**, ikke godkjent implementasjon av
illustrasjonene eller automatisk publisering. Ingen merge/publish før
faktiske visuelle iPad-skjermbilder, kunstgodkjenning og barnetest.
Gamle skisser med høyre stedsplakett er overstyrt av denne beslutningen.
