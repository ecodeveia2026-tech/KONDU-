/**
 * KONDU - DriverTrackingMap
 * Carte GPRS ultra-professionnelle dédiée aux chauffeurs.
 * - Hauteur fixe en px pour garantir le rendu Leaflet sur mobile
 * - Aucun overflow:hidden sur les conteneurs parents (bug Leaflet)
 * - invalidateSize() au montage pour forcer le calcul des tuiles
 * - Fallback sur Lomé si les coordonnées sont manquantes
 */
import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/* ===== Icônes ===== */
const makeIcon = (bg: string, emoji: string, pulse = false) =>
  L.divIcon({
    className: '',
    html: `<div style="
        position:relative;
        width:44px;height:44px;
        background:${bg};
        border-radius:50%;
        border:3px solid white;
        box-shadow:0 4px 14px rgba(0,0,0,.45);
        display:flex;align-items:center;justify-content:center;
        font-size:20px;
      ">
      ${emoji}
      ${
        pulse
          ? `<span style="
          position:absolute;inset:-6px;
          border-radius:50%;
          border:2.5px solid ${bg};
          animation:kondu-ring 1.5s infinite;
          opacity:.7;
        "></span>`
          : ''
      }
    </div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -26],
  });

const driverIcon   = makeIcon('#f59e0b', '🚗', true);
const pickupIconA  = makeIcon('#10b981', 'A');
const dropoffIconB = makeIcon('#ef4444', 'B');

/* ===== Recentrage + invalidateSize (fix mobile Leaflet) ===== */
const MapController: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  const initRef = useRef(false);

  useEffect(() => {
    // Force Leaflet à recalculer la taille du conteneur
    setTimeout(() => {
      map.invalidateSize();
      if (!initRef.current) {
        map.setView([lat, lng], 14);
        initRef.current = true;
      }
    }, 200);
  }, [map, lat, lng]);

  useEffect(() => {
    map.setView([lat, lng], 14, { animate: true });
  }, [lat, lng, map]);

  return null;
};

/* ===== Props ===== */
export interface DriverTrackingMapProps {
  driverLat?: number | null;
  driverLng?: number | null;
  pickupLat?: number | null;
  pickupLng?: number | null;
  pickupAddress?: string;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
  dropoffAddress?: string;
  orderStatus?: string;
  clientName?: string;
  estimatedPrice?: number;
}

