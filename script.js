const API_BASE = "http://localhost:4000";

document.addEventListener("DOMContentLoaded", () => {
  const role = localStorage.getItem("role");

  if (role !== "admin") {
    document.querySelectorAll(".hide-btn").forEach(btn => {
      btn.style.display = "none";
    });
  }

  const authLink = document.getElementById("authLink");
  if (role && authLink) {
    authLink.textContent = "Logout";
    authLink.href = "#";
    authLink.classList.remove("text-danger");
    authLink.classList.add("text-warning");
    authLink.addEventListener("click", () => {
      localStorage.removeItem("role");
      localStorage.removeItem("user");
      window.location.reload();
    });
  }
});

async function createGame(formElement) {
  const formData = new FormData(formElement);
  const res = await fetch(`${API_BASE}/game`, { method: "POST", body: formData });
  return res.json();
}

async function getAllGames() {
  const res = await fetch(`${API_BASE}/game`);
  return res.json();
}

async function getGameById(id) {
  const res = await fetch(`${API_BASE}/game/${id}`);
  return res.json();
}

async function updateGame(id, gameData) {
  const res = await fetch(`${API_BASE}/game/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(gameData)
  });
  return res.json();
}

async function deleteGame(id) {
  const res = await fetch(`${API_BASE}/game/${id}`, { method: "DELETE" });
  return res.json();
}

async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  return res.json();
}

document.addEventListener("DOMContentLoaded", async function () {
  const gameContainer = document.querySelector(".row.g-4");
  const addGameForm = document.getElementById("addGameForm");
  const updateGameForm = document.getElementById("updateGameForm");

  if (gameContainer) {
    async function renderGames() {
      const games = await getAllGames();
      gameContainer.innerHTML = "";
      const role = localStorage.getItem("role");

      games.forEach(game => {
        const col = document.createElement("div");
        col.className = "col-md-4";
        col.innerHTML = `
  <div class="card mb-4 shadow-sm">
    <img src="http://localhost:4000/${game.image}" class="card-img-top" alt="${game.name}" />
    <div class="card-body text-center">
      <h2 class="card-title">${game.name}</h2>
      <p class="card-text text-muted">${game.description}</p>
      <p class="card-text text-success">$${game.price} EGP</p>
      <button class="btn btn-primary btn-lg buy-btn">Buy</button>
      <button class="btn btn-danger btn-lg hide-btn" data-id="${game._id}">Remove</button>
      <button class="btn btn-secondary btn-lg hide-btn update-btn" data-id="${game._id}">Update</button>
    </div>
  </div>
`;

        gameContainer.appendChild(col);
      });

      document.querySelectorAll(".buy-btn").forEach(button => {
        button.addEventListener("click", () => {
          const title = button.closest(".card-body").querySelector(".card-title").textContent;
          alert(`🎮 Thank you for buying ${title}!`);
        });
      });

      if (role !== "admin") {
        document.querySelectorAll(".hide-btn").forEach(btn => {
          btn.style.display = "none";
        });
      }

      document.querySelectorAll(".btn-danger").forEach(button => {
        button.addEventListener("click", async (e) => {
          const id = e.target.getAttribute("data-id");
          await deleteGame(id);
          renderGames();
        }
        );
      });

      document.querySelectorAll(".update-btn").forEach(button => {
        button.addEventListener("click", async (e) => {
          const id = e.target.getAttribute("data-id");
          console.log("Selected ID for update:", id);

          if (!id || id === "null" || id === "undefined") {
            alert("Invalid game ID. Cannot update.");
            return;
          }

          try {
            const game = await getGameById(id);
            if (game && game._id) {
              document.getElementById("updateGameId").value = "";
              document.getElementById("updateName").value = "";
              document.getElementById("updateDescription").value = "";
              document.getElementById("updatePrice").value = "";

              document.getElementById("updateGameId").value = game._id;
              document.getElementById("updateName").value = game.name;
              document.getElementById("updateDescription").value = game.description;
              document.getElementById("updatePrice").value = game.price;

              console.log("Modal populated with:", {
                id: game._id,
                name: game.name,
                description: game.description,
                price: game.price
              });

              new bootstrap.Modal(document.getElementById("updateGameModal")).show();
            } else {
              alert("Game not found or invalid response from server.");
            }
          } catch (error) {
            console.error("Error fetching game details:", error);
            alert("Error loading game details. Please try again.");
          }
        });
      });
    }

    async function defaultAddHandler(e) {
      e.preventDefault();
      try {
        await createGame(addGameForm);
        bootstrap.Modal.getInstance(document.getElementById('addGameModal')).hide();
        addGameForm.reset();
        renderGames();
      } catch (error) {
        console.error("Error creating game:", error);
        alert("Error creating game. Please try again.");
      }
    }

    if (updateGameForm) {
      updateGameForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("updateGameId").value;
        console.log("Submitting update for ID:", id);

        if (!id || id === "null" || id === "undefined" || id.trim() === "") {
          alert("Invalid ID: Cannot update. Please close the modal and try again.");
          return;
        }

        const updatedData = {
          name: document.getElementById("updateName").value.trim(),
          description: document.getElementById("updateDescription").value.trim(),
          price: parseFloat(document.getElementById("updatePrice").value),
        };

        if (!updatedData.name || !updatedData.description || isNaN(updatedData.price)) {
          alert("Please fill in all fields with valid data.");
          return;
        }

        try {
          await updateGame(id, updatedData);
          bootstrap.Modal.getInstance(document.getElementById("updateGameModal")).hide();
          renderGames();
          alert("Game updated successfully!");
        } catch (error) {
          console.error("Error updating game:", error);
          alert("Error updating game. Please try again.");
        }
      });
    }

    if (addGameForm) {
      addGameForm.onsubmit = defaultAddHandler;
    }

    renderGames();
  }
});

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const data = await loginUser(email, password);
      if (data && data.user) {
        localStorage.setItem("role", data.user.role);
        alert("Login successful!");
        window.location.href = "/pages/index.html";
      } else {
        alert(data.message || "Login failed.");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please try again.");
    }
  });
}

async function createUser(formElement) {
  const name = formElement.name.value;
  const email = formElement.email.value;
  const password = formElement.password.value;
  const role = formElement.role.value; 

  const res = await fetch(`${API_BASE}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, role })
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Signup failed");
  }

  return res.json();
}


const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    try {
      const data = await createUser(signupForm);
      if (data.message === "User registered successfully") {
        alert("Signup successful!");
        window.location.href = "/pages/login/login.html";
      } else {
        alert(data.message || "Signup failed.");
      }
    } catch (error) {
      console.error("Signup error:", error);
      alert("Signup failed. Please try again.");
    }
  });
}