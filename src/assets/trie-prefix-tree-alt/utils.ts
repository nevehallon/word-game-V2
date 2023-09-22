export default {
	objectCopy(obj: Record<string, any>): Record<string, any> {
		if (typeof obj === 'undefined') {
			return {};
		}
		return JSON.parse(JSON.stringify(obj));
	},

	stringify(obj: Record<string, any>, spacer = 2) {
		if (typeof obj === 'undefined') {
			return '';
		}
		return JSON.stringify(obj, null, spacer);
	},
};
