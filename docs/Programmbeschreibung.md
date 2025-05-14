# Programmbeschreibung

- nutzt ModelViewPresenter-Prinzip

## Model

- ist für das Laden / Online-Auswerten verantwortlich
- Laden für lokalen Fragen von questions.json mit fetch
- Laden für lokale Fragen von Webquiz-Server ebenfalls mit fetch
- Auswerten von Fragen, indem mit fetch POST die ausgewählt Lösung an den Webquiz-Server gesendet wird -> Rückgabe ob richtig/falsch

## Presenter/Controller

- ist für die Fragenverarbeitung verantwortlich
- setQuestion(): setzt die Frage
  - Überprüfung ob an letzter Frage angekommen -> Endbildschirm
  - Erkennen des Aufgabentyps (normal, Mathe, Noten) -> entsprechend rendern
- checkAnswer(): überprüft lokale Fragen
  - schauen, ob richtig und Feedback geben (Buttons einfärben, Status setzen)
  - bei falscher Antwort noch die richtige dazuschreiben
- reset(): zurücksetzen der Variablen für eine neue Runde

## View

-> ist für die Darstellung im Browser verantwortlich
- Anzeigen und Verstecken der Buttons für Endbildschirm
- Anzeigen und Verstecken des Musiknotenlements
