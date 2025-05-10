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

// ############# Model: Fragen laden ############################################################
class Model {
    constructor() { 
        this.topic = View.getTopic();
        this.questions = [];
        this.maxQuestions = 999999;
        this.roundStarted = 0;
    }

    // Holt eine Frage aus dem Array, zufällig ausgewählt oder vom Server
    // Beim: es werden die IDs hardgecodet für jeden Aufgabentyp
    // z.B. 1-5 für Web, 6-10 für Mathe, ...
    async getQuestion(nr) {
        // lokale Aufgaben
        if (this.roundStarted != 1){ // nur neuladen aus Datei, wenn neue Runde oder neues Thema
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

    // Reset der Variablen für neue Runde
    reset(){
        console.log("Resetting!");

        this.question = null;
        this.questionNr = -1;
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
                correctionString = " (richtig ist: " + this.m.questions[i].a[0] + ")";

            }
            if (this.questionLog[i][0] == 1){ // richtig
                answerStatus = "✅";
                answerString = this.questionLog[i][1]
            }
            // kein <br> in Fragen
            question = this.m.questions[i].q.replace("<br>", " ");

            summaryString = summaryString + answerStatus + " " + (i+1) + ". " + question + ": " + answerString + correctionString  + "<br>";
        }
        return summaryString;
    }

    // Holt eine neue Frage aus dem Model und setzt die View
    async setQuestion() {
        this.questionNr++;
        // Endbildschrirm deaktivieren
        View.setEndscreen("disabled");
        View.setQuestionButtonsDisabled(false);

        console.log(this.questionNr+1 + "/" + this.m.maxQuestions);
        if (this.questionNr+1 > this.m.maxQuestions){ // alle Fragen beantwortet?
            // Hier eine Übersicht anzeigen (wieviel richtig?)
            View.setEndscreen("enabled");
            // Buttons deaktivieren
            View.setQuestionButtonsDisabled(true);

            let summaryString = this.createQuestionSummaryStr();
            View.renderEndScreenText(summaryString);
            View.renderStatusText( "✅ richtig | ❌ falsch | 🚫 unbeantwortet");
            //console.log("SummaryStr: " + summaryString);

            let percentageCorrect = Math.round(this.correctQuestions / this.m.maxQuestions * 100);
            View.renderQuestionText("Alle Fragen beantwortet!<br>Richtig beantwortet: " + this.correctQuestions + " von " + this.m.maxQuestions + " (" + percentageCorrect + "%)");

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
        View.renderStatsText((this.questionNr +1) + "/" + this.m.maxQuestions);
        let percent = Math.round((this.questionNr+1) / this.m.maxQuestions * 100); 
        console.log(percent);
        View.renderProgressBar(percent);
        View.renderStatusText("Bitte eine Antwort auswählen!")
        
        let shuffledAnswers = [...this.question.a]; // Kopie erstellen
        shuffleArray(shuffledAnswers); // random Antworten
        
        console.log(shuffledAnswers);
        
        for (let i = 0; i < 4; i++) {
            let text = shuffledAnswers[i];
            let pos = i;
            View.inscribeButtons(i, text, pos); // Tasten beschriften -> View -> Antworten
        }
    }

    // Prüft die Antwort, aktualisiert Statistik und setzt die View
    checkAnswer(answer) {
        View.setQuestionButtonsDisabled(true);
        console.log("Lösung: " + this.question.a[0]);
        console.log("Button-Antwort: " + document.querySelectorAll("#answer-btn > *")[answer].textContent);

        if (this.question.a[0] == document.querySelectorAll("#answer-btn > *")[answer].textContent){ // Aufgabentext == Buttontext?
            console.log("Richtige Antwort!");
            View.renderStatusText("✅ Richtige Antwort!");

            this.correctQuestions++;
            this.questionLog[this.questionNr] = [1, document.querySelectorAll("#answer-btn > *")[answer].textContent];
        } 
        else{
            console.log("Falsche Antwort! Richtig ist: " + this.question.a[0]);
            View.renderStatusText("❌ Falsche Antwort! Richtig ist: " + this.question.a[0]);

            this.questionLog[this.questionNr] = [-1, document.querySelectorAll("#answer-btn > *")[answer].textContent];
        }
        console.log("Question Array: " + this.questionLog);
    }
}

// ##################### View: Bildschirmausgabe, Eventhandling ########################################
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
        document.getElementById("newquestion-btn").addEventListener("click", this.newQuestion.bind(this), false); // newQuestion() für NewQuestion Button
    }

    newQuestion() {
        this.p.setQuestion();
        
        setTimeout(() => {
            window.scrollBy(0, 1);
            window.scrollBy(0, -1);
        }, 25);
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
            View.setQuestionButtonsDisabled(true);
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
        else if (document.getElementById('general-topic').checked) {
            return "allgemein";
        }
        else if (document.getElementById('minecraft-topic').checked) {
            return "minecraft";
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