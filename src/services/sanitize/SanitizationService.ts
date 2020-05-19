import {List, NonEmptyList} from "monet"
import memoize from "memoizee"
import {randomPickNonEmptyList} from "utils/Random"
import {AssetUrl} from "../asset/AssetService";

import image_01 from "images/image-01.jpg"
import image_02 from "images/image-02.jpg"
import image_03 from "images/image-03.jpg"
import image_04 from "images/image-04.jpg"
import image_05 from "images/image-05.jpg"
import image_06 from "images/image-06.jpg"
import image_07 from "images/image-07.jpg"
import image_08 from "images/image-08.jpg"
import image_09 from "images/image-09.jpg"
import image_10 from "images/image-10.jpg"
import image_11 from "images/image-11.jpg"

const SAFE_IMAGES: NonEmptyList<AssetUrl> =
    NonEmptyList(image_01, List.from([
        image_02, image_03, image_04, image_05, image_06, image_07, image_08, image_09, image_10, image_11
    ]))

const SAFE_PHRASES: NonEmptyList<string> =
    NonEmptyList(
        "Chuck Norris doesn’t read books. He stares them down until he gets the information he wants.",
        List.from([
            "Time waits for no man. Unless that man is Chuck Norris.",
            "If you spell Chuck Norris in Scrabble, you win. Forever.",
            "When God said, “Let there be light!” Chuck said, “Say Please.”",
            "Chuck Norris has a mug of nails instead of coffee in the morning.",
            "Chuck Norris’ tears cure cancer. Too bad he has never cried.",
            "Chuck Norris counted to infinity… twice.",
            "Chuck Norris can kill two stones with one bird.",
            "Chuck Norris can strangle you with a cordless phone.",
            "Chuck Norris doesn’t wear a watch. He decides what time it is."
        ])
    )

export const imageMappings =
    memoize(key => randomPickNonEmptyList(SAFE_IMAGES), { max: 100, length: 1 })

export const phraseMappings =
    memoize(key => randomPickNonEmptyList(SAFE_PHRASES), { max: 100, length: 1 })
