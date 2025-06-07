"use strict";

//let p, v, m;
document.addEventListener('DOMContentLoaded', function () {
    let m = new Model();
    let p = new Presenter();
    let v = new View(p);
    p.setModelAndView(m, v);
    //console.log("Current cache: " + CURRENT_CACHE)
});

// Service Worker registrieren für PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('../service-worker.js')
        .then(reg => console.log(reg))
        .catch(err => console.log(err))
}

/**
 * Fisher–Yates shuffle - Ordnet die Elemente im geg. Array zufällig an.
 * @param {any[]} array Ein Array
 */
function shuffleArray(array) { 
    for (let i = array.length - 1; i >= 1; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
};

// ############# Model: Fragen laden ############################################################
/**
 * Lädt Fragen vom lokalen Server/Webquiz-API-Server an der HTW, überprüft API Fragen
 * @class Model
 */
class Model {
    constructor() { 
        this.topic = View.getTopic();
        this.questions = [];
        this.maxQuestions = 999999;
        this.roundStarted = 0;

        this.username = "eric.hue@web.de";
        this.password = "SecretAmazingPW!1!"; // sehr sicher lol

        this.cacheName = CURRENT_CACHE;
    }

    /**
     *  Holt eine Frage aus dem JSON oder vom Server
     * @param {number} nr Fragenummer
     * @returns {{ q: string, a: string[], id?: number } | null} Die Frage mit Antwortmöglichkeiten oder `null` bei Fehlern.
     */
    async getQuestion(nr) {
        // lokale Fragen
        this.topic = View.getTopic();
        if (this.roundStarted != 1 && this.topic != "allgemeinSrv"){ // nur neuladen aus Datei, wenn neue Runde oder neues Thema
            this.roundStarted = 1;
            let response;
            try {
                if (navigator.onLine) {
                    console.log("ONLINE");

                    // Timeout auf 2 Sek, damit man nicht ewig auf den Cache wartet
                    const controller = new AbortController();
                    setTimeout(() => controller.abort(), 2000);

                    // Wenn online neuste Datei vom Server, kein Cache!!
                    let cacheHeaders = new Headers();
                    cacheHeaders.append('pragma', 'no-cache');
                    cacheHeaders.append('cache-control', 'no-cache');

                    response = await fetch("./questions.json", {
                        method: "GET",
                        headers: cacheHeaders,
                        cache: "no-store",
                        signal: controller.signal
                    });
        
                    if (response.ok) {
                        if ('caches' in window) { // http hat keinen Cache
                            const cache = await caches.open(this.cacheName);
                            await cache.delete('./questions.json');
                            await cache.put('./questions.json', response.clone());  // Antwort trotzdem im Cache speichern xD
                        }
                    }
                } else {
                    console.log("OFFLINE");
                    if ('caches' in window) { // http hat keinen Cache
                        // aus Cache laden
                        response = await caches.match('./questions.json');
                        if (!response) {
                            alert('Keine Verbindung zum Server und keine Caching-Daten gefunden. Stelle sicher, dass du eine Internetverbindung hast und versuche es erneut.');
                            return null;
                        }
                    }
                }
            } catch (error) {
                if ('caches' in window) { // http hat keinen Cache
                    // aus Cache laden
                    response = await caches.match('./questions.json');
                    if (!response) {
                        alert('Keine Verbindung zum Server und keine Caching-Daten gefunden. Stelle sicher, dass du eine Internetverbindung hast und versuche es erneut.\n(' + error + ")");
                        return null;
                    }
                }
                //alert("Es muss wegen CORS diese Seite auf einem Server gehostet sein, damit JSON Daten geladen werden können!\nError: " + error)
                console.error('Fehler beim Laden der Daten: ', error);
            }
            const data = await response.json();
            
            // nach Typ die richtigen Fragen auswählen
            console.log("Topic: " + this.topic);
            if (this.topic === "allgemein"){
                shuffleArray(data.allgemein);
                this.questions = data.allgemein;
            }
            else if (this.topic === "web"){
                shuffleArray(data.web);
                this.questions = data.web;
            }
            else if (this.topic === "mathe"){
                shuffleArray(data.mathe);
                this.questions = data.mathe;
            }
            else if (this.topic === "WwM"){
                this.questions = data.WwM;
            }
            else if (this.topic === "notes"){
                shuffleArray(data.notes);
                this.questions = data.notes;
            }
            else if (this.topic === "minecraft"){
                shuffleArray(data.minecraft);
                this.questions = data.minecraft;
            }

            console.log(this.questions);
            
            // get maxQuestions im Thema
            this.maxQuestions = this.questions.length;
            
        }
        else if (this.roundStarted != 1 && this.topic === "allgemeinSrv"){ // Online Fragen
            // curl --user eric.hue@web.de:SecretAmazingPW\!\1\! -X GET https://idefix.informatik.htw-dresden.de:8888/api/quizzes/1959
            this.roundStarted = 1;

            const quizIdStart = 1997;
            const quizIdEnd = 2007;
            const quizIdNum = (quizIdEnd - quizIdStart) + 1;

            const headers = new Headers();
            headers.set('Authorization', 'Basic ' + btoa(this.username + ':' + this.password));

            this.maxQuestions = quizIdNum;
            this.questions = [];
            //this.questions = new Array(quizIdNum);

            for (let quizId = quizIdStart; quizId <= quizIdEnd; quizId++){
                View.renderQuestionText("Laden... (ID: " + quizId + "/" + quizIdEnd + ")");
                console.log("Getting ID: " + quizId);

                // Timeout auf 5 Sek
                const controller = new AbortController();
                setTimeout(() => controller.abort(), 5000);
                try {
                    const response = await fetch(`https://idefix.informatik.htw-dresden.de:8888/api/quizzes/${quizId}?date=${Date.now()}`, {
                        method: 'GET',
                        cache: "no-store",
                        headers: headers,
                        signal: controller.signal
                    });

                    if (response.status != 404){ // nicht vorhandene werden ignoriert
                        const data = await response.json();
                        console.log("Quiz geladen:", data);

                        // Array befüllen
                        this.questions.push({
                            q: "<b>" + data.title + "</b><br>" + data.text,
                            a: data.options,
                            id: quizId // zusätzlich ID merken
                        });
                    }
                    else {
                        this.maxQuestions = this.maxQuestions -1; // eine Frage weniger bei Fehler 404
                    }

                } catch (error) {
                    alert("Fehler beim Laden vom Webquiz-Server! Stelle sicher, dass du im HTW-Netz bist, eine Internetverbindung hast und versuche es erneut.\n(" + error + ")");
                    return null;
                }
            }
            shuffleArray(this.questions); // Aufgaben random
        }
        // gewünschte Frage laden
        const question = this.questions[nr];
        console.log("Frage:", question.q);
        console.log("Antworten:", question.a);

        return question; // Aufgabe + Lösungen
    }

    /**
     * Sendet an Webquiz-Server-API geg. Antwort
     * @param {number} nr Fragenummer
     * @param {number} answerNr Antwortnummer (0-3)
     * @param {number}id ID der Frage auf dem Server
     * @returns Richtig (`1`) / Falsch (`-1`) / Fehler (`null`)
     */
    async checkAnswer(nr, answerNr, id) { // Server Request schicken mit Antwort
        // curl --user eric.hue@web.de:SecretAmazingPW\!\1\! -X POST -H 'Content-Type: application/json' \
        // https://idefix.informatik.htw-dresden.de:8888/api/quizzes/1959/solve --data '[3]'
        console.log("ONLINE ANSWER CHECK!!");
        console.log("Checking num: " + nr);
        console.log("Answer given: " + answerNr);
        console.log("Quiz-ID: " + id);

        const headers = new Headers();
        headers.set('Authorization', 'Basic ' + btoa(this.username + ':' + this.password));
        headers.set('Content-Type', 'application/json');

        try {
            // Timeout auf 5 Sek
            const controller = new AbortController();
            setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`https://idefix.informatik.htw-dresden.de:8888/api/quizzes/${id}/solve`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify([answerNr]),
                signal: controller.signal
            });

            const data = await response.json();
            console.log(data);
            console.log("SUCESS: " + data.success);
            if (data.success === true){ // richtig
                return 1;
            }
            else{ // falsch
                return -1;
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                alert("Timeout: Webquiz-Server nicht erreichbar! Bist du im HTW-Netz?\n("  + error + ")");
            } else {
                alert("Fehler beim Laden! Stelle sicher, dass du eine Internetverbindung hast und versuche es erneut.\n(" + error + ")");
            }
            return null;
        }
    }
}

