import { useState, useEffect, useCallback, useRef } from 'react';

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export type GeolocationStatus =
  | 'idle'
  | 'requesting'
  | 'acquired'
  | 'denied'
  | 'unavailable'
  | 'timeout'
  | 'error';

export interface GeocodeResult {
  address: string;
  city: string;
  state: string;
  country?: string;
  postcode?: string;
}

export function useGeolocation() {
  const [coordinates, setCoordinates] = useState<GeolocationCoordinates | null>(null);
  const [status, setStatus] = useState<GeolocationStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resolvedLocation, setResolvedLocation] = useState<GeocodeResult | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState<boolean>(false);
  const [isWatching, setIsWatching] = useState<boolean>(false);

  const watchIdRef = useRef<number | null>(null);

  // Clean up watcher on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  // Reverse geocode lat/lng to readable street/city/state
  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<GeocodeResult | null> => {
    setIsReverseGeocoding(true);
    try {
      const res = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
      if (res.ok) {
        const data = await res.json();
        const result: GeocodeResult = {
          address: data.address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          city: data.city || 'National Capital Region',
          state: data.state || 'Delhi',
          country: data.country || 'India',
          postcode: data.postcode
        };
        setResolvedLocation(result);
        setIsReverseGeocoding(false);
        return result;
      }
    } catch (err) {
      console.warn('Reverse geocoding error:', err);
    }

    // Local fallback approximation
    const fallback: GeocodeResult = {
      address: `GPS Fix: ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
      city: 'Field Station',
      state: 'India'
    };
    setResolvedLocation(fallback);
    setIsReverseGeocoding(false);
    return fallback;
  }, []);

  // Acquire current location on demand
  const acquireLocation = useCallback(
    async (options: { reverse?: boolean; highAccuracy?: boolean } = { reverse: true, highAccuracy: true }): Promise<GeolocationCoordinates | null> => {
      if (!navigator.geolocation) {
        setStatus('unavailable');
        setErrorMessage('Geolocation is not supported by your browser or environment.');
        return null;
      }

      setStatus('requesting');
      setErrorMessage(null);

      return new Promise<GeolocationCoordinates | null>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const coords: GeolocationCoordinates = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: Math.round(pos.coords.accuracy * 10) / 10,
              altitude: pos.coords.altitude,
              altitudeAccuracy: pos.coords.altitudeAccuracy,
              heading: pos.coords.heading,
              speed: pos.coords.speed,
              timestamp: pos.timestamp
            };

            setCoordinates(coords);
            setStatus('acquired');
            setErrorMessage(null);

            if (options.reverse !== false) {
              await reverseGeocode(coords.latitude, coords.longitude);
            }

            resolve(coords);
          },
          (err) => {
            console.warn('Geolocation error:', err);
            let reason = 'Failed to acquire location.';
            if (err.code === err.PERMISSION_DENIED) {
              setStatus('denied');
              reason = 'Location permission was denied. Please allow location access in your browser settings to geo-tag inspections.';
            } else if (err.code === err.POSITION_UNAVAILABLE) {
              setStatus('unavailable');
              reason = 'Location information is currently unavailable from your device.';
            } else if (err.code === err.TIMEOUT) {
              setStatus('timeout');
              reason = 'Location request timed out. Retrying or using manual coordinates.';
            } else {
              setStatus('error');
              reason = err.message || reason;
            }
            setErrorMessage(reason);
            resolve(null);
          },
          {
            enableHighAccuracy: options.highAccuracy !== false,
            timeout: 10000,
            maximumAge: 15000
          }
        );
      });
    },
    [reverseGeocode]
  );

  // Toggle real-time GPS tracking watcher
  const toggleWatch = useCallback(() => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation not supported on this browser.');
      return;
    }

    if (isWatching) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsWatching(false);
    } else {
      setIsWatching(true);
      setStatus('requesting');
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const coords: GeolocationCoordinates = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy * 10) / 10,
            altitude: pos.coords.altitude,
            altitudeAccuracy: pos.coords.altitudeAccuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            timestamp: pos.timestamp
          };
          setCoordinates(coords);
          setStatus('acquired');
          setErrorMessage(null);
        },
        (err) => {
          console.warn('GPS Watcher error:', err);
          if (err.code === err.PERMISSION_DENIED) {
            setStatus('denied');
            setErrorMessage('Location permission was denied.');
          }
          setIsWatching(false);
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 10000
        }
      );
    }
  }, [isWatching]);

  return {
    coordinates,
    status,
    errorMessage,
    resolvedLocation,
    isReverseGeocoding,
    isWatching,
    acquireLocation,
    toggleWatch,
    reverseGeocode,
    setCoordinates,
    setResolvedLocation
  };
}
