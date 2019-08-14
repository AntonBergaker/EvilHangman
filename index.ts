async function requestData(url: string) : Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const request = new XMLHttpRequest();
        
        request.onreadystatechange = x=> {
            if (request.readyState == 4) {
                resolve(request.response);
            }
        }
        
        request.open("GET", url);
        request.send();
    })
}

function randomRange(min: number, max: number):number {
    return min + Math.floor(Math.random() * (1+max-min));
}

const wordListByLength : string[][] = [[], [], [], [], [], [], [], [], [], [], [], []];
let availableWordList : string[];
let wordLetters : Map<number, HTMLDivElement>;
let wordLength : number;
let alphabetLetters : Map<string, HTMLDivElement>;
let failedTimes = 0;

async function setup() {
    const globalWordList = (await requestData("wordlist.txt")).split("\n");

    for (let word of globalWordList) {
        const words =  wordListByLength[word.length];
        words.push(word.toUpperCase());
    }

    initWord();
}

function initWord() {
    const alphabet = document.getElementById("alphabetContainer");
    alphabetLetters = new Map();

    // Create the letters
    for (let i=1; i<=26; i++) {
        const char = String.fromCharCode(i+64);
        const div = document.createElement("div");
        div.classList.add("alphabetLetter");
        div.innerText = char;
        div.addEventListener("click", function() {
            pickLetter(this.innerText);
        });
        alphabet.appendChild(div);
        alphabetLetters.set(char, div);
    }

    // Choose a length
    wordLength = randomRange(5, 9);

    // Copy the words
    availableWordList = wordListByLength[wordLength].slice();

    const word = document.getElementById("wordContainer");

    wordLetters = new Map();
    // Create the blanks
    console.log(wordLength);
    for (let i=0; i<wordLength; i++ ) {
        const div = document.createElement("div");
        div.classList.add("wordLetter")
        div.innerText = "_";
        word.appendChild(div);
        wordLetters.set(i, div);
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

function pickLetter(letter: string) {
    const div = alphabetLetters.get(letter);
    console.log(letter);
    div.style["color"] = "#999";
    div.style["cursor"] = "default";

    // Choose a good configuration
    let bestConfiguration = "";
    let bestCount = -1;

    const testedConfigurations = new Set<string>();
    const regEx = new RegExp("[^" + letter + "]", "g");

    for (const word of availableWordList) {
        // Replace all letters that's not the selected letter with _
        const processedWord = word.replace(regEx, "_");

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
            wordLetters.get(i).innerText = bestConfiguration.charAt(i);
        }
    }

    // If you failed
    if (bestConfiguration.includes(letter) == false) {
        failedTimes++;
        document.getElementById("image")["src"] = "img/" + failedTimes + ".png";
    }
}

setup();