// ############ Controller: Frage verarbeiten #########################################################
/**
 * Verarbeitet die Fragen vom Model und ist für weitere Quizlogik zuständig
 * @class Presenter
 */
class Presenter {
    constructor() {
        this.question = null;
        this.questionNr = -1;
        this.correctQuestions = 0;

        this.mathQuestion = 0;
        this.noteQuestion = 0;

        this.arrayCreated = 0;
        this.questionLog = null; // -1: falsch, 0: unabeantwortet, 1: richtig | Ausgewähle Antwort als Text, 0 unbeantwortet

        this.noMillionaere = 1;
    }

    setModelAndView(m, v) {
        this.m = m;
        this.v = v;
    }

    /**
     * Setzt Variablen zurück für neue Runde
     */
    reset(){
        console.log("Resetting!");

        this.question = null;
        this.questionNr = -1;
        
        this.mathQuestion = 0;
        this.noteQuestion = 0;

        this.shuffledAnswers = null; // Array für Antworten auf Btns

        this.correctQuestions = 0;
        this.arrayCreated = 0;
        this.questionLog = null;

        this.noMillionaere = 1;
    }

    /**
     * Erstellt String für Endbildschirm mit Zusammenfassung der Ergebnisse
     * @returns {string} Zusammenfassungstring
     */
    createQuestionSummaryStr(){
        let summaryString = "";
        for (let i = 0; i < this.questionLog.length; i++){
            let correctionString = "";
            let answerStatus = "";
            let answerString = "";
            let question = "";

            if (this.questionLog[i][0] == 0){ // unbeantwortet
                answerStatus = "🚫";
                answerString = "-";
            }
            if (this.questionLog[i][0] == -1){ // falsch
                answerStatus = "❌";
                answerString = this.questionLog[i][1];
                if (this.m.topic != "allgemeinSrv"){ // online ist nicht klar was richtig ist
                    correctionString = " (richtig ist: " + this.m.questions[i].a[0] + ")";
                }

            }
            if (this.questionLog[i][0] == 1){ // richtig
                answerStatus = "✅";
                answerString = this.questionLog[i][1]
            }
            // kein <br> in Fragen
            //question = this.m.questions[i].q.replace(/<br\s*\/?>/gi, " ");
            question = this.m.questions[i].q.replaceAll("<br>", " ");
            
            summaryString = summaryString + answerStatus + " " + (i+1) + ". " + question + ": " + answerString + correctionString  + "<br>";
        }
        return summaryString;
    }

