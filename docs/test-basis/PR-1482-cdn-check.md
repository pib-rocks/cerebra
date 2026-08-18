# Test-Basis: PR-1482 - Vermeidung von externen CDN-Abhängigkeiten (Offline-Fähigkeit)

Diese Test-Basis sichert die vollständige Offline-Fähigkeit des Cerebra-Frontends ab. Der Roboter muss im autonomen Betrieb ohne jegliche Internetverbindung lauffähig sein. Externe Ressourcen (wie CDNs) blockieren das Laden der Anwendung und verzögern das Rendern bei Netzausfall.

## Qualitätsziele & Anforderungen
1. **Keine externen Scripts/Styles in `index.html`:** Es dürfen keine gelinkten Skripte (`<script src="...">`) oder Styles (`<link href="...">`) vorhanden sein, die auf HTTP- oder HTTPS-Ressourcen außerhalb des lokalen Hosts verweisen (z. B. `jsdelivr.net`, `unpkg.com`, `cdnjs.com`, `googleapis.com`).
2. **Lokales Bundling:** Alle Bibliotheken (wie Bootstrap, Bootstrap Icons, Angular Material, Fonts) müssen über `package.json` und `angular.json` lokal geladen, kompiliert und gebündelt werden.

## Verifizierte Testfälle (Test Basis TC-CDN)

### TC-CDN-1 — index.html statischer Check
- **Gegeben:** Die Datei `src/index.html` des Cerebra-Projekts.
- **Wenn:** Der Quellcode der Datei inspiziert wird.
- **Dann:** Darf kein `<script>`- oder `<link>`-Tag ein `src` oder `href` Attribut enthalten, das absolute Web-URLs (beginnend mit `http://` oder `https://`) referenziert.

### TC-CDN-2 — Automatisierter Karma-Unit-Test (Regressionsschutz)
- **Gegeben:** Die lokale Testumgebung per Karma/Jasmine ist gestartet.
- **Wenn:** Der Unit-Test `src/app/offline-integrity.spec.ts` ausgeführt wird.
- **Dann:** Lädt und parst der Test die physische `src/index.html` oder inspiziert den DOM-Head und schlägt fehl, sobald eine unautorisierte externe CDN-Referenz gefunden wird.

---
*Dokumentiert nach erfolgreichem Refactoring am 23. Juli 2026. Zielzustand: 100% Offline-Konformität.*
