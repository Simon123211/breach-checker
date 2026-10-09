// ==== 1. Find the elements required ====
const form = document.getElementById("breach-form");
const passwordInput = document.getElementById("password");
const toggleButton = document.getElementById("toggle-visibility");
const strengthMeter = document.getElementById("strength-meter");
const strengthBar = document.getElementById("strength-bar");
const strengthLabel = document.getElementById("strength-label");
const checkButton = document.getElementById("check-button");
const spinner = document.getElementById("spinner");
const buttonText = document.getElementById("button-text");
const result = document.getElementById("result");

const API_URL = "https://api.pwnedpasswords.com/range/";

// === 2. Show / hide password ===
toggleButton.addEventListener("click", () => {
    const isHidden = passwordInput.type === "password";
    passwordInput.type = isHidden ? "text" : "password";
    toggleButton.textContent = isHidden ? "Hide" : "Show";
    toggleButton.setAttribute("aria-pressed", String(isHidden));
});

// === 3. Password strength meter ===
const LEVELS = [
    { label: "Very weak", colour: "bg-danger" },
    { label: "Weak", colour: "bg-danger" },
    { label: "Fair", colour: "bg-warning" },
    { label: "Good", colour: "bg-info" },
    { label: "Strong", colour: "bg-success" },
    { label: "Very strong", colour: "bg-success" }
];

// One point for each rule the password meets (0 to 5)
function scorePassword(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
}

function updateStrength() {
    const password = passwordInput.value;

    if (password === "") {
        strengthBar.style.width = "0%";
        strengthBar.className = "progress-bar";
        strengthLabel.textContent = "Not entered";
        strengthMeter.setAttribute("aria-valuenow", "0");
        strengthMeter.setAttribute("aria-valuetext", "Not entered");
        return;
    }

    const score = scorePassword(password);
    const percent = score === 0 ? 10 : score * 20; // always show sliver of bar
    const level = LEVELS[score];

    strengthBar.style.width = percent + "%";
    strengthBar.className = "progress-bar " + level.colour;
    strengthLabel.textContent = level.label;
    strengthMeter.setAttribute("aria-valuenow", String(percent));
    strengthMeter.setAttribute("aria-valuetext", level.label);
}

passwordInput.addEventListener("input", () => {
    updateStrength();
    result.innerHTML = ""; // clear old result when password changes
});

// === 4. Turn the password into SHA-1 hash (in browser) ===
async function sha1(text) {
    const data = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const bytes = Array.from(new Uint8Array(hashBuffer));
    return bytes.map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();    
}

// === 5. Ask the API, using only first 5 characters of hash ===
async function getBreachCount(password) {
    const hash = await sha1(password);
    const prefix = hash.slice(0, 5); // sent to API
    const suffix = hash.slice(5); // kept in browser

    const response = await fetch(API_URL + prefix);
    if (!response.ok) {
        throw new Error("Request failed with status " + response.status);
    }

    // Each lines looks like "SUFFIX:COUNT"
    const text = await response.text();
    for (const line of text.split("\n")) {
        const [lineSuffix, count] = line.trim().split(":");
        if (lineSuffix === suffix) {
            return Number(count);
        }
    }
    return 0; // not found in breach
}


// === 6. Display Bootstrap alert ===
function showResult(type, heading, message) {
    result.innerHTML = "";

    const alertBox = document.createElement("div");
    alertBox.className = "alert alert-" + type;

    const title = document.createElement("h3");
    title.className = "h5 alert-heading";
    title.textContent = heading;

    const text = document.createElement("p");
    text.className = "mb-0";
    text.textContent = message;

    alertBox.append(title, text);
    result.appendChild(alertBox);
}

function setLoading(isLoading) {
    checkButton.disabled = isLoading;
    spinner.classList.toggle("d-none", !isLoading);
    buttonText.textContent = isLoading ? "Checcking..." : "Check password";
}


// === 7. Handle form submit ==
form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Bootstrap validation: show red message if field empty
    if (!form.checkValidity()) {
        form.classList.add("was-validated");
        passwordInput.focus();
        return;
    }
    form.classList.remove("was-validated");

    // crypto.subtle only works on secure pages
    if (!window.crypto || !crypto.subtle) {
        showResult("warning", "Can't check here",
            "Open this page through Live Server (localhost) so the browser can hash the password securely.");
        return;
    }

    setLoading(true);

    try {
        const count = await getBreachCount(passwordInput.value);

        if (count > 0) {
            showResult("danger", "Breached!",
                "This password has appeared in data breaches " + count.toLocaleString() + " times. Don't use it");                
        } else {
            showResult("success", "Not found",
                "Good news: this password wasn't found in any known breach. Check the strength meter too.");                
        }
    } catch (error) {
        console.error("Breach check error:", error);
        showResult("warning", "Something went wrong",
            "The breach check couldn't be completed. Please check your connection and try again.");
    } finally {
        setLoading(false);
    }
});