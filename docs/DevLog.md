# 08.05.2025 (6h)

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
  - Antwortmöglichkeiten random auf Buttons verteilen (jetzt ist immer klar das die erste Antwort richtig ist!)
  - Einstellen des Themas (web, math, ...) über NavBar mit Radio Buttons
  - Button beim Anzeigen der Statistiken ausblenden/leeren & herausfinden wie man Zeilenumbruch für QuestionText machen kann (br?)