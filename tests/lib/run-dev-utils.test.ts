import {
  isMallocStackLoggingNoise,
  resolveNextDevArgs,
  sanitizeDevEnv,
} from "../../scripts/run-dev-utils.mjs";

describe("run-dev utils", () => {
  it("strips noisy npm and macOS allocator env vars before spawning Next dev", () => {
    const cleanEnv = sanitizeDevEnv({
      PATH: "/usr/bin",
      npm_config_verify_deps_before_run: "true",
      MallocStackLogging: "1",
      MallocNanoZone: "0",
      NODE_TLS_REJECT_UNAUTHORIZED: "0",
      DYLD_INSERT_LIBRARIES: "/tmp/libMallocDebug.dylib",
      CUSTOM_VALUE: "keep-me",
    } as unknown as NodeJS.ProcessEnv);

    expect(cleanEnv).toEqual({
      PATH: "/usr/bin",
      CUSTOM_VALUE: "keep-me",
    });
  });

  it("supports switching dev bundlers without duplicating flags", () => {
    expect(resolveNextDevArgs(["--webpack", "-p", "3001"], {} as NodeJS.ProcessEnv)).toEqual([
      "dev",
      "--webpack",
      "-p",
      "3001",
    ]);
    expect(resolveNextDevArgs(["--turbo"], {} as NodeJS.ProcessEnv)).toEqual(["dev", "--turbopack"]);
    expect(resolveNextDevArgs([], { NEXT_DEV_BUNDLER: "webpack" } as unknown as NodeJS.ProcessEnv)).toEqual([
      "dev",
      "--webpack",
    ]);
  });

  it("recognizes the macOS malloc warning so the launcher can suppress it", () => {
    expect(
      isMallocStackLoggingNoise(
        "node(12345) MallocStackLogging: can't turn off malloc stack logging because it was not enabled.",
      ),
    ).toBe(true);
    expect(isMallocStackLoggingNoise("ready - started server on 0.0.0.0:3000")).toBe(false);
  });
});