    /**
     * Erstellt String mit KatexZeilen und normalen Textzeilen
     * @returns {string} Mathe/Text String
     */
    createMultilineMathTextStr(){
        let lines = this.question.q.split(/<br\s*\/?>/gi); // an <br> splitten
        let mathLines = [];
        let textLines = [];

        for (let line of lines) {
            // Mathezeile enthält Operatoren, Zahlen, xyz?
            if (/.*[abxyz\d]\s*[+\-*/^=]\s*[abxyz?\d].*/.test(line.trim())) {
                mathLines.push(line);
            } else {
                textLines.push(line);
            }
        }

        let katexContent = "";
        if (mathLines.length > 0) {
            katexContent += "$" + mathLines.join(" \\\\ ") + "$"; // Mathezeile zusammenfügen, Zeilenumbruch ist \\
        }
        let textContent = textLines.join("<br>"); // Textzeile zusammefügen, Zeilenumbruch ist <br>

        return textContent + "<br>" + katexContent;
    }

    /**
     * Holt eine neue Frage aus dem Model, erkennt den Fragetyp und setzt die View entsprechend
     */
    async setQuestion() {
        View.setNewQuestionBtnDisabled(true);
        View.setAnswerButtonsDisabled(true);
        View.setTopicRadioBtnsDisabled(true);
        View.setMusicMode(false);
        this.v.resetPiano();
        View.setPianoBtnsDisabled(false);
        View.colorAnswerButtons("default", 0);
        View.renderProgressBar(0);
        View.renderStatsText("0/0");
        View.renderStatusText("Bitte warten!")
        this.mathQuestion = 0;
        this.noteQuestion = 0;
        this.questionNr++;
        let curtopic = View.getTopic();
       
        View.renderQuestionText("Laden...");
        for (let i = 0; i < 4; i++) {
            let text = "..."
            let pos = i;
            View.inscribeButtons(i, text, pos); // Tasten beschriften -> View -> Antworten
        }
        // Endbildschrirm deaktivieren
        View.setEndscreen(false);

        if (this.m.topic != curtopic){ // neues Thema & Runde -> reset
            console.log("Topic Change! New Round");
            this.m.roundStarted = 0;
            this.reset();

            this.questionNr++;
            // Endbildschrim deaktivieren
            View.setEndscreen(false);  
        }

        console.log(this.questionNr+1 + "/" + this.m.maxQuestions);
        if (this.questionNr+1 > this.m.maxQuestions){ // alle Fragen beantwortet?
            // Hier eine Übersicht anzeigen (wieviel richtig?)
            View.setEndscreen(true);
            // Buttons deaktivieren
            View.setAnswerButtonsDisabled(true);
            View.setNewQuestionBtnDisabled(false);
            View.renderProgressBar(100);
            View.renderStatsText((this.m.maxQuestions) + "/" + this.m.maxQuestions);

            let summaryString = this.createQuestionSummaryStr();
            View.renderEndScreenText(summaryString);
            View.renderKatex("end-screen-text", false);
            View.renderStatusText( "✅ richtig | ❌ falsch | 🚫 unbeantwortet");
            //console.log("SummaryStr: " + summaryString);

            let percentageCorrect = Math.round(this.correctQuestions / this.m.maxQuestions * 100);

            if (curtopic === "WwM" && this.noMillionaere == 1){
                View.renderQuestionText("<b>Du bist leider kein Millionär geworden!</b><br>Richtig beantwortet: " + this.correctQuestions + " von " + this.m.maxQuestions + " (" + percentageCorrect + "%)");
            }
            else if (curtopic === "WwM" && this.noMillionaere == 0){
                View.renderQuestionText("<b>Du bist ein Millionär geworden!</b><br>Richtig beantwortet: " + this.correctQuestions + " von " + this.m.maxQuestions + " (" + percentageCorrect + "%)");
            }
            else{    
                View.renderQuestionText("<b>Alle Fragen beantwortet!</b><br>Richtig beantwortet: " + this.correctQuestions + " von " + this.m.maxQuestions + " (" + percentageCorrect + "%)");
            }

            this.m.roundStarted = 0; // neue Runde -> reset
            this.reset();
            return
        }

        this.question = await this.m.getQuestion(this.questionNr); // Frage bekommen
        if (this.question == null){ // Server Timeout? -> Abbruch
            View.setNewQuestionBtnDisabled(false);
            View.setTopicRadioBtnsDisabled(false);
            View.setPianoBtnsDisabled(false);
            View.renderStatusText("Server Timeout!")
            this.m.roundStarted = 0; // neue Runde -> reset
            this.reset();
            return;
        }
        // Array für Spielerantworten aller Fragen erstellen
        if (this.arrayCreated == 0){
            this.questionLog = new Array(this.m.maxQuestions);
            // vorfüllen mit 0
            for (let i = 0; i < this.m.maxQuestions; i++){
                this.questionLog[i] = [0,0];
            }
            this.arrayCreated = 1;
        }
        
        if (curtopic === "notes" && (this.questionNr <= this.m.maxQuestions)) {
            console.log("Note question");
            View.setMusicMode(true);
            this.noteQuestion = 1;
        }
        // Regex zur Erkennung, ob Formeln in $ ... $ eingeschlossen
        else if (/.*\$.*\$.*/.test(this.question.q.trim())){
            console.log("Text contains Math in $ ... $!");
            let renderText = this.question.q.replace(/<br\s*\/?>/gi, "");  // <br> löschen
            View.renderQuestionText(renderText);
            this.mathQuestion = 1;
        } 
        // Regex zur Erkennung von Matheaufgaben ohne $: .* = alle Zeichen, [abxyz?\d] = abxyz? oder Zahlen, \s* = beliebige Anzahl Leerzeichen, [+-*/^=] = Operator
        else if (/.*[abxyz\d]\s*[+\-*/^=]\s*[abxyz?\d].*/.test(this.question.q.trim())) {
            console.log("Text contains Math!");
            if (this.question.q.includes("<br>")){ // mehrzeilige Formeln + Text
                let text = this.createMultilineMathTextStr();
                View.renderQuestionText(text);
            }
            else{ // einzeilige Formeln
                View.renderQuestionText("$" + this.question.q + "$");
            }
            this.mathQuestion = 1;
        }

        View.renderStatsText((this.questionNr + 1) + "/" + this.m.maxQuestions);
        let percent = Math.round((this.questionNr) / this.m.maxQuestions * 100); 
        //console.log(percent);
        View.renderProgressBar(percent);
        View.renderStatusText("Bitte eine Antwort auswählen!")
        
        this.shuffledAnswers = [...this.question.a]; // Kopie erstellen
        shuffleArray(this.shuffledAnswers); // random Antworten
        
        console.log(this.shuffledAnswers);
        
        for (let i = 0; i < 4; i++) {
            let text = this.shuffledAnswers[i];
            if (this.mathQuestion == 1){
                text = this.shuffledAnswers[i];
            }
            let pos = i;
            View.inscribeButtons(i, text, pos); // Tasten beschriften -> View -> Antworten
        }

        if (this.noteQuestion == 1){ // Noten rendern
            console.log("NOTE RENDER");
            View.renderMusicNotes(this.question.q);
            View.renderStatusText("Bitte die gezeigten Noten korrekt spielen!")
        }
        else if (this.mathQuestion == 1){ // Mathe rendern 
            console.log("MATH RENDER");
            View.renderKatex("question", true);
            View.renderKatex("answer-btn", true);
        }
        else{ // normalen Text rendern
            console.log("NORMAL RENDER");
            View.renderQuestionText(this.question.q);
        }

        View.setNewQuestionBtnDisabled(false);
        View.setAnswerButtonsDisabled(false);
        View.setTopicRadioBtnsDisabled(false);
    }

