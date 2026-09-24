/**
Author: vincent Bourgmayer @ 2026
**/

export function LoginForm({ onSubmit, onSucceed } = {}) {
    const form = document.createElement("form");

    form.innerHTML = `
        <h1>Connexion à Kiwi TCMS</h1>

        <div class="form-field">
            <label for="kiwi-server">
                Serveur
            </label>

            <input
                id="kiwi-server"
                name="server"
                type="url"
				value="https://kiwi.orne.fr"
                placeholder="https://kiwi.orne.fr"
                required
            >
        </div>

        <div class="form-field">
            <label for="kiwi-username">
                Nom d'utilisateur
            </label>

            <input
                id="kiwi-username"
                name="username"
                type="text"
                autocomplete="username"
                required
            >
        </div>

        <div class="form-field">
            <label for="kiwi-password">
                Mot de passe
            </label>

            <input
                id="kiwi-password"
                name="password"
                type="password"
                autocomplete="current-password"
                required
            >
        </div>

        <button type="submit">
            Se connecter
        </button>
    `;

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const formData = new FormData(form);

        const credentials = {
            server: formData.get("server"),
            username: formData.get("username"),
            password: formData.get("password")
        };

        if (onSubmit) {
            onSubmit(credentials).then(() => {
				console.log("JSON RPC AUTH SUCCEED ");
				onSucceed()
			});
        }
    });

    return form;
}