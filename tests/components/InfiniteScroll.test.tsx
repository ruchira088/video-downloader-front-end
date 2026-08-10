import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import InfiniteScroll from "~/components/infinite-scroll/InfiniteScroll"
import { intersectionObserverCallbacks, intersectionObserverInstances } from "../setup"

describe("InfiniteScroll", () => {
  beforeEach(() => {
    // Clear the callbacks and instances arrays before each test
    intersectionObserverCallbacks.length = 0
    intersectionObserverInstances.length = 0
  })

  test("should render children", () => {
    const loadMore = vi.fn()
    render(
      <InfiniteScroll loadMore={loadMore} hasMore={true}>
        <div data-testid="child">Child Content</div>
      </InfiniteScroll>
    )

    expect(screen.getByTestId("child")).toBeInTheDocument()
    expect(screen.getByText("Child Content")).toBeInTheDocument()
  })

  test("should render multiple children", () => {
    const loadMore = vi.fn()
    render(
      <InfiniteScroll loadMore={loadMore} hasMore={true}>
        <div data-testid="child-1">First</div>
        <div data-testid="child-2">Second</div>
        <div data-testid="child-3">Third</div>
      </InfiniteScroll>
    )

    expect(screen.getByTestId("child-1")).toBeInTheDocument()
    expect(screen.getByTestId("child-2")).toBeInTheDocument()
    expect(screen.getByTestId("child-3")).toBeInTheDocument()
  })

  test("should create IntersectionObserver on mount", () => {
    const loadMore = vi.fn()
    render(
      <InfiniteScroll loadMore={loadMore} hasMore={true}>
        <div>Content</div>
      </InfiniteScroll>
    )

    expect(intersectionObserverCallbacks.length).toBeGreaterThan(0)
  })

  test("should call loadMore when sentinel intersects and hasMore is true", () => {
    const loadMore = vi.fn()
    render(
      <InfiniteScroll loadMore={loadMore} hasMore={true}>
        <div>Content</div>
      </InfiniteScroll>
    )

    // Get the callback and simulate intersection
    const callback = intersectionObserverCallbacks[intersectionObserverCallbacks.length - 1]
    const mockEntry: Partial<IntersectionObserverEntry> = {
      isIntersecting: true,
    }
    callback([mockEntry as IntersectionObserverEntry], {} as IntersectionObserver)

    expect(loadMore).toHaveBeenCalledTimes(1)
  })

  test("should not call loadMore when hasMore is false", () => {
    const loadMore = vi.fn()
    render(
      <InfiniteScroll loadMore={loadMore} hasMore={false}>
        <div>Content</div>
      </InfiniteScroll>
    )

    // Get the callback and simulate intersection
    const callback = intersectionObserverCallbacks[intersectionObserverCallbacks.length - 1]
    const mockEntry: Partial<IntersectionObserverEntry> = {
      isIntersecting: true,
    }
    callback([mockEntry as IntersectionObserverEntry], {} as IntersectionObserver)

    expect(loadMore).not.toHaveBeenCalled()
  })

  test("should not call loadMore when not intersecting", () => {
    const loadMore = vi.fn()
    render(
      <InfiniteScroll loadMore={loadMore} hasMore={true}>
        <div>Content</div>
      </InfiniteScroll>
    )

    // Get the callback and simulate non-intersection
    const callback = intersectionObserverCallbacks[intersectionObserverCallbacks.length - 1]
    const mockEntry: Partial<IntersectionObserverEntry> = {
      isIntersecting: false,
    }
    callback([mockEntry as IntersectionObserverEntry], {} as IntersectionObserver)

    expect(loadMore).not.toHaveBeenCalled()
  })

  test("should update hasMore ref when prop changes", () => {
    const loadMore = vi.fn()
    const { rerender } = render(
      <InfiniteScroll loadMore={loadMore} hasMore={true}>
        <div>Content</div>
      </InfiniteScroll>
    )

    // Get the callback
    const callback = intersectionObserverCallbacks[intersectionObserverCallbacks.length - 1]
    const mockEntry: Partial<IntersectionObserverEntry> = {
      isIntersecting: true,
    }

    // Initially hasMore is true, should call loadMore
    callback([mockEntry as IntersectionObserverEntry], {} as IntersectionObserver)
    expect(loadMore).toHaveBeenCalledTimes(1)

    // Update hasMore to false
    rerender(
      <InfiniteScroll loadMore={loadMore} hasMore={false}>
        <div>Content</div>
      </InfiniteScroll>
    )

    // Should not call loadMore now
    callback([mockEntry as IntersectionObserverEntry], {} as IntersectionObserver)
    expect(loadMore).toHaveBeenCalledTimes(1) // Still 1, not called again
  })

  test("should apply custom className to the list container", () => {
    const loadMore = vi.fn()
    const { container } = render(
      <InfiniteScroll loadMore={loadMore} hasMore={true} className="custom-scroll">
        <div data-testid="child">Content</div>
      </InfiniteScroll>
    )

    // The caller's className lays out the list itself, so it belongs on the element wrapping
    // the children rather than on the outer scroll container which also holds the status row.
    const listContainer = container.querySelector(".custom-scroll")
    expect(listContainer).toBeInTheDocument()
    expect(listContainer).toContainElement(screen.getByTestId("child"))
  })

  test("should handle empty entries array", () => {
    const loadMore = vi.fn()
    render(
      <InfiniteScroll loadMore={loadMore} hasMore={true}>
        <div>Content</div>
      </InfiniteScroll>
    )

    // Get the callback and simulate empty entries (edge case)
    const callback = intersectionObserverCallbacks[intersectionObserverCallbacks.length - 1]
    callback([], {} as IntersectionObserver)

    expect(loadMore).not.toHaveBeenCalled()
  })

  test("should disconnect the observer on cleanup when unmounted", () => {
    const loadMore = vi.fn()
    const { unmount } = render(
      <InfiniteScroll loadMore={loadMore} hasMore={true}>
        <div>Content</div>
      </InfiniteScroll>
    )

    // Verify IntersectionObserver was created
    expect(intersectionObserverInstances.length).toBeGreaterThan(0)

    const observer = intersectionObserverInstances[intersectionObserverInstances.length - 1]
    expect(observer.disconnect).not.toHaveBeenCalled()

    // Unmount the component to trigger cleanup
    unmount()

    expect(observer.disconnect).toHaveBeenCalledTimes(1)
  })

  test("should observe the loading trigger and disconnect it on unmount", () => {
    const loadMore = vi.fn()
    const { unmount, container } = render(
      <InfiniteScroll loadMore={loadMore} hasMore={true}>
        <div>Content</div>
      </InfiniteScroll>
    )

    // The sentinel is the last child of the scroll container
    const sentinel = container.firstChild?.lastChild

    const observer = intersectionObserverInstances[intersectionObserverInstances.length - 1]
    expect(observer.observe).toHaveBeenCalledTimes(1)
    expect(observer.observe).toHaveBeenCalledWith(sentinel)

    unmount()

    expect(observer.disconnect).toHaveBeenCalledTimes(1)
  })

  describe("status", () => {
    test("should show nothing extra by default", () => {
      render(
        <InfiniteScroll loadMore={vi.fn()} hasMore={true}>
          <div>Content</div>
        </InfiniteScroll>
      )

      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument()
      expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    })

    test("should show a spinner while loading", () => {
      render(
        <InfiniteScroll loadMore={vi.fn()} hasMore={true} isLoading>
          <div>Content</div>
        </InfiniteScroll>
      )

      expect(screen.getByRole("progressbar")).toBeInTheDocument()
    })

    test("should offer a retry when loading failed", async () => {
      const onRetry = vi.fn()
      const user = userEvent.setup()

      render(
        <InfiniteScroll loadMore={vi.fn()} hasMore={true} isLoading hasError onRetry={onRetry}>
          <div>Content</div>
        </InfiniteScroll>
      )

      // The error takes precedence over the spinner: a stalled list must offer a way out.
      expect(screen.getByRole("alert")).toBeInTheDocument()
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument()

      await user.click(screen.getByRole("button", { name: /retry/i }))

      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    test("should not show a retry when the caller supplies no handler", () => {
      render(
        <InfiniteScroll loadMore={vi.fn()} hasMore={true} hasError>
          <div>Content</div>
        </InfiniteScroll>
      )

      expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    })

    test("should show the end message only once everything is loaded", () => {
      const { rerender } = render(
        <InfiniteScroll loadMore={vi.fn()} hasMore={true} endMessage="No more videos">
          <div>Content</div>
        </InfiniteScroll>
      )

      expect(screen.queryByText("No more videos")).not.toBeInTheDocument()

      rerender(
        <InfiniteScroll loadMore={vi.fn()} hasMore={false} endMessage="No more videos">
          <div>Content</div>
        </InfiniteScroll>
      )

      expect(screen.getByText("No more videos")).toBeInTheDocument()
    })

    test("should prefer the spinner over the end message while loading", () => {
      render(
        <InfiniteScroll loadMore={vi.fn()} hasMore={false} isLoading endMessage="No more videos">
          <div>Content</div>
        </InfiniteScroll>
      )

      expect(screen.getByRole("progressbar")).toBeInTheDocument()
      expect(screen.queryByText("No more videos")).not.toBeInTheDocument()
    })
  })

  test("should call the latest loadMore callback after a rerender", () => {
    const initialLoadMore = vi.fn()
    const updatedLoadMore = vi.fn()
    const { rerender } = render(
      <InfiniteScroll loadMore={initialLoadMore} hasMore={true}>
        <div>Content</div>
      </InfiniteScroll>
    )

    rerender(
      <InfiniteScroll loadMore={updatedLoadMore} hasMore={true}>
        <div>Content</div>
      </InfiniteScroll>
    )

    const callback = intersectionObserverCallbacks[intersectionObserverCallbacks.length - 1]
    const mockEntry: Partial<IntersectionObserverEntry> = {
      isIntersecting: true,
    }
    callback([mockEntry as IntersectionObserverEntry], {} as IntersectionObserver)

    expect(initialLoadMore).not.toHaveBeenCalled()
    expect(updatedLoadMore).toHaveBeenCalledTimes(1)
  })
})
