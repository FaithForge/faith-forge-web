import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import tzlookup from 'tz-lookup';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import {
  MapPin,
  Search,
  Crosshair,
  Globe,
  Clock,
  Loader2,
  Navigation,
  X,
} from 'lucide-react';

export interface CampusLocationData {
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  address?: string | null;
  city?: string | null;
  stateProvince?: string | null;
  country?: string | null;
  countryCode?: string | null;
  locationMetadata?: Record<string, any> | null;
}

export interface CampusLocationPickerProps {
  value: CampusLocationData;
  onChange: (data: CampusLocationData) => void;
  disabled?: boolean;
}

export const COMMON_TIMEZONES = [
  { value: 'America/Bogota', label: 'Bogotá, Lima, Quito (UTC-5)' },
  { value: 'America/New_York', label: 'New York, Miami (UTC-5 / UTC-4)' },
  { value: 'America/Chicago', label: 'Chicago, Dallas (UTC-6 / UTC-5)' },
  { value: 'America/Denver', label: 'Denver (UTC-7 / UTC-6)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (UTC-8 / UTC-7)' },
  { value: 'America/Mexico_City', label: 'Ciudad de México (UTC-6)' },
  { value: 'America/Guatemala', label: 'Guatemala, San Salvador (UTC-6)' },
  { value: 'America/Panama', label: 'Panamá (UTC-5)' },
  { value: 'America/Caracas', label: 'Caracas (UTC-4)' },
  { value: 'America/Santo_Domingo', label: 'Santo Domingo (UTC-4)' },
  { value: 'America/Santiago', label: 'Santiago de Chile (UTC-4 / UTC-3)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (UTC-3)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (UTC-3)' },
  { value: 'Europe/Madrid', label: 'Madrid, Barcelona (UTC+1 / UTC+2)' },
  { value: 'Europe/London', label: 'Londres (UTC+0 / UTC+1)' },
  { value: 'Asia/Dubai', label: 'Dubái (UTC+4)' },
  { value: 'Asia/Shanghai', label: 'Shanghái, Pekín (UTC+8)' },
  { value: 'Asia/Tokyo', label: 'Tokio (UTC+9)' },
  { value: 'UTC', label: 'UTC (Tiempo Universal)' },
];

/**
 * Creates custom Leaflet DivIcon with inline Tailwind styling.
 * Avoids broken external asset URLs in bundler environments.
 *
 * @returns {L.DivIcon} The custom Leaflet icon.
 */
