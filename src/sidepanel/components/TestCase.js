/**
Author: vincent Bourgmayer @ 2026
**/


function decodeHtmlEntities(text) {
    return new DOMParser()
        .parseFromString(text, "text/html")
        .documentElement.textContent;
}

export function TestCase({ testCaseId, testExecutionId, fetchTestCase, onSubmit } = {}) {


	const element = document.createElement("section");
	element.class = "test-case-run"
	element.innerHTML = `

    <header class="test-case-header">
        <button
            type="button"
            class="back-button"
            id="back-button">
            ← Retour
        </button>

        <h1 id="testTitle">Connexion avec login et mot de passe</h1>

        <p id="testPriority">
            P1
        </p>
    </header>


    <article class="test-case-description">

        <h2>Description</h2>

        <div>
			<p id="testContent">
			</p>
        </div>

    </article>
	<div class="test-case-result-form"></div>
	`;


    const form = document.createElement("form");
    form.innerHTML = `
        <fieldset>
            <legend>Résultat du test</legend>

            <div class="result-choice">

                <label class="result-option result-pass greenFlag">
                    <input
                        type="radio"
                        name="status"
                        value="4"
                        required>

                    <span>✓ PASS</span>
                </label>

                <label class="result-option result-fail redFlag">
                    <input
                        type="radio"
                        name="status"
                        value="5">

                    <span>✕ FAIL</span>
                </label>
            </div>
        </fieldset>

        <div class="form-field">
            <label for="test-case-comment">
                Commentaire
            </label>

            <textarea
                id="test-case-comment"
                name="comment"
                rows="5"
                placeholder="Ajouter un commentaire..."></textarea>

        </div>


        <div class="form-field">

            <label for="test-case-attachment">
                Pièce jointe
            </label>

            <input
                id="test-case-attachment"
                name="attachment"
                type="file"
                accept="image/*">

            <small>
                Vous pouvez joindre une capture d'écran.
            </small>

        </div>


        <div class="failure-option">

            <label for="createBug">Créer une anomalie</label>
			<input
				id="createBug"
				type="checkbox"
				name="createBug"
				value="true">
        </div>


        <div class="form-actions">

            <button
                type="button"
                id="cancel-button">
                Annuler
            </button>

            <button
                type="submit"
                class="primary-button">
                Valider le résultat
            </button>

        </div>
    `;


	
	if (testCaseId && testExecutionId && fetchTestCase && onSubmit) {
		fetchTestCase(testCaseId).then((result) => {
			const testCase = result[0];
			
			console.log(testCase);
			//TODO remplacer la maj du formulaire par sa création direct. sinon il y a un delta avant l'affichage des bonnes valeurs
			element.querySelector("#testTitle").innerText = decodeHtmlEntities(testCase.summary);
			element.querySelector("#testPriority").innerText = "P" + testCase.priority;
			element.querySelector("#testContent").innerText = decodeHtmlEntities(testCase.text);
		});
		
		
		
		form.addEventListener("submit", (event) => {
			event.preventDefault();
			let status = element.querySelector('input[name="status"]:checked').value;
			let comment = element.querySelector('#test-case-comment').value;
			onSubmit(testExecutionId, {
				"status": status,
			}, comment);
		});
	}


	element.querySelector(".test-case-result-form").appendChild(form);

    return element;
}