export function classifyDmgAsset(name) {
  const lower = String(name || "").toLowerCase();
  if (!lower.endsWith(".dmg")) {
    return null;
  }
  if (/(arm64|aarch64|apple[-_ ]?silicon|silicon)/.test(lower)) {
    return "apple_silicon";
  }
  if (/(x86_64|x64|intel|amd64)/.test(lower)) {
    return "intel";
  }
  if (/universal/.test(lower)) {
    return "universal";
  }
  return "unknown";
}

export function selectLatestDmgAssets(assets) {
  const dmgs = (assets || []).filter((asset) =>
    String(asset?.name || "").toLowerCase().endsWith(".dmg"),
  );

  let armAsset = null;
  let intelAsset = null;
  let universalAsset = null;
  const unknownAssets = [];

  dmgs.forEach((asset) => {
    const type = classifyDmgAsset(asset.name || "");
    if (type === "apple_silicon" && !armAsset) {
      armAsset = asset;
    } else if (type === "intel" && !intelAsset) {
      intelAsset = asset;
    } else if (type === "universal" && !universalAsset) {
      universalAsset = asset;
    } else {
      unknownAssets.push(asset);
    }
  });

  if (!armAsset && universalAsset) {
    armAsset = universalAsset;
  }
  if (!intelAsset && universalAsset) {
    intelAsset = universalAsset;
  }

  if (!armAsset && unknownAssets.length) {
    armAsset = unknownAssets[0];
  }
  if (!intelAsset && unknownAssets.length > 1) {
    intelAsset = unknownAssets[1];
  } else if (!intelAsset && unknownAssets.length === 1 && !armAsset) {
    intelAsset = unknownAssets[0];
  }

  return { armAsset, intelAsset };
}