/* ===== Composant principal ===== */
export const DriverTrackingMap: React.FC<DriverTrackingMapProps> = ({
  driverLat,
  driverLng,
  pickupLat,
  pickupLng,
  pickupAddress = 'Point de ramassage',
  dropoffLat,
  dropoffLng,
  dropoffAddress = 'Destination',
  orderStatus = 'PROVIDER_ACCEPTED',
  clientName = 'Client',
  estimatedPrice,
}) => {
  // Lomé par défaut si aucune coordonnée disponible
  const LOME_LAT = 6.1375;
  const LOME_LNG = 1.2123;

  const safePickupLat = (pickupLat && pickupLat !== 0) ? pickupLat : LOME_LAT;
  const safePickupLng = (pickupLng && pickupLng !== 0) ? pickupLng : LOME_LNG;
  const safeDriverLat = (driverLat && driverLat !== 0) ? driverLat : null;
  const safeDriverLng = (driverLng && driverLng !== 0) ? driverLng : null;
  const safeDropoffLat = (dropoffLat && dropoffLat !== 0) ? dropoffLat : null;
  const safeDropoffLng = (dropoffLng && dropoffLng !== 0) ? dropoffLng : null;

  // Centre prioritaire : chauffeur > ramassage > Lomé
  const centerLat = safeDriverLat ?? safePickupLat;
  const centerLng = safeDriverLng ?? safePickupLng;

  // Tracé de la route
  const routePoints: [number, number][] = [];
  if (safeDriverLat && safeDriverLng) routePoints.push([safeDriverLat, safeDriverLng]);
  routePoints.push([safePickupLat, safePickupLng]);
  if (safeDropoffLat && safeDropoffLng) routePoints.push([safeDropoffLat, safeDropoffLng]);

  const statusConfig: Record<string, { label: string; color: string }> = {
    PROVIDER_ACCEPTED: { label: '🚗 En route vers le client', color: '#f59e0b' },
    ARRIVING:          { label: '📍 Arrivé au point de ramassage', color: '#3b82f6' },
    IN_PROGRESS:       { label: '▶️ Course en cours', color: '#10b981' },
    COMPLETED:         { label: '✅ Course terminée', color: '#6b7280' },
  };
  const status = statusConfig[orderStatus ?? ''] ?? { label: orderStatus, color: '#6b7280' };

  return (
    <>
      {/* CSS global pour l'animation et Leaflet */}
      <style>{`
        @keyframes kondu-ring {
          0%   { transform: scale(1);    opacity: .75; }
          70%  { transform: scale(1.65); opacity: 0;   }
          100% { transform: scale(1.65); opacity: 0;   }
        }
        .kondu-tracking-map .leaflet-container {
          font-family: inherit !important;
          border-radius: 0 0 14px 14px;
        }
        .kondu-tracking-map .leaflet-control-attribution {
          font-size: 9px !important;
        }
      `}</style>

      <div
        className="kondu-tracking-map"
        style={{
          width: '100%',
          borderRadius: 16,
          border: '2px solid #f59e0b',
          boxShadow: '0 4px 24px rgba(0,0,0,.15)',
          background: '#0f172a',
          /* PAS de overflow:hidden ici — ça bloquerait Leaflet */
        }}
      >
        {/* ── Bandeau statut ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: '#0f172a',
          borderRadius: '14px 14px 0 0',
          color: '#f8fafc',
        }}>
          <span style={{ fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 9, height: 9, borderRadius: '50%',
              background: status.color, display: 'inline-block',
              boxShadow: `0 0 6px ${status.color}`,
            }} />
            {status.label}
          </span>
          <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>
            {safeDriverLat
              ? `GPS: ${safeDriverLat.toFixed(4)}, ${safeDriverLng?.toFixed(4)}`
              : '📡 GPS en attente…'}
          </span>
        </div>

        {/* ── Carte Leaflet ── hauteur FIXE en px ── */}
        <div style={{ height: 320, width: '100%' }}>
          <MapContainer
            center={[centerLat, centerLng]}
            zoom={14}
            scrollWheelZoom
            zoomControl
            style={{ height: '100%', width: '100%' }}
            attributionControl
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OSM'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            <MapController lat={centerLat} lng={centerLng} />

            {/* 🚗 Chauffeur */}
            {safeDriverLat && safeDriverLng && (
              <Marker position={[safeDriverLat, safeDriverLng]} icon={driverIcon}>
                <Popup>
                  <strong>🚗 Vous (chauffeur)</strong><br />
                  <span style={{ fontSize: 11 }}>
                    GPS : {safeDriverLat.toFixed(5)}, {safeDriverLng.toFixed(5)}
                  </span>
                </Popup>
              </Marker>
            )}

            {/* A — Ramassage */}
            <Marker position={[safePickupLat, safePickupLng]} icon={pickupIconA}>
              <Popup>
                <strong style={{ color: '#059669' }}>📍 Point A – Ramassage</strong><br />
                <span style={{ fontSize: 11 }}>{pickupAddress}</span><br />
                <span style={{ fontSize: 11, color: '#6b7280' }}>Client : {clientName}</span>
              </Popup>
            </Marker>

            {/* B — Destination */}
            {safeDropoffLat && safeDropoffLng && (
              <Marker position={[safeDropoffLat, safeDropoffLng]} icon={dropoffIconB}>
                <Popup>
                  <strong style={{ color: '#dc2626' }}>🏁 Point B – Destination</strong><br />
                  <span style={{ fontSize: 11 }}>{dropoffAddress}</span>
                  {estimatedPrice && (
                    <><br /><strong style={{ color: '#d97706', fontSize: 13 }}>{estimatedPrice} F CFA</strong></>
                  )}
                </Popup>
              </Marker>
            )}

            {/* Tracé itinéraire */}
            {routePoints.length >= 2 && (
              <>
                <Polyline positions={routePoints} color="#92400e" weight={10} opacity={0.15} />
                <Polyline positions={routePoints} color="#f59e0b" weight={5} opacity={0.9} dashArray="0" />
              </>
            )}
          </MapContainer>
        </div>

        {/* ── Légende ── */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          padding: '8px 16px',
          background: '#1e293b',
          borderRadius: '0 0 14px 14px',
          fontSize: 11,
          color: '#cbd5e1',
          alignItems: 'center',
        }}>
          {safeDriverLat && <span>🚗 <strong style={{ color: '#fbbf24' }}>Vous</strong></span>}
          <span>🟢 <strong>A</strong> Ramassage</span>
          {safeDropoffLat && <span>🔴 <strong>B</strong> Destination</span>}
          {estimatedPrice && (
            <span style={{ marginLeft: 'auto', fontWeight: 800, color: '#fbbf24', fontSize: 13 }}>
              {estimatedPrice} F CFA
            </span>
          )}
        </div>
      </div>
    </>
  );
};

export default DriverTrackingMap;
