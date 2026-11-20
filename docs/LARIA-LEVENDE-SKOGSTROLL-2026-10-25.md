# Læria – levende skogstroll (pilot)
Dato: 25.10.2026. Status: kodepilot på separat branch; **ikke integrert eller publisert**.

## Låst figurkontrakt
Storesøster, lillesøster og lillebror i den brukergodkjente karakterpakken er de eneste autoriserte designreferansene. Bevar ansikt, hår, drakt, proporsjoner, tekstur og farger. Ikke bruk nye genererte varianter som erstatning. Originale karakterassets må legges til som egne, verifiserte binærfiler før UI-integrasjon.

## Pilot
`laria-living-troll.js` eksponerer `window.LariaLivingTroll.mount(target, {character, src, label})`. Den har fem tilstander: idle, wave, think, hint og celebrate. Hendelser: greet, onCorrect, onIncorrect, onHint. Funksjonen endrer ikke spillmotor, profil eller progresjon. Den er *kun* en foreløpig helfigur-/transform-animasjon; separat rigging av øyne, hode og armer er ikke implementert. Ikke markedsfør dette som ekte karakterrigging.

## Akseptansekrav før integrasjon
1. Først originale godkjente PNG/WebP i versjonskontroll, og verifiser pixel-/formlikhet.
2. Pilot i en kontrollert scene med storesøster, test alle fem tilstander, ingen animasjon med reduced-motion.
3. Deretter lagdelt figur/rigging for armer, hode og øyne uten synlige skjøter; først da kan «levende karakter» beskrives som ferdig.
4. Safari/WebKit på faktisk iPad/iPhone, responsive skjermbilder og ytelseskontroll.
5. Gradvis utrulling til Hjem/reisekart/Gangemagi/Brøklab/Ordjakt. Bevar fri lek, korrekt matematikk, tilgjengelighet og eksisterende progresjon.
6. Ingen merge/publisering uten eksplisitt godkjenning og full QA.
