import test from "node:test";
import assert from "node:assert/strict";
import { classifyDmgAsset, selectLatestDmgAssets } from "./release-utils.js";

test("classifyDmgAsset identifies architectures", () => {
  assert.equal(classifyDmgAsset("ClipStack_1.2.0_aarch64.dmg"), "apple_silicon");
  assert.equal(classifyDmgAsset("ClipStack_1.2.0_x64.dmg"), "intel");
  assert.equal(classifyDmgAsset("ClipStack_1.2.0_universal.dmg"), "universal");
  assert.equal(classifyDmgAsset("ClipStack_1.2.0.dmg"), "unknown");
  assert.equal(classifyDmgAsset("ClipStack_1.2.0.zip"), null);
});

test("selectLatestDmgAssets maps explicit arm/intel assets", () => {
  const assets = [
    { name: "ClipStack_1.2.0_aarch64.dmg", browser_download_url: "https://x/arm" },
    { name: "ClipStack_1.2.0_x64.dmg", browser_download_url: "https://x/intel" }
  ];

  const { armAsset, intelAsset } = selectLatestDmgAssets(assets);
  assert.equal(armAsset?.browser_download_url, "https://x/arm");
  assert.equal(intelAsset?.browser_download_url, "https://x/intel");
});

test("selectLatestDmgAssets uses universal when arch-specific assets are missing", () => {
  const assets = [
    { name: "ClipStack_1.2.0_universal.dmg", browser_download_url: "https://x/universal" }
  ];

  const { armAsset, intelAsset } = selectLatestDmgAssets(assets);
  assert.equal(armAsset?.browser_download_url, "https://x/universal");
  assert.equal(intelAsset?.browser_download_url, "https://x/universal");
});

test("selectLatestDmgAssets falls back to unknown dmg assets", () => {
  const assets = [
    { name: "ClipStack_one.dmg", browser_download_url: "https://x/one" },
    { name: "ClipStack_two.dmg", browser_download_url: "https://x/two" }
  ];

  const { armAsset, intelAsset } = selectLatestDmgAssets(assets);
  assert.equal(armAsset?.browser_download_url, "https://x/one");
  assert.equal(intelAsset?.browser_download_url, "https://x/two");
});
