import { z } from "zod/v4"
import { Duration } from "luxon"
import { type KeySpace, type KeyValueStore, LocalKeyValueStore } from "~/services/kv-store/KeyValueStore"
import { Option } from "~/types/Option"

// Only the most recently watched videos are remembered, so the stored map can't grow without bound.
export const MAX_SAVED_POSITIONS = 200

// A position this close to either end isn't worth resuming: the viewer barely started, or finished.
const MINIMUM_POSITION = Duration.fromObject({ seconds: 10 })
const END_MARGIN = Duration.fromObject({ seconds: 15 })

const SavedPosition = z.object({
  seconds: z.number().nonnegative(),
  savedAt: z.number(),
})

const SavedPositions = z.record(z.string(), SavedPosition)

type SavedPositions = z.infer<typeof SavedPositions>

const PositionsKey = "positions" as const

const PlaybackPositionKeySpace: KeySpace<typeof PositionsKey, SavedPositions> = {
  name: "playback-position",
  keyEncoder: {
    encode: (value: typeof PositionsKey): string => value
  },
  valueCodec: {
    encode: (value: SavedPositions): string => JSON.stringify(value),
    decode: (value: string): SavedPositions => SavedPositions.parse(JSON.parse(value))
  }
}

export class PlaybackPositionService {
  constructor(
    readonly keyValueStore: KeyValueStore<typeof PositionsKey, SavedPositions>,
    readonly now: () => number = Date.now
  ) {}

  savedPosition(videoId: string): Option<Duration> {
    return this.positions()
      .flatMap(positions => Option.fromNullable(positions[videoId]))
      .map(({ seconds }) => Duration.fromObject({ seconds }))
  }

  /**
   * Remembers where the viewer is in `videoId`, or forgets it when the position is too close to
   * the start or the end to be worth resuming from.
   */
  savePosition(videoId: string, position: Duration, videoDuration: Duration): void {
    if (position.toMillis() < MINIMUM_POSITION.toMillis() || position.toMillis() > videoDuration.minus(END_MARGIN).toMillis()) {
      this.clearPosition(videoId)
      return
    }

    const positions: SavedPositions = {
      ...this.positions().getOrElse(() => ({})),
      [videoId]: { seconds: Math.floor(position.as("seconds")), savedAt: this.now() }
    }

    const mostRecent = Object.entries(positions)
      .sort(([, first], [, second]) => second.savedAt - first.savedAt)
      .slice(0, MAX_SAVED_POSITIONS)

    this.keyValueStore.put(PositionsKey, Object.fromEntries(mostRecent))
  }

  clearPosition(videoId: string): void {
    void this.positions()
      .filter(positions => videoId in positions)
      .forEach(({ [videoId]: _removed, ...remaining }) => this.keyValueStore.put(PositionsKey, remaining))
  }

  private positions(): Option<SavedPositions> {
    return this.keyValueStore.get(PositionsKey)
  }
}

export const playbackPositionService = new PlaybackPositionService(new LocalKeyValueStore(PlaybackPositionKeySpace))
