# Code Review & Verbesserungsplan — PR-1482 (Angular 18 → 22)

**PR:** [#132](https://github.com/pib-rocks/cerebra/pull/132) · **Branch:** `PR-1482` · **Base:** `develop`
**Umfang:** 62 Dateien (10.618 +, 6.615 −), davon `package-lock.json` mit ~16.6k Zeilen (erwartbar).
**Test-Status:** Build ✅ · 331 Unit-Tests ✅ · Backend run_all_tests.sh (Pi) ✅

**Verdikt: Änderungen anfordern (Request Changes)** — funktioniert, aber führt technische Schulden ein, die vor dem Merge adressiert werden sollten.

---

## Zusammenfassung

Das Upgrade ist funktional erfolgreich (Build grün, alle Tests grün). ABER: Der `ng update`-Migrationspfad hat an ~31 Stellen automatische Kompatibilitäts-Workarounds eingefügt, die den *alten* Angular-18-Zustand konservieren, statt die Codebasis auf die Angular-22-Konventionen zu heben. Das ist zulässig für einen ersten grünen Durchlauf, hinterlässt aber Schulden, die man bewusst als Follow-up planen oder jetzt bereinigen sollte.

---

## 🔴 Kritisch (vor Merge klären)

### K1 — `ChangeDetectionStrategy.Eager` + `standalone: false` in 31 Komponenten
Die Migration hat jeder Komponente/Pipe explizit `changeDetection: ChangeDetectionStrategy.Eager` und `standalone: false` verpasst.
- `Eager` ist in Angular 22 zwar gültig (neuer Name für `CheckAlways`, Zoneless-Ära), aber das *explizite* Setzen auf jeder Komponente ist ein von `ng update` generierter Kompatibilitäts-Workaround, kein Zielzustand.
- `standalone: false` fixiert alle Komponenten im NgModule-Modell. Angular 22 default ist `standalone: true`. Das konserviert bewusst das alte Modul-Modell.
- **Risiko:** Verschleiert, dass eine echte Migration zu Standalone Components + `provideZonelessChangeDetection()` noch aussteht. Wenn das nie passiert, wächst die Distanz zu künftigen Angular-Versionen.
- **Empfehlung:** Entweder (a) als bewusste Entscheidung dokumentieren und ein Follow-up-Ticket "Migrate Cerebra to standalone components / zoneless" anlegen, oder (b) die redundanten `Eager`-Deklarationen entfernen, wo der Default ohnehin greift.

### K2 — `main.ts`: `applicationProviders` beim `bootstrapModule`
```ts
platformBrowserDynamic().bootstrapModule(AppModule, {
    applicationProviders: [provideZoneChangeDetection()],
})
```
- Prüfen, ob `applicationProviders` die korrekte Option-Bezeichnung in Angular 22 ist (üblich wäre die Provider-Registrierung im NgModule oder `bootstrapApplication` bei Standalone). Wenn das nur "kompiliert, weil TS es durchlässt", aber zur Laufzeit ignoriert wird, ist die Zone-Change-Detection evtl. gar nicht aktiv.
- **Verifikation:** Zur Laufzeit prüfen, dass Change Detection wie erwartet läuft (nicht nur Build-grün).

---

## ⚠️ Warnungen (sollten adressiert werden)

### W1 — Inkonsistente Toolchain-Versionen
Angular Core/CLI ist auf 22, aber mehrere Peer-Tools blieben auf v18-Ära:
- `@angular-eslint/*` → weiterhin `18.1.0` (Core-ESLint-Plugins passen nicht zu Angular 22; Lint-Regeln könnten fehlschlagen oder veraltet sein)
- `@types/node` → `^18.19.14` (Node 18 Typen; Pi/CI laufen ggf. auf neuerer Node)
- `@types/jasmine` → `~4.3.0`, `jasmine-core` → `~4.5.0` (Test-Framework nicht mitgezogen)
- **Empfehlung:** `@angular-eslint` auf die zu Angular 22 passende Major-Version heben und `ng lint` laufen lassen. Node/Jasmine-Typen auf projektkonforme Versionen aktualisieren.

### W2 — `tsconfig.json`: `"ignoreDeprecations": "6.0"`
Unterdrückt pauschal alle TypeScript-6.0-Deprecation-Fehler.
- **Risiko:** Echte Deprecations (die in TS 6.x entfernt werden) werden versteckt statt behoben. Beim nächsten TS-Bump brechen sie hart.
- **Empfehlung:** Deprecations einzeln sichtbar machen und beheben; das Flag als temporär markieren (Kommentar + Follow-up-Ticket).

### W3 — `tsconfig.spec.json`: unterdrückte extendedDiagnostics
```json
"nullishCoalescingNotNullable": "suppress",
"optionalChainNotNullable": "suppress"
```
- Diese Checks zeigen redundante `?.`/`??` auf nicht-nullbaren Typen — oft ein Hinweis auf falsche Typannahmen. Nur in `tsconfig.spec.json` unterdrückt (Tests), nicht im App-Code — begrenzt das Risiko, aber verdeckt Test-Code-Qualität.
- **Empfehlung:** Ursächliche Stellen fixen statt Diagnose abzuschalten.

### W4 — Test-Änderungen könnten echtes Verhalten maskieren
- `camera.component.spec.ts`: `spyOn(...).and.stub()` — der Spy verhindert jetzt die echte Methodenausführung. Prüfen, ob der Test damit noch das ursprünglich Beabsichtigte prüft (Klick → State-Wechsel) oder nur noch "Spy wurde gerufen".
- `program.service.spec.ts`: `.pipe(take(1))` hinzugefügt "to prevent memory leaks". In Angular 22 könnten Observables aus Services jetzt anders emittieren (mehrfach statt einmal). Prüfen, ob `take(1)` ein echtes Verhaltensproblem kaschiert (Observable completet nicht mehr) statt nur den Test aufzuräumen.
- **Empfehlung:** Bei beiden verifizieren, dass der Test weiterhin die Funktionalität (nicht nur den Aufruf) prüft — konform zur Projekt-E2E-Regel "Verify FUNCTIONALITY not visibility".

---

## 💡 Verbesserungsvorschläge (nice to have)

### V1 — `package.json`: fehlende Newline am Dateiende
`}\ No newline at end of file` — POSIX-Konvention verletzt, erzeugt unnötiges Diff-Rauschen. Newline anhängen.

### V2 — `angular.json`: gemischte Einrückung (Tabs vs. Spaces)
Die migrierten Blöcke nutzen Spaces, der Rest Tabs. Prettier/EditorConfig über die Datei laufen lassen für konsistente Einrückung.

### V3 — `styles.scss`: Material-Token-Umbenennung verifizieren
`--mdc-snackbar-container-color` → `--mat-snackbar-container-color`. Visuell prüfen, dass die Snackbar-Hintergrundfarbe (`$blue-dark-5`) korrekt greift (Material 3 Token-Umstellung).

### V4 — `@if`/`@for` Control-Flow-Migration verifizieren
Die Templates wurden von `*ngIf`/`*ngFor` auf `@if`/`@for` migriert (gut, das ist der Angular-22-Zielzustand!). Bei `@for` wurde `track` gesetzt — prüfen, dass die `track`-Expression sinnvoll ist (`track error`/`track warning` bei primitiven Strings ok; `track pose` sollte idealerweise `track pose.poseId` sein für stabile Identität statt Objektreferenz).
- **Konkret:** `pose.component.html` nutzt `@for (pose of poses | async; track pose)` — besser `track pose.poseId`.

---

## ✅ Positiv

- Sauberer schrittweiser Upgrade-Pfad (18→19→20→21→22) statt riskantem Direktsprung.
- Template-Control-Flow korrekt auf `@if`/`@for` migriert (Angular-22-Zielzustand).
- `@angular/material` + `@angular/cdk` konsistent auf 22 mitgezogen.
- `zone.js` (0.15.1) und `typescript` (6.0.3) korrekt aligned.
- Alle 331 Unit-Tests + kompletter Backend-Integrationslauf auf dem Pi grün — keine Regression im Zusammenspiel.

---

## Empfohlene nächste Schritte (priorisiert)

1. **K2 verifizieren** (Runtime-Check Zone-Change-Detection) — blockierend, schnell.
2. **W4 verifizieren** (Test-Aussagekraft prüfen) — blockierend, mittel.
3. **W1 fixen** (`@angular-eslint` hochziehen, `ng lint` grün bekommen) — vor Merge.
4. **K1 entscheiden**: Follow-up-Ticket "Standalone + Zoneless Migration" anlegen ODER redundante `Eager`/`standalone:false` bereinigen. Als bewusste Entscheidung dokumentieren.
5. **W2/W3**: Deprecation-/Diagnostic-Suppression als temporär markieren + Follow-up.
6. **V1–V4**: Kosmetik/Kleinfixes, können in denselben PR oder einen Cleanup-PR.
