"use strict";

//let p, v, m;
document.addEventListener('DOMContentLoaded', function () {
    let m = new Model();
    let p = new Presenter();
    let v = new View(p);
    p.setModelAndView(m, v);
    //p.setTask();
});

// Fisher–Yates shuffle
function shuffleArray(array) { 
    for (let i = array.length - 1; i >= 1; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
};

// ############# Model ###########################################################################
class Model {
    constructor() { 
        this.questions = [];
        this.maxQuestions = 999999;
        this.roundStarted = 0;
    }

    // Holt eine Frage aus dem Array, zufällig ausgewählt oder vom Server
    // es werden die IDs hardgecodet für jeden Aufgabentyp
    // z.B. 1-5 für Web, 6-10 für Mathe, ...
    async getQuestion(nr) {
        // lokale Aufgaben
        if (this.roundStarted != 1){ // nur neuladen aus Datei, wenn neue Runde
            try{
                this.roundStarted = 1;

                const response = await fetch('./questions.json', {cache: "no-store"}); // no-store verhindert cache
                const data = await response.json();
                
                console.log(data.web)
                shuffleArray(data.web) // TODO: je nach Typ die richtigen Fragen auswählen
                this.questions = data.web;
                console.log(this.questions);
                
                // get maxQuestions im Thema
                this.maxQuestions = this.questions.length;
            } catch (error) {
                alert("Es muss wegen CORS diese Seite auf einem Server gehostet sein, damit JSON Daten geladen werden können!\nError: " + error)
                console.error('Fehler beim Laden der Daten:', error);
                return null; // Fehlerbehandlung    
            }
        }

        // gewünschte Frage laden
        const question = this.questions[nr];
        console.log("Frage:", question.q);
        console.log("Antworten:", question.a);

        return question; // Aufgabe + Lösungen
    }

    checkAnswer() {
        // TODO, Server Request schicken mit Antwort
        
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

    // String für Endbildschirm mit Zusammenfassung der Ergebnisse
    createQuestionSummaryStr(){
        let summaryString = "";
        for (let i = 0; i < this.questionLog.length; i++){
            let correctionString = "";
            let answerStatus = "";
            let answerString = "";

            if (this.questionLog[i][0] == 0){
                answerStatus = "🚫";
                answerString = "-";
            }
            if (this.questionLog[i][0] == -1){
                answerStatus = "❌";
                answerString = this.questionLog[i][1];
                correctionString = " (richtig ist: " + this.m.questions[i].a[0] + ")";

            }
            if (this.questionLog[i][0] == 1){
                answerStatus = "✅";
                answerString = this.questionLog[i][1]
            }

            summaryString = summaryString + answerStatus + " " + (i+1) + ". " + this.m.questions[i].q + ": " + answerString + correctionString  + "<br>";
        }
        return summaryString;
    }

    // Holt eine neue Frage aus dem Model und setzt die View
    async setQuestion() {
        this.questionNr++;
        // Buttons deaktivieren
        View.setQuestionButtonsDisabled(false);
        View.setEndscreen("disabled");

        console.log(this.questionNr+1 + "/" + this.m.maxQuestions);
        if (this.questionNr+1 > this.m.maxQuestions){ // alle Fragen beantwortet?
            // Hier eine Übersicht anzeigen (wieviel richtig?)
            let summaryString = this.createQuestionSummaryStr();
            View.renderEndScreenText(summaryString);
            View.renderStatusText( "✅ richtig | ❌ falsch | 🚫 unbeantwortet");
            //console.log("SummaryStr: " + summaryString);

            let percentageCorrect = Math.round(this.correctQuestions / this.m.maxQuestions * 100);
            View.renderQuestionText("Alle Fragen beantwortet!<br>Richtig beantwortet: " + this.correctQuestions + " von " + this.m.maxQuestions + " (" + percentageCorrect + "%)");
            View.setEndscreen("enabled");

            // zurücksetzen
            this.m.roundStarted = 0;

            this.questionNr = -1; 
            this.correctQuestions = 0;

            this.arrayCreated = 0;
            this.questionLog = null;
            return
        }

        this.question = await this.m.getQuestion(this.questionNr); // Frage bekommen
        // Array für Spielerantworten aller Fragen erstellen
        if (this.arrayCreated == 0){
            this.questionLog = new Array(this.m.maxQuestions);
            // vorfüllen mit 0
            for (let i = 0; i < this.m.maxQuestions; i++){
                this.questionLog[i] = [0,0];
            }
            this.arrayCreated = 1;
        }
        
        View.renderQuestionText(this.question.q);
        View.renderStatsText("Frage: " + (this.questionNr +1) + "/" + this.m.maxQuestions);
        View.renderStatusText("Bitte eine Antwort auswählen!")
        
        let shuffledAnswers = [...this.question.a]; // Kopie erstellen
        shuffleArray(shuffledAnswers); // random
        
        console.log(shuffledAnswers);
        
        for (let i = 0; i < 4; i++) {
            let text = shuffledAnswers[i];
            let pos = i;
            View.inscribeButtons(i, text, pos); // Tasten beschriften -> View -> Antworten
        }
    }

    // Prüft die Antwort, aktualisiert Statistik und setzt die View
    checkAnswer(answer) {
        console.log("Lösung: " + this.question.a[0]);
        console.log("Button-Antwort: " + document.querySelectorAll("#answer-btn > *")[answer].textContent);

        if (this.question.a[0] == document.querySelectorAll("#answer-btn > *")[answer].textContent){ // Aufgabentext == Buttontext?
            console.log("Richtige Antwort!");
            View.renderStatusText("✅ Richtige Antwort!");

            this.correctQuestions++;
            this.questionLog[this.questionNr] = [1, document.querySelectorAll("#answer-btn > *")[answer].textContent];
        } 
        else{
            console.log("Falsche Antwort! Richtig ist " + this.question.a[0]);
            View.renderStatusText("❌ Falsche Antwort! Richtig ist " + this.question.a[0]);

            this.questionLog[this.questionNr] = [-1, document.querySelectorAll("#answer-btn > *")[answer].textContent];
        }
        console.log("QUESTION ARRAY: " + this.questionLog);
        // Buttons deaktivieren
        View.setQuestionButtonsDisabled(true);
    }
}

// ##################### View #####################################################################
class View {
    constructor(p) {
        this.p = p;  // Presenter
        this.setHandler();
    }

    setHandler() {
        // Button handler
        // use capture false -> bubbling (von unten nach oben aufsteigend)
        // this soll auf Objekt zeigen -> bind (this)
        document.getElementById("answer-btn").addEventListener("click", this.checkEvent.bind(this), false); // checkEvent() für 4 Answer Buttons
        document.getElementById("newquestion-btn").addEventListener("click", this.start.bind(this), false); // Start() für Start Button
    }

    start() {
        this.p.setQuestion();
    }

    static inscribeButtons(i, text, pos) {
        document.querySelectorAll("#answer-btn > *")[i].textContent = text;
        document.querySelectorAll("#answer-btn > *")[i].setAttribute("number", pos);
    }

    static setQuestionButtonsDisabled(disabled_bool){
        for (let i = 0; i < 4; i++){
            document.querySelectorAll("#answer-btn > *")[i].disabled = disabled_bool;
        }
    }

    // Buttons & EndScreenText verstecken/anzeigen
    static setEndscreen(action){
        if (action === "enabled"){
            for (let i = 0; i < 4; i++){
                document.querySelectorAll("#answer-btn > *")[i].style.display = "none";
            }
            document.getElementById("end-screen-text").style.display = "block";
        }
        else if (action == "disabled"){
            for (let i = 0; i < 4; i++){
                document.querySelectorAll("#answer-btn > *")[i].style.display = "block";
            }
            document.getElementById("end-screen-text").style.display = "none";
        }
    }
    
    checkEvent(event) {
        console.log(event.type);
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

    static renderStatsText(text) {
        let div = document.getElementById("stats");
        div.textContent = text;
    }

    static renderStatusText(text){
        let div = document.getElementById("status-text");
        div.textContent = "➣ " + text; // Ändert den Textinhalt
    }
}