# TrollActor 2.0 – teknisk beslutning

## Funn

V1 bruker én låst WebP per karakter og animerer hele flaten med CSS-transform.
Det gir liv, men ikke tydelige armbevegelser, blikk, munnformer eller en
karakterspesifikk reaksjonsregi. De eksisterende filene kan derfor ikke bli en
ekte lagdelt animasjon uten at ny karakterkunst godkjennes.

## Anbefaling

Bruk lagdelt 2D med DOM/CSS/Web Animations API, ikke canvas eller Lottie som
første produksjonsløsning. Det er lett å teste, fungerer i WebKit på iPad og
animerer bare `transform`/`opacity` på 5–7 lag. Hold én aktiv TrollActor per
scene og respekter `prefers-reduced-motion`.

| Lag | Ny, godkjent kildekunst som kreves |
| --- | --- |
| Base | kropp/bein, transparent PNG/WebP |
| Armer | venstre/høyre arm, egne transparenter med skulderpivot |
| Hode | hode/hår, separat fra kropp |
| Ansikt | øyne åpen/blunk, øyenbryn, munn nøytral/smil/åpen |
| Tilbehør | storesøsters lilla hårbånd som egen valgfri detalj |
| Scene | separat skygge, aldri en del av karakterillustrasjonen |

## Tilstander

| Tilstand | Regi | Krever nye lag |
| --- | --- | --- |
| Idle | pust, blunk, liten vektforskyvning | ansikt + kropp |
| Vinke | høyre arm vinker, smil | arm + ansikt |
| Tenke | hodehelling, blikk opp | hode + øyne/øyenbryn |
| Hjelpe | mild fremoverbevegelse, åpen hånd | arm + ansikt |
| Juble | begge armer opp, hopp, stort smil | begge armer + ansikt |
| Oppmuntre | myk nikk, varmt smil | hode + ansikt |

## Prototype og godkjenningsport

`trollactor2-prototype.js` aktiveres bare med
`?trollactor2-prototype=1`. Den bruker den nåværende Storesøster-WebP helt
uendret og merker ansikts-/armlag som skjulte, manglende slots. Den er altså en
teknisk livssyklus- og ytelsesprototype, ikke ny karakterkunst.

Produkteier godkjente 20. november 2026 den illustrerte, håndtegnede
retningen for Storesøster som **visuell produksjonsretning**. Godkjenningen
gjelder identitetsmarkørene under, ikke de genererte konseptfilene som
produksjonsressurser. Eksisterende karakterfiler er fortsatt låst og skal ikke
erstattes før et eksportert, teknisk verifisert layer-pack er gjennomgått.

## Produksjonsspesifikasjon: Storesøster v2

### Låst visuell identitet

- Langt, bølgete brunt hår; lilla hårbånd med en liten blomst.
- Vennlig, trygg storesøster-energi; aldri fotorealistisk barn eller blank
  3D-figur.
- Spisse trollører, lilla/rosatonet bladantrekk og brune skogsstøvler.
- Malt, nordisk eventyrillustrasjon med matte gouache-/papirteksturer,
  tydelig silhuett og rolig fargebruk.
- Figuren leveres UI-fri på transparent flate. Bakgrunn, skilt, logo og
  sceneeffekter hører ikke hjemme i karakterfilene.

### Leveransepakke

| Element | Format og teknisk krav | Formål |
| --- | --- | --- |
| Masterkomposisjon | 2048 x 2048 px, RGBA PNG | Kilde for kvalitetssikring; aldri brukt direkte i runtime. |
| Runtime-lag | 2x WebP med alfa, maksimalt 1024 px høyde per aktiv laggruppe | iPad-først, rask dekoding og skarp Retina-visning. |
| Pivotkart | JSON, piksler relativt til 2048-master | Felles skulder-, hals-, hofte- og ansiktspivoter. |
| Ansiktsatlas | Separate transparente elementer, ikke malt over hudlaget | Blunk, blikk, bryn og munnformer. |
| Konturprøve | PNG av alle lag med pivoter og navngivning | Manuell visuell godkjenning før eksport. |

### Obligatoriske lag

```
storesoster-v2/
  body-legs.webp
  head-hair.webp
  arm-left.webp
  arm-right.webp
  eyes-open.webp
  eyes-blink.webp
  brows-neutral.webp
  brows-think.webp
  mouth-neutral.webp
  mouth-smile.webp
  mouth-open.webp
  headband-flower.webp
  shadow.webp
  pivots.json
```

Lagene skal ha samme 2048 x 2048-koordinatrom og transparent, ubrukt flate
rundt motivet. En arm kan ikke være delvis malt inn i overkropp eller hår; et
ansiktselement kan ikke inneholde hud, hår eller ører som allerede ligger i
et annet lag.

### Regi- og akseptansekriterier

| Tilstand | Bevegelse | Godkjennes når |
| --- | --- | --- |
| Idle | langsom pust, et blunk og diskret vektforskyvning | figuren føles levende uten å trekke fokus fra oppgaven. |
| Vinke | bare høyre arm vinker, kropp holder balanse | hånden er lesbar og skulderen deformeres ikke. |
| Tenke | liten hodehelling, blikk opp, ett bryn løftes | uttrykket er nysgjerrig, ikke trist eller forvirret. |
| Hjelpe | mild fremoverlening og åpen hånd | invitasjonen virker varm og kan avbrytes umiddelbart. |
| Juble | begge armer opp, lite hopp, åpent smil | bevegelsen holder seg innenfor karakterens sikre sceneflate. |
| Oppmuntre | lite nikk og rolig smil | fungerer sammen med tekst- eller lydhint uten å konkurrere. |

### Kvalitetsport før runtime-integrasjon

1. Produkteier gjennomgår master, lagoversikt og konturprøve på iPad-format.
2. Utvikling validerer alfa, filstørrelse, dimensjoner, pivotkart og at ingen
   UI eller bakgrunn er bakt inn.
3. TrollActor 2.0 kobles til den nye pakken bak en deaktivert feature-port.
4. Chromium og WebKit testes på iPad stående/liggende før den kan bli standard.
5. Først etter egen godkjenning kan den gamle Storesøster-WebP byttes ut;
   Lillesøster og Lillebror følger samme spesifikasjon i egne godkjenningsløp.
