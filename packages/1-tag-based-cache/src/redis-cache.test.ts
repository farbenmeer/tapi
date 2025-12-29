import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import { RedisCache } from "./redis-cache";
import { createClient, RedisClientType } from "@redis/client";

describe("RedisCache", () => {
  const redisClient = createClient({
    url: "redis://localhost:6379",
  });

  beforeAll(async () => {
    await redisClient.connect();
  });

  beforeEach(async () => {
    await redisClient.flushAll();
  });

  afterAll(async () => {
    redisClient.destroy();
  });

  test("basic store and retrieve", async () => {
    const sut = new RedisCache(redisClient);

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
    const sut = new RedisCache(redisClient);

    await sut.set({
      key: "test",
      data: {
        foo: 1,
        bar: "baz",
      },
      ttl: 1,
      tags: [],
    });

    // Wait for TTL to expire
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Force Redis to check TTL by trying to get the key
    expect(await sut.get("test")).toEqual(null);
  });

  test("expire by tags", async () => {
    const sut = new RedisCache(redisClient);

    await sut.set({
      key: "test",
      data: {
        foo: 1,
        bar: "baz",
      },
      ttl: 1000,
      tags: ["tag1", "tag2"],
    });

    await sut.set({
      key: "test2",
      data: {
        foo: 2,
        bar: "qux",
      },
      ttl: 1000,
      tags: ["tag2", "tag3"],
    });

    // Delete all entries with tag1
    await sut.delete(["tag1"]);

    // test should be deleted
    expect(await sut.get("test")).toEqual(null);

    // test2 should still exist
    expect(await sut.get("test2")).toEqual({
      data: {
        foo: 2,
        bar: "qux",
      },
      attachment: null,
    });

    // Delete all entries with tag2
    await sut.delete(["tag2"]);

    // Now test2 should also be deleted
    expect(await sut.get("test2")).toEqual(null);
  });

  test("store binary blob", async () => {
    const sut = new RedisCache(redisClient);

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

  test("store both data and attachment", async () => {
    const sut = new RedisCache(redisClient);

    const numbers = [1, 2, 3, 4, 5];

    await sut.set({
      key: "test",
      data: { message: "hello" },
      attachment: new Uint8Array(numbers),
      ttl: 1000,
      tags: ["tag1"],
    });

    expect(await sut.get("test")).toEqual({
      data: { message: "hello" },
      attachment: new Uint8Array(numbers),
    });
  });

  test("delete with multiple tags", async () => {
    const sut = new RedisCache(redisClient);

    // Set up multiple entries with overlapping tags
    await sut.set({
      key: "item1",
      data: { id: 1 },
      ttl: 1000,
      tags: ["user:1", "post:1"],
    });

    await sut.set({
      key: "item2",
      data: { id: 2 },
      ttl: 1000,
      tags: ["user:1", "post:2"],
    });

    await sut.set({
      key: "item3",
      data: { id: 3 },
      ttl: 1000,
      tags: ["user:2", "post:3"],
    });

    // Delete all items for user:1
    await sut.delete(["user:1"]);

    expect(await sut.get("item1")).toEqual(null);
    expect(await sut.get("item2")).toEqual(null);
    expect(await sut.get("item3")).toEqual({
      data: { id: 3 },
      attachment: null,
    });
  });

  test("delete needs to clean up data and attachment keys", async () => {
    const sut = new RedisCache(redisClient);

    await sut.set({
      key: "test",
      data: { foo: "bar" },
      attachment: new Uint8Array([1, 2, 3]),
      ttl: 1000,
      tags: ["tag1"],
    });

    // Verify both keys exist
    expect(await sut.get("test")).toBeTruthy();

    await sut.delete(["tag1"]);

    // Verify all related keys are deleted
    expect(await sut.get("test")).toEqual(null);
    expect(await redisClient.exists("data:test")).toBe(0);
    expect(await redisClient.exists("attachment:test")).toBe(0);
    expect(await redisClient.exists("tags:tag1")).toBe(0);
  });
});
