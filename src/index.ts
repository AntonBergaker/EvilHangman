function randomRange(min: number, max: number):number {
    return min + Math.floor(Math.random() * (1+max-min));
}

const wordListByLength : string[][] = [[], [], [], [], [], [], [], [], [], [], [], []];
let availableWordList : string[];
const wordLetters : Map<number, HTMLSpanElement> = new Map();
let wordLength : number;
const alphabetLetters : Map<string, HTMLSpanElement> = new Map();
let failedTimes = 0;

async function setup() {
    const text = await fetch("./wordlist.txt").then(x => x.text())
    const globalWordList = text.split("\n");

    for (let word of globalWordList) {
        const words = wordListByLength[word.length];
        words.push(word.toUpperCase());
    }

    initWord();
}

function initWord() {
    const alphabet = document.getElementById("alphabetContainer");
    const word = document.getElementById("wordContainer");

    alphabetLetters.clear();

    if (alphabet == undefined || word == undefined) {
        throw new Error("Can't find dom");
    } 

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

    // Choose a length
    wordLength = randomRange(5, 9);

    // Copy the words
    availableWordList = wordListByLength[wordLength].slice();

    wordLetters.clear();
    // Create the blanks
    for (let i=0; i<wordLength; i++ ) {
        const span = document.createElement("span");
        span.classList.add("wordLetter")
        span.innerText = "_";
        word.appendChild(span);
        wordLetters.set(i, span);
    }
}

function canMatch(configuration: string, word: string, letter:string) {
    let possible = true;
    for (let i=0; i < wordLength; i++) {
        const configChar = configuration.charAt(i);
        const wordChar = word.charAt(i);

        if (configChar == letter) {
            if (wordChar != letter) {
                possible = false;
                break;
            }
        }

        if (wordChar == letter) {
            if (configChar != letter) {
                possible = false;
                break;
            }
        }
    }
    return possible;
}

function stripLetters(word: string, letter: string) : string {
    return word
      .split('')
      .map(x => {
        return x === letter ? letter : '_'
      })
      .join('')
}

function pickLetter(letter: string) {
    const div = alphabetLetters.get(letter);
    
    if (div == undefined) {
        return;
    }

    div.style["color"] = "#999";
    div.style["cursor"] = "default";

    // Choose a good configuration
    let bestConfiguration = "";
    let bestCount = -1;

    const testedConfigurations = new Set<string>();

    for (const word of availableWordList) {
        // Replace all letters that's not the selected letter with _
        const processedWord = stripLetters(word, letter);

        // Do nothing if we already tested this configuration
        if (testedConfigurations.has(processedWord)) {
            continue;
        }
        
        testedConfigurations.add(processedWord);

        let count = 0;

        for (const word2 of availableWordList) {
            if (canMatch(processedWord, word2, letter)) {
                count++;
            }
        }

        // Double if it's failing cuz we love failing
        if (processedWord.includes(letter) == false) {
            count*=2;
        }

        if (count > bestCount) {
            bestConfiguration = processedWord;
            bestCount = count;
        } 
    }

    // Begin purgin

    let newList : string[] = [];

    for (const word2 of availableWordList) {
        if (canMatch(bestConfiguration, word2, letter)) {
            newList.push(word2);
        }
    }

    availableWordList = newList;

    console.log("Best configuration was: " + bestConfiguration + " with " + bestCount + " points")
    console.log(availableWordList);

    for (let i=0;i<wordLength;i++) {
        if (bestConfiguration.charAt(i) != "_") {
            const letter = wordLetters.get(i);
            if (letter) {
                letter.innerText = bestConfiguration.charAt(i);
            }
        }
    }

    // If you failed
    if (bestConfiguration.includes(letter) == false) {
        failedTimes++;
        const image = document.getElementById("image");
        if (image instanceof HTMLImageElement) {
            image.src = `img/${failedTimes}.png`;
        }
    }
}

setup();