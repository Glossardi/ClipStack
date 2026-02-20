// @ts-nocheck

let hasCheckedAtStartup = false;
let inFlightCheck = null;

function hasUpdate(update) {
  if (!update) {
    return false;
  }

  if (typeof update.available === "boolean") {
    return update.available;
  }

  return true;
}

export async function runUpdateFlow({ check, relaunch, logger = console }) {
  try {
    const update = await check();
    if (!hasUpdate(update)) {
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

async function resolveUpdaterDeps() {
  const [{ check }, { relaunch }] = await Promise.all([
    import("@tauri-apps/plugin-updater"),
    import("@tauri-apps/plugin-process"),
  ]);

  return { check, relaunch, logger: console };
}

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
    return runUpdateFlow(resolvedDeps);
  })().finally(() => {
    inFlightCheck = null;
  });

  return inFlightCheck;
}

export function _resetUpdaterStateForTests() {
  hasCheckedAtStartup = false;
  inFlightCheck = null;
}
