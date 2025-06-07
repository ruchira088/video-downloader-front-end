import {type AssetUrl} from "~/services/asset/AssetService"

import image_01 from "~/images/safe-images/image-01.jpg"
import image_02 from "~/images/safe-images/image-02.jpg"
import image_03 from "~/images/safe-images/image-03.jpg"
import image_04 from "~/images/safe-images/image-04.jpg"
import image_05 from "~/images/safe-images/image-05.jpg"
import image_06 from "~/images/safe-images/image-06.jpg"
import image_07 from "~/images/safe-images/image-07.jpg"
import image_08 from "~/images/safe-images/image-08.jpg"
import image_09 from "~/images/safe-images/image-09.jpg"
import image_10 from "~/images/safe-images/image-10.jpg"
import image_11 from "~/images/safe-images/image-11.jpg"

const SAFE_IMAGES: AssetUrl[] = [
  image_01, image_02, image_03, image_04, image_05, image_06, image_07, image_08, image_09, image_10, image_11
]

const SAFE_PHRASES: string[] = [
  "Chuck Norris doesn’t read books. He stares them down until he gets the information he wants.",
  "Time waits for no man. Unless that man is Chuck Norris.",
  "If you spell Chuck Norris in Scrabble, you win. Forever.",
  "When God said, “Let there be light!” Chuck said, “Say Please.”",
  "Chuck Norris has a mug of nails instead of coffee in the morning.",
  "Chuck Norris’ tears cure cancer. Too bad he has never cried.",
  "Chuck Norris counted to infinity… twice.",
  "Chuck Norris can kill two stones with one bird.",
  "Chuck Norris can strangle you with a cordless phone.",
  "Chuck Norris doesn’t wear a video-page. He decides what time it is.",
]

const hashCode =
  (stringValue: string) =>
    stringValue.trim()
      .split("")
      .map((subString, index) => subString.charCodeAt(0) + index)
      .reduce((acc, value) => acc + value, 0)

const mappings = <A>(values: A[]) => {
  if (values.length === 0) {
    throw new Error("Cannot create mappings with an empty list")
  }

  return (key: string): A => {
    const hash = hashCode(key)
    return values[hash % values.length]
  }
}

export const imageMappings: (key: string) => string = mappings(SAFE_IMAGES)

export const phraseMappings: (key: string) => string = mappings(SAFE_PHRASES)

export const translate = (phrase: string, safeMode: boolean): string => safeMode ? phraseMappings(phrase) : phrase