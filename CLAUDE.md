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
2. Eigene Abzeichen (`badges`) festlegen – jedes Lernpaket hat welche.
3. In `modules/index.js` eintragen.
4. `node tools/check.js` muss fehlerfrei durchlaufen.
5. `VERSION` in `sw.js` erhöhen, dann deployen.

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
    cats:()=>[ [ ()=>({...frage}) , ... ], [ ... ] ],
    // optional: Schreib-Fragen (input:true) für den Probetest. Reihenfolge nie ändern, nur hinten anhängen
    // (die Schatzkiste merkt sich Fragen über ihre Position, z. B. "nomen:w:5" oder "nomen:c0:5").
    write:()=>[ ()=>({input:true,...frage}), ... ],
    after:'reihe5', afterStars:2   // optional: erst offen ab 2 Sternen in Welt „reihe5“ (Freischalten nach Fortschritt; lokal offen, außer ?live)
  }],
  boss:{name:'Zahlen-Drache', icon:'🐉', count:15, lives:3},  // optional, mischt alle Welten (goldName: eigener Name für den goldenen Endgegner)
  // optional: Zusatz-Missionen (wie Welten mit Sternen und Schatzkiste, aber nicht im Endgegner/Blitz und
  // nicht nötig für den Endgegner). Stehen unter „Spezial-Missionen“, per unlock[id] zeitgesteuert.
  missions:[{id:'detektiv', name:'Fehler-Detektiv', icon:'🕵️', color:'#334155', color2:'#64748b', count:8, topic:'…', cats:()=>[[…]]}],
  unlock:{chest:'2026-12-01', blitz:'2026-12-01', gold:'2026-12-02', exam:'2026-12-03', detektiv:'2026-12-02'}, // optional: Spezial-Missionen, eigene missions-IDs und Welt-IDs erst ab Datum (vorher „Geheime Mission/Welt“). Lokal ist alles offen, außer mit ?live in der Adresse
  mascot:'🦉',                     // optional: Maskottchen auf der Paketseite und in den Rückmeldungen (Emoji oder SVG-HTML)
  badgeTitle:'Maulwurf-Abzeichen', // optional: Überschrift der eigenen Abzeichen
  badgeGroup:'lernwoerter',        // optional: mehrere Pakete teilen sich Abzeichen und Zähler (z. B. alle Lernwörter-Wochen)
  // PFLICHT: eigene Abzeichen (zusätzlich zu den allgemeinen). id nie ändern, gespeichert als "<paket-id oder badgeGroup>:<id>".
  badges:[{id:'meister', icon:'⛏️', name:'Einmaleins-Meister', desc:'3 Sterne in …', test:c=>c.starsIn('reihe6')>=3}]
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
| `input` | `true` = Schreib-Frage (Textfeld statt Knöpfe, nur in `write`) |
| `accept` | bei Schreib-Fragen: alle akzeptierten Schreibweisen (muss `answer` enthalten). Groß/klein zählt! |
| `spot` | Fehler-Detektiv: `{tokens:[{t:'Wort'},{t:'Hunt',fix:'Hund'}], n:1}`; Kind tippt die `n` falschen Wörter an. Kein `options`; `answer` = richtiger Satz |
| `num` | bei Schreib-Fragen: Zahlentastatur statt Buchstaben, kein Hinweis auf Groß/klein |
| `say` | Hör-Diktat (nur mit `input:true`): Text, den die Eule per Sprachausgabe vorliest; `prompt` darf leer sein |

Spezial-Missionen baut die App automatisch für jedes Lernpaket: Probetest (wenn es `write` gibt),
Fehler-Schatzkiste (falsch beantwortete Fragen, 2× richtig = 💎), Blitzrunde (60 s, Rekord), Endgegner und
goldener Endgegner (1 Leben, nach dem Endgegner). Blitzrunde: höchstens 10 Runden pro Tag. Reservierte Welt-IDs: boss, gold, exam, chest, blitz.
Level: bis Level 20 je 100 XP, danach jede Stufe +30 XP (`costOf` in js/app.js).

Nützliche CSS-Klassen in `prompt`/`explain`: `bigword`, `chain` + `st` + `arr`, `mini`, `hl` (Markierung), `<b>`;
für Mathe: `stw` (Stellenwerttafel), `calc` (schriftlich untereinander), `mauer` + `brick` (Zahlenmauer), `strahl` (Zahlenstrahl).

### Eigene Abzeichen (`badges`)
`test(c)` wird nach jeder richtigen Antwort und am Ende jeder Runde in diesem Lernpaket aufgerufen. `c` enthält:
`kind` (world, boss, exam, blitz, chest), `world` (Welt-ID), `stars` (Sterne dieser Runde), `won` (nicht verloren),
`gold` (goldener Endgegner), `streak` (aktuelle Serie), `score` (Blitzrunde), `correct` (richtige Antworten in diesem Paket insgesamt),
`starsIn(weltId)`, `allWorlds` (alle Welten mit Stern), `allStars` (alle Sterne), `blitzRecord`.
XP, Level und die allgemeinen Abzeichen gelten über alle Lernpakete. Jedes Lernpaket braucht eigene Abzeichen (ca. 8–12, `check.js` prüft das).
Anzeige: Die Startseite zeigt alle Abzeichen gesammelt (allgemein + alle Pakete), eine Paketseite nur die eigenen des Pakets.
Level-Titel: 60 Stück in `TITLES`, danach geht es mit Sternen weiter (… ⭐2).

