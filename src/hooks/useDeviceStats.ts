import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

let retryCount = 0;

export const logDeviceStats = async (data: any) => {
  if (retryCount > 3) return;
  try {
    await addDoc(collection(db, 'device_stats'), data);
  } catch (e: any) {
    retryCount++;
    console.error('[DeviceStats] Fallo de permisos, silenciando alertas:', e.message);
  }
};
