// @ts-check

import test from "node:test";
import assert from "node:assert/strict";

import {
  _resetUpdaterStateForTests,
  checkForUpdatesOnStartup,
  runUpdateFlow,
} from "./updater.js";

test("runUpdateFlow installs and relaunches when an update is available", async () => {
  let didInstall = false;
  let didRelaunch = false;

  const result = await runUpdateFlow({
    check: async () => ({
      available: true,
      downloadAndInstall: async () => {
        didInstall = true;
      },
    }),
    relaunch: async () => {
      didRelaunch = true;
    },
    logger: { error: () => {} },
  });

  assert.equal(result, "updated");
  assert.equal(didInstall, true);
  assert.equal(didRelaunch, true);
});

test("runUpdateFlow skips install when no update is available", async () => {
  let didRelaunch = false;

  const result = await runUpdateFlow({
    check: async () => null,
    relaunch: async () => {
      didRelaunch = true;
    },
    logger: { error: () => {} },
  });

  assert.equal(result, "up-to-date");
  assert.equal(didRelaunch, false);
});

test("runUpdateFlow logs and returns failed when check throws", async () => {
  /** @type {string[]} */
  const errors = [];

  const result = await runUpdateFlow({
    check: async () => {
      throw new Error("network down");
    },
    relaunch: async () => {},
    logger: {
      error: (...args) => {
        errors.push(args.join(" "));
      },
    },
  });

  assert.equal(result, "failed");
  assert.equal(errors.length, 1);
  assert.match(errors[0], /Update check failed:/);
});

test("checkForUpdatesOnStartup runs updater only once", async () => {
  _resetUpdaterStateForTests();

  let checkCalls = 0;

  const deps = {
    check: async () => {
      checkCalls += 1;
      return null;
    },
    relaunch: async () => {},
    logger: { error: () => {} },
  };

  const [resultA, resultB] = await Promise.all([
    checkForUpdatesOnStartup(deps),
    checkForUpdatesOnStartup(deps),
  ]);
  const resultC = await checkForUpdatesOnStartup(deps);

  assert.equal(resultA, "up-to-date");
  assert.equal(resultB, "up-to-date");
  assert.equal(resultC, "skipped");
  assert.equal(checkCalls, 1);
});
