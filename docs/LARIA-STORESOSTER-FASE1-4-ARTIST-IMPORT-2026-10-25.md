# Læria – Storesøster: Fase 1.4 kontroll av malte originaltro lag

Dato: 25.10.2026. Draft PR #220. Dette er et teknisk produksjonsverktøy, ikke en godkjent animasjon.

## Fremgang

Vi har nå en ekte import- og kontrollrutine for den redigerbare ti-lags V2-OpenRaster-filen fra fase 1.2. Kunstneren kan male skjult hår, erme, kjole og midje under armens nøytrale kontur, lagre som OpenRaster (.ora), og teste en faktisk malt kandidat.

1. Åpne V2 OpenRaster-filen i Krita eller GIMP. Kun de fire PAINT-lagene kan males.
2. Originalen, den utskilte armen, original kropp, guide-lagene, pikselkoordinater og lagrekkefølge må være helt uendret.
3. Kjør: python tools/rigging/storesoster_ora_intake.py --source laer-litt-mer/assets/gangemagi-troll/storesoster.webp --ora /sti/til/malte_lag.ora --output /tmp/storesoster-artist-review
4. Gjennomgå posisjoner-IKKE-GODKJENT.png med arm -25, -12, 0, +12, +25 grader. Nøytral stilling må forbli eksakt identisk med originalen.
5. Gjenta tegnearbeidet til kropp, hår, stoff, skulder og hånd har naturlig kontinuitet i alle stillinger.

Kontrollen låser originale kildelag med SHA-256 for dekodede RGBA-piksler, sikrer at maling bare finnes bak en fullt opak del av originalarmen og krever eksakt original nøytral gjengivelse.

### Hva bestått test IKKE betyr

En negativ test maler med vilje hele den tillatte flaten skrikende magenta: målt antall hull blir null, selv om illustrasjonen åpenbart er feil. Den består kun den strukturelle bildekontrakten, ikke premiumtesten. Importverktøyet returnerer alltid human_visual_approval=false, anatomy_approved=false, phase1_approved=false og app_integration_permitted=false.

Port 1 er derfor BLOKKERT til en menneskelig vurdert, anatomisk korrekt, originaltro figur er levert. Ingen live appendring, ingen merge, ingen publisering.
