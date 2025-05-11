"use strict";
//let p, v, m;
document.addEventListener('DOMContentLoaded', function () {
    let m = new Model();
    let p = new Presenter();
    let v = new View(p);
    p.setModelAndView(m, v);
    View.setAnswerButtonsDisabled(true);
});

// Fisher–Yates shuffle
function shuffleArray(array) { 
    for (let i = array.length - 1; i >= 1; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
};

// ############# Model: Fragen laden ############################################################
class Model {
    constructor() { 
        this.topic = View.getTopic();
        this.questions = [];
        this.maxQuestions = 999999;
        this.roundStarted = 0;

        this.username = "eric.hue@web.de";
        this.password = "SecretAmazingPW!1!"; // sehr sicher lol
    }

    // Holt eine Frage aus dem JSON oder vom Server
    async getQuestion(nr) {
        // lokale Fragen
        this.topic = View.getTopic();
        if (this.roundStarted != 1 && this.topic != "allgemeinSrv"){ // nur neuladen aus Datei, wenn neue Runde oder neues Thema
            try {
                this.roundStarted = 1;

                const response = await fetch('./questions.json', {cache: "no-store"}); // no-store verhindert cache
                const data = await response.json();
                
                // nach Typ die richtigen Fragen auswählen
                this.topic = View.getTopic();
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
                else if (this.topic === "minecraft"){
                    shuffleArray(data.minecraft);
                    this.questions = data.minecraft;
                }

                console.log(this.questions);
                
                // get maxQuestions im Thema
                this.maxQuestions = this.questions.length;
            } catch (error) {
                alert("Es muss wegen CORS diese Seite auf einem Server gehostet sein, damit JSON Daten geladen werden können!\nError: " + error)
                console.error('Fehler beim Laden der Daten:', error);
                return null; // Fehlerbehandlung    
            }
        }
        else if (this.roundStarted != 1 && this.topic === "allgemeinSrv"){ // Online Fragen
            // curl --user eric.hue@web.de:SecretAmazingPW\!\1\! -X GET https://idefix.informatik.htw-dresden.de:8888/api/quizzes/1959
            this.roundStarted = 1;

            //const quizIdStart = 149;
            //const quizIdEnd = 248;
            const quizIdStart = 1940;
            const quizIdEnd = 1961;
            const quizIdNum = (quizIdEnd - quizIdStart) +1;

            const headers = new Headers();
            headers.set('Authorization', 'Basic ' + btoa(this.username + ':' + this.password));

            this.maxQuestions = quizIdNum;
            this.questions = [];
            //this.questions = new Array(quizIdNum);
            console.log("HELLO");
            for (let quizId = quizIdStart; quizId <= quizIdEnd; quizId++){
                View.renderQuestionText("Laden... (ID: " + quizId + "/" + quizIdEnd + ")");
                console.log("Getting ID: " + quizId);

                // Timeout auf 5 Sek
                const controller = new AbortController();
                setTimeout(() => controller.abort(), 5000);
                try {
                    const response = await fetch(`https://idefix.informatik.htw-dresden.de:8888/api/quizzes/${quizId}`, {
                        method: 'GET',
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
                    if (error.name === 'AbortError') {
                        alert("Timeout: Server nicht erreichbar (bist du im HTW-Netz?)");
                    } else {
                        alert("Fehler beim Laden: " + error.message);
                    }
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
                alert("Timeout: Server nicht erreichbar (bist du im HTW-Netz?)");
            } else {
                alert("Fehler beim Laden: " + error.message);
            }
            return null;
        }
    }
}

// ############ Controller: Frage verarbeiten #########################################################
class Presenter {
    constructor() {
        this.question = null;
        this.questionNr = -1;
        this.correctQuestions = 0;

        this.arrayCreated = 0;
        this.questionLog = null; // -1: falsch, 0: unabeantwortet, 1: richtig | Ausgewähle Antwort als Text, 0 unbeantwortet
    }

    setModelAndView(m, v) {
        this.m = m;
        this.v = v;
    }

    // Reset der Variablen für neue Runde
    reset(){
        console.log("Resetting!");

        this.question = null;
        this.questionNr = -1;
        this.mathQuestion = 0;
        this.shuffledAnswers = null; // Array für Antworten auf Btns

        this.correctQuestions = 0;
        this.arrayCreated = 0;
        this.questionLog = null;
    }

    // String für Endbildschirm mit Zusammenfassung der Ergebnisse
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
            // kein $ für Mathe in Fragen
            question = question.replaceAll("$", "");
            summaryString = summaryString + answerStatus + " " + (i+1) + ". " + question + ": " + answerString + correctionString  + "<br>";
        }
        return summaryString;
    }

    // String mit KatexZeilen und normalen Textzeilen erstellen
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
            katexContent += "$" + mathLines.join(" \\\\ ") + "$"; // Mathezeile zusammenfügen, Zeilenumbruch ist \\\\
        }
        let textContent = textLines.join("<br>"); // Textzeile zusammefügen, Zeilenumbruch ist <br>

        return textContent + "<br>" + katexContent;
    }

    // Holt eine neue Frage aus dem Model und setzt die View
    async setQuestion() {
        View.setNewQuestionBtnDisabled(true);
        View.setAnswerButtonsDisabled(true);
        View.colorAnswerButtons("default", 0);
        View.renderProgressBar(0);
        View.renderStatsText("0/0");
        View.renderStatusText("Bitte warten!")
        this.mathQuestion = 0;
        this.questionNr++;
       
        View.renderQuestionText("Laden...");
        for (let i = 0; i < 4; i++) {
            let text = "..."
            let pos = i;
            View.inscribeButtons(i, text, pos); // Tasten beschriften -> View -> Antworten
        }
        // Endbildschrirm deaktivieren
        View.setEndscreen("disabled");

        console.log(this.questionNr+1 + "/" + this.m.maxQuestions);
        if (this.questionNr+1 > this.m.maxQuestions){ // alle Fragen beantwortet?
            // Hier eine Übersicht anzeigen (wieviel richtig?)
            View.setEndscreen("enabled");
            // Buttons deaktivieren
            View.setAnswerButtonsDisabled(true);
            View.setNewQuestionBtnDisabled(false);
            View.renderProgressBar(100);
            View.renderStatsText((this.m.maxQuestions) + "/" + this.m.maxQuestions);

            let summaryString = this.createQuestionSummaryStr();
            View.renderEndScreenText(summaryString);
            View.renderStatusText( "✅ richtig | ❌ falsch | 🚫 unbeantwortet");
            //console.log("SummaryStr: " + summaryString);

            let percentageCorrect = Math.round(this.correctQuestions / this.m.maxQuestions * 100);
            View.renderQuestionText("<b>Alle Fragen beantwortet!</b><br>Richtig beantwortet: " + this.correctQuestions + " von " + this.m.maxQuestions + " (" + percentageCorrect + "%)");

            this.m.roundStarted = 0; // neue Runde -> reset
            this.reset();
            return
        }

        let curtopic = View.getTopic();
        if (this.m.topic != curtopic){ // neues Thema & Runde -> reset
            console.log("Topic Change! New Round");
            this.m.roundStarted = 0;
            this.reset();

            this.questionNr++;
            // Endbildschrim deaktivieren
            View.setEndscreen("disabled");  
        }

        this.question = await this.m.getQuestion(this.questionNr); // Frage bekommen
        if (this.question == null){ // Server Timeout? -> Abbruch
            View.setNewQuestionBtnDisabled(false);
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
        
        // Regex zur Erkennung, ob Formeln in $ ... $ eingeschlossen
        if (/.*\$.*\$.*/.test(this.question.q.trim())){
            console.log("Text contains Math in $ ... $!");
            let renderText = this.question.q.replace(/<br\s*\/?>/gi, "");
            View.renderQuestionText(renderText); // <br> löschen
            this.mathQuestion = 1;
        } 
        // Regex zur Erkennung von Matheaufgaben: .* = alle Zeichen, [abxyz?\d] = abxyz? oder Zahlen, \s* = beliebige Anzahl Leerzeichen, [+-*/^=] = Operator
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
        else{
            View.renderQuestionText(this.question.q);
        }

        View.renderStatsText((this.questionNr +1) + "/" + this.m.maxQuestions);
        let percent = Math.round((this.questionNr+1) / this.m.maxQuestions * 100); 
        //console.log(percent);
        View.renderProgressBar(percent);
        View.renderStatusText("Bitte eine Antwort auswählen!")
        
        this.shuffledAnswers = [...this.question.a]; // Kopie erstellen
        shuffleArray(this.shuffledAnswers); // random Antworten
        
        console.log(this.shuffledAnswers);
        
        for (let i = 0; i < 4; i++) {
            let text = this.shuffledAnswers[i];
            if (this.mathQuestion == 1){
                text = "$" + this.shuffledAnswers[i] + "$";
            }
            let pos = i;
            View.inscribeButtons(i, text, pos); // Tasten beschriften -> View -> Antworten
        }

        // Mathe rendern 
        if (this.mathQuestion == 1){
            View.renderKatex("question");
            View.renderKatex("answer-btn");
        }
        View.setNewQuestionBtnDisabled(false);
        View.setAnswerButtonsDisabled(false);
    }

    // Prüft die Antwort, aktualisiert Statistik und setzt die View
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
            } 
            else{
                console.log("Falsche Antwort! Richtig ist: " + this.question.a[0]);
                View.renderStatusText("❌ Falsche Antwort! Richtig ist: " + this.question.a[0]);
                View.colorAnswerButtons("false", answer);

                this.questionLog[this.questionNr] = [-1, buttonText];
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
        View.setNewQuestionBtnDisabled(false);
    }
}

