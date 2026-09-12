import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { ProviderProfile } from '../lib/types';
import { Phone, MessageSquare, Crown, Navigation, ShieldCheck } from 'lucide-react';

// Correction des icônes par défaut Leaflet
const createCustomIcon = (color: string, label: string) => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #030712;
        font-weight: bold;
        font-size: 14px;
      ">
        ${label}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

const clientIcon = createCustomIcon('#3b82f6', '📍');
const pickupIcon = createCustomIcon('#10b981', 'A');
const dropoffIcon = createCustomIcon('#ef4444', 'B');

const getVehicleIcon = (type: string, isVip: boolean) => {
  let symbol = '🏍️';
  let color = '#f59e0b';

  if (isVip) {
    color = '#fbbf24';
    symbol = '👑';
  } else if (type === 'taxi') {
    color = '#10b981';
    symbol = '🚕';
  } else if (type === 'tricycle') {
    color = '#eab308';
    symbol = '🛺';
  } else if (type === 'moving' || type === 'delivery') {
    color = '#8b5cf6';
    symbol = '🚚';
  }

  return createCustomIcon(color, symbol);
};

// Composant pour recentrer automatiquement la carte
const RecenterMap: React.FC<{ center: [number, number]; zoom?: number }> = ({ center, zoom = 14 }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

interface LiveMapProps {
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  providers?: ProviderProfile[];
  pickupCoords?: [number, number] | null;
  dropoffCoords?: [number, number] | null;
  pickupAddress?: string;
  dropoffAddress?: string;
  onLocationSelect?: (lat: number, lng: number) => void;
  className?: string;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  centerLat = 6.3703, // Cotonou par défaut (point d'ancrage Afrique de l'Ouest)
  centerLng = 2.3912,
  zoom = 14,
  providers = [],
  pickupCoords,
  dropoffCoords,
  pickupAddress,
  dropoffAddress,
  className = 'h-96 w-full rounded-2xl overflow-hidden',
}) => {
  const currentCenter: [number, number] = [centerLat, centerLng];

  return (
    <div className={`relative ${className} border border-slate-800 shadow-2xl`}>
      <MapContainer
        center={currentCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <RecenterMap center={currentCenter} zoom={zoom} />

        {/* Position actuelle de l'utilisateur / Client */}
        <Marker position={currentCenter} icon={clientIcon}>
          <Popup>
            <div className="text-slate-900 font-sans p-1 text-xs">
              <p className="font-bold flex items-center gap-1 text-blue-600">
                <Navigation className="w-3.5 h-3.5" /> Ma Position Actuelle
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Prêt pour un départ rapide</p>
            </div>
          </Popup>
        </Marker>

        {/* Point de départ spécifique si renseigné */}
        {pickupCoords && (
          <Marker position={pickupCoords} icon={pickupIcon}>
            <Popup>
              <div className="text-slate-900 font-sans text-xs">
                <strong className="text-emerald-700 font-bold block">Point de Départ (A)</strong>
                <span>{pickupAddress || 'Position de départ'}</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Point d'arrivée spécifique si renseigné */}
        {dropoffCoords && (
          <Marker position={dropoffCoords} icon={dropoffIcon}>
            <Popup>
              <div className="text-slate-900 font-sans text-xs">
                <strong className="text-red-600 font-bold block">Destination (B)</strong>
                <span>{dropoffAddress || 'Position d\'arrivée'}</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Tracé de la course entre départ et arrivée */}
        {pickupCoords && dropoffCoords && (
          <Polyline
            positions={[pickupCoords, dropoffCoords]}
            color="#f59e0b"
            weight={4}
            dashArray="6, 8"
          />
        )}

        {/* Chauffeurs actifs et disponibles aux alentours */}
        {providers.map((prov) => {
          if (!prov.current_lat || !prov.current_lng) return null;
          const pos: [number, number] = [prov.current_lat, prov.current_lng];
          const icon = getVehicleIcon(prov.service_type, prov.is_vip);

          return (
            <Marker key={prov.id || prov.user_id} position={pos} icon={icon}>
              <Popup>
                <div className="text-slate-900 font-sans p-1 text-xs min-w-[200px]">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-slate-900 text-sm">
                      {prov.profile?.full_name || 'Chauffeur Pro'}
                    </span>
                    {prov.is_vip && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Crown className="w-2.5 h-2.5 text-amber-600" /> VIP
                      </span>
                    )}
                  </div>

                  <div className="text-slate-600 text-[11px] space-y-0.5 mb-2">
                    <p>Véhicule: <strong className="text-slate-800">{prov.vehicle_brand || 'Véhicule'} {prov.vehicle_model || ''}</strong></p>
                    <p>Plaque: <strong className="text-slate-800">{prov.vehicle_plate || 'Vérifiée'}</strong></p>
                    <p className="flex items-center gap-1 text-emerald-600 font-medium">
                      <ShieldCheck className="w-3 h-3" /> Note: ⭐ {prov.rating_avg.toFixed(1)} ({prov.total_ratings} avis)
                    </p>
                  </div>

                  {/* Actions directes */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                    {prov.profile?.phone && (
                      <a
                        href={`tel:${prov.profile.phone}`}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-900 text-white rounded text-[11px] font-bold hover:bg-slate-800"
                      >
                        <Phone className="w-3 h-3 text-amber-400" /> Appeler
                      </a>
                    )}
                    {prov.profile?.whatsapp && (
                      <a
                        href={`https://wa.me/${prov.profile.whatsapp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-emerald-600 text-white rounded text-[11px] font-bold hover:bg-emerald-500"
                      >
                        <MessageSquare className="w-3 h-3" /> WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
