import { selectLatestDmgAssets } from "./release-utils.js";

const DEFAULT_CONFIG = {
  githubRepo: "Glossardi/ClipStack",
  githubProjectUrl: "https://github.com/Glossardi/ClipStack",
};

const config = {
  ...DEFAULT_CONFIG,
  ...(window.__CLIPSTACK_CONFIG__ || {}),
};

function setFallbackState() {
  const releaseUrl = `${config.githubProjectUrl}/releases/latest`;
  const armLink = document.getElementById("download-arm");
  const intelLink = document.getElementById("download-intel");
  const armLabel = document.getElementById("arm-version");
  const intelLabel = document.getElementById("intel-version");
  const latestVersion = document.getElementById("latest-version");
  const latestUpdated = document.getElementById("latest-updated");

  if (armLink) armLink.href = releaseUrl;
  if (intelLink) intelLink.href = releaseUrl;
  if (armLabel) armLabel.textContent = "Latest version";
  if (intelLabel) intelLabel.textContent = "Latest version";
  if (latestVersion) latestVersion.textContent = "Latest version";
  if (latestUpdated) latestUpdated.textContent = "Open release page fallback";
}

async function fetchLatestRelease() {
  const armLink = document.getElementById("download-arm");
  const intelLink = document.getElementById("download-intel");
  const armLabel = document.getElementById("arm-version");
  const intelLabel = document.getElementById("intel-version");
  const latestVersion = document.getElementById("latest-version");
  const latestUpdated = document.getElementById("latest-updated");

  try {
    const response = await fetch(
      `https://api.github.com/repos/${config.githubRepo}/releases/latest`,
      {
        headers: { Accept: "application/vnd.github+json" },
      },
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const release = await response.json();
    const version = (release.tag_name || "latest").replace(/^v/i, "");
    const updatedAt = release.published_at
      ? new Date(release.published_at).toISOString().slice(0, 10)
      : null;

    const { armAsset, intelAsset } = selectLatestDmgAssets(release.assets || []);
    const releaseUrl = `${config.githubProjectUrl}/releases/latest`;

    if (armLink) {
      armLink.href = armAsset?.browser_download_url || releaseUrl;
    }
    if (intelLink) {
      intelLink.href = intelAsset?.browser_download_url || releaseUrl;
    }

    if (armLabel) armLabel.textContent = `v${version}`;
    if (intelLabel) intelLabel.textContent = `v${version}`;
    if (latestVersion) latestVersion.textContent = `v${version}`;
    if (latestUpdated) {
      latestUpdated.textContent = updatedAt
        ? `Published ${updatedAt}`
        : "Latest release";
    }
  } catch (error) {
    console.warn("Falling back to releases page:", error);
    setFallbackState();
  }
}

function init() {
  fetchLatestRelease();
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
