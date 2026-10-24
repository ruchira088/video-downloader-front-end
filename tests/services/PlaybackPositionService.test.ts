import { describe, expect, test } from "vitest"
import { Duration } from "luxon"
import { MAX_SAVED_POSITIONS, PlaybackPositionService } from "~/services/playback/PlaybackPositionService"
import type { KeyValueStore } from "~/services/kv-store/KeyValueStore"
import { None, Option, Some } from "~/types/Option"

class InMemoryKeyValueStore<K, V extends {}> implements KeyValueStore<K, V> {
  readonly values = new Map<K, V>()

  put(key: K, value: V): void {
    this.values.set(key, value)
  }

  get(key: K): Option<V> {
    return Option.fromNullable(this.values.get(key))
  }

  remove(key: K): Option<V> {
    const existing = this.get(key)
    this.values.delete(key)
    return existing
  }
}

const seconds = (value: number) => Duration.fromObject({ seconds: value })
const tenMinutes = seconds(600)

const createService = () => {
  let clock = 0
  const store = new InMemoryKeyValueStore<"positions", Record<string, { seconds: number, savedAt: number }>>()
  const service = new PlaybackPositionService(store, () => ++clock)
  return { service, store }
}

describe("PlaybackPositionService", () => {
  test("should return None for a video with no saved position", () => {
    const { service } = createService()

    expect(service.savedPosition("video-1")).toEqual(None.of())
  })

  test("should save and read back a position, in whole seconds", () => {
    const { service } = createService()

    service.savePosition("video-1", seconds(125.8), tenMinutes)

    expect(service.savedPosition("video-1").map(position => position.as("seconds"))).toEqual(Some.of(125))
  })

  test("should keep positions for different videos apart", () => {
    const { service } = createService()

    service.savePosition("video-1", seconds(30), tenMinutes)
    service.savePosition("video-2", seconds(60), tenMinutes)

    expect(service.savedPosition("video-1").map(position => position.as("seconds"))).toEqual(Some.of(30))
    expect(service.savedPosition("video-2").map(position => position.as("seconds"))).toEqual(Some.of(60))
  })

  test.each([
    ["near the start", 5],
    ["near the end", 590],
  ])("should forget the position when it is %s", (_label, position) => {
    const { service } = createService()
    service.savePosition("video-1", seconds(120), tenMinutes)

    service.savePosition("video-1", seconds(position), tenMinutes)

    expect(service.savedPosition("video-1")).toEqual(None.of())
  })

  test("should clear one video's position and leave the others", () => {
    const { service } = createService()
    service.savePosition("video-1", seconds(30), tenMinutes)
    service.savePosition("video-2", seconds(60), tenMinutes)

    service.clearPosition("video-1")

    expect(service.savedPosition("video-1")).toEqual(None.of())
    expect(service.savedPosition("video-2").isEmpty()).toBe(false)
  })

  test("should not write anything when clearing a video that was never saved", () => {
    const { service, store } = createService()

    service.clearPosition("video-1")

    expect(store.values.size).toBe(0)
  })

  test("should keep only the most recently saved positions", () => {
    const { service, store } = createService()

    for (let index = 0; index <= MAX_SAVED_POSITIONS; index++) {
      service.savePosition(`video-${index}`, seconds(30), tenMinutes)
    }

    expect(Object.keys(store.values.get("positions") ?? {})).toHaveLength(MAX_SAVED_POSITIONS)
    expect(service.savedPosition("video-0")).toEqual(None.of())
    expect(service.savedPosition(`video-${MAX_SAVED_POSITIONS}`).isEmpty()).toBe(false)
  })
})
