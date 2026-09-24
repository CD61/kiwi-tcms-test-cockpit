/**
Author: vincent Bourgmayer @ 2026
**/

export function TestCaseList({ fetchTestCases, onSelect } = {}) {
    const element = document.createElement("section");

    element.innerHTML = `
        <h1>Cas de test</h1>
        <p class="subtitle">
            Sélectionnez le cas de test à exécuter.
        </p>

        <div id="testCases-list"></div>`;


	if (fetchTestCases) {
		fetchTestCases().then((result) => { 
			console.log("list test cases succeed ");
			
			const grid = new gridjs.Grid({
				columns: [
					{
						name: "id",
						data: row => row.id,
						hidden: true
					},
					{ 
						name: "Libellé",
						data: row => row.summary
					},
					{ 
						name: "Priorité",
						data: row => row.priority__value
					}
				],
				search: true,
				data: result
			}).render(element.querySelector("#testCases-list"));
		
			grid.on("rowClick", (...args) => onSelect(args));
		});
	}

    return element;
}