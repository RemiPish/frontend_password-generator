import { zxcvbn } from "@zxcvbn-ts/core";

const characterSets = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+",
};

const ui = {
  passwordLengthRange: document.querySelector('input[name="char-length"]'),
  passwordLengthText: document.querySelector(".password-generator__length-value"),
  form: document.querySelector(".password-generator__form"),

  passwordOutput: document.querySelector(".password-generator__password"),
  passwordOutputErrorText: document.querySelector(
    ".password-generator__display__error",
  ),

  strengthContainer: document.querySelector(".password-generator__strength-bars"),
  strengthText: document.querySelector(".password-generator__strength-text"),

  copyButton: document.querySelector(".password-generator__copy-button"),
  copyIcon: document.querySelector(".copy-icon"),
  copyText: document.querySelector(".password-generator__copy-text"),

  uppercaseInput: document.querySelector('input[name="uppercase"]'),
  lowercaseInput: document.querySelector('input[name="lowercase"]'),
  numbersInput: document.querySelector('input[name="numbers"]'),
  symbolsInput: document.querySelector('input[name="symbols"]'),
};

const missingElements = Object.entries(ui)
  .filter(([, element]) => !element)
  .map(([name]) => name);

if (missingElements.length > 0) {
  console.warn(
    "Password generator initialization failed. Missing elements:",
    missingElements,
  );
} else {
  initPasswordGenerator(ui);
}

function initPasswordGenerator(ui) {
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

  function getOptions() {
    return {
      upper: ui.uppercaseInput.checked,
      lower: ui.lowercaseInput.checked,
      numbers: ui.numbersInput.checked,
      symbols: ui.symbolsInput.checked,
    };
  }

  // ---------------- STRENGTH ----------------

  function testPasswordStrength(password) {
    const { score } = zxcvbn(password);

    ui.strengthText.textContent = getStrengthLabel(score);

    ui.strengthContainer.classList.remove("bar--1", "bar--2", "bar--3", "bar--4");
    ui.strengthContainer.classList.add(`bar--${mapScoreToBars(score)}`);
  }

  function mapScoreToBars(score) {
    return score <= 2 ? score + 1 : 4;
  }

  function getStrengthLabel(score) {
    return ["Too Weak", "Weak", "Medium", "Strong"][Math.min(score, 3)];
  }

  // ---------------- COPY ----------------

  function updateCopyState(hasPassword) {
    ui.copyButton.disabled = !hasPassword;
    ui.copyText.textContent = "";
    ui.copyIcon.classList.remove("copy-icon--copied");
  }

  ui.copyButton.addEventListener("click", async () => {
    if (!generatedPassword) return;

    try {
      await navigator.clipboard.writeText(generatedPassword);

      ui.copyIcon.classList.add("copy-icon--copied");
      ui.copyText.textContent = "COPIED";

      setTimeout(() => {
        ui.copyText.textContent = "";
        ui.copyIcon.classList.remove("copy-icon--copied");
      }, 1500);
    } catch (error) {
      console.error("Failed to copy password:", error);
    }
  });

  // ---------------- RANGE ----------------

  function updateRangeProgress() {
    const min = Number(ui.passwordLengthRange.min);
    const max = Number(ui.passwordLengthRange.max);
    const value = Number(ui.passwordLengthRange.value);

    const progress = ((value - min) / (max - min)) * 100;

    ui.passwordLengthRange.style.setProperty("--progress", `${progress}%`);
  }

  ui.passwordLengthRange.addEventListener("input", (e) => {
    ui.passwordLengthText.textContent = e.target.value;
    updateRangeProgress();
  });

  // ---------------- FORM ----------------

  ui.form.addEventListener("submit", (e) => {
    e.preventDefault();

    const length = Number(ui.passwordLengthRange.value);
    const options = getOptions();
    const optionCount = Object.values(options).filter(Boolean).length;
    const error = getValidationError(length, optionCount);

    if (error) {
      ui.passwordOutputErrorText.textContent = error;
      ui.passwordOutput.textContent = "P4$5W0rD!";
      ui.passwordOutput.classList.add("is-empty");

      generatedPassword = "";
      updateCopyState(false);

      return;
    }

    const password = generatePasswordString(options, length);

    generatedPassword = password;

    ui.passwordOutput.textContent = password;
    ui.passwordOutput.classList.remove("is-empty");
    ui.passwordOutputErrorText.textContent = "";

    updateCopyState(true);
    testPasswordStrength(password);
  });

  // init
  updateCopyState(false);
  updateRangeProgress();
}