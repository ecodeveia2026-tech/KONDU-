import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { ProviderProfile } from '../lib/types';
import { Phone, MessageSquare, Crown, Navigation, ShieldCheck, MapPin, Compass, Layers } from 'lucide-react';

// Repères géographiques majeurs des localités du Togo et quartiers de Lomé
export interface LocalityPoint {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  icon: string;
}

export const TOGO_LOCALITIES: LocalityPoint[] = [
  { id: 'lome-centre', name: 'Lomé Centre (Grand Marché)', region: 'Maritime', lat: 6.1256, lng: 1.2254, icon: '🏛️' },
  { id: 'agoe', name: 'Agoè-Nyivé', region: 'Maritime', lat: 6.2167, lng: 1.2000, icon: '🏙️' },
  { id: 'adidogome', name: 'Adidogomé', region: 'Maritime', lat: 6.1667, lng: 1.1500, icon: '🏡' },
  { id: 'tokoin', name: 'Tokoin Doumassessé', region: 'Maritime', lat: 6.1450, lng: 1.2150, icon: '🏥' },
  { id: 'be-hedzranawoe', name: 'Bè & Hedzranawoé', region: 'Maritime', lat: 6.1600, lng: 1.2400, icon: '📍' },
  { id: 'aeroport', name: 'Aéroport Int. Gnassingbé Eyadéma', region: 'Maritime', lat: 6.1656, lng: 1.2544, icon: '✈️' },
  { id: 'port-lome', name: 'Port Autonome de Lomé', region: 'Maritime', lat: 6.1333, lng: 1.2833, icon: '⚓' },
  { id: 'tsevie', name: 'Tsévié', region: 'Maritime', lat: 6.4333, lng: 1.2167, icon: '🌴' },
  { id: 'kpalime', name: 'Kpalimé', region: 'Plateaux', lat: 6.9000, lng: 0.6333, icon: '⛰️' },
  { id: 'atakpame', name: 'Atakpamé', region: 'Plateaux', lat: 7.5333, lng: 1.1333, icon: '🏞️' },
  { id: 'sokode', name: 'Sokodé', region: 'Centrale', lat: 8.9833, lng: 1.1333, icon: '🕌' },
  { id: 'kara', name: 'Kara', region: 'Kara', lat: 9.5500, lng: 1.1833, icon: '🏔️' },
  { id: 'dapaong', name: 'Dapaong', region: 'Savanes', lat: 10.8667, lng: 0.2000, icon: '🏜️' }
];

// Icônes cartographiques personnalisées ultra lisibles
const createCustomIcon = (color: string, label: string, isPulse: boolean = false) => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        position: relative;
        background-color: ${color};
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 2.5px solid white;
        box-shadow: 0 6px 16px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #030712;
        font-weight: 900;
        font-size: 15px;
      ">
        ${label}
        ${isPulse ? `
          <span style="
            position: absolute;
            inset: -4px;
            border-radius: 50%;
            border: 2px solid ${color};
            animation: pulse-animation 1.5s infinite;
          "></span>
        ` : ''}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
};

const clientIcon = createCustomIcon('#3b82f6', '📍', true);
const pickupIcon = createCustomIcon('#10b981', 'A');
const dropoffIcon = createCustomIcon('#ef4444', 'B');

const localityIcon = (symbol: string) => L.divIcon({
  className: 'locality-map-pin',
  html: `
    <div style="
      background-color: #1e293b;
      color: #f8fafc;
      padding: 3px 8px;
      border-radius: 12px;
      border: 1.5px solid #f59e0b;
      font-size: 11px;
      font-weight: 800;
      box-shadow: 0 4px 10px rgba(0,0,0,0.25);
      display: flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
    ">
      <span>${symbol}</span>
    </div>
  `,
  iconSize: [100, 24],
  iconAnchor: [50, 12],
  popupAnchor: [0, -14],
});

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

  return createCustomIcon(color, symbol, true);
};

