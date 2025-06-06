
# Lernprogramm
**Ein webbasiertes Lernprogramm als Beleg von Eric Hübel (s86462) in Webprogrammierung.** 

Die Seite ist verfügbar auf: https://www.informatik.htw-dresden.de/~s86462/Lernprogramm/

Die Seite kann lokal gestartet werden mit im Hauptverzeichnis: ```python -m http.server 8000``` und über ```localhost:8000``` aufgerufen werden.

## Erfüllte Aufgaben

- funktionierendes Lernprogramm mit CSS Gestaltung und Responsive Design
  - zufällige Aufgaben mit zufälligen angeordneten Antwortmöglichkeiten und Statistik am Ende
- JS mit Model-View-Presenter Prinzip
- verschiedene Aufgabenthemen: Web, Mathe, Noten, Wer wird Millionär?, Minecraft (geladen von lokaler JSON)
  - Allgemein (Srv) lädt eigene Fragen über externe API vom [Webquiz-Server](https://github.com/swsms/web-quiz-engine)
- Offlinenutzung der PWA möglich
- Matheaufgaben werden mittels [KaTeX](https://katex.org/) gerendert
- Noten werden mittels [abcjs](https://www.abcjs.net/) gerendert
  - dies wurde anstatt Vexflow gewählt, da es damit ähnlich einfach ist wie mit KaTeX die Noten zu rendern
- Piano-Keyboard zum Eingeben der Noten

## Probleme/Herausforderungen

- siehe [DevLog](docs/DevLog.md)

## genutzter Browser

- entwickelt unter: Firefox 139
- PWA getestet mit: Chrome 137
- sowohl auf Desktop und Mobil getestet
