// import create from "./create";
import append from "./append";
import checkPrefix from "./checkPrefix";
import recursePrefix from "./recursePrefix";
import recurseRandomWord from "./recurseRandomWord";
import utils from "./utils";
import config from "./config";
import permutations from "./permutations";
import localforage from "localforage";

const PERMS_MIN_LEN = config.PERMS_MIN_LEN;

let trie: Record<string, any>;
let myTrie;
let myReverseTrie: Record<string, any>;

async function getTrie() {
	try {
		myTrie = JSON.parse(await localforage.getItem("wordTrieStr") as string);
		trie = myTrie;
		myReverseTrie = JSON.parse(await localforage.getItem("reverseWordTrieStr") as string);
		return true;
	} catch (error) {
		console.error(error);
		return false;
	}
}
getTrie();

// console.log(myTrie);
// console.log(myReverseTrie);

function Trie(input?: string[]) {
	// if(!Array.isArray(input)) {
	//   throw(`Expected parameter Array, received ${typeof input}`);
	// }
	// let trie = create([...input]);

	return {
		/**
		 * Get the generated raw trie object
		 */
		tree() {
			return trie;
		},

		/**
		 * Get a string representation of the trie
		 */
		dump(spacer = 0) {
			return utils.stringify(trie, spacer);
		},

		/**
		 * Add a new word to the trie
		 */
		addWord(word: string) {
			if (typeof word !== "string" || word === "") {
				throw `Expected parameter string, received ${typeof word}`;
			}

			const reducer = (...params: any[]) => {
				// @ts-expect-error // ! A spread argument must either have a tuple type or be passed to a rest parameter.ts(2556)
				return append(...params);
			};

			const input = word.toLowerCase().split("");
			input.reduce(reducer, trie);

			return this;
		},

		/**
		 * Remove an existing word from the trie
		 */
		removeWord(word: string) {
			if (typeof word !== "string" || word === "") {
				throw `Expected parameter string, received ${typeof word}`;
			}

			const { prefixFound, prefixNode } = checkPrefix(trie, word);

			if (prefixFound) {
				delete prefixNode[config.END_WORD];
			}

			return this;
		},

		/**
		 * Check a prefix is valid
		 * @returns Boolean
		 */
		isPrefix(prefix: string) {
			if (typeof prefix !== "string") {
				throw `Expected string prefix, received ${typeof prefix}`;
			}

			const { prefixFound } = checkPrefix(trie, prefix);

			return prefixFound;
		},

		/**
		 * Check a suffix is valid
		 * @returns Boolean
		 */
		isSuffix(suffix: string) {
			if (typeof suffix !== "string") {
				throw `Expected string suffix, received ${typeof suffix}`;
			}

			const { prefixFound } = checkPrefix(myReverseTrie, suffix); // prefixFound here actually refers to the suffix found

			return prefixFound;
		},

		/**
		 * Get a list of all words in the trie with the given prefix
		 * @returns Array
		 */
		getPrefix(strPrefix: string | any[], sorted = true) {
			if (typeof strPrefix !== "string") {
				throw `Expected string prefix, received ${typeof strPrefix}`;
			}

			if (typeof sorted !== "boolean") {
				throw `Expected sort parameter as boolean, received ${typeof sorted}`;
			}

			if (!this.isPrefix(strPrefix)) {
				return [];
			}

			const prefixNode = strPrefix.length
				? checkPrefix(trie, strPrefix).prefixNode
				: trie;

			return recursePrefix(prefixNode, strPrefix, sorted);
		},

		/**
		 * Get a random word in the trie with the given prefix
		 * @returns Array
		 */
		getRandomWordWithPrefix(strPrefix: any) {
			if (typeof strPrefix !== "string") {
				throw `Expected string prefix, received ${typeof strPrefix}`;
			}

			if (!this.isPrefix(strPrefix)) {
				return "";
			}

			const { prefixNode } = checkPrefix(trie, strPrefix);

			return recurseRandomWord(prefixNode, strPrefix);
		},

		/**
		 * Count the number of words with the given prefixSearch
		 * @returns Number
		 */
		countPrefix(strPrefix: any) {
			const prefixes = this.getPrefix(strPrefix);

			return prefixes.length;
		},

		/**
		 * Get all words in the trie
		 * @returns Array
		 */
		getWords(sorted = true) {
			return this.getPrefix("", sorted);
		},

		/**
		 * Check the existence of a word in the trie
		 * @returns Boolean
		 */
		hasWord(word: string) {
			if (typeof word !== "string") {
				throw `Expected string word, received ${typeof word}`;
			}

			const { prefixFound, prefixNode } = checkPrefix(trie, word);

			if (prefixFound) {
				return prefixNode[config.END_WORD] === 1;
			}

			return false;
		},

		/**
		 * Get a list of valid anagrams that can be made from the given letters
		 * @returns Array
		 */
		getAnagrams(letters: string | any[]) {
			if (typeof letters !== "string") {
				throw `Anagrams expected string letters, received ${typeof letters}`;
			}

			if (letters.length < PERMS_MIN_LEN) {
				throw `getAnagrams expects at least ${PERMS_MIN_LEN} letters`;
			}

			return permutations(letters, trie, {
				type: "anagram",
			});
		},

		/**
		 * Get a list of all sub-anagrams that can be made from the given letters
		 * @returns Array
		 */
		getSubAnagrams(letters: string | any[]) {
			if (typeof letters !== "string") {
				throw `Expected string letters, received ${typeof letters}`;
			}

			if (letters.length < PERMS_MIN_LEN) {
				throw `getSubAnagrams expects at least ${PERMS_MIN_LEN} letters`;
			}

			return permutations(letters, trie, {
				type: "sub-anagram",
			});
		},
	};
}

export { Trie, getTrie };
