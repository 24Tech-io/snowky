
// using native fetch

async function testLogin() {
    const email = "adhithiyanmaliackal@gmail.com";
    const body = {
        email: email,
        password: "@Adhi1234"
    };

    console.log(`Attempting to login: ${email}`);

    try {
        const res = await fetch("http://localhost:3000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        console.log(`Status: ${res.status}`);
        console.log(`Response:`, data);
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

testLogin();
