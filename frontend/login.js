const existingUser = JSON.parse(localStorage.getItem("talktopit_user") || "null");
if (existingUser) {
  window.location.href = "/chat";
}

const tabSignIn = document.getElementById("tabSignIn");
const tabSignUp = document.getElementById("tabSignUp");
const signInFormPage = document.getElementById("signInFormPage");
const signUpFormPage = document.getElementById("signUpFormPage");

tabSignIn.addEventListener("click", () => {
  tabSignIn.classList.add("active");
  tabSignUp.classList.remove("active");
  signInFormPage.classList.remove("hidden");
  signUpFormPage.classList.add("hidden");
});

tabSignUp.addEventListener("click", () => {
  tabSignUp.classList.add("active");
  tabSignIn.classList.remove("active");
  signUpFormPage.classList.remove("hidden");
  signInFormPage.classList.add("hidden");
});

signInFormPage.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("siEmail").value;
  localStorage.setItem("talktopit_user", JSON.stringify({ name: email.split("@")[0], email }));
  window.location.href = "/chat";
});

signUpFormPage.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("suName").value;
  const email = document.getElementById("suEmail").value;
  localStorage.setItem("talktopit_user", JSON.stringify({ name, email }));
  window.location.href = "/chat";
});

const founderLinkPage = document.getElementById("founderLinkPage");
const founderModal = document.getElementById("founderModal");
founderLinkPage.addEventListener("click", () => founderModal.classList.remove("hidden"));
document.querySelectorAll("[data-close]").forEach(el => {
  el.addEventListener("click", () => document.getElementById(el.dataset.close).classList.add("hidden"));
});