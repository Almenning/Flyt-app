# Grovanova i bredt Mac-format: godkjent bredformat

Løsningen gjenbruker iPad liggende som urørt 4:3-senter. Begge godkjente kilde-PNG-er, begge WebP-filer, manifestet og senterets mål og hitbokser er uendret. Bare to nye, separate kantillustrasjoner ligger bak senteret. De er en egen AI-assistert utvidelse, visuelt godkjent av produkteier 27. november 2026 etter visning av skjermbilde fra den fungerende Mac-kandidaten. De erstatter ikke originalene. Ingen nye skilt, navigasjonselementer eller troll er malt inn.

Utvidelsen velges automatisk når den passer. Kontrollvisningen `?app=laria&lariaMacWide=0` beholder det gamle formatet. Utvidelsen gjelder bare for v16 på ikke-berøringsdesktop med 4:3–2:1 sceneformat, minst 1024 × 650. iPad, telefon, smale vinduer, ultrabrede formater og den validerte v16-bildelasten beholder eksisterende visning. Ingen progresjons-, betalings- eller andre appendringer.

Browser-QA kontrollerer at Mac-scenen bruker full tilgjengelig bredde, at det godkjente bildet fortsatt er 4:3 og sentrert, at begge kantillustrasjonene tegnes, og at iPad beholder eksisterende komposisjon. Den eksisterende testen for navigasjon, Reisen-dialog, troll og integritetsfallback beholdes. Fysisk Mac/Safari er ikke testet her. Kjør eksakt-commit CI og kontroller den ordinære publiseringsporten før produksjonssetting.
