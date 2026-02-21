import { selectLatestDmgAssets } from "./release-utils.js";

const DEFAULT_CONFIG = {
  siteUrl: "https://clipstack.click",
  githubRepo: "Glossardi/ClipStack",
  githubProjectUrl: "https://github.com/Glossardi/ClipStack",
};

const config = {
  ...DEFAULT_CONFIG,
  ...(window.__CLIPSTACK_CONFIG__ || {}),
};

async function loadLatestRelease() {
  const armLabel = document.getElementById("arm-version");
  const intelLabel = document.getElementById("intel-version");
  const armLink = document.getElementById("download-arm");
  const intelLink = document.getElementById("download-intel");

  try {
    const res = await fetch(
      `https://api.github.com/repos/${config.githubRepo}/releases/latest`
    );

    if (!res.ok) {
        throw new Error(`GitHub API Error: ${res.status}`);
    }

    const release = await res.json();
    const version = (release.tag_name || "latest").replace(/^v/i, "");

    const { armAsset, intelAsset } = selectLatestDmgAssets(release.assets || []);

    if (armAsset?.browser_download_url) {
        armLink.href = armAsset.browser_download_url;
        if (armLabel) armLabel.textContent = `Latest stable: v${version}`;
    } else {
        if (armLabel) armLabel.textContent = "Download from GitHub";
        armLink.href = `${config.githubProjectUrl}/releases/latest`;
    }

    if (intelAsset?.browser_download_url) {
        intelLink.href = intelAsset.browser_download_url;
        if (intelLabel) intelLabel.textContent = `Latest stable: v${version}`;
    } else {
        if (intelLabel) intelLabel.textContent = "Download from GitHub";
        intelLink.href = `${config.githubProjectUrl}/releases/latest`;
    }
  } catch (error) {
    console.warn("Falling back to GitHub Release page due to API limit or error", error);
    
    // UI Feedback for error state
    if (armLabel) armLabel.textContent = "Download from GitHub";
    if (intelLabel) intelLabel.textContent = "Download from GitHub";
    
    // Direct link to latest release page as fallback
    if (armLink) armLink.href = `${config.githubProjectUrl}/releases/latest`;
    if (intelLink) intelLink.href = `${config.githubProjectUrl}/releases/latest`;
  }
}

function initReveal() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

function hidePreload() {
  const preload = document.getElementById("preload");
  if (!preload) return;
  setTimeout(() => {
    preload.classList.add("hide");
    setTimeout(() => preload.remove(), 600);
  }, 400);
}

function init() {
  loadLatestRelease();
  initReveal();
  hidePreload();
  
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  
  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === "#") return;
      
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
