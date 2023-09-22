import utils from "./utils";

export default function checkPrefix(prefixNode: Record<string, any>, prefix: string) {
	const input = prefix.toLowerCase().split("");
	const prefixFound = input.every((letter: string | number, index: any) => {
		if (!prefixNode[letter]) {
			return false;
		}
		return (prefixNode = prefixNode[letter]);
	});

	return {
		prefixFound,
		prefixNode,
	};
}

