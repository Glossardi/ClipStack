import { selectLatestDmgAssets } from "./release-utils.js";

const DEFAULT_CONFIG = {
  siteUrl: "https://clipstack.click",
  githubRepo: "Glossardi/ClipStack",
  githubProjectUrl: "https://github.com/Glossardi/ClipStack",
  umamiScriptUrl: "https://analytics.glossardi.de/script.js",
  umamiWebsiteId: "c230ce3d-9704-46bc-9e3d-ae3bb1f35633",
};

const TEXT = {
  en: {
    "nav.faq": "FAQ",
    "nav.about": "About",
    "nav.github": "GitHub",
    "hero.badge": "Now available for macOS",
    "hero.title": "ClipStack",
    "hero.subtitle": "Clipboard history in your menu bar.",
    "hero.cta_arm": "Download for Apple Silicon",
    "hero.cta_intel": "Download for Intel Mac",
    "hero.loading": "Looking up latest release...",
    "hero.latest": "Latest stable:",
    "hero.release_ready": "Direct download ready",
    "hero.release_fallback": "Latest release page",
    "hero.release_error":
      "Release check unavailable. Opening latest release page.",
    "hero.release_pending":
      "No public release found yet. Please check back soon.",
    "hero.release_pending_meta": "Public release not available yet",
    "hero.updated": "Updated",
    "trust.local": "Local-first storage",
    "trust.opensource": "Open source (MIT)",
    "trust.private": "No cloud sync required",
    "feature.one.title": "Made for the menu bar",
    "feature.one.body": "Fast access. No clutter.",
    "feature.two.title": "Fast by design",
    "feature.two.body": "Tiny footprint and smooth keyboard flow.",
    "feature.three.title": "Simple install",
    "feature.three.body": "Download. Drag to Applications. Done.",
    "faq.title": "Frequently asked questions",
    "faq.q1.q": "How do I install ClipStack on macOS?",
    "faq.q1.a":
      "Download the DMG, open it, drag ClipStack into Applications, then launch it.",
    "faq.q2.q": "Does ClipStack support Apple Silicon and Intel Macs?",
    "faq.q2.a":
      "Yes. This page automatically serves the latest builds for both chip types.",
    "faq.q3.q": "Is ClipStack open source?",
    "faq.q3.a":
      "Yes, the full source code is available on GitHub under the MIT license.",
    "faq.q4.q": "Where is my clipboard data stored?",
    "faq.q4.a":
      "Clipboard history is stored locally on your Mac. No cloud account is required.",
    "faq.q5.q": "Can I verify the latest version?",
    "faq.q5.a":
      "Yes. Version and download links are read from the latest GitHub Release in real time.",
    "about.title": "About Simon",
    "about.body":
      "I am Simon, a professional software engineer focused on AI products. I build small tools that make daily work easier, and I share the best ones as open-source apps.",
    "footer.rights": "Built with care for focused work.",
    "footer.source": "Source Code",
    "footer.imprint": "Imprint",
  },
  de: {
    "nav.faq": "FAQ",
    "nav.about": "Über",
    "nav.github": "GitHub",
    "hero.badge": "Jetzt für macOS verfügbar",
    "hero.title": "ClipStack",
    "hero.subtitle": "Clipboard-Verlauf in deiner Menüleiste.",
    "hero.cta_arm": "Download für Apple Silicon",
    "hero.cta_intel": "Download für Intel Mac",
    "hero.loading": "Neueste Version wird geladen...",
    "hero.latest": "Aktuelle stabile Version:",
    "hero.release_ready": "Direkter Download bereit",
    "hero.release_fallback": "Neueste Release-Seite",
    "hero.release_error":
      "Release-Prüfung nicht verfügbar. Es wird die neueste Release-Seite geöffnet.",
    "hero.release_pending":
      "Noch kein öffentliches Release verfügbar. Bitte später erneut prüfen.",
    "hero.release_pending_meta": "Öffentliches Release aktuell nicht verfügbar",
    "hero.updated": "Aktualisiert",
    "trust.local": "Lokale Speicherung",
    "trust.opensource": "Open Source (MIT)",
    "trust.private": "Kein Cloud-Sync nötig",
    "feature.one.title": "Für die Menüleiste gebaut",
    "feature.one.body": "Schneller Zugriff. Kein Ballast.",
    "feature.two.title": "Auf Geschwindigkeit optimiert",
    "feature.two.body": "Kleiner Footprint und flüssiger Keyboard-Flow.",
    "feature.three.title": "Einfache Installation",
    "feature.three.body": "Download. In Programme ziehen. Fertig.",
    "faq.title": "Häufige Fragen",
    "faq.q1.q": "Wie installiere ich ClipStack auf macOS?",
    "faq.q1.a":
      "DMG herunterladen, öffnen, ClipStack in Programme ziehen und starten.",
    "faq.q2.q": "Unterstützt ClipStack Apple Silicon und Intel Macs?",
    "faq.q2.a":
      "Ja. Diese Seite liefert automatisch die neuesten Builds für beide Chip-Typen.",
    "faq.q3.q": "Ist ClipStack Open Source?",
    "faq.q3.a":
      "Ja, der gesamte Source Code ist auf GitHub unter der MIT-Lizenz verfügbar.",
    "faq.q4.q": "Wo werden meine Clipboard-Daten gespeichert?",
    "faq.q4.a":
      "Die Zwischenablage-Historie liegt lokal auf deinem Mac. Kein Cloud-Konto notwendig.",
    "faq.q5.q": "Kann ich die aktuelle Version prüfen?",
    "faq.q5.a":
      "Ja. Versionsnummer und Download-Links werden in Echtzeit aus dem neuesten GitHub Release geladen.",
    "about.title": "Über Simon",
    "about.body":
      "Ich bin Simon, professioneller Softwareentwickler mit Fokus auf KI-Produkte. Ich baue kleine Tools, die den Alltag erleichtern, und teile die besten davon als Open-Source-Apps.",
    "footer.rights": "Mit Fokus auf produktives Arbeiten entwickelt.",
    "footer.source": "Quellcode",
    "footer.imprint": "Impressum",
  },
};

