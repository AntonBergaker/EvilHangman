import {HangMan} from "./hangman";


const wordLetters : Map<number, HTMLSpanElement> = new Map();
const alphabetLetters : Map<string, HTMLSpanElement> = new Map();
const hangman = new HangMan();

function removeAllDomChildren(element : HTMLElement) {
    while(element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

async function setup() {
    const text = await fetch("./wordlist.txt").then(x => x.text());
    hangman.addWords(text.split("\n"));

    hangman.start();

    setupBoard(hangman.wordLength);
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

    wordLetters.clear();
    // Create the blanks
    for (let i=0; i < wordLength; i++ ) {
        const span = document.createElement("span");
        span.classList.add("wordLetter")
        span.innerText = "_";
        word.appendChild(span);
        wordLetters.set(i, span);
    }
}

function pickLetter(letter: string) {
    const div = alphabetLetters.get(letter);
    
    if (div == undefined) {
        return;
    }

    div.style["color"] = "#999";
    div.style["cursor"] = "default";

    const success = hangman.pickLetter(letter);

    if (success != null) {
        for (let i=0;i<success.length;i++) {
            if (success.charAt(i) != "_") {
                const letter = wordLetters.get(i);
                if (letter) {
                    letter.innerText = success.charAt(i);
                }
            }
        }
    } else {
        const image = document.getElementById("image");
        if (image instanceof HTMLImageElement) {
            image.src = `./img/guess8/${hangman.failedTimes}.png`;
        }
    }
}

setup();