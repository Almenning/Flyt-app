# iOS-utvikling

HverdagsOss pakker lokale webassets i Capacitor; den bruker ikke GitHub Pages som native `server.url`.

```sh
npm run cap:sync
npm run cap:open:ios
```

`cap:sync` kopierer de statiske appfilene til `www/` og synkroniserer dem med `ios/`. Åpning, bygging, simulator og enhetsverifisering krever Mac og Xcode.

Apple-signering, App Store Connect og TestFlight er bevisst ikke satt opp ennå. Web/PWA-versjonen beholder service worker; den registreres ikke i native Capacitor-kontekst.

## Native livssyklus

`@capacitor/app` brukes til å registrere `appStateChange`. Når iOS-appen går i bakgrunnen stoppes polling og en ventende lagring forsøkes best-effort. Når appen blir aktiv igjen kontrolleres Supabase-sesjonen, ventende endringer lagres først, siste husholdningsstate hentes og polling startes igjen. Utløpt sesjon går tilbake til vanlig innlogging i stedet for å la WebView-en stå i en fastlåst tilstand.

Etter endringer i native plugins skal `npm run cap:sync` kjøres før Xcode-bygg. Faktisk simulator-/enhetstest gjøres fortsatt på Mac/Xcode.

## Sikker native innlogging

I native iOS bruker Supabase nå en egen storage-adapter mot iOS Keychain i stedet for WebViewens `localStorage`. Keychain-postene er bundet til appens bundle-id og lagres med `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`.

Ved første oppstart etter denne endringen migreres en eksisterende Supabase-sesjon fra WebView-lagring til Keychain dersom Keychain ennå er tom. Den gamle kopien fjernes først etter vellykket Keychain-skriving. Nye native sesjoner lagres bare i Keychain. Web/PWA fortsetter å bruke Supabase sin vanlige nettleserlagring.

Ved eksplisitt utlogging og ved påvist utløpt native sesjon tømmes Keychain-lageret for HverdagsOss-auth samt eventuelle gamle Supabase-authnøkler i WebView-lagringen.

Dette må fortsatt bygges og verifiseres i Xcode på Mac før TestFlight, fordi Linux-CI ikke kompilerer den native Swift-koden.