const config = {
  ...DEFAULT_CONFIG,
  ...(window.__CLIPSTACK_CONFIG__ || {}),
};

const state = {
  language: "en",
  releaseVersion: null,
};

function t(key) {
  return TEXT[state.language]?.[key] || TEXT.en[key] || key;
}

function detectLanguage() {
  const urlLang = new URLSearchParams(window.location.search).get("lang");
  if (urlLang === "en" || urlLang === "de") {
    return urlLang;
  }

  const saved = window.localStorage.getItem("clipstack_lang");
  if (saved === "en" || saved === "de") {
    return saved;
  }

  const browserLang = (navigator.language || "en").toLowerCase();
  return browserLang.startsWith("de") ? "de" : "en";
}

function setLanguage(language, updateUrl = true) {
  state.language = language;
  document.documentElement.lang = language;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (!key) {
      return;
    }
    el.textContent = t(key);
  });

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-lang") === language);
  });

  window.localStorage.setItem("clipstack_lang", language);

  if (updateUrl) {
    const url = new URL(window.location.href);
    url.searchParams.set("lang", language);
    window.history.replaceState({}, "", url);
  }
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat(state.language === "de" ? "de-DE" : "en-US", {
    dateStyle: "medium",
  }).format(date);
}

function releasePageUrl() {
  return `https://github.com/${config.githubRepo}/releases/latest`;
}

function updateDownloadCard(anchor, metaNode, link, textKey, version) {
  anchor.href = link;
  anchor.classList.remove("is-disabled");
  anchor.removeAttribute("aria-disabled");
  metaNode.textContent = `${t(textKey)}${version ? ` • ${version}` : ""}`;
}

function fallbackDownloadCard(anchor, metaNode) {
  anchor.href = releasePageUrl();
  anchor.classList.add("is-disabled");
  anchor.setAttribute("aria-disabled", "true");
  metaNode.textContent = t("hero.release_fallback");
}

