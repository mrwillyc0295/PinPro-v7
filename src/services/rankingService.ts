import { db } from '../firebase';
import { doc, updateDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '../contexts/AuthContext';

export const RANKING_CONSTANTS = {
  TRUST_BOOST_VALUE: 50,
  PREMIUM_BOOST_VALUE: 100,
  ACTIVITY_BOOST_BASE: 20,
  LOCATION_BOOST_BASE: 10,
  RATING_MULTIPLIER: 15, // Cada estrella vale 15 puntos
};

/**
 * Calculates the ranking score for a professional based on the provided logic.
 */
export function calculateRankingScore(profile: any): number {
  if (profile.role !== 'Profesional') return 0;

  let score = profile.baseScore || 0;

  // 1. Trust Boost (Verified priority)
  const trustBoost = profile.verificationStatus === 'verified' ? RANKING_CONSTANTS.TRUST_BOOST_VALUE : 0;
  score += trustBoost;

  // 2. Premium Boost
  const premiumBoost = profile.isPremium ? RANKING_CONSTANTS.PREMIUM_BOOST_VALUE : 0;
  score += premiumBoost;

  // 3. Rating Boost (Impact of reviews)
  const rating = profile.rating || 5; // Default to 5 if no reviews
  const totalReviews = profile.totalReviews || 0;
  const ratingBoost = rating * RANKING_CONSTANTS.RATING_MULTIPLIER * (totalReviews > 0 ? 1 : 0.5); // Boost less if no reviews (avoid fake 5.0)
  score += ratingBoost;

  // 4. Activity Boost (Recent activity)
  const activityBoost = profile.activityBoost || 0;
  score += activityBoost;

  // 5. Location Boost
  const locationBoost = profile.locationBoost || 0;
  score += locationBoost;

  // 6. Admin Boost (Manual override)
  let adminBoost = 0;
  if (profile.adminBoost && profile.adminBoostExpiry) {
    const now = new Date();
    const expiry = profile.adminBoostExpiry instanceof Timestamp
      ? profile.adminBoostExpiry.toDate()
      : new Date(profile.adminBoostExpiry);

    if (expiry > now) {
      adminBoost = profile.adminBoost;
    }
  }
  score += adminBoost;

  // 7. Penalties (Complaints/Cancellations)
  const penalties = profile.penalties || 0;
  score -= penalties;

  return Math.max(0, score);
}

/**
 * Updates the finalScore of a professional in Firestore.
 */
export async function updateProfessionalScore(uid: string, profile: any) {
  const finalScore = calculateRankingScore(profile);

  const proRef = doc(db, 'profesionales', uid);
  await updateDoc(proRef, {
    finalScore,
    trustBoost: profile.verificationStatus === 'verified' ? RANKING_CONSTANTS.TRUST_BOOST_VALUE : 0,
    premiumBoost: profile.isPremium ? RANKING_CONSTANTS.PREMIUM_BOOST_VALUE : 0,
    updatedAt: serverTimestamp()
  });
}

/**
 * Algoritmo de Ordenamiento PinPro
 * Ordena por: 1. Nivel de suscripción, 2. Score Final (incluye rating), 3. Distancia
 */
export function ordenarProfesionales(lista: any[], userLat: number, userLon: number) {
    return lista.sort((a, b) => {
        // 1. Prioridad por Nivel (Elite/3 > Premium/2 > Gratis/1)
        const getLevel = (pro: any) => {
            if (typeof pro.subscription_level === 'number') return pro.subscription_level;
            return pro.level === 'elite' ? 3 : (pro.level === 'premium' ? 2 : 1);
        }

        const levelA = getLevel(a);
        const levelB = getLevel(b);

        if (levelA !== levelB) {
            return levelB - levelA;
        }

        // 2. Score Final (Ranking calculado que incluye rating, verificación, etc)
        const scoreA = a.finalScore || 0;
        const scoreB = b.finalScore || 0;

        if (scoreA !== scoreB) {
            return scoreB - scoreA;
        }

        // 3. Si tienen el mismo score, ordenamos por distancia
        const distA = calcularDistancia(userLat, userLon, a.lat || a.latitude || 0, a.lng || a.longitude || 0);
        const distB = calcularDistancia(userLat, userLon, b.lat || b.latitude || 0, b.lng || b.longitude || 0);

        return distA - distB;
    });
}

/**
 * Returns special CSS class for featured professionals
 */
export function getProfessionalCardClass(pro: any): string {
    const level = typeof pro.subscription_level === 'number' ? pro.subscription_level :
                  (pro.level === 'elite' ? 3 : (pro.level === 'premium' ? 2 : 1));
    return (level === 3 || level === 2) ? 'featured-glow' : '';
}

/**
 * Helper para calcular distancia (Haversine)
 */
export function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distancia en km
}
