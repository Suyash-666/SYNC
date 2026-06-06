import React from 'react';
import PropTypes from 'prop-types';
import { Skeleton } from './Skeleton';
import EmptyState from '../errors/EmptyState';

/**
 * CardShell — gives every analytics card the same four orthogonal states:
 *
 *   1. isLoading  → shows a soft skeleton inside the card chrome.
 *   2. error      → shows an inline "couldn't load" with a retry button.
 *   3. empty      → shows the friendly EmptyState (the "metadata / placeholder"
 *                   surface the user actually wants to see when there's no
 *                   real data yet — e.g. "no assignments yet").
 *   4. children   → the live, fully-rendered card body.
 *
 * Crucially, **none of the error/empty states cascade to siblings.** A failing
 * attendance call does not blank the assignments chart. Each card consumes
 * its own query and renders independently.
 *
 * The shell does not impose a frame — the calling card provides its own
 * background / border so the placeholder looks identical to the live view.
 */
export default function CardShell({
  isLoading = false,
  error = null,
  isEmpty = false,
  onRetry,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  skeletonVariant = 'block',
  skeletonHeight = 220,
  className = '',
  children,
}) {
  // Loading wins over error/empty so a card never flickers when refetching.
  if (isLoading) {
    return (
      <div className={className}>
        <Skeleton variant={skeletonVariant} className={`w-full`} style={{ height: skeletonHeight }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-2 rounded-2xl border border-danger/30 bg-danger-soft/40 p-6 text-center">
          <div className="text-sm font-semibold text-foreground">Couldn't load this section</div>
          <div className="max-w-xs text-xs text-foreground-muted">
            {typeof error === 'string' ? error : error?.message || 'Try again in a moment.'}
          </div>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-1 rounded-md border border-border bg-surface px-3 py-1 text-xs font-semibold text-foreground hover:border-foreground/30"
            >
              Retry
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={className}>
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          compact
        />
      </div>
    );
  }

  return <>{children}</>;
}

CardShell.propTypes = {
  isLoading: PropTypes.bool,
  error: PropTypes.any,
  isEmpty: PropTypes.bool,
  onRetry: PropTypes.func,
  emptyIcon: PropTypes.node,
  emptyTitle: PropTypes.string,
  emptyDescription: PropTypes.string,
  skeletonVariant: PropTypes.string,
  skeletonHeight: PropTypes.number,
  className: PropTypes.string,
  children: PropTypes.node,
};
