import {type FC, type ReactNode, useEffect, useRef} from "react"
import classNames from "classnames"

import styles from "./InfiniteScroll.module.scss"

type InfiniteScrollProps = {
    readonly loadMore: () => void
    readonly hasMore: boolean
    readonly children: ReactNode
    readonly className?: string
}

const InfiniteScroll: FC<InfiniteScrollProps> = props => {
    const loadingTrigger = useRef<HTMLDivElement | null>(null)
    const hasMore = useRef<boolean>(props.hasMore)

    hasMore.current = props.hasMore

    useEffect(() => {
        if (loadingTrigger.current != null) {
            const intersectionObserver = new IntersectionObserver(entries => {
                if (entries.length > 0) {
                    const entry = entries[0]
                    if (entry.isIntersecting && hasMore.current) {
                        props.loadMore()
                    }
                }
            })

            intersectionObserver.observe(loadingTrigger.current)

            return () => {
                if (loadingTrigger.current != null) {
                    intersectionObserver.unobserve(loadingTrigger.current)
                }
            }
        }
    }, []);

    return (
        <div className={classNames(styles.infiniteScroll, props.className)}>
            {props.children}
            <div ref={loadingTrigger} className={classNames(styles.loader)}/>
        </div>
    )
}

export default InfiniteScroll