    /**
     * Prüft die Antwort, aktualisiert Statistik und setzt die View
     * @param {number} answer Antwortbuttonnummer
     */
    // 
    async checkAnswer(answer) {
        View.renderStatusText("Überprüfe Antwort...")
        View.setNewQuestionBtnDisabled(true);
        View.setAnswerButtonsDisabled(true);

        const buttonText = this.shuffledAnswers[answer];
        console.log("BUTTON TEXT: "+ buttonText);
        
        console.log("Lösung: " + this.question.a[0]);
        console.log("Button-Antwort: " + buttonText);

        if (this.m.topic != "allgemeinSrv"){ // lokale Fragen
            if (this.question.a[0] == buttonText){ // Aufgabentext == Buttontext?
                console.log("Richtige Antwort!");
                View.renderStatusText("✅ Richtige Antwort!");
                View.colorAnswerButtons("correct", answer);

                this.correctQuestions++;
                this.questionLog[this.questionNr] = [1, buttonText];

                // letzte Frage korrekt -> Millionär
                if (this.m.topic === "WwM" && this.correctQuestions == this.m.maxQuestions){
                    this.noMillionaere = 0;
                }
            } 
            else{
                console.log("Falsche Antwort! Richtig ist: " + this.question.a[0]);
                View.renderStatusText("❌ Falsche Antwort! Richtig ist: " + this.question.a[0]);
                View.colorAnswerButtons("false", answer);

                this.questionLog[this.questionNr] = [-1, buttonText];

                // doch kein Millionär :( -> nicht weiterspielen 
                if (this.m.topic === "WwM"){
                    this.questionNr = this.m.maxQuestions-1;
                    this.noMillionaere = 1;
                }

                if (this.m.topic === "mathe"){
                    View.renderKatex("status-text", false);
                }
            }
        }
        else if (this.m.topic === "allgemeinSrv"){ // Online Fragen -> Server Check
            // Antwort Zahl rausbekommen
            let answerNum = 0;
            for (let i=0; i<4; i++){
                //console.log("Text: " + buttonText);
                //console.log("Question: " + this.question.a[i]);
                if (buttonText === this.question.a[i]){
                    answerNum = i;
                    break;
                }
            }
            console.log("Num answered: " + answerNum);
            let correct = await this.m.checkAnswer(this.questionNr, answerNum, this.question.id);
            if (correct == null){ // Server Timeout?
                View.setNewQuestionBtnDisabled(false);
                View.renderStatusText("Server Timeout!");
                return;
            }
            console.log("Korrekt: " + correct);
            if (correct == 1){ // richtig
                console.log("Richtige Antwort!");
                View.renderStatusText("✅ Richtige Antwort!");
                View.colorAnswerButtons("correct", answer);

                this.correctQuestions++;
                this.questionLog[this.questionNr] = [1, buttonText];
            }
            else { // falsch
                console.log("Falsche Antwort!");
                View.renderStatusText("❌ Falsche Antwort!");
                View.colorAnswerButtons("false", answer);

                this.questionLog[this.questionNr] = [-1, buttonText];
            }
        }
        console.log("Question Array: " + this.questionLog);
        let percent = Math.round((this.questionNr + 1) / this.m.maxQuestions * 100); 
        //console.log(percent);
        View.renderProgressBar(percent);
        View.setNewQuestionBtnDisabled(false);
    }

