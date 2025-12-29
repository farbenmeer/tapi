import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import { FilesystemCache } from "./filesystem-cache";

describe("FilesystemCache", () => {
  const dir = mkdtempSync(tmpdir() + "test-filesystem-cache-");

  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  afterAll(() => {
    rmSync(dir, { recursive: true });
  });

  test("basic store and retrieve", async () => {
    const sut = new FilesystemCache(resolve(dir, "basic"));

    await sut.set({
      key: "test",
      data: {
        foo: 1,
        bar: "baz",
      },
      ttl: 1000,
      tags: [],
    });

    expect(await sut.get("test")).toEqual({
      data: {
        foo: 1,
        bar: "baz",
      },
      attachment: null,
    });
  });

  test("expire by ttl", async () => {
    const sut = new FilesystemCache(resolve(dir, "expire"));

    vi.setSystemTime(new Date(2025, 12, 26, 23, 21, 0));

    await sut.set({
      key: "test",
      data: {
        foo: 1,
        bar: "baz",
      },
      ttl: 1,
      tags: [],
    });

    vi.setSystemTime(new Date(2025, 12, 26, 23, 21, 10));

    expect(await sut.get("test")).toEqual(null);
  });

  test("expire by tags", async () => {
    const sut = new FilesystemCache(resolve(dir, "tags"));

    await sut.set({
      key: "test",
      data: {
        foo: 1,
        bar: "baz",
      },
      ttl: 1000,
      tags: ["tag1", "tag2"],
    });

    await sut.delete(["tag1"]);

    expect(await sut.get("test")).toEqual(null);

    expect(sut.db.prepare("SELECT * FROM entries").all()).toEqual([]);
    expect(sut.db.prepare("SELECT * FROM tags").all()).toEqual([]);
  });

  test("store binary blob", async () => {
    const sut = new FilesystemCache(resolve(dir, "binary"));

    const numbers = [1, 2, 3, 4, 5];

    await sut.set({
      key: "test",
      ttl: 1000,
      tags: [],
      attachment: new Uint8Array(numbers),
    });

    expect(await sut.get("test")).toEqual({
      data: null,
      attachment: new Uint8Array(numbers),
    });
  });
});
