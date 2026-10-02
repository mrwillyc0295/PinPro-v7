import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { CallUI } from './RealTimeComponents';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export function GlobalCallManager() {
  const { socket } = useSocket();
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [callerName, setCallerName] = useState('Usuario PinPro');

  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = async (data: any) => {
      console.log('Incoming call from:', String(data.from));

      if (data.fromName) {
        setCallerName(data.fromName);
      } else {
        // Try to identify caller name from Firestore fallback
        try {
          const proDoc = await getDoc(doc(db, 'profesionales', data.fromId || data.from));
          if (proDoc.exists()) {
            setCallerName(proDoc.data().name);
          } else {
            const clientDoc = await getDoc(doc(db, 'clientes', data.fromId || data.from));
            if (clientDoc.exists()) {
              setCallerName(clientDoc.data().name);
            }
          }
        } catch (err) {
          console.error("Error fetching caller info:", err);
        }
      }

      setIncomingCall(data);
    };

    socket.on('incoming-call', handleIncomingCall);

    return () => {
      socket.off('incoming-call', handleIncomingCall);
    };
  }, [socket]);

  return (
    <>
      {incomingCall && (
        <CallUI
          recipientId={incomingCall.from}
          recipientName={callerName}
          isIncoming={true}
          isOpen={!!incomingCall}
          onClose={() => {
            setIncomingCall(null);
            setCallerName('Usuario PinPro');
          }}
          offer={incomingCall.offer}
        />
      )}
    </>
  );
}
