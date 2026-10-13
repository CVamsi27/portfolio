# Motivation: Germany photographs first

User direction: “motivation should have beautiful Germany images, text below”. This replaces the optional supporting-image disclosure in the approved full-workspace design.

Show one large Germany photograph first, with a quiet location/photographer caption and three manual view buttons: Neuschwanstein, Eibsee, Berlin. Place the saved goal, purpose, reminder and next milestone beneath the gallery. Retain the existing typography, teal tokens, reminder actions and goal data. No timers, automatic rotation or text overlay on the photograph.

Use three locally bundled, optimized WebP photographs with direct source credits and descriptive alt text. The visual choice is Germany regardless of saved goal category; it must not rewrite the saved goal or destination. The page no longer needs external media requests/cache. Existing media endpoints remain compatible for other consumers. If a photo fails, show a short recovery message and let another view load; all text/actions remain available.

Verification: bundled asset contract; typecheck, lint and production build; browser desktop/phone crop and layout checks; manual image selection, reminder/save and navigation; update regression coverage for image-first layout, manual-only switching, privacy and failure recovery.
