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
    const loadMore = useRef<() => void>(props.loadMore)

    hasMore.current = props.hasMore
    loadMore.current = props.loadMore

    useEffect(() => {
        const element = loadingTrigger.current

        if (element != null) {
            const intersectionObserver = new IntersectionObserver(entries => {
                if (entries.length > 0) {
                    const entry = entries[0]
                    if (entry.isIntersecting && hasMore.current) {
                        loadMore.current()
                    }
                }
            })

            intersectionObserver.observe(element)

            return () => intersectionObserver.disconnect()
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