async function loadLatestRelease() {
  const versionNode = document.getElementById("latest-version");
  const updatedNode = document.getElementById("latest-updated");
  const armLink = document.getElementById("download-arm");
  const intelLink = document.getElementById("download-intel");
  const armMeta = document.getElementById("download-arm-meta");
  const intelMeta = document.getElementById("download-intel-meta");

  versionNode.textContent = "v-";
  updatedNode.textContent = t("hero.loading");

  try {
    const res = await fetch(
      `https://api.github.com/repos/${config.githubRepo}/releases/latest`,
      {
        headers: {
          Accept: "application/vnd.github+json",
        },
      },
    );

    if (!res.ok) {
      throw new Error(`GitHub API returned ${res.status}`);
    }

    const release = await res.json();
    const version = (release.tag_name || release.name || "latest").replace(
      /^v/i,
      "",
    );
    state.releaseVersion = version;

    const { armAsset, intelAsset } = selectLatestDmgAssets(
      release.assets || [],
    );

    if (armAsset?.browser_download_url) {
      updateDownloadCard(
        armLink,
        armMeta,
        armAsset.browser_download_url,
        "hero.release_ready",
        version,
      );
    } else {
      fallbackDownloadCard(armLink, armMeta);
    }

    if (intelAsset?.browser_download_url) {
      updateDownloadCard(
        intelLink,
        intelMeta,
        intelAsset.browser_download_url,
        "hero.release_ready",
        version,
      );
    } else {
      fallbackDownloadCard(intelLink, intelMeta);
    }

    versionNode.textContent = `v${version}`;
    const formattedDate = formatDate(
      release.published_at || release.created_at,
    );
    updatedNode.textContent = formattedDate
      ? `${t("hero.updated")} ${formattedDate}`
      : t("hero.release_ready");

    const softwareSchema = document.getElementById("software-schema");
    if (softwareSchema) {
      const schema = JSON.parse(softwareSchema.textContent);
      schema.softwareVersion = version;
      schema.url = config.siteUrl;
      schema.downloadUrl = release.html_url || releasePageUrl();
      softwareSchema.textContent = JSON.stringify(schema);
    }
  } catch (error) {
    const isNotFound = String(
      error && error.message ? error.message : "",
    ).includes("404");
    if (isNotFound) {
      armLink.href =
        config.githubProjectUrl || `https://github.com/${config.githubRepo}`;
      intelLink.href =
        config.githubProjectUrl || `https://github.com/${config.githubRepo}`;
      armLink.classList.add("is-disabled");
      intelLink.classList.add("is-disabled");
      armMeta.textContent = t("hero.release_pending_meta");
      intelMeta.textContent = t("hero.release_pending_meta");
      updatedNode.textContent = t("hero.release_pending");
    } else {
      fallbackDownloadCard(armLink, armMeta);
      fallbackDownloadCard(intelLink, intelMeta);
      updatedNode.textContent = t("hero.release_error");
    }
    versionNode.textContent = "v-";
  }
}

function injectUmami() {
  if (!config.umamiScriptUrl || !config.umamiWebsiteId) {
    return;
  }

  if (document.querySelector(`script[src="${config.umamiScriptUrl}"]`)) {
    return;
  }

  const script = document.createElement("script");
  script.defer = true;
  script.src = config.umamiScriptUrl;
  script.setAttribute("data-website-id", config.umamiWebsiteId);
  document.head.appendChild(script);
}

function trackDownload(arch) {
  if (window.umami && typeof window.umami.track === "function") {
    window.umami.track("download", {
      arch,
      version: state.releaseVersion || "unknown",
      repo: config.githubRepo,
    });
  }
}

function setupLanguageControls() {
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = btn.getAttribute("data-lang") === "de" ? "de" : "en";
      setLanguage(next);
      if (window.umami && typeof window.umami.track === "function") {
        window.umami.track("language_switch", { language: next });
      }
      loadLatestRelease();
    });
  });
}

function setupDownloadTracking() {
  document.querySelectorAll("[data-track-download]").forEach((node) => {
    node.addEventListener("click", () => {
      const arch = node.getAttribute("data-track-download") || "unknown";
      trackDownload(arch);
    });
  });
}

function setupRevealAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
    },
  );

  document
    .querySelectorAll(".reveal, .reveal-delay")
    .forEach((el) => observer.observe(el));
}

function setupStaticLinks() {
  const githubLink = document.getElementById("github-link");
  if (githubLink) {
    githubLink.href =
      config.githubProjectUrl || `https://github.com/${config.githubRepo}`;
  }

  document
    .querySelectorAll('a[href="https://github.com/Glossardi/ClipStack"]')
    .forEach((link) => {
      link.href =
        config.githubProjectUrl || `https://github.com/${config.githubRepo}`;
    });

  const softwareSchema = document.getElementById("software-schema");
  if (softwareSchema) {
    const schema = JSON.parse(softwareSchema.textContent);
    schema.url = config.siteUrl;
    schema.downloadUrl = releasePageUrl();
    softwareSchema.textContent = JSON.stringify(schema);
  }
}

function hidePreload() {
  const preload = document.getElementById("preload");
  if (!preload) {
    return;
  }

  window.setTimeout(() => {
    preload.classList.add("hide");
    window.setTimeout(() => preload.remove(), 360);
  }, 220);
}

function setFooterYear() {
  const yearNode = document.getElementById("footer-year");
  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }
}

function init() {
  setupStaticLinks();
  injectUmami();

  const lang = detectLanguage();
  setLanguage(lang, false);

  setupLanguageControls();
  setupDownloadTracking();
  setupRevealAnimations();
  setFooterYear();
  loadLatestRelease();
  hidePreload();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
