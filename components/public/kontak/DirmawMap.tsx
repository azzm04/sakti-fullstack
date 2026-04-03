'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon (webpack/Next.js asset issue)
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Koordinat Dirmawa UNDIP Tembalang
const DIRMAWA_POS: [number, number] = [-7.052278, 110.438028];

export default function DirmawMap() {
  return (
    <div className="relative h-64 rounded-2xl overflow-hidden shadow-sm border border-slate-100">
      <MapContainer
        center={DIRMAWA_POS}
        zoom={16}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={DIRMAWA_POS} icon={icon}>
          <Popup>
            <div className="text-sm font-semibold text-slate-800">Dirmawa UNDIP</div>
            <div className="text-xs text-slate-500 mt-0.5">Jl. Prof. Sudarto, Tembalang</div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Badge overlay */}
      <div className="absolute bottom-3 left-3 z-[999] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm pointer-events-none">
        <span className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
        <span className="text-xs font-bold text-primary">DIRMAWA UNDIP</span>
      </div>
    </div>
  );
}
