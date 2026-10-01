import { useState, useEffect } from 'react';
import { onSnapshot, DocumentSnapshot, QuerySnapshot, FirestoreError } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

type SubscriptionTarget = any; // Can be DocumentReference or Query

interface SubscriptionResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useFirestoreSubscription<T>(
  target: SubscriptionTarget | null,
  operationType: OperationType,
  path: string,
  transform: (snapshot: any) => T,
  dependencies: any[] = []
): SubscriptionResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!target) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      target,
      (snapshot: DocumentSnapshot | QuerySnapshot) => {
        try {
          const transformedData = transform(snapshot);
          setData(transformedData);
          setLoading(false);
        } catch (err) {
          console.error("Error transforming Firestore data:", err);
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      },
      (err: FirestoreError) => {
        try {
          handleFirestoreError(err, operationType, path);
        } catch (handledErr) {
          // handleFirestoreError throws, so we catch it to set our local error state
          setError(handledErr instanceof Error ? handledErr : new Error(String(handledErr)));
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return { data, loading, error };
}
