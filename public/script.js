document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  console.log("Sending:", { name, email, password }); // 👈 DEBUG

  try {
    const res = await fetch("/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    console.log("Response:", data); // 👈 DEBUG
    if (res.ok) {
  alert("Login successful");
  window.location.href = "/dashboard.html";
} else {
  alert(data.message);
}
    }

  } catch (err) {
    console.error("ERROR:", err);
    alert("Something went wrong");
  }
});