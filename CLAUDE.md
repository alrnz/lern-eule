# Lern-Eule – Lern-App (PWA)

Gamifizierte Lern-App für ein Grundschulkind (Deutsch, Klasse 2–3). Reines HTML/CSS/JS ohne Build-Schritt,
offline-fähig über einen Service Worker, auf iPhone/iPad per „Zum Home-Bildschirm“ installierbar.
Alle Texte für das Kind auf Deutsch, kindgerecht, kurz, ermutigend.

## Aufbau
- `index.html` – Grundgerüst, lädt `js/app.js` und `modules/index.js`
- `js/app.js` – Kern: Startseite, Lernpaket-Seite, Quiz-Engine, XP/Level/Abzeichen, Sound, Konfetti, Speichern (localStorage `lern-eule-v1`)
- `css/app.css` – alle Styles
- `modules/index.js` – Liste der Lernpakete
- `modules/<fach>-<thema>-<jjjj-mm>.js` – je ein Lernpaket
- `sw.js` – Service Worker (network first). **Bei jedem Deploy `VERSION` erhöhen.**
- `tools/check.js` – Prüft alle Lernpakete: `node tools/check.js`
- `tools/make-icons.swift` – erzeugt die Icons in `icons/`

Node ist hier v12: in Code, den `tools/check.js` ausführt, kein `??` und kein `?.` verwenden.

## Neues Lernpaket hinzufügen
Meist kommt eine Elternnachricht (Foto) mit Testdatum und Themen. Dann:
1. `modules/<fach>-<thema>-<jjjj-mm>.js` anlegen (Vorlage: `modules/deutsch-grammatik-2026-11.js`).
2. In `modules/index.js` eintragen.
3. `node tools/check.js` muss fehlerfrei durchlaufen.
4. `VERSION` in `sw.js` erhöhen, dann deployen.

Pro Welt mindestens ~15–20 verschiedene Fragen, damit Wiederholen nicht langweilig wird.
Jede Frage bekommt eine `explain`, die die Regel kurz erklärt; das ist der eigentliche Lerneffekt.
Lernpakete mit vergangenem `date` erscheinen automatisch unter „Schon geschrieben“ und bleiben spielbar.

### Format
```js
(function(){
const {shuffle,cap,pick3,gapIn,rnd,uniq,esc}=LernApp.util;
LernApp.register({
  id:'mathe-einmaleins-2026-12',   // eindeutig, nur a-z 0-9 -; nie ändern (Sterne hängen daran)
  subject:'Mathe', title:'Einmaleins-Test', subtitle:'Die 6er, 7er und 8er Reihe',
  testName:'Mathetest',            // für „Noch 3 Tage bis zum …“
  date:'2026-12-04',               // optional, JJJJ-MM-TT
  icon:'🧮', color:'#0ea5e9',
  questionsPerWorld:10,            // optional, Standard 10
  worlds:[{
    id:'reihe6', name:'6er-Vulkan', icon:'🌋', color:'#ef4444', color2:'#f97316',
    topic:'Kurzbeschreibung auf der Karte',
    rules:'HTML für den Spickzettel',
    // Liste von Kategorien; jede Kategorie ist eine Liste von Funktionen, die je eine Frage bauen.
    // Gezogen wird reihum aus den Kategorien, damit die Fragetypen gemischt sind.
    cats:()=>[ [ ()=>({...frage}) , ... ], [ ... ] ]
  }],
  boss:{name:'Zahlen-Drache', icon:'🐉', count:15, lives:3}   // optional, mischt alle Welten
});
})();
```

### Frage-Objekt
| Feld | Bedeutung |
|---|---|
| `task` | kleine Aufgabenzeile über der Frage |
| `prompt` | HTML der Frage. `<span class="gap">?</span>` ist eine Lücke, die nach der Antwort gefüllt wird (`gapIn('Satz mit ___')`) |
| `options` | Antwort-Strings (2–9, keine Doppelten) |
| `answer` | richtige Antwort, muss in `options` stehen |
| `explain` | HTML-Erklärung nach der Antwort |
| `fixed` | `true` = Reihenfolge der Optionen nicht mischen (z. B. `. ? !`) |
| `big` | `true` = große Kacheln für einzelne Zeichen/Buchstaben |
| `fill` | was in die Lücke kommt, falls nicht `answer` |

Nützliche CSS-Klassen in `prompt`/`explain`: `bigword`, `chain` + `st` + `arr`, `mini`, `hl` (Markierung), `<b>`.

## Deploy
Live: https://alrnz.github.io/lern-eule/ (GitHub Pages aus `main`, Repo `alrnz/lern-eule`, öffentlich).
Die Adresse nicht wechseln: localStorage hängt an der Domain, sonst ist der Fortschritt weg.
Deploy = committen und `main` pushen; Pages ist nach ca. 1 Minute aktuell.
Immer `/usr/bin/git` verwenden: das ältere `/usr/local/bin/git` kann das eingestellte SSH-Signieren nicht.

## Testen
Lokal: `python3 -m http.server 8766` im Projektordner, dann http://localhost:8766.
Der Service Worker läuft nur über https oder localhost.