function createPinIcon(): L.DivIcon {
  return L.divIcon({
    className: 'custom-campus-pin',
    html: `
      <div style="transform: translate(-50%, -100%); display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background-color: #4f46e5; color: white; border-radius: 9999px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.25); border: 2.5px solid white;">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

/**
 * Interactive map and geolocation picker for Church Campuses.
 * Integrates Leaflet, OpenStreetMap, Nominatim reverse geocoding, and offline timezone lookup.
 *
 * @param {CampusLocationPickerProps} props - Component properties.
 * @returns {JSX.Element} The rendered geolocation and timezone picker.
 */
export const CampusLocationPicker: React.FC<CampusLocationPickerProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const { t } = useTranslation(['admin', 'common']);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Default coordinate fallback: Bogotá (4.7110, -74.0721)
  const defaultLat = 4.7110;
  const defaultLng = -74.0721;
  const hasCoordinates = value.latitude !== null && value.longitude !== null;

  /**
   * Helper to ensure marker is attached to the map at target position.
   *
   * @param {L.Map} map - Leaflet Map instance.
   * @param {number} lat - Latitude.
   * @param {number} lng - Longitude.
   */
  const setMarkerPosition = (map: L.Map, lat: number, lng: number) => {
    if (!markerRef.current) {
      const pinIcon = createPinIcon();
      const marker = L.marker([lat, lng], {
        icon: pinIcon,
        draggable: !disabled,
      }).addTo(map);

      marker.on('dragend', () => {
        const position = marker.getLatLng();
        handleCoordinatesSelected(position.lat, position.lng);
      });

      markerRef.current = marker;
    } else {
      if (!map.hasLayer(markerRef.current)) {
        markerRef.current.addTo(map);
      }
      markerRef.current.setLatLng([lat, lng]);
    }
  };

  /**
   * Helper to detach marker from map when coordinates are reset.
   *
   * @param {L.Map} map - Leaflet Map instance.
   */
  const removeMarkerFromMap = (map: L.Map) => {
    if (markerRef.current && map.hasLayer(markerRef.current)) {
      map.removeLayer(markerRef.current);
    }
  };

  /**
   * Resolves timezone and performs reverse geocoding for a latitude/longitude pair.
   *
   * @param {number} lat - Latitude.
   * @param {number} lng - Longitude.
   * @returns {Promise<void>}
   */
  const handleCoordinatesSelected = async (lat: number, lng: number) => {
    let detectedTimezone = value.timezone || 'America/Bogota';
    try {
      detectedTimezone = tzlookup(lat, lng);
    } catch {
      // Fallback to previous or default timezone if point is in ocean/unmapped area
    }

    setIsGeocoding(true);
    let address = value.address || '';
    let city = value.city || '';
    let stateProvince = value.stateProvince || '';
    let country = value.country || '';
    let countryCode = value.countryCode || '';
    let locationMetadata = value.locationMetadata || {};

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'es,en;q=0.8',
          },
        },
      );
      if (response.ok) {
        const geoData = await response.json();
        address = geoData.display_name || address;
        const details = geoData.address || {};
        city = details.city || details.town || details.village || details.municipality || details.county || '';
        stateProvince = details.state || details.province || details.region || '';
        country = details.country || '';
        countryCode = (details.country_code || '').toUpperCase();
        locationMetadata = {
          osmId: geoData.osm_id,
          osmType: geoData.osm_type,
          boundingBox: geoData.boundingbox,
          rawAddress: details,
        };
      }
    } catch {
      // Silent error: user can still edit fields manually if network fails
    } finally {
      setIsGeocoding(false);
    }

    onChange({
      ...value,
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
      timezone: detectedTimezone,
      address,
      city,
      stateProvince,
      country,
      countryCode,
      locationMetadata,
    });
  };

  // Initialize and mount Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialCenter: [number, number] = hasCoordinates
      ? [value.latitude!, value.longitude!]
      : [defaultLat, defaultLng];
    const initialZoom = hasCoordinates ? 16 : 11;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
    }).addTo(map);

    if (hasCoordinates) {
      setMarkerPosition(map, value.latitude!, value.longitude!);
    }

    map.on('click', (e: L.LeafletMouseEvent) => {
      if (disabled) return;
      setMarkerPosition(map, e.latlng.lat, e.latlng.lng);
      handleCoordinatesSelected(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;

    // Invalidate size after modal animation settles
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Sync external coordinate changes with map view and marker
  useEffect(() => {
    if (!mapRef.current) return;

    if (value.latitude !== null && value.longitude !== null) {
      setMarkerPosition(mapRef.current, value.latitude, value.longitude);
      mapRef.current.panTo([value.latitude, value.longitude], { animate: true });
    } else {
      // Coordinates cleared or campus without coordinates: remove pin and reset view
      removeMarkerFromMap(mapRef.current);
      mapRef.current.setView([defaultLat, defaultLng], 11, { animate: true });
    }
  }, [value.latitude, value.longitude]);

  /**
   * Searches places using OpenStreetMap Nominatim API.
   *
   * @param {string} query - Location text query.
   * @returns {Promise<void>}
   */
  const handleSearch = async (query: string) => {
    if (!query.trim() || query.trim().length < 3) return;
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query.trim(),
        )}&limit=5&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'es,en;q=0.8',
          },
        },
      );
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
        setShowResults(true);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Centers map on a selected search result.
   *
   * @param {any} result - Nominatim result object.
   */
  const handleSelectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    if (!isNaN(lat) && !isNaN(lng)) {
      if (mapRef.current) {
        mapRef.current.setView([lat, lng], 16, { animate: true });
        setMarkerPosition(mapRef.current, lat, lng);
      }
      handleCoordinatesSelected(lat, lng);
      setShowResults(false);
      setSearchQuery('');
    }
  };

  /**
   * Uses browser Geolocation API to find user's current GPS location.
   */
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 16, { animate: true });
          setMarkerPosition(mapRef.current, lat, lng);
        }
        handleCoordinatesSelected(lat, lng);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  };

  /**
   * Clears the current location and resets the map to default view.
   */
  const handleClearLocation = () => {
    if (disabled) return;
    if (mapRef.current) {
      removeMarkerFromMap(mapRef.current);
      mapRef.current.setView([defaultLat, defaultLng], 11, { animate: true });
    }
    onChange({
      ...value,
      latitude: null,
      longitude: null,
      address: null,
      city: null,
      stateProvince: null,
      country: null,
      countryCode: null,
      locationMetadata: null,
    });
  };

  // Compile timezone choices including currently selected value
  const timezoneOptions = useMemo(() => {
    const existing = COMMON_TIMEZONES.find((tz) => tz.value === value.timezone);
    if (existing) return COMMON_TIMEZONES;
    if (value.timezone) {
      return [{ value: value.timezone, label: `${value.timezone} (Detectada)` }, ...COMMON_TIMEZONES];
    }
    return COMMON_TIMEZONES;
  }, [value.timezone]);

  return (
    <div className="flex flex-col gap-4">
      {/* Search and Current Location Controls */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch(searchQuery);
              }
            }}
            placeholder={t('admin:campuses.location_search_placeholder', 'Buscar dirección o ciudad en el mapa...')}
            className="pr-10 placeholder:text-gray-400 text-xs"
            disabled={disabled}
          />
          <button
            type="button"
            onClick={() => handleSearch(searchQuery)}
            disabled={disabled || isSearching}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-indigo-600 transition-colors"
          >
            {isSearching ? (
              <Loader2 size={16} className="animate-spin text-indigo-600" />
            ) : (
              <Search size={16} />
            )}
          </button>
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={handleUseCurrentLocation}
          disabled={disabled || isLocating}
          title={t('admin:campuses.use_my_location', 'Usar mi ubicación actual')}
          className="shrink-0 p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-2xs"
        >
          {isLocating ? (
            <Loader2 size={16} className="animate-spin text-indigo-600" />
          ) : (
            <Crosshair size={16} className="text-gray-600" />
          )}
        </Button>

        {/* Autocomplete Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute left-0 right-12 top-full mt-1.5 z-50 bg-white rounded-xl shadow-xl border border-gray-200/90 overflow-hidden divide-y divide-gray-100 max-h-60 overflow-y-auto">
            {searchResults.map((res, idx) => (
              <button
                key={res.place_id || idx}
                type="button"
                onClick={() => handleSelectSearchResult(res)}
                className="w-full text-left px-3.5 py-2.5 hover:bg-indigo-50/60 transition-colors flex items-start gap-2 text-xs text-gray-700"
              >
                <MapPin size={14} className="text-indigo-600 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{res.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Canvas */}
      <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-inner bg-slate-100 h-60 w-full z-0">
        <div ref={mapContainerRef} className="h-full w-full" />

        {/* Floating Coordinates & Status Badge */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-[400] flex items-center justify-between pointer-events-none">
          <div className="bg-white/95 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-gray-200/80 shadow-xs flex items-center gap-2 text-[11px] font-medium text-gray-700 pointer-events-auto">
            <Navigation size={12} className="text-indigo-600" />
            {hasCoordinates ? (
              <span>
                {value.latitude?.toFixed(4)}, {value.longitude?.toFixed(4)}
              </span>
            ) : (
              <span className="text-gray-400">
                {t('admin:campuses.click_map_to_pin', 'Haz clic en el mapa para ubicar')}
              </span>
            )}
            {isGeocoding && <Loader2 size={11} className="animate-spin text-indigo-600 ml-1" />}
          </div>

          {hasCoordinates && (
            <button
              type="button"
              onClick={handleClearLocation}
              disabled={disabled}
              className="pointer-events-auto bg-white/95 hover:bg-rose-50 text-rose-600 px-2 py-1.5 rounded-lg border border-rose-200/80 shadow-xs text-[10px] font-semibold flex items-center gap-1 transition-colors"
              title="Quitar ubicación seleccionada"
            >
              <X size={12} />
              <span>Quitar pin</span>
            </button>
          )}
        </div>
      </div>

      {/* Editable Address, City & Country Section */}
      <div className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-gray-200/90">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
            <MapPin size={13} className="text-indigo-600" />
            <span>{t('admin:campuses.field_address_label', 'Dirección física de la sede')}</span>
          </label>
          {isGeocoding && (
            <span className="text-[11px] text-indigo-600 font-medium flex items-center gap-1">
              <Loader2 size={11} className="animate-spin" />
              <span>Detectando dirección...</span>
            </span>
          )}
        </div>

        <Input
          value={value.address || ''}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
          placeholder={t('admin:campuses.field_address_placeholder', 'Ej: Cra. 2 # 6-45, Bocagrande')}
          className="text-xs bg-white placeholder:text-gray-400"
          disabled={disabled}
        />
        <p className="text-[11px] text-gray-400 leading-normal">
          {t(
            'admin:campuses.field_address_hint',
            'El mapa sugiere una dirección automáticamente, pero puedes editarla o escribirla con total libertad.',
          )}
        </p>

        {/* City and Country fields */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-200/60 mt-0.5">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-gray-600">
              {t('admin:campuses.field_city_label', 'Ciudad / Municipio')}
            </label>
            <Input
              value={value.city || ''}
              onChange={(e) => onChange({ ...value, city: e.target.value })}
              placeholder={t('admin:campuses.field_city_placeholder', 'Ej: Cartagena')}
              className="text-xs bg-white placeholder:text-gray-400"
              disabled={disabled}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-gray-600">
              {t('admin:campuses.field_country_label', 'País')}
            </label>
            <Input
              value={value.country || ''}
              onChange={(e) => onChange({ ...value, country: e.target.value })}
              placeholder={t('admin:campuses.field_country_placeholder', 'Ej: Colombia')}
              className="text-xs bg-white placeholder:text-gray-400"
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Timezone Selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
          <Clock size={13} className="text-indigo-600" />
          <span>{t('admin:campuses.timezone_label', 'Zona Horaria')}</span>
        </label>
        <Select
          value={value.timezone || 'America/Bogota'}
          onChange={(e) => onChange({ ...value, timezone: e.target.value })}
          disabled={disabled}
          className="border-gray-200 text-xs font-medium text-gray-800"
        >
          {timezoneOptions.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label} ({tz.value})
            </option>
          ))}
        </Select>
        <p className="text-[11px] text-gray-400 leading-normal">
          {t(
            'admin:campuses.timezone_hint',
            'Se detecta automáticamente con las coordenadas. Los recordatorios de servicio se calcularán según este huso horario.',
          )}
        </p>
      </div>
    </div>
  );
};

export default CampusLocationPicker;
