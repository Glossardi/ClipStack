// @ts-check

/**
 * @typedef {Object} UpdatePayload
 * @property {boolean | undefined} [available]
 * @property {() => Promise<void>} downloadAndInstall
 */

/**
 * @typedef {Object} UpdateDeps
 * @property {() => Promise<UpdatePayload | null | undefined>} check
 * @property {() => Promise<void>} relaunch
 * @property {{ error: (...args: unknown[]) => void }} [logger]
 */

/**
 * @typedef {"up-to-date" | "updated" | "failed"} UpdateFlowResult
 */

/**
 * @typedef {UpdateFlowResult | "skipped"} StartupUpdateResult
 */

let hasCheckedAtStartup = false;
/** @type {Promise<UpdateFlowResult> | null} */
let inFlightCheck = null;
/** Timestamp of last successful update check (ms). 0 = never. */
let lastCheckedAt = 0;
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

/**
 * @param {UpdatePayload | null | undefined} update
 */
function hasUpdate(update) {
  if (!update) {
    return false;
  }

  if (typeof update.available === "boolean") {
    return update.available;
  }

  return true;
}

/**
 * @param {UpdateDeps} deps
 * @returns {Promise<UpdateFlowResult>}
 */
export async function runUpdateFlow({ check, relaunch, logger = console }) {
  try {
    const update = await check();
    if (!update || !hasUpdate(update)) {
      return "up-to-date";
    }

    await update.downloadAndInstall();
    await relaunch();
    return "updated";
  } catch (error) {
    logger.error("Update check failed:", error);
    return "failed";
  }
}

/**
 * @returns {Promise<UpdateDeps>}
 */
async function resolveUpdaterDeps() {
  const [{ check }, { relaunch }] = await Promise.all([
    import("@tauri-apps/plugin-updater"),
    import("@tauri-apps/plugin-process"),
  ]);

  return { check, relaunch, logger: console };
}

/**
 * @param {UpdateDeps} [deps]
 * @returns {Promise<StartupUpdateResult>}
 */
export async function checkForUpdatesOnStartup(deps) {
  if (inFlightCheck) {
    return inFlightCheck;
  }

  if (hasCheckedAtStartup) {
    return "skipped";
  }

  hasCheckedAtStartup = true;
  inFlightCheck = (async () => {
    const resolvedDeps = deps ?? (await resolveUpdaterDeps());
    const result = await runUpdateFlow(resolvedDeps);
    lastCheckedAt = Date.now();
    return result;
  })().finally(() => {
    inFlightCheck = null;
  });

  return inFlightCheck;
}

/**
 * Check for updates on window focus, throttled to once per hour.
 * Safe to call on every focus event.
 * @param {UpdateDeps} [deps]
 * @returns {Promise<StartupUpdateResult>}
 */
export async function checkForUpdatesOnFocus(deps) {
  if (inFlightCheck) return inFlightCheck;
  if (Date.now() - lastCheckedAt < CHECK_INTERVAL_MS) return "skipped";

  inFlightCheck = (async () => {
    const resolvedDeps = deps ?? (await resolveUpdaterDeps());
    const result = await runUpdateFlow(resolvedDeps);
    lastCheckedAt = Date.now();
    return result;
  })().finally(() => {
    inFlightCheck = null;
  });

  return inFlightCheck;
}

export function _resetUpdaterStateForTests() {
  hasCheckedAtStartup = false;
  inFlightCheck = null;
  lastCheckedAt = 0;
}
