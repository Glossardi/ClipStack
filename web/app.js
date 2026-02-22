const translations = {
  en: {
    headline: "Copy less. Ship more.",
    subheadline:
      "The minimal clipboard app that keeps your flow clean, fast, and distraction-free.",
    downloadApple: "Download for Apple Silicon",
    downloadIntel: "Download for Intel",
    latestHint: "Always points to the newest public release.",
    benefitsTitle: "Built for calm productivity",
    benefit1: "Fewer interruptions while switching between tasks.",
    benefit2: "Faster execution for creators, coders, and operators.",
    benefit3: "Private by default — local-first and no cookies.",
    aboutTitle: "About Simon",
    aboutText:
      "I am Simon, building focused apps and practical tools that stay simple and useful.",
    privacyText:
      "This site uses Umami analytics without cookies to understand aggregate usage and download demand.",
    imprintText:
      "Impressum: Legal details will be added here according to EU requirements.",
    downloadArmAria: "Download ClipStack as DMG for Apple Silicon",
    downloadIntelAria: "Download ClipStack as DMG for Intel Macs"
  },
  de: {
    headline: "Weniger kopieren. Mehr schaffen.",
    subheadline:
      "Die minimalistische Clipboard-App für einen ruhigen, schnellen und fokussierten Workflow.",
    downloadApple: "Download für Apple Silicon",
    downloadIntel: "Download für Intel",
    latestHint: "Verweist immer auf die neueste öffentliche Version.",
    benefitsTitle: "Für ruhige Produktivität gebaut",
    benefit1: "Weniger Unterbrechungen beim Wechsel zwischen Aufgaben.",
    benefit2: "Schnelleres Arbeiten für Creator, Entwickler und Operator.",
    benefit3: "Privat by default — lokal zuerst und ohne Cookies.",
    aboutTitle: "Über Simon",
    aboutText:
      "Ich bin Simon und entwickle fokussierte Apps und praktische Tools, die simpel und nützlich bleiben.",
    privacyText:
      "Diese Seite nutzt Umami Analytics ohne Cookies, um aggregierte Nutzung und Download-Nachfrage zu verstehen.",
    imprintText:
      "Impressum: Rechtliche Angaben werden hier gemäß EU-Anforderungen ergänzt.",
    downloadArmAria: "ClipStack als DMG für Apple Silicon herunterladen",
    downloadIntelAria: "ClipStack als DMG für Intel-Macs herunterladen"
  }
};

function resolveLanguage() {
  const fromQuery = new URLSearchParams(window.location.search).get("lang");
  if (fromQuery === "de" || fromQuery === "en") return fromQuery;
  const nav = (navigator.language || "en").toLowerCase();
  return nav.startsWith("de") ? "de" : "en";
}

function applyI18n(lang) {
  const text = translations[lang] || translations.en;
  document.documentElement.lang = lang;
  document.title =
    lang === "de"
      ? "ClipStack — Minimaler Clipboard-Flow für macOS"
      : "ClipStack — Faster clipboard flow for macOS";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key && text[key]) el.textContent = text[key];
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria");
    if (key && text[key]) el.setAttribute("aria-label", text[key]);
  });
}

function trackDownloads() {
  document.querySelectorAll("[data-track]").forEach((el) => {
    el.addEventListener("click", () => {
      const eventName = el.getAttribute("data-track");
      if (window.umami && typeof window.umami.track === "function") {
        window.umami.track(eventName, {
          source: "hero",
          language: document.documentElement.lang
        });
      }
    });
  });
}

function revealSections() {
  const items = document.querySelectorAll(".reveal");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    items.forEach((el) => el.classList.add("in"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  items.forEach((el) => observer.observe(el));
}

applyI18n(resolveLanguage());
trackDownloads();
revealSections();
