import config from './config';

export default function permutations(letters: string, trie: Record<string, any>, opts = {
	type: 'anagram',
}) {
	if (typeof letters !== 'string') {
		throw (`Permutations expects string letters, received ${typeof letters}`);
	}

	const words: string[] = [];

	const permute = (word: string, node: Record<string, any>, prefix = '') => {
		const wordIsEmpty = word.length === 0;
		const wordFound = words.includes(prefix);
		const endWordFound = node[config.END_WORD] === 1;

		if (wordIsEmpty && endWordFound && !wordFound) {
			words.push(prefix);
		}

		for (let i = 0, len = word.length; i < len; i++) {
			const letter = word[i];

			if (opts.type === 'sub-anagram') {
				if (endWordFound && !words.includes(prefix)) {
					words.push(prefix);
				}
			}

			if (node[letter]) {
				const remaining = word.substring(0, i) + word.substring(i + 1, len);
				permute(remaining, node[letter], prefix + letter, /* words */);
			}
		}

		return words.sort();
	};

	return permute(letters, trie);
};