    /**
     * Prüft gespielte Noten bei Notenkategorie, aktualisiert Statistik und setzt die View
     * @param {string} answer Notenstring
     */
    async checkAnswerPiano(answer) {
        View.renderStatusText("Überprüfe Antwort...")
        View.setNewQuestionBtnDisabled(true);
        View.setPianoBtnsDisabled(true);
        this.v.resetPiano();
        console.log("Answer Len" + answer.length);
        console.log("Questions Answ Len" + this.question.a[0].length);

        console.log("Antwort Chars: ", [...answer].map(c => c.charCodeAt(0)));
        console.log("Richtige Chars: ", [...this.question.a[0]].map(c => c.charCodeAt(0)));

        if (String(answer) === String(this.question.a[0])) { // richtige Antwort
            console.log("Richtige Antwort!");
            View.renderStatusText("✅ " + answer + " ist die richtige Antwort!");
            this.correctQuestions++;
            this.questionLog[this.questionNr] = [1, answer];
        }
        else { // falsch
            console.log("Falsche Antwort! Richtig ist: " + this.question.a[0]);
            View.renderStatusText("❌ " + answer + " ist die falsche Antwort! Richtig ist: " + this.question.a[0]);

            this.questionLog[this.questionNr] = [-1, answer];
        }
        console.log("Question Array: " + this.questionLog);
        let percent = Math.round((this.questionNr + 1) / this.m.maxQuestions * 100); 
        View.renderProgressBar(percent);
        View.setNewQuestionBtnDisabled(false);
    }

}

// ##################### View: Bildschirmausgabe, Eventhandling ########################################
/**
 * Handelt Events, Bildschirmausgabe und Sichbarkeit von Elementen
 * @class View
 */
