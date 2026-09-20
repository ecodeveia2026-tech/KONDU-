/**
 * ŋdzemɔ - DriverTrackingMap
 * Carte GPRS ultra-professionnelle pour le chauffeur.
 *
 * Logique de navigation par statut :
 *   PROVIDER_ACCEPTED / ARRIVING  →  Chauffeur → Client (point A)
 *   IN_PROGRESS                   →  Chauffeur → Destination (point B)
 *
 * Fixes :
 *   - Aucun overflow:hidden sur les parents (bug Leaflet)
 *   - invalidateSize() après montage pour mobile
 *   - Coordonnées nullable avec fallback Lomé
 *   - Hauteur fixe en px garantie
 */
import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/* ─── Icônes ─────────────────────────────────────────────────────── */
const makeIcon = (bg: string, emoji: string, pulse = false) =>
  L.divIcon({
    className: '',
    html: `<div style="
        position:relative;
        width:44px;height:44px;
        background:${bg};
        border-radius:50%;
        border:3px solid white;
        box-shadow:0 4px 18px rgba(0,0,0,.45);
        display:flex;align-items:center;justify-content:center;
        font-size:20px;
      ">
      ${emoji}
      ${
        pulse
          ? `<span style="
          position:absolute;inset:-6px;border-radius:50%;
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

const driverIcon   = makeIcon('#f59e0b', '🚗', true);  // Chauffeur (pulsant)
const clientIcon   = makeIcon('#10b981', '👤', true);   // Client au ramassage (A)
const dropoffIcon  = makeIcon('#ef4444', '🏁');          // Destination (B)

/* ─── Contrôleur de carte : invalidateSize + recentrage ─────────── */
const MapController: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  const initRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
      if (!initRef.current) {
        map.setView([lat, lng], 14);
        initRef.current = true;
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [map, lat, lng]);

  useEffect(() => {
    if (initRef.current) {
      map.setView([lat, lng], 14, { animate: true });
    }
  }, [lat, lng, map]);

  return null;
};

/* ─── Props ──────────────────────────────────────────────────────── */
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

/* ─── Composant ──────────────────────────────────────────────────── */
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
  /* Coordonnées sécurisées avec fallback Lomé */
  const LOME_LAT = 6.1375;
  const LOME_LNG = 1.2123;

  const safeDriverLat  = (driverLat  && driverLat  !== 0) ? driverLat  : null;
  const safeDriverLng  = (driverLng  && driverLng  !== 0) ? driverLng  : null;
  const safePickupLat  = (pickupLat  && pickupLat  !== 0) ? pickupLat  : LOME_LAT;
  const safePickupLng  = (pickupLng  && pickupLng  !== 0) ? pickupLng  : LOME_LNG;
  const safeDropoffLat = (dropoffLat && dropoffLat !== 0) ? dropoffLat : null;
  const safeDropoffLng = (dropoffLng && dropoffLng !== 0) ? dropoffLng : null;

  /* ─────────────────────────────────────────────────────────────────
     LOGIQUE DE NAVIGATION PAR STATUT
     ─────────────────────────────────────────────────────────────────
     PROVIDER_ACCEPTED / ARRIVING →  Chauffeur ➡ Client (pickup A)
     IN_PROGRESS                  →  Chauffeur ➡ Destination (B)
     Autre                        →  Chauffeur ➡ Pickup (défaut)
  ──────────────────────────────────────────────────────────────────── */
  const isOnWayToClient = ['PROVIDER_ACCEPTED', 'ARRIVING'].includes(orderStatus ?? '');
  const isInProgress    = orderStatus === 'IN_PROGRESS';

  // Tracé de route : toujours depuis le chauffeur
  const routePoints: [number, number][] = [];
  if (safeDriverLat && safeDriverLng) {
    routePoints.push([safeDriverLat, safeDriverLng]);
  }

  if (isInProgress && safeDropoffLat && safeDropoffLng) {
    // Client à bord → aller à la destination
    routePoints.push([safeDropoffLat, safeDropoffLng]);
  } else {
    // En route vers le client → aller au ramassage
    routePoints.push([safePickupLat, safePickupLng]);
    // Afficher également la destination au fond (grisé)
    if (safeDropoffLat && safeDropoffLng) {
      // On ne l'ajoute PAS au tracé principal, juste comme marqueur informatif
    }
  }

  /* Centre de la carte : position du chauffeur en priorité */
  const centerLat = safeDriverLat ?? safePickupLat;
  const centerLng = safeDriverLng ?? safePickupLng;

  /* Statut et instructions vocales */
  type StatusInfo = { label: string; instruction: string; color: string; target: string };
  const statusConfig: Record<string, StatusInfo> = {
    PROVIDER_ACCEPTED: {
      label: '🚗 En route vers le client',
      instruction: `Rejoindre ${clientName} au point de ramassage`,
      color: '#f59e0b',
      target: 'pickup',
    },
    ARRIVING: {
      label: '📍 Arrivé au ramassage',
      instruction: `Attendez ${clientName} — Vous êtes au point de collecte`,
      color: '#3b82f6',
      target: 'pickup',
    },
    IN_PROGRESS: {
      label: '▶️ Course en cours',
      instruction: `En route vers la destination`,
      color: '#10b981',
      target: 'dropoff',
    },
    COMPLETED: {
      label: '✅ Course terminée',
      instruction: 'Merci pour cette course !',
      color: '#6b7280',
      target: 'none',
    },
  };
  const st: StatusInfo = statusConfig[orderStatus ?? ''] ?? {
    label: orderStatus ?? '',
    instruction: '',
    color: '#6b7280',
    target: 'pickup',
  };

  return (
    <>
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
        .kondu-tracking-map .leaflet-control-attribution { font-size: 9px !important; }
      `}</style>

      <div
        className="kondu-tracking-map"
        style={{
          width: '100%',
          borderRadius: 16,
          border: `2px solid ${st.color}`,
          boxShadow: '0 6px 28px rgba(0,0,0,.18)',
          background: '#0f172a',
          /* PAS de overflow:hidden → laisserait Leaflet s'afficher correctement */
        }}
      >
        {/* ── En-tête statut ── */}
        <div style={{
          padding: '10px 16px',
          background: '#0f172a',
          borderRadius: '14px 14px 0 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 9, height: 9, borderRadius: '50%',
                background: st.color,
                display: 'inline-block',
                boxShadow: `0 0 8px ${st.color}`,
              }} />
              {st.label}
            </span>
            <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>
              {safeDriverLat
                ? `GPS: ${safeDriverLat.toFixed(4)}, ${safeDriverLng?.toFixed(4)}`
                : '📡 GPS en attente…'}
            </span>
          </div>
          {/* Instruction de navigation */}
          <div style={{
            fontSize: 11, color: st.color, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 6,
            paddingLeft: 18,
          }}>
            <span>→</span>
            <span>{st.instruction}</span>
          </div>
        </div>

        {/* ── Carte Leaflet (hauteur fixe px) ── */}
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
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />

            <MapController lat={centerLat} lng={centerLng} />

            {/* 🚗 Position du Chauffeur */}
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

            {/* 👤 Position du Client (point A – ramassage) */}
            {/* Toujours affiché pour que le chauffeur sache où aller */}
            <Marker position={[safePickupLat, safePickupLng]} icon={clientIcon}>
              <Popup>
                <strong style={{ color: '#059669' }}>
                  {isOnWayToClient ? '👤 Client – Point de collecte' : '✅ Ramassage effectué'}
                </strong><br />
                <span style={{ fontSize: 11 }}><strong>{clientName}</strong></span><br />
                <span style={{ fontSize: 11, color: '#6b7280' }}>{pickupAddress}</span>
              </Popup>
            </Marker>

            {/* 🏁 Destination (point B) – toujours visible comme info */}
            {safeDropoffLat && safeDropoffLng && (
              <Marker position={[safeDropoffLat, safeDropoffLng]} icon={dropoffIcon}>
                <Popup>
                  <strong style={{ color: '#dc2626' }}>🏁 Destination finale</strong><br />
                  <span style={{ fontSize: 11 }}>{dropoffAddress}</span>
                  {estimatedPrice && (
                    <><br /><strong style={{ color: '#d97706', fontSize: 13 }}>
                      {estimatedPrice} F CFA
                    </strong></>
                  )}
                </Popup>
              </Marker>
            )}

            {/* ══ TRACÉ PRINCIPAL : Chauffeur → Cible active ══ */}
            {routePoints.length >= 2 && (
              <>
                {/* Halo */}
                <Polyline
                  positions={routePoints}
                  color={isInProgress ? '#065f46' : '#92400e'}
                  weight={10}
                  opacity={0.18}
                />
                {/* Ligne principale */}
                <Polyline
                  positions={routePoints}
                  color={isInProgress ? '#10b981' : '#f59e0b'}
                  weight={5}
                  opacity={0.95}
                />
              </>
            )}

            {/* Tracé secondaire grisé : Ramassage → Destination (contexte) */}
            {!isInProgress && safePickupLat && safeDropoffLat && safeDropoffLng && (
              <Polyline
                positions={[
                  [safePickupLat, safePickupLng],
                  [safeDropoffLat, safeDropoffLng],
                ]}
                color="#94a3b8"
                weight={3}
                opacity={0.45}
                dashArray="5, 8"
              />
            )}
          </MapContainer>
        </div>

        {/* ── Légende ── */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 10,
          padding: '8px 16px',
          background: '#1e293b',
          borderRadius: '0 0 14px 14px',
          fontSize: 11, color: '#cbd5e1', alignItems: 'center',
        }}>
          {safeDriverLat && <span>🚗 <strong style={{ color: '#fbbf24' }}>Vous</strong></span>}
          <span>👤 <strong style={{ color: '#34d399' }}>Client</strong> – {pickupAddress}</span>
          {safeDropoffLat && (
            <span>🏁 <strong style={{ color: '#f87171' }}>Destination</strong> – {dropoffAddress}</span>
          )}
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