// ##################### View: Bildschirmausgabe, Eventhandling ########################################
class View {
    constructor(p) {
        this.p = p;  // Presenter
        this.setHandler();
    }

    static renderKatex(elemName){
        let elem = null;
        
        if (elemName === "answer-btn"){ // alle Buttons durchgehen
            for (let i = 0; i < 4; i++){
                elem = document.querySelectorAll("#answer-btn > *")[i];
                console.log("Rendering in: " + elem);
                renderMathInElement(elem, {
                    delimiters: [
                        {left: "$", right: "$", display: true},
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
                    {left: "$", right: "$", display: true},
                    {left: "$$", right: "$$", display: true},
                    {left: "\\(", right: "\\)", display: false},
                    {left: "\\[", right: "\\]", display: true}
                ],
                throwOnError: false
            });
        }
    }

    setHandler() {
        // Button handler
        // use capture false -> bubbling (von unten nach oben aufsteigend)
        // this soll auf Objekt zeigen -> bind (this)
        document.getElementById("answer-btn").addEventListener("click", this.checkEvent.bind(this), false); // checkEvent() für 4 Answer Buttons
        document.getElementById("newquestion-btn").addEventListener("click", this.newQuestion.bind(this), false); // newQuestion() für NewQuestion Button
    }

    newQuestion() {
        this.p.setQuestion();
        
        // Neuzeichnen erzwingen
        setTimeout(() => {
            window.scrollBy(0, 1);
            window.scrollBy(0, -1);
        }, 25);
    }

    static inscribeButtons(i, text, pos) {
        document.querySelectorAll("#answer-btn > *")[i].textContent = text;
        document.querySelectorAll("#answer-btn > *")[i].setAttribute("number", pos);
    }

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

    static setAnswerButtonsDisabled(disabled_bool){
        for (let i = 0; i < 4; i++){
            document.querySelectorAll("#answer-btn > *")[i].disabled = disabled_bool;
        }
    }

    static setNewQuestionBtnDisabled(disabled_bool){
        document.getElementById("newquestion-btn").disabled = disabled_bool;
    }

    // Buttons & EndScreenText verstecken/anzeigen
    static setEndscreen(action){
        if (action === "enabled"){
            for (let i = 0; i < 4; i++){
                document.querySelectorAll("#answer-btn > *")[i].style.display = "none";
            }
            document.getElementById("end-screen-text").style.display = "block";
            View.setAnswerButtonsDisabled(true);
        }
        else if (action == "disabled"){
            for (let i = 0; i < 4; i++){
                document.querySelectorAll("#answer-btn > *")[i].style.display = "block";
            }
            document.getElementById("end-screen-text").style.display = "none";
        }
    }

    static getTopic(){
        if (document.getElementById('web-topic').checked) {
            return "web";
        }
        else if (document.getElementById('math-topic').checked) {
            return "mathe";
        }
        else if (document.getElementById('generalSrv-topic').checked) {
            return "allgemeinSrv";
        }
        else if (document.getElementById('minecraft-topic').checked) {
            return "minecraft";
        }
    }
    
    checkEvent(event) {
        console.log(event.type);
        console.log("Clicked target:", event.target);

        if (event.target.nodeName === "BUTTON") {
            this.p.checkAnswer(Number(event.target.attributes.getNamedItem("number").value));
        }
    }

    static renderQuestionText(text) {
        let div = document.getElementById("question");
        let p = document.createElement("p");
        p.innerHTML = text;
        div.replaceChildren(p);
    }

    static renderEndScreenText(text) {
        let div = document.getElementById("end-screen-text");
        let p = document.createElement("p");
        p.innerHTML = text;
        div.replaceChildren(p);
    }

    static renderProgressBar(percent){
        document.getElementById("progress").style.width = percent + "%";
        let div = document.getElementById("progress-percent");
        div.textContent = percent + "%";
    }

    static renderStatsText(text) {
        let div = document.getElementById("stats");
        div.textContent = text;
    }

    static renderStatusText(text){
        let div = document.getElementById("status-text");
        div.textContent = "➣ " + text;
    }
}