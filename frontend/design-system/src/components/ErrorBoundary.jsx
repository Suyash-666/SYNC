import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  reloadPage = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-primary)] px-4 text-text-primary">
          <div className="max-w-md rounded-3xl border border-[var(--color-border)] bg-[rgba(17,24,39,0.78)] p-6 text-center shadow-2xl shadow-black/25">
            <h1 className="text-2xl font-semibold">Something went wrong</h1>
            <p className="mt-3 text-sm text-text-secondary">SYNC hit an unexpected error. Reloading the page usually clears it.</p>
            <button type="button" onClick={this.reloadPage} className="mt-6 rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white">
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}