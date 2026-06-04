import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button, EmptyState } from '../components';

export default function OfflineState({ onRetry }) {
  return (
    <EmptyState
      icon={<WifiOff className="h-7 w-7" />}
      title="You're offline"
      description="We can't reach the server right now. Check your connection and try again."
      actionLabel="Retry"
      onAction={onRetry}
    />
  );
}
