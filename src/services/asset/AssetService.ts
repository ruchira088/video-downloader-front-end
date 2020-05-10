import {List, NonEmptyList} from "monet";
import configuration from "services/Configuration";
import {randomPickNonEmptyList} from "utils/Random"

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

type AssetUrl = string

const SAFE_IMAGES: NonEmptyList<AssetUrl> =
    NonEmptyList(image_01, List.from([
        image_02, image_03, image_04, image_05, image_06, image_07, image_08, image_09, image_10, image_11
    ]))

export const assetUrl =
    (id: string): AssetUrl =>
        configuration.safeMode ? randomPickNonEmptyList(SAFE_IMAGES) : `${configuration.apiService}/assets/id/${id}`