### Dauerhafte Lernpakete
Ohne `date` ist ein Lernpaket dauerhaft zum Üben da (z. B. `modules/mathe-maulwurf.js`, Mathe Klasse 3,
Themen nach „Denken und Rechnen 3 – Forderheft“, Westermann). Dateiname dann ohne Datum. Mathe-Aufgaben werden dort
mit festem Startwert erzeugt (`gen(seed,n,…)`), damit die Schatzkiste sie wiederfindet: neue Listen nur hinten anfügen,
bestehende seeds und Anzahlen nicht ändern.

### Jeden Tag üben (`daily:true`)
Lernpakete mit `daily:true` (optional `dailyName`) sind Tagesaufgaben: Lernwörter (alle Wochen zusammen, über `badgeGroup`)
und die Affen-Box. Sie stehen auf der Startseite oben im Bereich „🗓️ Jeden Tag üben“ statt unter „Lernpakete“.
Eine beendete Runde mit mindestens einer richtigen Antwort hakt die Tagesaufgabe ab (+20 XP). Sind alle abgehakt,
öffnet sich die Tages-Truhe: +30 XP plus 5 XP je Serientag (bis 10). Serie = Tage mit Truhe am Stück; Sa/So unterbrechen
sie nicht. Abzeichen: truhe1, streak3/5/10/20. Gespeichert in `S.dd` (heute) und `S.fullDays`.

### Affen-Box (`modules/mathe-box.js`)
Einmaleins nach der Karteikarten-Idee von Ina („Hallo Lernen“): leicht anfangen, in Minischritten steigern.
Affe Kiki klettert Ast für Ast: 10er → 2er → 5er → 4er → 3er → 6er → 9er → 8er → 7er, oben die Mix-Box
(36 Karten 2·2 … 9·9 ohne Tauschaufgaben). Jeder Ast öffnet sich erst mit 2 Sternen im Ast davor (`after`).
Ab Ast 2 kommen Wiederholungskarten aus den schon geschafften Reihen dazu. `REIHEN` nie umsortieren (Schatzkiste).

### Lernwörter (`modules/deutsch-lernwoerter.js`)
Jede Woche ~10 Lernwörter aus der Schule. Neue Woche = Eintrag **oben** in `WOCHEN` (`from` = Montag der Woche,
optional `test` = Diktat-Datum). Daraus wird automatisch ein eigenes Lernpaket `lernwoerter-<from>` mit den Spielen
Hör-Diktat, Blitzblick (beide `noMix`: nicht im Endgegner/Blitz), Richtig geschrieben?, Lücken-Wörter, Fehler-Finder,
Endgegner und Probetest (= ganzes Diktat). Falsche Schreibweisen und Erklärungen erzeugen die `RULES` in der Datei;
eigene Tipps/Vorlese-Texte per `['Wort','Tipp','Vorlese-Text']`. Startseite: im Bereich „🗓️ Jeden Tag üben“ aktuelle und
letzte Woche, ältere eingeklappt. Wörter einer Woche nie umsortieren (Schatzkiste).
Spiele vorerst sperren: `closed:['blick',…]` in der Woche (ohne Datum, Karte „Geheime Welt – bald“). Später freischalten:
aus `closed` nehmen und `unlock:{blick:'JJJJ-MM-TT'}` setzen, dann kommt die Ankündigung. `closed` geht in jedem Lernpaket.

## Spielstand sichern
Startseite unten: „💾 Sichern / Laden“ (hinter der Eltern-Malaufgabe). Sichern = JSON-Datei `lern-eule-<Name>-<Datum>.json`
mit `{app:'lern-eule',v:1,saved,state}` (iPhone/iPad: Teilen-Menü, sonst Download). Laden ersetzt den ganzen Spielstand
nach Rückfrage; `fixState()` in js/app.js ergänzt fehlende Felder. Neue Felder im Spielstand dort mit Standardwert eintragen.
Beim Start bittet die App um dauerhaften Speicher (`navigator.storage.persist()`).

## Deploy
Live: https://alrnz.github.io/lern-eule/ (GitHub Pages aus `main`, Repo `alrnz/lern-eule`, öffentlich).
Die Adresse nicht wechseln: localStorage hängt an der Domain, sonst ist der Fortschritt weg.
Deploy = committen und `main` pushen; Pages ist nach ca. 1 Minute aktuell.
Immer `/usr/bin/git` verwenden: das ältere `/usr/local/bin/git` kann das eingestellte SSH-Signieren nicht.

## Testen
Lokal: `python3 -m http.server 8766` im Projektordner, dann http://localhost:8766.
Der Service Worker läuft nur über https oder localhost.
