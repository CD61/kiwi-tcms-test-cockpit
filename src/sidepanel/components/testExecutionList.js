/**
Author: vincent Bourgmayer @ 2026
**/


function decodeHtmlEntities(text) {
    return new DOMParser()
        .parseFromString(text, "text/html")
        .documentElement.textContent;
}

export function TestExecutionList({ TestRunId, fetchTestExecution, onSelect } = {}) {
    const element = document.createElement("section");

    element.innerHTML = `
        <h1>Cas de test</h1>
        <p class="subtitle">
            Sélectionnez le cas de test à exécuter.
        </p>

        <div id="testCases-list"></div>`;


	if (TestRunId && fetchTestExecution && onSelect) {
		fetchTestExecution(TestRunId).then((result) => { 
			console.log("list test cases succeed ");
			
			const grid = new gridjs.Grid({
				columns: [
					{
						name: "id",
						data: row => row.id,
						hidden: true
					},
					{
						name: "caseId",
						data: row => row.case,
						hidden: true
					},
					{ 
						name: "Libellé",
						data: row => decodeHtmlEntities(row.case__summary) // for test case execution
						//data: row => row.summary // for test case
					},
					{ 
						name: "Status",
						data: row => row.status__name
						//name: "Priorité", //for test case
						//data: row => row.priority__value // for test case
					}
				],
				search: true,
				data: result
			}).render(element.querySelector("#testCases-list"));
		
			grid.on("rowClick", (...args) => onSelect(args, ));
		});
	}

    return element;
}