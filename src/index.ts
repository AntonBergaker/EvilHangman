import {Hangman, HangmanPlaceLetterReply, HangmanHistoryEntry} from "./hangman";

enum GuessMode {
    Guess8,
    Guess13
}

let difficulty : GuessMode = GuessMode.Guess8;
let failed = false;
let won = false;
let wordLength : number = 0;
const wordLetters : Map<number, HTMLSpanElement> = new Map();
const alphabetLetters : Map<string, HTMLSpanElement> = new Map();
const hangman = new Hangman();

const guess8Images = [
    "./img/8guess/0.png",
    "./img/8guess/1.png",
    "./img/8guess/2.png",
    "./img/8guess/3.png",
    "./img/8guess/4.png",
    "./img/8guess/5.png",
    "./img/8guess/6.png",
    "./img/8guess/7.png",
    "./img/8guess/8.png",
];

const guess13Images = [
    "./img/13guess/0.png",
    "./img/13guess/1.png",
    "./img/13guess/2.png",
    "./img/13guess/3.png",
    "./img/13guess/4.png",
    "./img/13guess/5.png",
    "./img/13guess/6.png",
    "./img/13guess/7.png",
    "./img/13guess/8.png",
    "./img/13guess/9.png",
    "./img/13guess/10.png",
    "./img/13guess/11.png",
    "./img/13guess/12.png",
    "./img/13guess/13.png",
];


function randomRange(min: number, max: number):number {
    return min + Math.floor(Math.random() * (1+max-min));
}

