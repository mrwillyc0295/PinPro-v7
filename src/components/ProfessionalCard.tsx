import React from 'react';
import DOMPurify from 'dompurify';

interface ProfessionalCardProps {
  professional: any;
  onClose: () => void;
}

export default function ProfessionalCard({ professional, onClose }: ProfessionalCardProps) {
  // Assuming 'phone' field exists based on the requirement
  const whatsappLink = `https://wa.me/${professional.phone}?text=Hola%20${encodeURIComponent(professional.name)},%20te%20contacté%20a%20través%20de%20PinPro%20y%20necesito%20tus%20servicios.`;

  return (
    <div className="pro-card-overlay" style={{
      position: 'absolute', bottom: '20px', left: '20px', right: '20px',
      backgroundColor: '#18181b', padding: '20px', borderRadius: '16px',
      border: '1px solid #00dc82', color: '#fff', zIndex: 2000,
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="text-lg font-bold">
            {professional.name ? DOMPurify.sanitize(professional.name) : 'Profesional'}
        </h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
      </div>
      <p className="mt-2 text-sm">⭐ Calificación: {professional.rating || 'N/A'} / 5</p>
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'block', backgroundColor: '#25D366', color: '#fff',
          textAlign: 'center', padding: '12px', borderRadius: '8px',
          textDecoration: 'none', fontWeight: 'bold', marginTop: '15px'
        }}
      >
        Contactar por WhatsApp
      </a>
    </div>
  );
}
