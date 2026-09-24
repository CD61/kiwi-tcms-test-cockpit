/**
Author: vincent Bourgmayer @ 2026
**/

let rpcId = 0;

export async function rpc(method, params = []) {
	const request = {
		jsonrpc: "2.0",
		method,
		params,
		id: ++rpcId
	};

	const response = await fetch("https://kiwi.orne.fr/json-rpc/", {
		method: "POST",
		headers: {
			"Content-Type": "application/json; charset=UTF-8"
		},
		body: JSON.stringify(request)
	});

	if (!response.ok) {
		throw new Error(`HTTP error ${response.status}`);
	}


	const data = await response.json();

	if (data.error) {
		const error = new Error(data.error.message);
		error.code = data.error.code;
		error.data = data.error.data;
		throw error;
	}

	return data.result;
}
