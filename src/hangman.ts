export enum HangmanPlaceLetterReply {
    FoundLetter,
    NoLetter,
    AlreadyUsedLetter
}

export interface HangmanHistoryEntry {
    letter: string,
    wasCorrect: boolean,
    sequenceSoFar : string,
    entriesLeftCount : number,
    entriesLeft : string[]
}

export class Hangman {
    readonly wordListByLength : Map<number, string[]>;
    readonly usedLetters : Set<string>;
    availableWordList : string[] = [];
    wordLength : number = 0;
    failedTimes : number = 0;
    sequence : string;

    private history : HangmanHistoryEntry[] = []

    public constructor() {
        this.wordListByLength = new Map();
        this.usedLetters = new Set();
        this.sequence = "";
    }

    public addWords(words: string[]) {
        for (const word of words) {
            const wordLength = word.length;
            let array = this.wordListByLength.get(wordLength);
            if (array == undefined) {
                array = [];
                this.wordListByLength.set(wordLength, array);
            }

            array.push(word.toUpperCase());
        }
    }

    public start(wordLength : number) {
        // Choose a length
        this.wordLength = wordLength;

        this.sequence = "_".repeat(wordLength);
        const array = this.wordListByLength.get(this.wordLength);

        if (array == undefined) {
            throw new Error("No words for the selected range");
        }

        // Copy the words
        this.usedLetters.clear();
        this.availableWordList = array.slice();
        this.failedTimes = 0;
        this.history = [];
    }

    canMatch(configuration: string, word: string, letter:string) {
        let possible = true;
        for (let i=0; i < this.wordLength; i++) {
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


    stripLetters(word: string, letter: string) : string {
        return word
          .split('')
          .map(x => {
            return x === letter ? letter : '_'
          })
          .join('')
    }

    randomElementInArray<T>(array: T[]) : T {
        return array[Math.floor(Math.random() * array.length)];
    }

    getPossibleWord() : string {
        return this.randomElementInArray(this.availableWordList);
    }

    hasWon() : boolean {
        return this.sequence.includes('_') == false;
    }

    pickLetter(letter: string) : HangmanPlaceLetterReply {
        if (this.usedLetters.has(letter)) {
            return HangmanPlaceLetterReply.AlreadyUsedLetter;
        }

        this.usedLetters.add(letter);

        // Choose a good configuration
        let bestConfiguration = "";
        let bestCount = -1;
        let bestIsFail = true;

        const testedConfigurations = new Set<string>();

        for (const word of this.availableWordList) {
            // Replace all letters that's not the selected letter with _
            const processedWord = this.stripLetters(word, letter);

            // Do nothing if we already tested this configuration
            if (testedConfigurations.has(processedWord)) {
                continue;
            }
            
            testedConfigurations.add(processedWord);

            let count = 0;

            for (const word2 of this.availableWordList) {
                if (this.canMatch(processedWord, word2, letter)) {
                    count++;
                }
            }

            let fail = false;

            // Double if it's failing cuz we love failing
            if (processedWord.includes(letter) == false) {
                count*=2;
                fail = true;
            }

            if (count > bestCount) {
                bestConfiguration = processedWord;
                bestCount = count;
                bestIsFail = fail;
            } 
        }

        // Begin purging

        let newList : string[] = [];

        for (const word2 of this.availableWordList) {
            if (this.canMatch(bestConfiguration, word2, letter)) {
                newList.push(word2);
            }
        }

        this.availableWordList = newList;

        console.log("Best configuration was: " + bestConfiguration + " with " + bestCount + " points")
        console.log(this.availableWordList);

        // Select 50 words and push them into history bois
        this.history.push( {
            letter: letter,
            wasCorrect: !bestIsFail,
            sequenceSoFar: this.sequence,
            entriesLeftCount: this.availableWordList.length,
            entriesLeft: this.availableWordList.slice(0, Math.min(50, this.availableWordList.length))
        });

        const letterArray = this.sequence.split('');
        for (let i=0; i < this.wordLength; i++) {
            if (bestConfiguration.charAt(i) == letter) {
                letterArray[i] = letter;
            }
        }
        this.sequence = letterArray.join('');

        if (bestIsFail) {
            this.failedTimes++;
            return HangmanPlaceLetterReply.NoLetter;
        }
        return HangmanPlaceLetterReply.FoundLetter;
    }

    getHistory() : HangmanHistoryEntry[] {
        return this.history;
    }
}