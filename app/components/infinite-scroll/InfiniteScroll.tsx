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
    const intersectionObserver = useRef<IntersectionObserver | null>(null)
    const wasLoading = useRef<boolean>(props.isLoading === true)

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
            const observer = new IntersectionObserver(entries => {
                if (entries.length > 0) {
                    const entry = entries[0]
                    if (entry.isIntersecting && hasMore.current) {
                        loadMore.current()
                    }
                }
            })

            observer.observe(element)
            intersectionObserver.current = observer

            return () => {
                observer.disconnect()
                intersectionObserver.current = null
            }
        }
    }, []);

    // IntersectionObserver only reports transitions, so if a page settles without pushing the
    // sentinel off-screen (a short or fully de-duplicated page), nothing would ask for the next
    // one. Re-observing makes the observer deliver a fresh entry for the sentinel's current
    // state, which loads another page only if it is still in view. A failed page is skipped: it
    // waits for an explicit retry rather than looping.
    useEffect(() => {
        const settled = wasLoading.current && props.isLoading !== true
        wasLoading.current = props.isLoading === true

        const element = loadingTrigger.current
        const observer = intersectionObserver.current

        if (settled && props.hasMore && props.hasError !== true && element != null && observer != null) {
            observer.unobserve(element)
            observer.observe(element)
        }
    }, [props.isLoading, props.hasMore, props.hasError])

    // The caller's className usually makes the list a grid, so the status row lives outside it
    // rather than becoming a stray cell among the cards.
    return (
        <div className={styles.infiniteScroll}>
            <div className={props.className}>
                {props.children}
            </div>
            <Status {...props}/>
            <div ref={loadingTrigger} className={styles.loader}/>
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
                <CircularProgress size={24} aria-label="Loading more"/>
            </div>
        )
    }

    if (!props.hasMore && props.endMessage != null) {
        return <div className={classNames(styles.status, styles.endMessage)}>{props.endMessage}</div>
    }

    return null
}

export default InfiniteScroll
