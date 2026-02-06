// Toggle between Login and Signup forms
function createAccount(button) {
    const container = document.querySelector(".container");

    container.classList.toggle("signup-active");

    if (container.classList.contains("signup-active")) {
        button.textContent = "Go to Login";
        document.getElementById("btnlogin").textContent = "Sign Up";
        showSignup();
    } else {
        button.textContent = "New Account";
        document.getElementById("btnlogin").textContent = "Login";
        showLogin() 
    }
}

// Handle login or signup form submission
function handleLogin(event) {
    event.preventDefault();

    const container = document.querySelector(".container");

    if (container.classList.contains("signup-active")) {
        // Signup logic
        const name = document.getElementById("signName").value;
        const email = document.getElementById("signEmail").value;
        const phone = document.getElementById("signPhone").value;
        const password = document.getElementById("signPass").value;

        alert(`✅ Signup successful!\nName: ${name}\nEmail: ${email}\nPhone: ${phone}`);
    } else {
        // Login logic
        const emailOrPhone = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPass").value;

        alert(`🔑 Login successful!\nUser: ${emailOrPhone}`);
    }
}

// Forgot password
function forgotPassword() {
    alert("🔒 Password reset link sent to your email!");
}

// Home button
function goHome() {
    alert("🏠 Redirecting to Home Page...");
    // window.location.href = "index.html"; // uncomment if you have a home page
}
//6 input-box problem fix

function showLogin() {
    // Disable signup fields
    document.querySelectorAll('.signup-fields input').forEach(input => input.disabled = true);
    // Enable login fields
    document.querySelectorAll('.login-fields input').forEach(input => input.disabled = false);


}

function showSignup() {
    // Disable login fields
    document.querySelectorAll('.login-fields input').forEach(input => input.disabled = true);
    // Enable signup fields
    document.querySelectorAll('.signup-fields input').forEach(input => input.disabled = false);
}
//load the ShowLogin function by default 
window.onload = showLogin;


//Supabase Login
// Supabase auth + profile storage
// - Uses dynamic import so you don't need to change HTML
// - Stores only the login email/phone (localStorage), never signup values
// - After successful login, redirects to test.html
// - After successful signup, inserts {name,email,phone} into "profiles" table
//   Make sure a table named "profiles" exists with columns: name (text), email (text), phone (text)

const SUPABASE_URL = "https://hrfwntixjesvexqjeviv.supabase.co"; // TODO: set your project URL
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZndudGl4amVzdmV4cWpldml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjE3MTQsImV4cCI6MjA3NDk5NzcxNH0.UaiP3UhfqS6Li6JSAEjsJkAYPfvsqkSgsSGoatOstxs"; 

// const SUPABASE_URL = "I_Have_it";
// const SUPABASE_ANON_KEY = "I_Have_it"

let supabaseClientPromise = null;

async function getSupabase() {
    if (!supabaseClientPromise) {
        try {
            const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.45.4");
            // Alternative if above fails: https://esm.sh/@supabase/supabase-js@2?target=deno
            supabaseClientPromise = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log("Supabase client initialized successfully");
        } catch (err) {
            console.error("Failed to load Supabase client:", err);
            alert("Failed to load authentication library. Check console for details.");
            throw err;
        }
    }
    return supabaseClientPromise;
}

