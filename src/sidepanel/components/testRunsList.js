/**
Author: vincent Bourgmayer @ 2026
**/
export function TestRunsList({ testPlanId, fetchTestRuns, onSelect } = {}) {
    const element = document.createElement("section");

    element.innerHTML = `
        <h1>Executions du plan de test</h1>
        <p class="subtitle">
            Sélectionnez une execution du plan de test.
        </p>

        <div class="testRuns-list"></div>
    `;

    const list = element.querySelector(".testRuns-list");

	if (fetchTestRuns && testPlanId && onSelect) {
		
		fetchTestRuns(testPlanId).then((result) => {
			
			console.log("list test runs succeed ");
			
			result.forEach((testRun) => {
				const item = document.createElement("button");

				item.className = "testRun-item";

				item.innerHTML = `
					<strong>${testRun.summary}</strong><br/>
					<span>${testRun.planned_start.slice(0, -9)} - ${testRun.planned_stop.slice(0, -9)}</span>
				`;

				item.addEventListener("click", () => {
					onSelect(testRun.id)
				});

				list.appendChild(item);
			});
		});
	}
	
    return element;
}