function removeAllDomChildren(element : HTMLElement) {
    while(element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

function addClickFunction(element : HTMLElement | null | string, func : (this : HTMLElement, ev : MouseEvent) => any ) {
    let dom : HTMLElement | null;
    if (typeof element == "string") {
        dom = document.getElementById(element);
    } else {
        dom = element as HTMLElement;
    }
    if (dom instanceof HTMLElement) {
        dom.addEventListener("click", func);
    }
}

function getGuessCount() {
    return difficulty == GuessMode.Guess13 ? 13 : 8;
}

function playAgain() {
    wordLength = randomRange(4, 8);
    hangman.start(wordLength);
    setupBoard(wordLength);
    showDifficulty();
    won = false;
    failed = false;
}

function populateAiHistory() {
    const mainDom = document.getElementById("aiEntries");

    if (mainDom == null) {
        return;
    }

    removeAllDomChildren(mainDom);

    const history = hangman.getHistory();

    for (const entry of history) {
        const element = document.createElement("div");
        element.classList.add("aiEntry");
        
        const paragraph = document.createElement("p");
        paragraph.innerText = entry.wasCorrect ? `Best option is to grant letter ${entry.letter}` : `Enough possible words left to not place letter ${entry.letter}`;
        element.appendChild(paragraph);

        const paragraph2 = document.createElement("p");
        paragraph2.innerHTML = `Remaning possible words matching ${entry.sequenceSoFar.split('').join(' ')}: <span>${entry.entriesLeftCount}</span>`
        element.appendChild(paragraph2);

        const paragraph3 = document.createElement("p");
        paragraph3.classList.add("wordsLeft");
        paragraph3.innerText = entry.entriesLeft.join(", ");
        if (entry.entriesLeft.length != entry.entriesLeftCount) {
            paragraph3.innerText += ", ...";
        }

        element.appendChild(paragraph3);

        mainDom.appendChild(element);
    }
}

function showOverlay() {
    document.getElementById("difficultyOverlay")!.style.visibility = "visible";
    document.getElementById("difficultyOverlay")!.style.display = "block";
}
function hideOverlay() {
    document.getElementById("difficultyOverlay")!.style.visibility = "hidden";
    document.getElementById("difficultyOverlay")!.style.display = "none";
}
function showDifficulty() {
    hideAiHistory();
    showOverlay();
    document.getElementById("difficultyPopup")!.style.visibility = "visible";
    document.getElementById("difficultyPopup")!.style.display = "block";
}
function hideDifficulty() {
    hideOverlay();
    document.getElementById("difficultyPopup")!.style.visibility = "hidden";
    document.getElementById("difficultyPopup")!.style.display = "none";
}
function showAiHistory() {
    hideDifficulty();
    showOverlay();

    document.getElementById("aiPopup")!.style.visibility = "visible";
    document.getElementById("aiPopup")!.style.display = "block";
    populateAiHistory();
}
function hideAiHistory() {
    hideOverlay();
    document.getElementById("aiPopup")!.style.visibility = "hidden";
    document.getElementById("aiPopup")!.style.display = "none";
}

function showOptions() {
    document.getElementById("optionsContainer")!.style.visibility = "visible";
}
function hideOptions() {
    document.getElementById("optionsContainer")!.style.visibility = "hidden";
}

function selectDifficulty(difficultyString : string) {
    
    if (difficultyString == "difficultySelection13") {
        difficulty = GuessMode.Guess13;
    } else {
        difficulty = GuessMode.Guess8;
    }

    hangman.start(wordLength);
    hideDifficulty();
    hideOptions();
}

async function setup() {
    const text = await fetch("./wordlist.txt").then(x => x.text());
    hangman.addWords(text.split("\n"));
    if (wordLength == 0) {
        wordLength = randomRange(4, 8)
    }

    const elements = document.getElementsByClassName("difficultySelection");

    for (let i=0;i < elements.length; i++) {
        const element = elements.item(i) as HTMLElement;
        addClickFunction(element, function() {
            selectDifficulty(this.id);
        })
    }

    addClickFunction("playAgain", playAgain);

    addClickFunction("revealAI", showAiHistory);

    addClickFunction("aiClose", hideAiHistory);

    setupBoard(wordLength);
}

function setupBoard(wordLength:number) {
    const alphabet = document.getElementById("alphabetContainer");
    const word = document.getElementById("wordContainer");

    if (alphabet == undefined || word == undefined) {
        throw new Error("Can't find dom");
    } 

    removeAllDomChildren(alphabet);
    alphabetLetters.clear();

    // Create the letters
    for (let i=1; i<=26; i++) {
        const char = String.fromCharCode(i+64);
        const span = document.createElement("span");
        span.classList.add("alphabetLetter");
        span.innerText = char;
        span.addEventListener("click", function() {
            pickLetter(this.innerText);
        });
        alphabet.appendChild(span);
        alphabetLetters.set(char, span);
    }

    removeAllDomChildren(word);
    wordLetters.clear();
    // Create the blanks
    for (let i=0; i < wordLength; i++ ) {
        const span = document.createElement("span");
        span.classList.add("wordLetter")
        span.innerText = "_";
        word.appendChild(span);
        wordLetters.set(i, span);
    }

    updateImage();
}

function updateImage() {
    const image = document.getElementById("image");
    if (image instanceof HTMLImageElement) {
        image.src = (difficulty == GuessMode.Guess13 ? guess13Images : guess8Images)[hangman.failedTimes];
    }
}

function pickLetter(letter: string) {

    if (failed || won) {
        return;
    }

    const div = alphabetLetters.get(letter);
    
    if (div == undefined) {
        return;
    }

    const response = hangman.pickLetter(letter);

    if (response == HangmanPlaceLetterReply.AlreadyUsedLetter) {
        return;
    }

    div.style["color"] = "#999";
    div.style["cursor"] = "default";


    if (response == HangmanPlaceLetterReply.FoundLetter) {
        for (let i=0;i<hangman.sequence.length;i++) {
            const letter = wordLetters.get(i);
            if (letter) {
                letter.innerText = hangman.sequence.charAt(i);
            }
        
        }

        if (hangman.hasWon()) {
            won = true;
            showOptions();
        }

    } else {
        updateImage();

        if (hangman.failedTimes >= getGuessCount()) {
            failed = true;
            const word = hangman.getPossibleWord();
            for (let i=0;i<word.length; i++) {
                const letterDom = wordLetters.get(i);
                if (letterDom && letterDom.innerText == "_") {
                    letterDom.innerText = word.charAt(i);
                    letterDom.style.color = "red";
                }
            }

            showOptions();
        }
    }
}

setup();