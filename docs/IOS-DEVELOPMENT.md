# iOS-utvikling

HverdagsOss pakker lokale webassets i Capacitor; den bruker ikke GitHub Pages som native `server.url`.

```sh
npm run cap:sync
npm run cap:open:ios
```

`cap:sync` kopierer de statiske appfilene til `www/` og synkroniserer dem med `ios/`. Åpning, bygging, simulator og enhetsverifisering krever Mac og Xcode.

Apple-signering, App Store Connect og TestFlight er bevisst ikke satt opp ennå. Web/PWA-versjonen beholder service worker; den registreres ikke i native Capacitor-kontekst.
