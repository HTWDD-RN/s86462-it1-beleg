# DevLog

## 08.05.2025 (7h)

- GitHub Repo erstellt -> Template geklont
- Website mit CSS schöner gemacht
  - Farbverlauf
  - schöne, animierte Buttons
  - Bild im Header
- erste Versuche Aufgaben von JSON zu laden über Datei
  - CORS-Fehler, wenn die Website direkt aufgerufen :/
  - muss Python-Server starten mit: python -m http.server 8000
- JSON-Format: q: Question, a: Answers (erste ist immer richtig)
- Quiz funktioniert und es werden Fragen erfolgreich aus der Datei geladen und angezeigt
- zusätzlich werden Antworten überprüft und das Ergebnis angezeigt
- mit Media Queries gearbeitet, um Buttons auf kleinen Bildschirmen untereinander darzustellen
- Todo: 
  - Antwortmöglichkeiten random auf Buttons verteilen (jetzt ist immer klar das die erste Antwort richtig ist!) OK
  - Buttons nach Auswahl der Antwort nicht klickbar machen OK
  - Einstellen des Themas (web, math, ...) über NavBar mit Radio Buttons -> falls Thema anders als das aktuelle Thema, zurücksetzen OK
  - Button beim Anzeigen der Statistiken ausblenden/leeren & herausfinden wie man Zeilenumbruch für QuestionText machen kann (br?) OK
- DevTools -> Network -> Disable Cache, damit immer akt. JS geladen wird
  - für json: {cache: "no-store"}

  ## 09.05.2025 (8h)

  - Buttons werden nun deaktiviert, wenn Frage beantwortet
  - Endbildschirm verbessert: 
    - Buttons versteckt
    - stattdessen wird genauere Statistik angzeigt mit jeder Aufgabe
  - Antworten werden zufällig auf Buttons verteilt
  - schicke Unicode-Symbole hinzugefügt
  - Fragen werden nun nur am Anfang einer Runde geladen und auch gemischt
  - Thema kann nun per Radio Button ausgewählt werden
    -> falls das Thema inmitten der Fragen geändert wird, beginnt eine neue Runde
  - neue Fragen hinzugefügt
  - Icons hinzugefügt
- Todo:
  - Progress Bar in Status mit Prozent OK
  - versuchen Thema "Allgemein" von Webquiz-API zu laden -> vorher welche mit curl hochladen

  ## 10.05.2025 (2h)

  - Fortschrittsleiste hinzugefügt
    - mit Prozent und daneben wieviel Fragen von MaxFragen
  - Todo:
    - Webquiz-API: will das Thema Allgemein immer vom Server laden -> Fallback lokal, wenn Server nicht erreichbar?
    - KaTeX Rendering?