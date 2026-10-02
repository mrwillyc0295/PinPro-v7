import React, { ReactNode } from 'react';
import ErrorBoundary from './ErrorBoundary';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  componentName?: string;
}

export const SafeBoundary: React.FC<Props> = ({ children, fallback, componentName }) => {
  return (
    <ErrorBoundary local={true} componentName={componentName} fallback={fallback}>
      {children}
    </ErrorBoundary>
  );
};
