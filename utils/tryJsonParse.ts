export default function tryJsonParse(stringJson, flag = 'object') {
	let result;
	let check;
	try {
		result = JSON.parse(stringJson);
	} catch (err) {
		return false;
	}
	if (flag === 'array') {
		check = result instanceof Array
		if (!check) {
			return false;
		}
	} else if (flag === 'string') {
		check = typeof result

		if (check !== 'string') {
			return false;
		}
	} else if (flag === "date") {
		check = result instanceof Date;
		if (!check) {
			return false;
		}
	}
	return result
}