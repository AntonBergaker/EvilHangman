
export class HangMan {
    readonly wordListByLength : Map<number, string[]>;
    availableWordList : string[] = [];
    wordLength : number = 0;
    failedTimes : number = 0;

    private randomRange(min: number, max: number):number {
        return min + Math.floor(Math.random() * (1+max-min));
    }

    public constructor() {
        this.wordListByLength = new Map();
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

    private clear() {
        this.failedTimes = 0;
    }

    public start() {
        // Choose a length
        this.wordLength = this.randomRange(5, 9);

        const array = this.wordListByLength.get(this.wordLength);

        if (array == undefined) {
            throw new Error("No words for the selected range");
        }

        // Copy the words
        this.availableWordList = array.slice();
        this.failedTimes = 0;
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


    pickLetter(letter: string) : string | null {
            
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

        if (bestIsFail) {
            this.failedTimes++;
        }

        return bestIsFail ? null : bestConfiguration;
    }
}