class View {
    constructor(p) {
        this.p = p;  // Presenter
        this.setHandler();
        this.setupPiano();
        View.setMusicMode(false);
        View.setAnswerButtonsDisabled(true);
        
        this.noteString = "";
    }

    /**
     * Rendert den Text mittels KaTeX im angebenen Element als LaTeX Formel, sollte in $..$ stehen
     * @param {string} elemName  ID-Namen des Element
     * @param {bool} MultiLine_bool Mehrzeilig formatieren?
     */
    static renderKatex(elemName, MultiLine_bool){
        let elem = null;
        
        if (elemName === "answer-btn"){ // alle Buttons durchgehen
            for (let i = 0; i < 4; i++){
                elem = document.querySelectorAll("#answer-btn > *")[i];
                console.log("Rendering in: " + elem);
                renderMathInElement(elem, {
                    delimiters: [
                        {left: "$", right: "$", display: MultiLine_bool},
                        {left: "$$", right: "$$", display: true},
                        {left: "\\(", right: "\\)", display: false},
                        {left: "\\[", right: "\\]", display: true}
                    ],
                    throwOnError: false
                });
            }
        }
        else{ // einzelnes Element
            elem = document.getElementById(elemName);
            renderMathInElement(elem, {
                delimiters: [
                    {left: "$", right: "$", display: MultiLine_bool},
                    {left: "$$", right: "$$", display: true},
                    {left: "\\(", right: "\\)", display: false},
                    {left: "\\[", right: "\\]", display: true}
                ],
                throwOnError: false
            });
        }
    }

    /**
     * Setzt Handler für Buttons und Radiobuttons
     */
    setHandler() {
        // use capture false -> bubbling (von unten nach oben aufsteigend)
        // this soll auf Objekt zeigen -> bind (this)
        document.getElementById("answer-btn").addEventListener("click", this.checkEvent.bind(this), false); // checkEvent() für 4 Answer Buttons
        document.getElementById("newquestion-btn").addEventListener("click", this.newQuestion.bind(this), false); // newQuestion() für NewQuestion Button
        document.getElementById("topic").addEventListener("change", this.newQuestion.bind(this), false); // newQuestion() bei Topic Radio Buttons
        document.getElementById("piano-reset-btn").addEventListener("click", this.resetPiano.bind(this), false);
        document.getElementById("piano-check-btn").addEventListener("click", this.checkAnswerPiano.bind(this), false);
    }

    /**
     * EventListener Funktion nach Klick auf Neue Frage Button
     */
    newQuestion() {
        this.p.setQuestion();
        
        // Neuzeichnen erzwingen
        setTimeout(() => {
            window.scrollBy(0, 1);
            window.scrollBy(0, -1);
        }, 25);
    }

    /**
     * Setzt Text und Attribute für Antwortbuttons
     * @param {number} i Buttonnummer (0-3)
     * @param {string} text Buttontext
     * @param {number} pos Attribut Position
     */
    static inscribeButtons(i, text, pos) {
        document.querySelectorAll("#answer-btn > *")[i].textContent = text;
        document.querySelectorAll("#answer-btn > *")[i].setAttribute("number", pos);
    }

    /**
     * Färbt Antwortbuttons je nach Korrektheit ein oder setzt sie auf Standard zurück
     * @param {string} colortype Farbtyp: "correct", "false", "default"
     * @param {number} num Buttonnummer
     */
    static colorAnswerButtons(colortype, num){
        // background: linear-gradient(to bottom, #2B3C70, #5F6C9C);
        if (colortype === "correct"){
            document.querySelectorAll("#answer-btn > *")[num].style.background = "linear-gradient(to bottom, #2b704a, #5f9c73)";
        }
        else if (colortype === "false"){
            document.querySelectorAll("#answer-btn > *")[num].style.background = "linear-gradient(to bottom, #91393d, #9c5f67";
        }
        else if (colortype === "default"){
            for (let i = 0; i < 4; i++){
                document.querySelectorAll("#answer-btn > *")[i].style.removeProperty("background");
            }
        }
    }

    /**
     * Schaltet Elemente für Kategorie Noten ein und aus
     * @param {bool} enabled_bool Ein/Aus
     */
    static setMusicMode(enabled_bool){
        if (enabled_bool == true){
            document.getElementById("question").style.display = "none";
            document.getElementById("paper").style.display = "block";
            document.getElementById("paper-box").style.display = "block"; 

            document.getElementById("piano-div").style.display = "flex";
            document.querySelector('.flex-container').style.flexDirection = "row"; // flexDirection wird solange Piano exisitiert geändert
            this.setAnswerButtonsHidden(true);
            this.setPianoBtnsHidden(false);
        }
        else if(enabled_bool == false){
            this.setPianoBtnsHidden(true);
            this.setAnswerButtonsHidden(false);
            document.getElementById("paper").style.display = "none";
            document.getElementById("paper-box").style.display = "none";

            document.getElementById("piano-div").style.display = "none";
            document.querySelector('.flex-container').style.flexDirection = ''; // jetzt wieder CSS überlassen

            document.getElementById("question").style.display = "block";
        }
    }