// ── Main handler ────────────────────────────────────────────────────────
async function handleLogin(event) {
    event.preventDefault();
    event.stopPropagation(); // extra safety against bubbling

    const submitBtn = event.target.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    let client;
    try {
        client = await getSupabase();
        if (!client?.auth) {
            throw new Error("Supabase auth module not available");
        }
    } catch (err) {
        console.error("Client init error:", err);
        alert("Cannot connect to authentication service. Please check your internet or try refreshing.");
        if (submitBtn) submitBtn.disabled = false;
        return;
    }

    const container = document.querySelector(".container");
    if (!container) {
        alert("Form structure error – contact support.");
        if (submitBtn) submitBtn.disabled = false;
        return;
    }

    try {
        if (container.classList.contains("signup-active")) {
            // ── SIGNUP FLOW ───────────────────────────────────────────────
            const nameEl = document.getElementById("signName");
            const emailEl = document.getElementById("signEmail");
            const phoneEl = document.getElementById("signPhone");
            const passEl  = document.getElementById("signPass");

            if (!nameEl || !emailEl || !passEl) {
                alert("Signup form fields missing.");
                return;
            }

            const name     = nameEl.value.trim();
            const email    = emailEl.value.trim();
            const phone    = phoneEl ? phoneEl.value.trim() : "";
            const password = passEl.value;

            if (!email || !password) {
                alert("Email and password are required.");
                return;
            }

            if (name.length < 2) {
                alert("Please enter a valid name (at least 2 characters).");
                return;
            }

            console.log("SIGNUP ATTEMPT → name:", name);
            console.log("SIGNUP ATTEMPT → email:", email);
            console.log("SIGNUP ATTEMPT → password length:", password.length);

            const { data, error } = await client.auth.signUp({
                email,
                password,
                options: {
                    data: { name },
                }
            });

            if (error) {
                console.error("SIGNUP ERROR – full object:", error);
                console.error("Error message:", error.message);
                console.error("Error status/code:", error.status, error.code);

                if (error.message?.toLowerCase().includes("duplicate") || 
                    error.message?.includes("already registered")) {
                    alert("This email is already registered. Please log in instead.");
                } 
                // else {
                //     alert("Signup failed: " + (error.message || "Unknown error"));
                // }
                return;
            }

            console.log("SIGNUP RESPONSE – user:", data.user?.email);
            console.log("Session exists:", !!data.session);
            console.log("User metadata:", data.user?.user_metadata);

            if (data.session) {
                console.log("Auto-login successful – redirecting");
                alert("Signup successful! Go to Login.");
            } else {
                console.log("Signup ok but no session (confirmation probably required)");
                alert("Account created!\n\nPlease check your email to confirm before logging in.");
                // Clear form
                nameEl.value = "";
                emailEl.value = "";
                if (phoneEl) phoneEl.value = "";
                passEl.value = "";
            }
        } 
        else {
            // ── LOGIN FLOW ─────────────────────────────────────────────────
            const identifierEl = document.getElementById("loginEmail");
            const passEl       = document.getElementById("loginPass");

            if (!identifierEl || !passEl) {
                alert("Login form fields missing.");
                return;
            }

            let identifier = identifierEl.value.trim();
            const password = passEl.value;

            if (!identifier || !password) {
                alert("Please enter your email and password.");
                return;
            }

            console.log("LOGIN ATTEMPT → email:", identifier);
            console.log("LOGIN ATTEMPT → password length:", password.length); // don't log real password!

            const { data, error } = await client.auth.signInWithPassword({
                email: identifier,
                password,
            });

            if (error) {
                console.error("LOGIN FAILED – full error object:", error);
                console.error("Error message:", error.message);
                console.error("Error status:", error.status);
                
                if (error.message?.toLowerCase().includes("invalid login credentials")) {
                    alert("Incorrect email or password.");
                } else if (error.message?.includes("confirmed")) {
                    alert("Account not confirmed yet.");
                } else {
                    alert("Login failed: " + (error.message || "Unknown error"));
                }
                return;
            }

            console.log("LOGIN SUCCESS – user:", data.user?.email);
            console.log("Session exists:", !!data.session);

            if (data.session) {
                window.location.href = "owner.html";
            }
        }
    } catch (err) {
        console.error("Auth operation error:", err);
        alert("Something went wrong during authentication. Check console and try again.");
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

// Attach listener ONLY once – on DOM ready
document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".login-form") || document.getElementById("login");
    if (form) {
        form.addEventListener("submit", handleLogin);
        console.log("Submit listener attached to form");
    } else {
        console.error("No login form found in DOM");
    }
});