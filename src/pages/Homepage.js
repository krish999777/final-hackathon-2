import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  addDonation,
  addRequest,
  bootstrapStore,
  findHospitalsByType,
  getHospitals,
  getSession,
  isCompatible,
  syncFromBackend,
} from '../services/mockApi';

const bloodTypes = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

const cityCoordinates = {
  pune: { lat: 18.5204, lng: 73.8567 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  nagpur: { lat: 21.1458, lng: 79.0882 },
  delhi: { lat: 28.7041, lng: 77.1025 },
};

const getCoordsForCity = (city) => cityCoordinates[city?.toLowerCase()] || null;
const cityNames = {
  pune: 'Pune',
  mumbai: 'Mumbai',
  nagpur: 'Nagpur',
  delhi: 'Delhi',
};

const Homepage = () => {
  const [session] = useState(() => getSession());
  const [inventory, setInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [lastRequest, setLastRequest] = useState(null);
  const [needType, setNeedType] = useState('A+');

  const [donationForm, setDonationForm] = useState({
    bloodType: 'O+',
    units: 2,
    city: '',
    contact: '',
  });

  const [requestForm, setRequestForm] = useState({
    bloodType: 'A+',
    units: 2,
    city: '',
    urgency: 'Needed in 4 hours',
    clinicalReason: '',
    requestedBy: '',
    contact: '',
  });

  const [userPosition, setUserPosition] = useState(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [bloodFilter, setBloodFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [leafletReady, setLeafletReady] = useState(false);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      const seeded = bootstrapStore();
      setInventory(seeded.inventory);
      setRequests(seeded.requests);
      setHospitals(seeded.hospitals || getHospitals());
    };
    load();
  }, []);

  useEffect(() => {
    if (!window.L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setLeafletReady(true);
      document.body.appendChild(script);
    } else {
      setLeafletReady(true);
    }
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationEnabled(true);
        setLocationError('');
      },
      () => setLocationError('Location blocked; showing all cities.'),
      { enableHighAccuracy: false, timeout: 5000 },
    );
  }, []);

  useEffect(() => {
    if (!userPosition) return;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371;
    let nearest = null;
    let nearestDist = Number.MAX_VALUE;
    Object.entries(cityCoordinates).forEach(([key, coords]) => {
      const dLat = toRad(coords.lat - userPosition.lat);
      const dLng = toRad(coords.lng - userPosition.lng);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(userPosition.lat)) *
          Math.cos(toRad(coords.lat)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const d = Math.round(R * c);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = key;
      }
    });
    const fallbackLabel = userPosition
      ? `Lat ${userPosition.lat.toFixed(3)}, Lng ${userPosition.lng.toFixed(3)}`
      : '';
    const friendlyName = nearest ? cityNames[nearest] || nearest : fallbackLabel;
    if (friendlyName) {
      setDonationForm((prev) => (prev.city ? prev : { ...prev, city: friendlyName }));
      setRequestForm((prev) => (prev.city ? prev : { ...prev, city: friendlyName }));
      setCityFilter((prev) => prev || friendlyName);
    }

    if (leafletReady && mapRef.current && window.L) {
      const centerCoords = getCoordsForCity(nearest) || userPosition;
      if (centerCoords) {
        if (!mapInstance.current) {
          mapInstance.current = window.L.map(mapRef.current).setView([centerCoords.lat, centerCoords.lng], 12);
          window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
          }).addTo(mapInstance.current);
        } else {
          mapInstance.current.setView([centerCoords.lat, centerCoords.lng], 12);
        }
        if (markerRef.current) {
          mapInstance.current.removeLayer(markerRef.current);
        }
        markerRef.current = window.L.marker([centerCoords.lat, centerCoords.lng]).addTo(mapInstance.current);
      }
    }
  }, [userPosition, leafletReady]);

  useEffect(() => {
    const center =
      userPosition ||
      (donationForm.city ? getCoordsForCity(donationForm.city) : null) ||
      (cityFilter ? getCoordsForCity(cityFilter) : null);
    if (!leafletReady || !mapRef.current || !center || !window.L) return;
    if (!mapInstance.current) {
      mapInstance.current = window.L.map(mapRef.current).setView([center.lat, center.lng], 13);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapInstance.current);
    } else {
      mapInstance.current.setView([center.lat, center.lng], 13);
    }
    if (markerRef.current) {
      mapInstance.current.removeLayer(markerRef.current);
    }
    markerRef.current = window.L.marker([center.lat, center.lng]).addTo(mapInstance.current);
  }, [leafletReady, donationForm.city, cityFilter, userPosition]);

  const totalUnits = useMemo(
    () => inventory.reduce((sum, item) => sum + Number(item.units || 0), 0),
    [inventory],
  );

  const groupedInventory = useMemo(() => {
    return bloodTypes.map((type) => ({
      bloodType: type,
      units: inventory
        .filter((entry) => entry.bloodType === type)
        .reduce((sum, entry) => sum + Number(entry.units || 0), 0),
    }));
  }, [inventory]);

  const compatibleMatches = useMemo(() => {
    if (!lastRequest) return [];
    return inventory
      .filter((item) => isCompatible(item.bloodType, lastRequest.bloodType))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 4);
  }, [lastRequest, inventory]);

  const cityOptions = useMemo(
    () => Array.from(new Set(inventory.map((item) => item.city))).sort(),
    [inventory],
  );

  const quickMatches = useMemo(() => {
    if (!needType) return [];
    return inventory
      .filter((item) => isCompatible(item.bloodType, needType))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);
  }, [inventory, needType]);

  const distanceKm = useCallback((coords) => {
    if (!userPosition || !coords) return null;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(coords.lat - userPosition.lat);
    const dLng = toRad(coords.lng - userPosition.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(userPosition.lat)) *
        Math.cos(toRad(coords.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }, [userPosition]);

  const filteredInventory = useMemo(() => {
    let list = inventory;
    if (bloodFilter) list = list.filter((item) => item.bloodType === bloodFilter);
    if (cityFilter) list = list.filter((item) => item.city === cityFilter);
    return [...list].sort((a, b) => {
      const da = distanceKm(getCoordsForCity(a.city)) ?? Number.MAX_VALUE;
      const db = distanceKm(getCoordsForCity(b.city)) ?? Number.MAX_VALUE;
      return da - db;
    });
  }, [inventory, bloodFilter, cityFilter, userPosition, distanceKm]);

  const filteredHospitals = useMemo(() => {
    const matches = bloodFilter ? findHospitalsByType(bloodFilter) : hospitals;
    const byCity = cityFilter ? matches.filter((h) => h.city === cityFilter) : matches;
    const bySearch = searchTerm
      ? byCity.filter(
          (h) =>
            h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            h.bankPartner?.toLowerCase().includes(searchTerm.toLowerCase()),
        )
      : byCity;
    return [...bySearch].sort((a, b) => {
      const da = distanceKm(getCoordsForCity(a.city)) ?? Number.MAX_VALUE;
      const db = distanceKm(getCoordsForCity(b.city)) ?? Number.MAX_VALUE;
      return da - db;
    });
  }, [hospitals, bloodFilter, cityFilter, searchTerm, userPosition, distanceKm]);

  const handleDonationSubmit = (event) => {
    event.preventDefault();
    const { inventory: updatedInventory } = addDonation(donationForm, session);
    setInventory(updatedInventory);
    setDonationForm((prev) => ({ ...prev, city: '', contact: '' }));
  };

  const handleRequestSubmit = (event) => {
    event.preventDefault();
    const { requests: updatedRequests, record } = addRequest(requestForm, session);
    setRequests(updatedRequests);
    setLastRequest(record);
    setRequestForm((prev) => ({ ...prev, city: '', clinicalReason: '', requestedBy: '', contact: '' }));
  };

  const isLoggedIn = Boolean(session);
  const isHospital = session?.role === 'Hospital';
  const isIndividualDonor = session?.role === 'Individual donor';
  const canRequest = isLoggedIn && !isIndividualDonor;

  if (!isLoggedIn) {
    return (
      <main className="page">
        <section className="hero" id="home">
          <div className="hero__content">
            <p className="eyebrow">BloodLink Console</p>
            <h1>Login to donate, receive, or search blood.</h1>
            <p className="lead">
              Access is locked until you sign in. Individuals can donate; hospitals can search,
              filter, and view other hospital data.
            </p>
            <div className="hero__actions">
              <a className="btn btn--primary" href="/login">
                Go to login
              </a>
            </div>
          </div>
          <div className="hero__stats">
            <div className="stat">
              <p className="stat__label">Units ready</p>
              <p className="stat__value">{totalUnits}</p>
              <p className="stat__hint">Crossmatched and stored</p>
            </div>
            <div className="stat">
              <p className="stat__label">Active requests</p>
              <p className="stat__value">{requests.length}</p>
              <p className="stat__hint">Hospitals and individuals</p>
            </div>
            <div className="stat">
              <p className="stat__label">Status</p>
              <p className="stat__value">Login required</p>
              <p className="stat__hint">Sign in to continue</p>
            </div>
          </div>
        </section>

        <section className="grid" id="login">
          <div className="panel panel--accent">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Identity check</p>
                <h3>Login first</h3>
                <p className="hint">All actions are gated. Continue to the login page.</p>
              </div>
              <div className="pill">Not signed in</div>
            </div>
            <a className="btn btn--primary" href="/login">
              Login
            </a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="hero" id="home">
        <div className="hero__content">
          <p className="eyebrow">BloodLink Console</p>
          <h1>
            Hi {session.name || 'there'}, donate, receive, or search nearby blood after login.
          </h1>
          <p className="lead">
            Individuals can donate. Hospitals can search, filter, and view other hospital data with
            location-aware sorting.
          </p>
          <div className="hero__actions">
            {session ? (
              <>
                {canRequest && (
                  <a className="btn btn--primary" href="#request">
                    {isHospital ? 'Find blood' : 'Request blood'}
                  </a>
                )}
                {isIndividualDonor && (
                  <a className="btn btn--ghost" href="#donate">
                    Donate blood
                  </a>
                )}
              </>
            ) : (
              <a className="btn btn--primary" href="/login">
                Login to continue
              </a>
            )}
          </div>
        </div>
        <div className="hero__stats">
          <div className="stat">
            <p className="stat__label">Units ready</p>
            <p className="stat__value">{totalUnits}</p>
            <p className="stat__hint">Crossmatched and stored</p>
          </div>
          <div className="stat">
            <p className="stat__label">Active requests</p>
            <p className="stat__value">{requests.length}</p>
            <p className="stat__hint">Hospitals and individuals</p>
          </div>
          <div className="stat">
            <p className="stat__label">Status</p>
            <p className="stat__value">{session ? 'Logged in' : 'Login required'}</p>
            <p className="stat__hint">Access depends on your role</p>
          </div>
        </div>
      </section>

      {!session && (
        <section className="grid" id="login">
          <div className="panel panel--accent">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Identity check</p>
                <h3>Login required</h3>
                <p className="hint">Use the login page to continue. Roles decide available actions.</p>
              </div>
              <div className="pill">Not signed in</div>
            </div>
            <a className="btn btn--primary" href="/login">
              Go to login
            </a>
          </div>
        </section>
      )}

      {session && isIndividualDonor && (
        <section className="grid grid--two" id="donate">
          <div className="panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Donate</p>
                <h3>List available blood units</h3>
                <p className="hint">Add blood type, city, readiness, and contact.</p>
              </div>
              <div className="pill pill--ghost">Verified donors only</div>
            </div>
            <form className="form" onSubmit={handleDonationSubmit}>
              <div className="form__row">
                <label>
                  Blood type
                  <select
                    value={donationForm.bloodType}
                    onChange={(e) => setDonationForm({ ...donationForm, bloodType: e.target.value })}
                  >
                    {bloodTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Units available
                  <input
                    type="number"
                    min="1"
                    value={donationForm.units}
                    onChange={(e) =>
                      setDonationForm({ ...donationForm, units: Number(e.target.value || 0) })
                    }
                    required
                  />
                </label>
              </div>
              <div className="form__row">
                <label>
                  City
                  <input
                    type="text"
                    value={donationForm.city}
                    onChange={(e) => setDonationForm({ ...donationForm, city: e.target.value })}
                    placeholder="Auto-detected city or type manually"
                    required
                  />
                </label>
              </div>
              <div className="form__row">
                <label>
                  Contact
                  <input
                    type="text"
                    value={donationForm.contact}
                    onChange={(e) => setDonationForm({ ...donationForm, contact: e.target.value })}
                    placeholder="+91 90000 00000"
                  />
                </label>
              </div>
              <button type="submit" className="btn btn--primary">
                Publish to inventory
              </button>
            </form>
          </div>

          <div className="panel panel--muted map-panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Location</p>
                <h3>Nearest city detected</h3>
                <p className="hint">
                  We try to detect your city automatically. You can still adjust it above if needed.
                </p>
              </div>
              <div className="pill pill--ghost">
                {locationEnabled ? 'Using location' : 'Enter city manually'}
              </div>
            </div>
            <div className="map-card">
              <div
                id="map"
                ref={mapRef}
                style={{ height: '220px', width: '100%', borderRadius: '12px' }}
              />
              <p className="hint" style={{ marginTop: '0.5rem' }}>
                {donationForm.city || 'Detecting location...'}{' '}
                {userPosition ? `(Lat ${userPosition.lat.toFixed(3)}, Lng ${userPosition.lng.toFixed(3)})` : ''}
              </p>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setUserPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                        setLocationEnabled(true);
                        setLocationError('');
                      },
                      () => setLocationError('Location blocked; enter city manually.'),
                      { enableHighAccuracy: true, timeout: 5000 },
                    );
                  }
                }}
              >
                Use my location
              </button>
            </div>
          </div>

          <div className="panel panel--muted" id="inventory">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Inventory</p>
                <h3>Blood units by type</h3>
                <p className="hint">Live counts update instantly.</p>
              </div>
              <div className="pill pill--ghost">Mock API</div>
            </div>
            <div className="inventory-grid">
              {groupedInventory.map((item) => (
                <div key={item.bloodType} className="inventory-card">
                  <p className="inventory-card__type">{item.bloodType}</p>
                  <p className="inventory-card__units">{item.units} units</p>
                  <p className="inventory-card__hint">
                    {item.units > 0 ? 'Donors ready' : 'Need donors'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {session && (
        <section className="grid" id="quick-find">
          <div className="panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Need blood</p>
                <h3>Quick matches by blood type</h3>
                <p className="hint">Choose a blood type to see compatible inventory right away.</p>
              </div>
            </div>
            <div className="form">
              <label>
                Blood type needed
                <select value={needType} onChange={(e) => setNeedType(e.target.value)}>
                  {bloodTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="inventory-list">
              {quickMatches.map((item) => {
                const dist = distanceKm(getCoordsForCity(item.city));
                return (
                  <div key={item.id} className="inventory-row">
                    <div className="pill pill--ghost">{item.bloodType}</div>
                    <div className="inventory-row__meta">
                      <h4>
                        {item.units} units · {item.hospital}
                      </h4>
                      <p className="hint">
                        {item.city} · {item.status}
                      </p>
                    </div>
                    <div className="inventory-row__contact">
                      <p className="inventory-row__contact-label">Contact</p>
                      <p>{item.contact}</p>
                      {dist ? <p className="hint">~{dist} km away</p> : null}
                    </div>
                  </div>
                );
              })}
              {!quickMatches.length && <p className="hint">No compatible inventory right now.</p>}
            </div>
          </div>
        </section>
      )}

      {session && isHospital && (
        <section className="grid" id="hospital-tools">
          <div className="panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Hospital tools</p>
                <h3>Search and filter blood availability</h3>
                <p className="hint">Filter by blood type and city. Location sorts nearest first.</p>
              </div>
              <div className="pill pill--ghost">
                {locationEnabled ? 'Using your location' : 'Location not set'}
              </div>
            </div>

            <div className="form">
              <div className="form__row">
                <label>
                  Blood type
                  <select value={bloodFilter} onChange={(e) => setBloodFilter(e.target.value)}>
                    <option value="">Any</option>
                    {bloodTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </label>
                <label>
                  City
                  <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
                    <option value="">Any</option>
                    {cityOptions.map((city) => (
                      <option key={city}>{city}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Search hospitals / banks
                <input
                  type="text"
                  placeholder="Hospital or bank name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </label>
              {locationError && <p className="hint">{locationError}</p>}
            </div>

            <div className="inventory-list">
              {filteredInventory.map((item) => {
                const dist = distanceKm(getCoordsForCity(item.city));
                return (
                  <div key={item.id} className="inventory-row">
                    <div className="pill pill--ghost">{item.bloodType}</div>
                    <div className="inventory-row__meta">
                      <h4>
                        {item.units} units · {item.hospital}
                      </h4>
                      <p className="hint">
                        {item.city} · {item.status}
                      </p>
                    </div>
                    <div className="inventory-row__contact">
                      <p className="inventory-row__contact-label">Contact</p>
                      <p>{item.contact}</p>
                      {dist ? <p className="hint">~{dist} km away</p> : null}
                    </div>
                  </div>
                );
              })}
              {!filteredInventory.length && <p className="hint">No inventory found.</p>}
            </div>
          </div>

          <div className="panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Hospital directory</p>
                <h3>Access partner hospital data</h3>
                <p className="hint">View bank partners and reach verified hospital teams.</p>
              </div>
            </div>
            <div className="inventory-list">
              {filteredHospitals.map((hospital) => {
                const dist = distanceKm(getCoordsForCity(hospital.city));
                return (
                  <div key={hospital.id} className="inventory-row">
                    <div className="pill pill--ghost">{hospital.city}</div>
                    <div className="inventory-row__meta">
                      <h4>{hospital.name}</h4>
                      <p className="hint">
                        Bank partner: {hospital.bankPartner} · Ready types: {hospital.readyTypes.join(', ')}
                      </p>
                    </div>
                    <div className="inventory-row__contact">
                      <p className="inventory-row__contact-label">Contact</p>
                      <p>{hospital.contact}</p>
                      <p className="hint">{hospital.email}</p>
                      {dist ? <p className="hint">~{dist} km away</p> : null}
                    </div>
                  </div>
                );
              })}
              {!filteredHospitals.length && <p className="hint">No hospitals match these filters.</p>}
            </div>
          </div>
        </section>
      )}

      {session && canRequest && (
        <section className="grid grid--two" id="request">
          <div className="panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Receive</p>
                <h3>Place a blood request</h3>
                <p className="hint">Stored in the mock backend and matched by compatibility.</p>
              </div>
              <div className="pill pill--warning">Requires login</div>
            </div>
            <form className="form" onSubmit={handleRequestSubmit}>
              <div className="form__row">
                <label>
                  Blood type needed
                  <select
                    value={requestForm.bloodType}
                    onChange={(e) => setRequestForm({ ...requestForm, bloodType: e.target.value })}
                  >
                    {bloodTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Units needed
                  <input
                    type="number"
                    min="1"
                    value={requestForm.units}
                    onChange={(e) =>
                      setRequestForm({ ...requestForm, units: Number(e.target.value || 0) })
                    }
                    required
                  />
                </label>
              </div>
              <div className="form__row">
                <label>
                  City
                  <input
                    type="text"
                    value={requestForm.city}
                    onChange={(e) => setRequestForm({ ...requestForm, city: e.target.value })}
                    placeholder="Delhi, Nagpur..."
                    required
                  />
                </label>
                <label>
                  Urgency
                  <select
                    value={requestForm.urgency}
                    onChange={(e) => setRequestForm({ ...requestForm, urgency: e.target.value })}
                  >
                    <option>Needed in 2 hours</option>
                    <option>Needed in 4 hours</option>
                    <option>Same day</option>
                    <option>Within 48 hours</option>
                  </select>
                </label>
              </div>
              <div className="form__row">
                <label>
                  Requested by
                  <input
                    type="text"
                    value={requestForm.requestedBy}
                    onChange={(e) => setRequestForm({ ...requestForm, requestedBy: e.target.value })}
                    placeholder="ICU / Dr. Rathi"
                    required
                  />
                </label>
                <label>
                  Contact
                  <input
                    type="text"
                    value={requestForm.contact}
                    onChange={(e) => setRequestForm({ ...requestForm, contact: e.target.value })}
                    placeholder="+91 90000 00000"
                  />
                </label>
              </div>
              <label>
                Clinical reason
                <textarea
                  rows={3}
                  value={requestForm.clinicalReason}
                  onChange={(e) => setRequestForm({ ...requestForm, clinicalReason: e.target.value })}
                  placeholder="Example: Postpartum hemorrhage, O- preferred."
                  required
                />
              </label>
              <button type="submit" className="btn btn--primary">
                Submit request
              </button>
            </form>
          </div>

          <div className="panel panel--muted">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Matching</p>
                <h3>Compatible donors</h3>
                <p className="hint">We list donors compatible with the latest request.</p>
              </div>
              <div className="pill pill--ghost">Realtime</div>
            </div>
            {lastRequest ? (
              <div className="match-list">
                <div className="match-list__meta">
                  <p className="eyebrow">Latest request</p>
                  <h4>
                    {lastRequest.units} units of {lastRequest.bloodType}
                  </h4>
                  <p className="hint">
                    {lastRequest.city} · {lastRequest.urgency}
                  </p>
                </div>
                <div className="match-cards">
                  {compatibleMatches.length ? (
                    compatibleMatches.map((match) => (
                      <div key={match.id} className="match-card">
                        <div className="match-card__header">
                          <span className="pill pill--ghost">{match.bloodType}</span>
                          <span className="pill pill--success">{match.units} units</span>
                        </div>
                        <h4>{match.hospital}</h4>
                        <p className="hint">{match.city}</p>
                        <p className="match-card__contact">Contact: {match.contact}</p>
                      </div>
                    ))
                  ) : (
                    <p className="hint">No compatible donors yet. Try O- or expand location radius.</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="hint">Submit a request to see compatible donors in real time.</p>
            )}
          </div>
        </section>
      )}

      {session && (
        <section className="grid grid--two" id="activity">
          <div className="panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Activity</p>
                <h3>Recent requests</h3>
                <p className="hint">Hospitals and families that need blood right now.</p>
              </div>
            </div>
            <div className="timeline">
              {requests.map((req) => (
                <div key={req.id} className="timeline__item">
                  <div className="pill pill--ghost">{req.bloodType}</div>
                  <div>
                    <h4>
                      {req.units} units · {req.requestedBy}
                    </h4>
                    <p className="hint">
                      {req.city} · {req.urgency}
                    </p>
                    <p className="timeline__reason">{req.clinicalReason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Donor wall</p>
                <h3>Latest published units</h3>
                <p className="hint">Most recent contributions from donors and partner hospitals.</p>
              </div>
            </div>
            <div className="inventory-list">
              {inventory.map((item) => (
                <div key={item.id} className="inventory-row">
                  <div className="pill pill--ghost">{item.bloodType}</div>
                  <div className="inventory-row__meta">
                    <h4>
                      {item.units} units · {item.hospital}
                    </h4>
                    <p className="hint">
                      {item.city} · {item.status}
                    </p>
                  </div>
                  <div className="inventory-row__contact">
                    <p className="inventory-row__contact-label">Contact</p>
                    <p>{item.contact}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
};

export default Homepage;
