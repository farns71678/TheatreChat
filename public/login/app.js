const formErr = document.getElementById("password-err");

document.getElementById("login-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
        formErr.innerText = "";
        const password = document.getElementById("password-input").value;
        const res = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json; charset=UTF-8'
            },
            body: JSON.stringify({ password })
        });

        if (!res.ok) {
            const data = await res.json();
            if (data.error) {
                formErr.innerText = data.error;
            }
            else formErr.innerText = "Unable to login";
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const durl = params.get("durl");
        if (durl) {
            location.assign(createRelativePath("/" + durl));
        }
        else {
            location.assign(createRelativePath("/config"));
        }
    }
    catch (error) {
        console.log(`An error occured logging in: ${error}`);
        formErr.innerText = "Unable to log in";
    }
});

function createRelativePath(path) {
    return new URL(path, window.location).href;
}