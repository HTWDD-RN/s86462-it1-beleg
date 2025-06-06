
# ![Icon](images/icon_32.png)  Lernprogramm
**Ein webbasiertes Lernprogramm als Beleg von Eric Hübel (23-041-62/s86462) in Webprogrammierung.** 

Die Seite ist verfügbar auf: https://www.informatik.htw-dresden.de/~s86462/Lernprogramm/

Die Seite kann lokal gestartet im Hauptverzeichnis werden mit: ```python -m http.server 8000``` und über ```localhost:8000``` aufgerufen werden.

## Erfüllte Aufgaben

- funktionierendes Lernprogramm mit CSS Gestaltung und Responsive Design
- zufällige Aufgaben mit zufälligen angeordneten Antwortmöglichkeiten und Statistik am Ende
- JS mit Model-View-Presenter Prinzip
- verschiedene Aufgabenthemen: 
  - Web, Mathe, Noten, Wer wird Millionär? und Minecraft (geladen von lokaler JSON)
  - Allgemein (Srv) lädt eigene Fragen über externe API vom [Webquiz-Server](https://github.com/swsms/web-quiz-engine)
- Offlinenutzung mit PWA möglich
- Matheaufgaben werden mittels [KaTeX](https://katex.org/) gerendert
- Noten werden mittels [abcjs](https://www.abcjs.net/) gerendert
  - dies wurde anstatt Vexflow gewählt, da es damit ähnlich einfach ist wie mit KaTeX die Noten zu rendern
- [Piano-Keyboard](https://github.com/pncsoares/piano) zum Eingeben der Noten

## Probleme/Herausforderungen

- siehe [DevLog](docs/DevLog.md)

## genutzter Browser

- entwickelt unter: Firefox 139
- PWA getestet mit: Chrome 137
- sowohl auf Desktop und Mobil getestet

## Vorschläge zur Erweiterung und Verbesserung

- zusätzlich Seiten zum Erstellen/Bearbeiten von Aufgaben
- Login für Webquizserver
- Mehrfachantwort / nicht alle Buttons müssen belegt sein mit Antwort