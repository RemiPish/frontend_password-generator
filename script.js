import { zxcvbn } from "@zxcvbn-ts/core";

const characterSets = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+",
};

// DOM
const passwordLengthRange = document.querySelector('input[name="char-length"]');
const passwordLengthText = document.querySelector(".password-generator__length-value");
const form = document.querySelector(".password-generator__form");

const passwordOutput = document.querySelector(".password-generator__password");
const passwordOutputErrorText = document.querySelector(".password-generator__display__error");

const strengthContainer = document.querySelector(".password-generator__strength-bars");
const strengthText = document.querySelector(".password-generator__strength-text");

const copyButton = document.querySelector(".password-generator__copy-button");
const copyIcon = document.querySelector(".copy-icon");
const copyText = document.querySelector(".password-generator__copy-text");

let generatedPassword = "";

// ---------------- RANDOM ----------------

function getRandomIndex(max) {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % max;
}

function getRandomChar(characters) {
  return characters[getRandomIndex(characters.length)];
}

// ---------------- PASSWORD ----------------

function generatePasswordString(options, length) {
  const passwordChars = [];
  let selectedString = "";

  Object.entries(characterSets).forEach(([key, chars]) => {
    if (options[key]) {
      selectedString += chars;
      passwordChars.push(getRandomChar(chars));
    }
  });

  if (!selectedString) return "";

  while (passwordChars.length < length) {
    passwordChars.push(getRandomChar(selectedString));
  }

  return shuffleArray(passwordChars).join("");
}

function shuffleArray(array) {
  const res = [...array];

  for (let i = res.length - 1; i > 0; i--) {
    const j = getRandomIndex(i + 1);
    [res[i], res[j]] = [res[j], res[i]];
  }

  return res;
}

// ---------------- VALIDATION ----------------

function getValidationError(length, optionCount) {
  if (length <= 0) return "Character length should be over 0!";
  if (optionCount === 0) return "Select at least one option before generating!";
  if (length < optionCount) {
    return "Character length must be equal to or bigger than the selected option count!";
  }
  return "";
}

// ---------------- STRENGTH ----------------

function testPasswordStrength(password) {
  const { score } = zxcvbn(password);

  strengthText.textContent = getStrengthLabel(score);

  strengthContainer.classList.remove("bar--1", "bar--2", "bar--3", "bar--4");
  strengthContainer.classList.add(`bar--${mapScoreToBars(score)}`);
}

function mapScoreToBars(score) {
  return score <= 2 ? score + 1 : 4;
}

function getStrengthLabel(score) {
  return ["Too Weak", "Weak", "Medium", "Strong"][Math.min(score, 3)];
}

// ---------------- COPY ----------------

function updateCopyState(hasPassword) {
  copyButton.disabled = !hasPassword;
  copyText.textContent = "";
  copyIcon.classList.remove("copy-icon--copied");
}

copyButton.addEventListener("click", async () => {
  if (!generatedPassword) return;

  await navigator.clipboard.writeText(generatedPassword);

  copyIcon.classList.add("copy-icon--copied");
  copyText.textContent = "COPIED";

  setTimeout(() => {
    copyText.textContent = "";
    copyIcon.classList.remove("copy-icon--copied");
  }, 1500);
});

// ---------------- EVENTS ----------------

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const length = Number(passwordLengthRange.value);

  const options = {
    upper: document.querySelector('input[name="uppercase"]').checked,
    lower: document.querySelector('input[name="lowercase"]').checked,
    numbers: document.querySelector('input[name="numbers"]').checked,
    symbols: document.querySelector('input[name="symbols"]').checked,
  };

  const optionCount = Object.values(options).filter(Boolean).length;

  const error = getValidationError(length, optionCount);

  if (error) {
    passwordOutputErrorText.textContent = error;
    passwordOutput.textContent = "P4$5W0rD!";
    passwordOutput.classList.add("is-empty");
    generatedPassword = "";
    updateCopyState(false);
    return;
  }

  const password = generatePasswordString(options, length);

  generatedPassword = password;
  passwordOutput.textContent = password;
  passwordOutput.classList.remove("is-empty");

  passwordOutputErrorText.textContent = "";

  updateCopyState(true);
  testPasswordStrength(password);
});

// ---------------- RANGE ----------------

function updateRangeProgress() {
  const min = Number(passwordLengthRange.min);
  const max = Number(passwordLengthRange.max);
  const value = Number(passwordLengthRange.value);

  const progress = ((value - min) / (max - min)) * 100;

  passwordLengthRange.style.setProperty("--progress", `${progress}%`);
}

passwordLengthRange.addEventListener("input", (e) => {
  passwordLengthText.textContent = e.target.value;
  updateRangeProgress();
});

// init
updateRangeProgress();