// Composant de recentrage automatique de la carte
const RecenterMap: React.FC<{ center: [number, number]; zoom?: number }> = ({ center, zoom = 13 }) => {
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
  showLocalityMarkers?: boolean;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  centerLat = 6.1375, // Lomé par défaut
  centerLng = 1.2123,
  zoom = 13,
  providers = [],
  pickupCoords,
  dropoffCoords,
  pickupAddress,
  dropoffAddress,
  className = 'h-[500px] w-full rounded-3xl overflow-hidden',
  showLocalityMarkers = true,
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([centerLat, centerLng]);
  const [mapZoom, setMapZoom] = useState<number>(zoom);
  const [tileStyle, setTileStyle] = useState<'voyager' | 'standard' | 'dark'>('voyager');

  const tileUrls = {
    voyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    standard: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  };

  const handleSelectLocality = (loc: LocalityPoint) => {
    setMapCenter([loc.lat, loc.lng]);
    setMapZoom(14);
  };

  return (
    <div className={`relative ${className} border border-slate-200/90 shadow-xl bg-slate-100 flex flex-col overflow-hidden`}>
      
      {/* Barre d'outils cartographiques et filtres de localités du Togo */}
      <div className="z-10 bg-white/95 backdrop-blur-md px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        
        {/* Sélecteur de Localités du Togo */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs no-scrollbar">
          <span className="font-bold text-slate-700 flex items-center gap-1 shrink-0 mr-1">
            <Compass className="w-3.5 h-3.5 text-amber-600" /> Localités :
          </span>
          <button
            onClick={() => { setMapCenter([6.1375, 1.2123]); setMapZoom(13); }}
            className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition shrink-0 shadow-2xs"
          >
            Lomé Globale
          </button>
          {TOGO_LOCALITIES.slice(0, 6).map((loc) => (
            <button
              key={loc.id}
              onClick={() => handleSelectLocality(loc)}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-700 font-semibold border border-slate-200 transition shrink-0"
            >
              {loc.icon} {loc.name}
            </button>
          ))}
        </div>

        {/* Style de carte HD */}
        <div className="flex items-center gap-1 shrink-0">
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <button
            onClick={() => setTileStyle('voyager')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${tileStyle === 'voyager' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            HD Claire
          </button>
          <button
            onClick={() => setTileStyle('standard')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${tileStyle === 'standard' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            OSM
          </button>
          <button
            onClick={() => setTileStyle('dark')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${tileStyle === 'dark' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            Nuit
          </button>
        </div>

      </div>

      {/* Conteneur de Carte Leaflet */}
      <div className="relative flex-1 w-full h-full">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url={tileUrls[tileStyle]}
          />

          <RecenterMap center={mapCenter} zoom={mapZoom} />

          {/* Marqueurs des Localités et Quartiers du Togo */}
          {showLocalityMarkers && TOGO_LOCALITIES.map((loc) => (
            <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={localityIcon(`${loc.icon} ${loc.name}`)}>
              <Popup>
                <div className="text-slate-900 font-sans p-1 text-xs">
                  <p className="font-bold text-amber-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {loc.name}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Région : {loc.region} • Coordonnées : {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Position du Client */}
          <Marker position={mapCenter} icon={clientIcon}>
            <Popup>
              <div className="text-slate-900 font-sans p-1 text-xs">
                <p className="font-bold flex items-center gap-1 text-blue-600">
                  <Navigation className="w-3.5 h-3.5" /> Centre GPRS / Position Utilisateur
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Signal GPS temps réel actif (Lomé, Togo)</p>
              </div>
            </Popup>
          </Marker>

          {/* Point de départ (A) */}
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

          {/* Point d'arrivée (B) */}
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

          {/* Tracé dynamique de la course */}
          {pickupCoords && dropoffCoords && (
            <Polyline
              positions={[pickupCoords, dropoffCoords]}
              color="#f59e0b"
              weight={4.5}
              dashArray="6, 8"
            />
          )}

          {/* Chauffeurs actifs en temps réel sur GPRS */}
          {providers.map((prov) => {
            if (!prov.current_lat || !prov.current_lng) return null;
            const pos: [number, number] = [prov.current_lat, prov.current_lng];
            const icon = getVehicleIcon(prov.service_type, prov.is_vip);

            return (
              <Marker key={prov.id || prov.user_id} position={pos} icon={icon}>
                <Popup>
                  <div className="text-slate-900 font-sans p-1 text-xs min-w-[210px]">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {prov.profile?.full_name || 'Chauffeur Partenaire'}
                      </span>
                      {prov.is_vip && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-amber-300">
                          <Crown className="w-3 h-3 text-amber-600 fill-amber-500" /> VIP
                        </span>
                      )}
                    </div>

                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 text-slate-600 text-[11px] space-y-1 mb-2">
                      <p>Service : <strong className="text-amber-600 uppercase font-bold">{prov.service_type}</strong></p>
                      <p>Véhicule : <strong className="text-slate-800">{prov.vehicle_brand || 'Véhicule'} {prov.vehicle_model || ''}</strong></p>
                      <p>Plaque Togolaise : <strong className="text-amber-800 font-mono font-extrabold">{prov.vehicle_plate || 'TG 1234 AB'}</strong></p>
                      <p className="flex items-center gap-1 text-emerald-600 font-bold">
                        <ShieldCheck className="w-3 h-3" /> Note : ⭐ {(prov.rating_avg || 5.0).toFixed(1)} ({prov.total_ratings || 12} avis)
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        GPS : {prov.current_lat.toFixed(4)}, {prov.current_lng.toFixed(4)} (Précision: ±{prov.location_accuracy || 5}m)
                      </p>
                    </div>

                    {/* Actions de contact rapide */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                      {prov.profile?.phone && (
                        <a
                          href={`tel:${prov.profile.phone}`}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold shadow-2xs"
                        >
                          <Phone className="w-3 h-3 text-amber-400" /> Appeler
                        </a>
                      )}
                      {prov.profile?.whatsapp && (
                        <a
                          href={`https://wa.me/${prov.profile.whatsapp.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold shadow-2xs"
                        >
                          <MessageSquare className="w-3 h-3 text-white" /> WhatsApp
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

    </div>
  );
};