    /**
     * Rendert ein Notenstring mittels abcjs als Noten-SVG
     * @param {string} notes Noten
     */
    static renderMusicNotes(notes){
        console.log("RENDERING "+ notes);
        ABCJS.renderAbc(
            "paper",
            notes,
            {
                paddingtop: 0,
                paddingleft: 0,
                paddingright: 0,
                paddingbottom: 0,
            }
        );
    
        // Hacks, damit zentriert angezeigt
        const svg = document.querySelector("#paper svg");
        const g = svg.querySelector("g");
        
        const bbox = g.getBBox(); // eigentliche Breite/Höhe der Noten (Bounding Box)
        const scaleFactor = 1.2;
        svg.style.transform = `scale(${scaleFactor})`;
        const padding = 15;
        
        // nur den Teil mit Noten im ViewPort anzeigen
        svg.setAttribute("viewBox", `0 0 ${bbox.width} ${bbox.height + padding}`);
        svg.setAttribute("width", bbox.width);
    }

    /**
     * Aktiviert/Deaktiviert Antwortbuttons
     * @param {bool} disabled_bool Aktiviert/Deaktiviert
     */
    static setAnswerButtonsDisabled(disabled_bool){
        for (let i = 0; i < 4; i++){
            document.querySelectorAll("#answer-btn > *")[i].disabled = disabled_bool;
        }
    }

    /**
     * Zeigt/versteckt Antwortbuttons
     * @param {bool} disabled_bool Aktiviert/Deaktiviert
     */
    static setAnswerButtonsHidden(disabled_bool){
        if (disabled_bool == true){
            for (let i = 0; i < 4; i++){
                document.querySelectorAll("#answer-btn > *")[i].style.display = "none";
            }
        }
        else {
            for (let i = 0; i < 4; i++){
                document.querySelectorAll("#answer-btn > *")[i].style.display = "block";
            }
        }
    }

    /**
     * Aktiviert/Deaktiviert Neue Frage Button
     * @param {bool} disabled_bool Aktiviert/Deaktiviert
     */
    static setNewQuestionBtnDisabled(disabled_bool){
        document.getElementById("newquestion-btn").disabled = disabled_bool;
    }

    /**
     * Aktiviert/Deaktiviert Antwort prüfen, Zurücksetzen Buttons vom Piano
     * @param {bool} disabled_bool Aktiviert/Deaktiviert
     */
    static setPianoBtnsDisabled(disabled_bool){
        document.getElementById("piano-check-btn").disabled = disabled_bool;
        document.getElementById("piano-reset-btn").disabled = disabled_bool;
    }

    /**
     * Zeigt/versteckt Antwort prüfen, Zurücksetzen Buttons vom Piano
     * @param {bool} disabled_bool Aktiviert/Deaktiviert
     */
    static setPianoBtnsHidden(disabled_bool){
        if (disabled_bool == true){
            document.getElementById("piano-check-btn").style.display = "none";
            document.getElementById("piano-reset-btn").style.display = "none";
        }
        else {
            document.getElementById("piano-check-btn").style.display = "flex";
            document.getElementById("piano-reset-btn").style.display = "flex";
        }
    }

    /**
     * Aktiviert/Deaktiviert Thema Radio Buttons
     * @param {bool} disabled_bool Aktiviert/Deaktiviert
     */
    static setTopicRadioBtnsDisabled(disabled_bool){
        let radiobtns = document.getElementsByClassName("radio");
        for (let i = 0; i < radiobtns.length; i++){
            radiobtns[i].disabled = disabled_bool;
        }

        if (disabled_bool == true){
            document.getElementById("topic").classList.add("disabled");
        }
        else {
            document.getElementById("topic").classList.remove("disabled");
        }
    }

    /**
     * Zeigt/versteckt Antwortbuttons/Endbilschirm 
     * @param {bool} disabled_bool Aktiviert/Deaktiviert
     */
    static setEndscreen(enabled_bool){
        if (enabled_bool == true){
            for (let i = 0; i < 4; i++){
                document.querySelectorAll("#answer-btn > *")[i].style.display = "none";
            }
            document.getElementById("end-screen-text").style.display = "block";
            View.setAnswerButtonsDisabled(true);
        }
        else if (enabled_bool == false){
            for (let i = 0; i < 4; i++){
                document.querySelectorAll("#answer-btn > *")[i].style.display = "block";
            }
            document.getElementById("end-screen-text").style.display = "none";
        }
    }

