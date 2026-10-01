import { khmerTranslations } from "./translations.js";

const themeStorageKey = "arindra-portfolio-theme";
const languageStorageKey = "arindra-portfolio-language";
const themeButton = document.createElement("button");
const languageButton = document.createElement("button");
const originalTextNodes = new WeakMap();
const originalAttributes = new WeakMap();
const reverseTranslations = Object.fromEntries(
  Object.entries(khmerTranslations).map(([english, khmer]) => [khmer, english])
);
const translatableAttributes = ["aria-label", "title", "placeholder", "alt"];
let currentLanguage = "en";

function normalizeText(value) {
  return value.replace(/\s+/g, " ").trim();
}

function translateValue(value, language) {
  const normalized = normalizeText(value);
  if (language === "km") {
    return khmerTranslations[normalized] || value;
  }
  return reverseTranslations[normalized] || value;
}

function translateTextNode(node) {
  if (node.parentElement?.closest("script, style, noscript, svg, .language-toggle")) {
    return;
  }

  if (!originalTextNodes.has(node)) {
    originalTextNodes.set(node, {
      original: node.nodeValue,
      translated: node.nodeValue
    });
  }

  const state = originalTextNodes.get(node);
  if (node.nodeValue !== state.translated) {
    state.original = node.nodeValue;
  }

  const original = state.original;
  const leading = original.match(/^\s*/)?.[0] || "";
  const trailing = original.match(/\s*$/)?.[0] || "";
  const translated = translateValue(original.trim(), currentLanguage);
  const nextValue = `${leading}${translated}${trailing}`;
  state.translated = nextValue;

  if (node.nodeValue !== nextValue) {
    node.nodeValue = nextValue;
  }
}

function translateAttributes(element) {
  if (element.closest?.(".language-toggle")) return;

  for (const attribute of translatableAttributes) {
    if (!element.hasAttribute(attribute)) continue;

    let originals = originalAttributes.get(element);
    if (!originals) {
      originals = new Map();
      originalAttributes.set(element, originals);
    }

    if (!originals.has(attribute)) {
      originals.set(attribute, {
        original: element.getAttribute(attribute),
        translated: element.getAttribute(attribute)
      });
    }

    const state = originals.get(attribute);
    const current = element.getAttribute(attribute);
    if (current !== state.translated) {
      state.original = current;
    }

    const translated = translateValue(state.original, currentLanguage);
    state.translated = translated;
    if (element.getAttribute(attribute) !== translated) {
      element.setAttribute(attribute, translated);
    }
  }
}

function translateTree(root) {
  if (root.nodeType === Node.TEXT_NODE) {
    translateTextNode(root);
    return;
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    translateTextNode(walker.currentNode);
  }

  if (root instanceof Element) {
    translateAttributes(root);
    root.querySelectorAll("*").forEach(translateAttributes);
  }
}

function setLanguage(language) {
  currentLanguage = language === "km" ? "km" : "en";
  document.documentElement.lang = currentLanguage;
  translateTree(document.documentElement);
  languageButton.textContent = currentLanguage === "en" ? "English" : "ខ្មែរ";
  languageButton.setAttribute(
    "aria-label",
    currentLanguage === "en" ? "ប្ដូរទៅភាសាខ្មែរ" : "Switch to English"
  );
  languageButton.title = currentLanguage === "en" ? "ប្ដូរទៅភាសាខ្មែរ" : "Switch to English";

  try {
    localStorage.setItem(languageStorageKey, currentLanguage);
  } catch {
    // Language switching still works when browser storage is unavailable.
  }
}

function setTheme(theme) {
  document.documentElement.classList.toggle("theme-dark", theme === "dark");
  document.body.classList.toggle("theme-dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
  themeButton.innerHTML = theme === "dark"
    ? '<i class="fa-solid fa-sun" aria-hidden="true"></i>'
    : '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
  themeButton.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} mode`);
  themeButton.title = `Switch to ${theme === "dark" ? "light" : "dark"} mode`;

  try {
    localStorage.setItem(themeStorageKey, theme);
  } catch {
    // The theme remains usable when browser storage is unavailable.
  }
}

themeButton.type = "button";
themeButton.className = "theme-toggle inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-700 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500";

let savedTheme = "light";
try {
  savedTheme = localStorage.getItem(themeStorageKey) === "dark" ? "dark" : "light";
} catch {
  savedTheme = "light";
}

setTheme(savedTheme);
themeButton.addEventListener("click", () => {
  setTheme(document.body.classList.contains("theme-dark") ? "light" : "dark");
});

const menuButton = document.querySelector("#menu-btn");
const controls = menuButton?.parentElement;
const mobileMenuContent = document.querySelector("#mobile-menu > div");
const mobileSettings = document.createElement("div");
mobileSettings.className = "mt-2 flex items-center justify-end gap-2 border-t border-gray-200 pt-3";
languageButton.type = "button";
languageButton.className = "language-toggle inline-flex h-9 min-w-10 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white px-2 text-xs font-semibold text-gray-700 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500";

if (controls && mobileMenuContent) {
  mobileMenuContent.append(mobileSettings);

  const positionLanguageControls = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      controls.insertBefore(languageButton, menuButton);
      controls.insertBefore(themeButton, menuButton);
      return;
    }

    mobileSettings.append(languageButton, themeButton);
  };

  positionLanguageControls();
  window.addEventListener("resize", positionLanguageControls);
}

let savedLanguage = "en";
try {
  savedLanguage = localStorage.getItem(languageStorageKey) === "km" ? "km" : "en";
} catch {
  savedLanguage = "en";
}

setLanguage(savedLanguage);
languageButton.addEventListener("click", () => {
  setLanguage(currentLanguage === "en" ? "km" : "en");
});

const translationObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === "childList") {
      mutation.addedNodes.forEach(translateTree);
    } else if (mutation.type === "attributes") {
      translateAttributes(mutation.target);
    }
  }
});
translationObserver.observe(document.documentElement, {
  childList: true,
  subtree: true,
  characterData: true,
  attributes: true,
  attributeFilter: translatableAttributes
});

