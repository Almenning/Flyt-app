# HverdagsOss

HverdagsOss er en par- og husholdningsapp for å koordinere hverdagen, fordele gjøremål, anerkjenne hverandre og følge mål og belønninger.

Denne grenen er den isolerte HverdagsOss-exporten som brukes til sikker separasjon fra Læria. Se [HVERDAGSOSS-SPLIT-MANIFEST.md](HVERDAGSOSS-SPLIT-MANIFEST.md).

## Verifisering

- `npm ci`
- `npm run test:node`
- `npm run test:browser`
- `npm run cap:copy`
- iOS/native QA kjøres via `.github/workflows/ios-native-build.yml`

Produksjonskode skal ikke endres som del av repository-separasjonen før den isolerte kopien er fullstendig verifisert.
