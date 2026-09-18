/**
 * KONDU - DriverTrackingMap
 * Carte GPRS ultra-professionnelle dédiée aux chauffeurs.
 * Affiche : position du chauffeur (en temps réel), point A (ramassage), point B (destination),
 * tracé de l'itinéraire et informations de navigation.
 */
import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ===== Icônes personnalisées =====
const makeIcon = (bg: string, emoji: string, pulse = false) =>
  L.divIcon({
    className: '',
    html: `<div style="
        position:relative;
        width:40px;height:40px;
        background:${bg};
        border-radius:50%;
        border:3px solid white;
        box-shadow:0 4px 14px rgba(0,0,0,.4);
        display:flex;align-items:center;justify-content:center;
        font-size:18px;
      ">
      ${emoji}
      ${pulse ? `<span style="
        position:absolute;inset:-5px;
        border-radius:50%;
        border:2px solid ${bg};
        animation:kondu-pulse 1.4s infinite;
      "></span>` : ''}
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22],
  });

const driverIcon = makeIcon('#f59e0b', '🚗', true);
const pickupIcon = makeIcon('#10b981', 'A');
const dropoffIcon = makeIcon('#ef4444', 'B');

// ===== Recentrage automatique =====
const FlyToCenter: React.FC<{ lat: number; lng: number; zoom: number }> = ({ lat, lng, zoom }) => {
  const map = useMap();
  const prevRef = useRef<string>('');
  useEffect(() => {
    const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
    if (key !== prevRef.current) {
      map.setView([lat, lng], zoom, { animate: true });
      prevRef.current = key;
    }
  }, [lat, lng, zoom, map]);
  return null;
};

// ===== Props =====
export interface DriverTrackingMapProps {
  /** Position actuelle du chauffeur */
  driverLat?: number | null;
  driverLng?: number | null;
  /** Point de ramassage (A) */
  pickupLat: number;
  pickupLng: number;
  pickupAddress?: string;
  /** Destination (B) */
  dropoffLat?: number | null;
  dropoffLng?: number | null;
  dropoffAddress?: string;
  /** Statut actuel de la course */
  orderStatus?: string;
  /** Nom du client */
  clientName?: string;
  /** Prix estimé */
  estimatedPrice?: number;
}

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
  // Centre prioritaire : chauffeur → ramassage → Lomé par défaut
  const centerLat = driverLat ?? pickupLat ?? 6.1375;
  const centerLng = driverLng ?? pickupLng ?? 1.2123;

  // Tracé de l'itinéraire : chauffeur → A (ramassage) → B (destination)
  const routePoints: [number, number][] = [];
  if (driverLat && driverLng) routePoints.push([driverLat, driverLng]);
  routePoints.push([pickupLat, pickupLng]);
  if (dropoffLat && dropoffLng) routePoints.push([dropoffLat, dropoffLng]);

  const statusLabel: Record<string, { text: string; color: string }> = {
    PROVIDER_ACCEPTED: { text: 'En route vers le client', color: '#f59e0b' },
    ARRIVING: { text: 'Arrivé au point de ramassage', color: '#3b82f6' },
    IN_PROGRESS: { text: 'Course en cours', color: '#10b981' },
    COMPLETED: { text: 'Course terminée', color: '#6b7280' },
  };
  const statusInfo = statusLabel[orderStatus] || { text: orderStatus, color: '#6b7280' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* Style Leaflet global */}
      <style>{`
        @keyframes kondu-pulse {
          0%, 100% { transform: scale(1); opacity: .8; }
          50%       { transform: scale(1.55); opacity: 0; }
        }
        .leaflet-container { font-family: inherit; }
        .kondu-map-wrap .leaflet-control-attribution { font-size: 9px; }
      `}</style>

      {/* Bandeau statut */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 14px',
        background: '#0f172a',
        color: '#f8fafc',
        borderRadius: '16px 16px 0 0',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusInfo.color, display: 'inline-block' }}></span>
          {statusInfo.text}
        </span>
        <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
          {driverLat && driverLng
            ? `GPS: ${driverLat.toFixed(4)}, ${driverLng.toFixed(4)}`
            : 'GPS: en attente…'}
        </span>
      </div>

      {/* La carte elle-même — hauteur fixe pour garantir l'affichage */}
      <div className="kondu-map-wrap" style={{ height: 320, width: '100%' }}>
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

          <FlyToCenter lat={centerLat} lng={centerLng} zoom={14} />

          {/* Marqueur chauffeur */}
          {driverLat && driverLng && (
            <Marker position={[driverLat, driverLng]} icon={driverIcon}>
              <Popup>
                <strong>🚗 Vous (chauffeur)</strong><br />
                <span style={{ fontSize: 11 }}>
                  GPS : {driverLat.toFixed(4)}, {driverLng.toFixed(4)}
                </span>
              </Popup>
            </Marker>
          )}

          {/* Point A — Ramassage */}
          <Marker position={[pickupLat, pickupLng]} icon={pickupIcon}>
            <Popup>
              <strong style={{ color: '#10b981' }}>📍 Point A — Ramassage</strong><br />
              <span style={{ fontSize: 11 }}>{pickupAddress}</span><br />
              <span style={{ fontSize: 11, color: '#6b7280' }}>Client : {clientName}</span>
            </Popup>
          </Marker>

          {/* Point B — Destination */}
          {dropoffLat && dropoffLng && (
            <Marker position={[dropoffLat, dropoffLng]} icon={dropoffIcon}>
              <Popup>
                <strong style={{ color: '#ef4444' }}>🏁 Point B — Destination</strong><br />
                <span style={{ fontSize: 11 }}>{dropoffAddress}</span>
                {estimatedPrice && (
                  <><br /><span style={{ fontWeight: 800, color: '#d97706', fontSize: 12 }}>{estimatedPrice} F CFA</span></>
                )}
              </Popup>
            </Marker>
          )}

          {/* Tracé de l'itinéraire */}
          {routePoints.length >= 2 && (
            <>
              {/* Ligne principale */}
              <Polyline
                positions={routePoints}
                color="#f59e0b"
                weight={5}
                opacity={0.85}
              />
              {/* Halo pour lisibilité */}
              <Polyline
                positions={routePoints}
                color="#92400e"
                weight={9}
                opacity={0.18}
              />
            </>
          )}
        </MapContainer>
      </div>

      {/* Légende sous la carte */}
      <div style={{
        display: 'flex', gap: 10, flexWrap: 'wrap',
        padding: '8px 14px',
        background: '#1e293b',
        borderRadius: '0 0 16px 16px',
        fontSize: 11,
        color: '#cbd5e1',
      }}>
        <span>🚗 <strong>Votre position</strong></span>
        <span>🟢 <strong>A</strong> Ramassage</span>
        <span>🔴 <strong>B</strong> Destination</span>
        {estimatedPrice && <span style={{ marginLeft: 'auto', color: '#fbbf24', fontWeight: 800 }}>{estimatedPrice} F CFA</span>}
      </div>
    </div>
  );
};

export default DriverTrackingMap;
