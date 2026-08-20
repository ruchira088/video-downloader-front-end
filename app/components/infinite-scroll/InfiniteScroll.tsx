import {type FC, type ReactNode, useEffect, useRef} from "react"
import classNames from "classnames"
import {Button, CircularProgress} from "@mui/material"

import styles from "./InfiniteScroll.module.scss"

type InfiniteScrollProps = {
    readonly loadMore: () => void
    readonly hasMore: boolean
    readonly children: ReactNode
    readonly className?: string
    readonly isLoading?: boolean
    readonly hasError?: boolean
    readonly onRetry?: () => void
    // Shown once everything has been loaded. Omit it for lists that have their own empty state.
    readonly endMessage?: ReactNode
}

const InfiniteScroll: FC<InfiniteScrollProps> = props => {
    const loadingTrigger = useRef<HTMLDivElement | null>(null)
    const hasMore = useRef<boolean>(props.hasMore)
    const loadMore = useRef<() => void>(props.loadMore)

    // The observer is created once on mount, so it reads the newest props through refs rather
    // than being torn down and rebuilt on every render. Writing them in an effect (rather than
    // during render) keeps the render pass side-effect free; the refs are seeded with the first
    // render's props above, and this effect runs before any intersection callback can fire.
    useEffect(() => {
        hasMore.current = props.hasMore
        loadMore.current = props.loadMore
    })

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

    // The caller's className usually makes the list a grid, so the status row lives outside it
    // rather than becoming a stray cell among the cards.
    return (
        <div className={classNames(styles.infiniteScroll)}>
            <div className={props.className}>
                {props.children}
            </div>
            <Status {...props}/>
            <div ref={loadingTrigger} className={classNames(styles.loader)}/>
        </div>
    )
}

const Status: FC<InfiniteScrollProps> = props => {
    if (props.hasError && props.onRetry != null) {
        return (
            <div className={classNames(styles.status, styles.error)} role="alert">
                <span>Something went wrong while loading.</span>
                <Button size="small" onClick={props.onRetry}>Retry</Button>
            </div>
        )
    }

    if (props.isLoading) {
        return (
            <div className={styles.status}>
                <CircularProgress size={24}/>
            </div>
        )
    }

    if (!props.hasMore && props.endMessage != null) {
        return <div className={classNames(styles.status, styles.endMessage)}>{props.endMessage}</div>
    }

    return null
}

export default InfiniteScroll
