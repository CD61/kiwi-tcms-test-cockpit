/**
Author: vincent Bourgmayer @ 2026
**/
export function TestPlansList({fetchTestPlans, onSelect } = {}) {
    const element = document.createElement("section");

    element.innerHTML = `
        <h1>Plans de test</h1>
        <p class="subtitle">
            Sélectionnez un plan de test.
        </p>

        <div class="testPlans-list"></div>
    `;

	if (fetchTestPlans && onSelect) {
		const list = element.querySelector(".testPlans-list");
		
		fetchTestPlans().then((result) => {
			console.log("Fetch test plans succeed ");
			result.forEach((testPlan) => {
				const item = document.createElement("button");

				item.className = "testPlan-item";

				item.innerHTML = `
					<strong>${testPlan.name}</strong>
					<span>${testPlan.text}</span>
					<br/><span>${testPlan.product__name}</span>
				`;

				item.addEventListener("click", () => {
					onSelect(testPlan.id);
				});

				list.appendChild(item);
			});
		});
	}

    return element;
}