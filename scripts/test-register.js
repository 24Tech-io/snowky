
// using native fetch

async function testRegister() {
    const email = "adhithiyanmaliackal@gmail.com";
    const body = {
        name: "Adhi",
        email: email,
        password: "@Adhi1234"
    };

    console.log(`Attempting to register: ${email}`);

    try {
        const res = await fetch("http://localhost:3000/api/auth/register", {
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

testRegister();
