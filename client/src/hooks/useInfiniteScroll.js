// hooks/useInfiniteScroll.js — Intersection Observer for infinite scroll
import { useEffect, useRef, useCallback } from 'react';

/**
 * useInfiniteScroll
 * @param {Function} onLoadMore - called when bottom sentinel is visible
 * @param {boolean} hasMore - whether there are more items to load
 * @param {boolean} isLoading - whether a fetch is in progress
 * @returns {React.RefObject} sentinelRef - attach to a div at bottom of list
 */
export const useInfiniteScroll = (onLoadMore, hasMore, isLoading) => {
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  const handleIntersect = useCallback(
    (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoading) {
        onLoadMore();
      }
    },
    [onLoadMore, hasMore, isLoading]
  );

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(handleIntersect, {
      rootMargin: '100px',
      threshold: 0.1,
    });

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [handleIntersect]);

  return sentinelRef;
};
