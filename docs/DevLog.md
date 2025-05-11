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
  - versuchen Thema "Allgemein" von Webquiz-API zu laden OK -> vorher welche mit curl hochladen

  ## 10.05.2025 (6h)

  - Fortschrittsleiste hinzugefügt
    - mit Prozent und daneben wieviel Fragen von MaxFragen
  - hab es geschafft Fragen vom WebQuiz Server zu laden
    - sehr langsam, da jede ID einzeln gefetcht werden muss (200-300ms pro ID)
    - CheckAnswer: kann leider nicht wissen, welche Antwort die richtige ist, da der Server bei einer falschen Antwort nicht sagt, welche richtig ist
    -> man könnte da zwar für jede Frage alle 4 Möglichkeiten abfragen, aber das dauert zu lange
  - der Server ist nur aus dem HTW-Netz erreichbar, deshalb gibt es eine Fehlermeldung
  - Timeout auf 5 Sek. gesetzt, damit man nicht eine Min warten muss
  - Buttons werden nun sicherheitshalber deaktiviert, damit diese nicht gedrückt werden, wenn etwas noch nicht vollständig geladen ist
  - mehr Statusmeldungen gesetzt und bessere Fehlerbehandlung
  - Todo:
    - Webquiz-API: will das Thema Allgemein immer vom Server laden OK
    - KaTeX Rendering? OK

    ## 11.05.2025 (6h)

    - Ausgewählter Antwortbutton wird nun eingefärbt, ob richtig oder falsch für schnelleres Feedback
      - style.background Attribut muss entfernt werden, damit das Standardbuttondesign wieder greift
    - KaTeX Rendering integriert
      - viel mit Regex versucht nicht gekennzeichnete Formeln in $ ... $ einzuschließen -> funktioniert so semi gut
      - es wird damit auch erkannt ob es $ ... $ gibt und tut dann nichts an der Frage ändern
    - KaTeX wird gerendert, wenn eingeschlossen mit $ oder von Regex eine Formel erkannt wird
    - die Antworten dürfen nicht mit $ eingeschlossen werden (passiert automatisch)
    - Überprüfung der Antworten: da dafür der Buttontext verwendet wird und Katex diesen ändert muss ich diese in einem Array zwischenspeichern
    - Bug: beim Klick auf Button passiert nichts??? -> geschiet durch renderKatex :(
      -> das Problem war das man auf den Katex Text klicken kann und dies auch den Event Handler triggert, aber da dies vom Typ kein Button ist passiert nichts
      -> gelöst indem Pointerevents für katex-display und span abgeschaltet werden
    - !important ist wichtig, damit Katex CSS übernommen wird
    - beim Versuch Katex herunterzuladen ist meine Seite auf Firefox Android eingefroren -> hab Katex heruntergeladen und verwende es lokal, was dieses Problem behoben hat?