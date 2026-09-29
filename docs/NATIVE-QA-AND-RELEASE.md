# Native QA og siste lanseringskontroller

## Hva denne endringen løser

Appens lokale Keychain-plugin registreres med `registerPluginInstance`. `registerPluginType` kan bli ignorert når Capacitors automatiske pluginregistrering er aktiv; et grønt kompileringstrinn oppdager ikke dette.

`iOS native build` har derfor både en vanlig kompilering og faktiske XCTest-/XCUITest-kjøringer på en ny iOS Simulator. Testene bruker samme appkode som produksjonsbygget, men egne testtargets. Det er ingen skjult testinngang, testbruker eller testtoken i produksjonsappen.

Testene kontrollerer:

- At appen når innloggingsskjermen og at registreringsfeltene er tilgjengelige.
- Virkelig Keychain-skriving, lesing, sletting og tilgjengelighetsklasse fra WebView via Swift-pluginen.
- At en testverdi overlever ny innlasting av WebView og ikke blir skrevet til localStorage.
- At låst auth-lagring avviser skriving, og at eksplisitt opprydding virker.
- At App-pluginen svarer og nødvendige HTML-sider følger den lokale apppakken.
- Kalde og varme invitasjonslenker samt en ukjent URL, uten automatisk innmelding.

Kjør på en Mac med Xcode og installert iOS Simulator:

```sh
npm ci
npm run cap:sync
bash scripts/run-ios-native-qa.sh
```

Testscriptet oppretter og sletter sin egen simulator. Det klargjør testtargets og `NativeQA`-scheme i den lokale Xcode-prosjektfilen; disse genererte prosjektendringene skal ikke publiseres som produksjonsendringer. Swift-testkoden ligger i `ios/App/NativeQATests`, utenfor appens Sources-liste. CI beholder xcresult, testlogger og skjermbilder i sju dager. Det brukes bare syntetiske verdier, aldri reelle kontoer eller private husholdningsdata.

En mislykket runtime-test gjør hele native-jobben rød. Simulatorens resultat er ikke bevis for fysisk Keychain-låsing, bakgrunnssuspensjon, ekte e-postlevering eller App Store-godkjenning.

## Passordtilbakestilling

`reset.html` bruker den samme lokalt pakkede, versjonslåste Supabase-klienten som appen. Siden krever minst ti tegn og samsvarende bekreftelse, avviser dobbeltinnsending og håndterer ugyldig lenke, manglende klient, nettfeil og tidsavbrudd.

Gjenopprettingssesjonen holdes i minnet i en separat klient. Siden låner ikke en annen kontos lagrede sesjon. Hemmelige URL-parametre fjernes etter behandling, og passordfeltene tømmes etter bekreftet endring. Hvis lagringssvaret går tapt, forklares usikkerheten uten å påstå at endringen definitivt feilet eller lyktes.

Atferdstester kjører denne sidens faktiske JavaScript med kontrollerte SDK-svar. De tester klienten, ikke at Supabase faktisk leverer e-post til en ny ekstern mottaker. Eksisterende e-post-/redirectoppsett er ikke endret.

## Åpne kontroller før offentlig lansering

| Kontroll | Hva som fortsatt må bekreftes |
|---|---|
| Publiseringssperre | Repositoryets Pages Source må faktisk være GitHub Actions. Den testavhengige publiseringskjeden er allerede laget; en gammel branch-publisering er ikke sperret av den. |
| E-post | Registrering, e-postbekreftelse og glemt passord med en helt ny ekstern adresse. Egen SMTP og leveringsoppsett er ikke bekreftet her. |
| Offentlig kontakt/personvern | Riktig behandlingsansvarlig, fungerende supportadresse og endelige App Privacy-opplysninger må være bekreftet. Ingen adresse eller virksomhetsrolle skal gjettes. |
| Passordsikkerhet | Leaked Password Protection står fortsatt som utsatt. Ingen abonnementskjøp eller aktivering er gjort i denne oppgaven. |
| Apple | Team, signering, fysisk iPhone og TestFlight må være på plass. Simulatorbygget er uten Apple Developer-signering. |
| Ekte tobrukertest | Samtidig redigering, nettutfall, tvangsavslutning, gjenåpning, kontobytte, samtykke, frakobling og kontosletting med egne testkontoer. |

Ikke marker disse som løst på grunnlag av en compile-test eller en test med simulerte kontoer.

## Arbeidsløp fremover

Samle nært beslektede feil i avgrensede oppdrag. Bruk en branch og PR, og kontroller tester på den faktiske endringen før merge. Behold fungerende kode og produktvalg utenfor oppgaven. Bruk CI der det lokale miljøet mangler nettleser eller Xcode, fremfor gjentatt miljøfeilsøking. Rapporter kort hva som er implementert, hva som faktisk er testet, og hvilke konkrete eksterne avklaringer som gjenstår.
