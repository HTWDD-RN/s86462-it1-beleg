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
- Fragen werden nun nur am Anfang einer Runde geladen und auchgemischt
- Thema kann nun per Radio Button ausgewählt werden
  -> falls das Thema inmitten der Fragen geändert wird, beginnt eine neue Runde
- neue Fragen hinzugefügt
- Icons hinzugefügt
- Todo:
  - Progress Bar in Status mit Prozent OK
  - versuchen Thema "Allgemein" von Webquiz-API zu laden OK -> vorherwelche mit curl hochladen

## 10.05.2025 (6h)

- Fortschrittsleiste hinzugefügt
  - mit Prozent und daneben wieviel Fragen von MaxFragen
- hab es geschafft Fragen vom WebQuiz Server zu laden
  - sehr langsam, da jede ID einzeln gefetcht werden muss (200-300ms pro ID)
  - CheckAnswer: kann leider nicht wissen, welche Antwort die richtige ist, da der Server bei einer falschen Antwort nicht sagt, welche richtig ist
  -> man könnte da zwar für jede Frage alle 4 Möglichkeiten abfragen, aber das dauert zu lange
- der Server ist nur aus dem HTW-Netz erreichbar, deshalb gibt eseine Fehlermeldung
- Timeout auf 5 Sek. gesetzt, damit man nicht eine Min warten muss
- Buttons werden nun sicherheitshalber deaktiviert, damit diese nichtgedrückt werden, wenn etwas noch nicht vollständig geladen ist
- mehr Statusmeldungen gesetzt und bessere Fehlerbehandlung
- Todo:
  - Webquiz-API: will das Thema Allgemein immer vom Server laden OK
  - KaTeX Rendering? OK

## 11.05.2025 (6h)

- Ausgewählter Antwortbutton wird nun eingefärbt, ob richtig oder falsch für schnelleres Feedback
  - style.background Attribut muss entfernt werden, damit das Standardbuttondesign wieder greift
- KaTeX Rendering integriert (v0.16.22)
  - viel mit Regex versucht nicht gekennzeichnete Formeln in \$ ... \$ einzuschließen -> funktioniert so semi gut
  - es wird damit auch erkannt ob es $ ... $ gibt und tut dann nichts an der Frage ändern