    /**
     * Ermittelt Thema vom ausgewähltem Radiobutton
     * @returns {string} Thema
     */
    static getTopic(){
        if (document.getElementById('web-topic').checked) {
            return "web";
        }
        else if (document.getElementById('math-topic').checked) {
            return "mathe";
        }
        else if (document.getElementById('notes-topic').checked) {
            return "notes";
        }
        else if (document.getElementById('WwM?-topic').checked) {
            return "WwM";
        }
        else if (document.getElementById('generalSrv-topic').checked) {
            return "allgemeinSrv";
        }
        else if (document.getElementById('minecraft-topic').checked) {
            return "minecraft";
        }
    }
    
    /**
     *  Eventhandler zur Überprüfung von Benutzerantworten
     *  @param {Event} event Event-Objekt
     */
    checkEvent(event) {
        console.log(event.type);
        console.log("Clicked target:", event.target);

        if (event.target.nodeName === "BUTTON") {
            this.p.checkAnswer(Number(event.target.attributes.getNamedItem("number").value));
        }
    }

    /**
     *  Rendert geg. Text als Frage 
     *  @param {string} text Frage
     */
    static renderQuestionText(text) {
        let div = document.getElementById("question");
        let p = document.createElement("p");
        p.innerHTML = text;
        div.replaceChildren(p);
    }

    /**
     *  Rendert geg. Text als Endscreenstatistik
     *  @param {string} text Statistik
     */
    static renderEndScreenText(text) {
        let div = document.getElementById("end-screen-text");
        let p = document.createElement("p");
        p.innerHTML = text;
        div.replaceChildren(p);
    }
    
    /**
     *  Setzt Fortschrittseite auf geg. Wert inkl. Prozenttext 
     *  @param {number} percent Prozent
     */
    static renderProgressBar(percent){
        document.getElementById("progress").style.width = percent + "%";
        let div = document.getElementById("progress-percent");
        div.textContent = percent + "%";
    }

    /**
     *  Rendert geg. Text als Fortschrittstext
     *  @param {string} text Fortschritt
     */
    static renderStatsText(text) {
        let div = document.getElementById("stats");
        div.textContent = text;
    }

    /**
     *  Rendert geg. Text als Statustext
     *  @param {string} text Status
     */
    static renderStatusText(text){
        let div = document.getElementById("status-text");
        div.textContent = "➣ " + text;
    }

    /**
     *  Initalisiert das Piano und setzt nötigen Handler - einmal aufrufen am Start
     */
    setupPiano(){
        const white_keys = ['y', 'x', 'c', 'v', 'b', 'n', 'm'];
        const black_keys = ['s', 'd', 'g', 'h', 'j'];

        const keys = document.querySelectorAll('.key');
        const whiteKeys = document.querySelectorAll('.key.white');
        const blackKeys = document.querySelectorAll('.key.black');

        this.NoteString = "";

        keys.forEach(key => {
            key.addEventListener('click', () => this.playNote(key));
        });

        document.addEventListener('keydown', e => {
            if (e.repeat) {
                return;
            }

            const key = e.key;
            const whiteKeyIndex = white_keys.indexOf(key);
            const blackKeyIndex = black_keys.indexOf(key);

            if (whiteKeyIndex > -1) {
                this.playNote(whiteKeys[whiteKeyIndex]);
            }

            if (blackKeyIndex > -1) {
                this.playNote(blackKeys[blackKeyIndex]);
            }
        });
    }

    /**
     * Eventhandler-Funktion nach Drücken einer Piano-Taste: speichert gespielte Note und spielt diese ab 
     * @param {Element} key Tastenelement
     */
    playNote(key) {
        if (this.NoteString.length > 100){
            this.NoteString = "";
        }

        if (this.NoteString === ""){ // kein Leerzeichen davor bei erster Note
            this.NoteString = this.NoteString + key.dataset.note;
        }
        else{
            this.NoteString = this.NoteString + " " + key.dataset.note;
        }

        View.renderStatusText("Gespielt: " + this.NoteString);
        
        const noteAudio = document.getElementById(key.dataset.note);
        if (!noteAudio) {
            console.log("Audio-Element nicht gefunden für:", key.dataset.note);
            return;
        }

        noteAudio.currentTime = 0;
        noteAudio.play();
    
        key.classList.add('active');
        noteAudio.addEventListener('ended', () => {
            key.classList.remove('active');
        })
    }

    /**
     *  Eventhandler-Funktion für Zurücksetzen-Button: leert Speicher für gespielte Noten
     */
    resetPiano(){
        this.NoteString = "";
        View.renderStatusText("Gespielt: " + this.NoteString);
    }

    /**
     *  Eventhandler-Funktion für Antwort prüfen-Button: Überprüft gespielte Noten mittels Presenter-Funktion
     */
    checkAnswerPiano(){
        this.p.checkAnswerPiano(this.NoteString);
    }
}