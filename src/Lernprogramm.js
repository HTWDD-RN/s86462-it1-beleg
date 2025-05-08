"use strict";

//let p, v, m;
document.addEventListener('DOMContentLoaded', function () {
    let m = new Model();
    let p = new Presenter();
    let v = new View(p);
    p.setModelAndView(m, v);
    //p.setTask();
});

// ############# Model ###########################################################################
class Model {
    constructor() { 
        this.maxQuestions = 999999;
    }

    // Holt eine Frage aus dem Array, zufällig ausgewählt oder vom Server
    // es werden die IDs hardgecodet für jeden Aufgabentyp
    // z.B. 1-5 für Web, 6-10 für Mathe, ...
    async getTask(nr) {
        // lokale Aufgaben
        try{
            const response = await fetch('./questions.json');
            const data = await response.json();
                console.log(data);  // Zeigt die geladenen Daten in der Konsole
                
                const questions = data.web; // TODO: je nach Typ die richtigen Fragen auswählen
                console.log(questions);
                
                // get maxQuestions im Thema
                this.maxQuestions = questions.length;

                // gewünschte Frage laden
                const question = questions[nr];
                console.log("Frage:", question.q);
                console.log("Antworten:", question.a);

                return question; // Aufgabe + Lösungen
            } catch (error) {
                alert("Es muss wegen CORS diese Seite auf einem Server gehostet sein, damit JSON Daten geladen werden können!")
                console.error('Fehler beim Laden der Daten:', error);
                return null; // Fehlerbehandlung
            }
    }

    checkAnswer() {
        // TODO, Server Request schicken mit Antwort
        
    }
}

// ############ Controller: Frage verarbeiten #########################################################
class Presenter {
    constructor() {
        this.questionNr = -1;
        this.question = null;
        this.correctQuestions = 0;
        this.questionAnswered = 0;
    }

    setModelAndView(m, v) {
        this.m = m;
        this.v = v;
    }

     // Holt eine neue Frage aus dem Model und setzt die View
    async setQuestion() {
        this.questionNr++;
        this.questionAnswered = 0;

        console.log(this.questionNr+1 + "/" + this.m.maxQuestions);
        if (this.questionNr+1 > this.m.maxQuestions){ // alle Fragen beantwortet?
            // Hier eine Übersicht anzeigen (wieviel richtig?)
            View.renderQuestionText("Alle Fragen beantwortet!\nRichtig beantwortet: " + this.correctQuestions + " von " + this.m.maxQuestions);

            // zurücksetzen
            this.questionNr = -1; 
            this.correctQuestions = 0;
            this.questionAnswered = 0;
            return
        }
        this.question = await this.m.getTask(this.questionNr);
        
        View.renderQuestionText(this.question.q);
        View.renderStatsText("Frage: " + (this.questionNr +1) + "/" + this.m.maxQuestions);
        View.renderStatusText("Bitte eine Antwort auswählen!")
    
        for (let i = 0; i < 4; i++) {
            let wert = this.question.a[i];
            let pos = i;
            View.inscribeButtons(i, wert, pos); // Tasten beschriften -> View -> Antworten
        }
    }

    // Prüft die Antwort, aktualisiert Statistik und setzt die View
    checkAnswer(answer) {
        console.log("Lösung: " + this.question.a[0]);
        console.log("Button-Antwort: " + document.querySelectorAll("#answer-btn > *")[answer].textContent);

        if (this.question.a[0] == document.querySelectorAll("#answer-btn > *")[answer].textContent){ // Aufgabentext == Buttontext?
            console.log("Richtige Antwort!");
            View.renderStatusText("Richtige Antwort!");

            if (this.questionAnswered == 0){ // nur zählen falls noch nicht beantwortet
                this.correctQuestions++;
            }
        } 
        else{
            console.log("Falsche Antwort! Richtig wäre " + this.question.a[0]);
            View.renderStatusText("Falsche Antwort! Richtig wäre " + this.question.a[0]);
        }
        this.questionAnswered = 1;
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
    
    checkEvent(event) {
        console.log(event.type);
        if (event.target.nodeName === "BUTTON") {
            this.p.checkAnswer(Number(event.target.attributes.getNamedItem("number").value));
        }
    }

    static renderQuestionText(text) {
        let div = document.getElementById("question");
       // div.textContent = text;
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
        div.textContent = "-> " + text; // Ändert den Textinhalt
    }
}