- KaTeX wird gerendert, wenn eingeschlossen mit $ oder von Regex eine Formel erkannt wird
- die Antworten dürfen nicht mit $ eingeschlossen werden (passiert automatisch)
- Überprüfung der Antworten: da dafür der Buttontext verwendet wird und Katex diesen ändert muss ich diese in einem Arrayzwischenspeichern
- Bug: beim Klick auf Button passiert nichts??? -> geschiet durch renderKatex :(
  -> das Problem war das man auf den Katex Text klicken kann und dies auch den Event Handler triggert, aber da dies vom Typ kein Button ist passiert nichts
  -> gelöst indem Pointerevents für katex-display und span abgeschaltet werden
- !important ist wichtig, damit Katex CSS übernommen wird
- beim Versuch Katex herunterzuladen ist meine Seite auf Firefox Android eingefroren -> hab Katex heruntergeladen und verwende es lokal, was dieses Problem behoben hat?

- Todo:
  - ServiceWorker für PWA hinzufügen mit Cache für Offline Nutzung OK
  - App Icon OK
  - Fehlende Datei überprüfen (manifest?) OK
  - bessere Check wenn Offline? OK

  ## 12.05.2025 (9h)

- ServiceWorker mit Cache für Offline Nutzung hinzugefügt
  - geht irgendwie nicht ohne HTTPS aber Firefox meckert das es den Zertifikataussteller nicht kennt
  - Registrierung schlägt fehl mit: DOMException: The operation is insecure.
  -> ich glaube es hat zum ersten Mal funktioniert!!! Indem ich den service-worker.js ins Hauptverzeichnis / gepackt habe lädt die Seite nun offline. Vorher hatte es wohl Probleme, da es in /scripts/ war und ich den scope nicht ohne DOMException auf / setzen konnte
  -> falls ein Pfad nicht existiert, installiert der SW nicht korrekt und es gibt keine Fehlermeldung
- Firefox scheint im Gegensatz zu Chrome das Manifest zu ignorieren und nutzt einfach das Favicon (nein, FF erwartet halt nur mehr)
  - auch die Manifest jetzt so bearbeitet, dass es so öffnet wie die HTWDmobil PWA im Fullscreen!
- Ich lade immer die neusten Ressourcen wenn online, tu aber wenn offline aus dem Cache laden :)
  - sonst auch den Edge Case, wenn man Online ist, aber der Server mit questions.json nicht erreichbar ist besser gehandelt

  - Todo:
   - Cache muss doch gelöscht im SW werden damit Firefox Android auch in der PWA (wenn man ein Icon erstellt) questions.json neulädt
   -> davor irgendwie checken, ob der Cache existiert (denn sonst scheint es beim Installieren des SW auf Desktop einzufrieren?)
   -> ist leider auch keine Lösung, da dadurch irgendwann die ganze Website im Offline Modus weg ist
   -> ich ignoriere das für jetzt (Idee ist Network first, anstatt Cache first)

  # 13.05.2025 (6h)

  - Dateipfade relativ gemacht, sodass auf dem Informatik Server alles angezeigt wird
  - manifest.webmanifest auf dem Informatik-Server:
   "scope": "/~s86462/Lernprogramm/",
   "start_url": "https://www.informatik.htw-dresden.de/~s86462/Lernprogramm/",
  - WICHTIG: Wenn es eine DOMException: The operation is insecure., dann ist der Pfad des SW beim Registrieren fehlerhaft oder scope / ist angegeben
  - Noten Thema hinzugefügt
  - Musikbibliothek abcjs integriert -> muss ABCJS.func schreiben, damit es funktioniert
  - SVG Eigenschaften bearbeitet, sodass es zentriert dargestellt wird
  - Wer wird Millionär Thema hinzugefügt -> Fragen in richtiger Reihenfolge!

  # 14.05.2025 (1h)

  - endlich ein SW mit NetworkFirst Strategie, Fallback ist Cache

  # 20.05.2025 (7h)

  - KaTeX Rendering für Statistiken hinzugefügt und richtige Antwort (mit display: false kann es in der selben Zeile angezeigt werden)
  - Fortschrittsleiste ist bei ersten Frage bei 0% und geht erst nach Lösen der Frage hoch
  - eigene Fragen hochgeladen -> vorher gelöste Fragen zu löschen schlägt fehl, da Fragen-Datenbankeinträge noch in Relation mit completion sind:
    - "could not execute statement; SQL [n/a]; constraint [\"FKKFVSRR06095Q83TPUU1X51H3: PUBLIC.COMPLETION FOREIGN KEY(QUIZ_ID) REFERENCES PUBLIC.QUIZ(ID) (1975)\"
  - noch zusätzliche Cache Fixes, sodass Fragen vom WebQuizServer nie gecacht werden (entvalidierung durch Date.now())
  - SW-Fixes, sodass die Seite schneller lädt, indem der Timeout nur für bestimmte Dateien höher gesetzt wird (ich hasse das langsam)
  - außerdem scheinen Chrome und Firefox etwas anders zu funktionieren wenn offline:
    - Firefox gibt sofort NetworkError
    - Chrome wartet bis Timeout -> AbortError
  -> kann deshalb nur eine generische Errormeldung geben
  - Todo: 
    - Musik-Noten Playback?
    - eigene Fragen hochladen auf Webquiz-Server (10 Stück) OK
    - TopicChange, wenn neues Thema angeklickt (setQuestion aufrufen)? -> neuer EventListener für RadioButtons OK
    -> diese noch deaktivieren, wenn geladen wird!!! OK