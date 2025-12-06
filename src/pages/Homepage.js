import React, { useEffect, useMemo, useState } from 'react';
import {
  addDonation,
  addRequest,
  bootstrapStore,
  getSession,
  isCompatible,
  saveSession,
} from '../services/mockApi';

const bloodTypes = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

const Homepage = () => {
  const [session, setSession] = useState(() => getSession());
  const [inventory, setInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [lastRequest, setLastRequest] = useState(null);

  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    organization: '',
    role: 'Hospital',
  });

  const [donationForm, setDonationForm] = useState({
    bloodType: 'O+',
    units: 2,
    city: '',
    hospital: '',
    readyIn: 'Available now',
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

  useEffect(() => {
    const seeded = bootstrapStore();
    setInventory(seeded.inventory);
    setRequests(seeded.requests);
  }, []);

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

  const handleAuthSubmit = (event) => {
    event.preventDefault();
    const nextSession = saveSession(authForm);
    setSession(nextSession);
  };

  const handleDonationSubmit = (event) => {
    event.preventDefault();
    const { inventory: updatedInventory } = addDonation(donationForm, session);
    setInventory(updatedInventory);
    setDonationForm((prev) => ({ ...prev, city: '', hospital: '', contact: '' }));
  };

  const handleRequestSubmit = (event) => {
    event.preventDefault();
    const { requests: updatedRequests, record } = addRequest(requestForm, session);
    setRequests(updatedRequests);
    setLastRequest(record);
    setRequestForm((prev) => ({ ...prev, city: '', clinicalReason: '', requestedBy: '', contact: '' }));
  };

  return (
    <main className="page">
      <section className="hero" id="home">
        <div className="hero__content">
          <p className="eyebrow">BloodLink Console</p>
          <h1>Find, verify, and route blood units within minutes.</h1>
          <p className="lead">
            Hospitals and individual donors use this dashboard to list ready blood units or place
            urgent requests. Sign in to verify your identity, then donate or receive with transparent
            inventory and compatibility checks.
          </p>
          <div className="hero__actions">
            <a className="btn btn--primary" href="#donate">
              Donate blood
            </a>
            <a className="btn btn--ghost" href="#request">
              Request blood
            </a>
            <a className="btn btn--text" href="#inventory">
              View inventory
            </a>
          </div>
        </div>
        <div className="hero__stats">
          <div className="stat">
            <p className="stat__label">Units ready</p>
            <p className="stat__value">{totalUnits}</p>
            <p className="stat__hint">Crossmatched and cold-stored</p>
          </div>
          <div className="stat">
            <p className="stat__label">Active requests</p>
            <p className="stat__value">{requests.length}</p>
            <p className="stat__hint">From hospitals and families</p>
          </div>
          <div className="stat">
            <p className="stat__label">Secure logins</p>
            <p className="stat__value">{session ? 'Verified' : 'Required'}</p>
            <p className="stat__hint">We verify every submission</p>
          </div>
        </div>
      </section>

      <section className="grid" id="login">
        <div className="panel panel--accent">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Identity check</p>
              <h3>Log in to donate or receive</h3>
              <p className="hint">
                We capture your role to prevent scams. Use your hospital ID or donor email so our
                backend can trace each action.
              </p>
            </div>
            {session ? (
              <div className="pill pill--success">Signed in as {session.role}</div>
            ) : (
              <div className="pill">Not signed in</div>
            )}
          </div>

          <form className="form" onSubmit={handleAuthSubmit}>
            <div className="form__row">
              <label>
                Full name
                <input
                  type="text"
                  value={authForm.name}
                  required
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                  placeholder="Dr. Aditi Sharma"
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={authForm.email}
                  required
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  placeholder="name@hospital.org"
                />
              </label>
            </div>
            <div className="form__row">
              <label>
                Role
                <select
                  value={authForm.role}
                  onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}
                >
                  <option>Hospital</option>
                  <option>Blood bank</option>
                  <option>Individual donor</option>
                  <option>Receiver</option>
                </select>
              </label>
              <label>
                Organization (optional)
                <input
                  type="text"
                  value={authForm.organization}
                  onChange={(e) => setAuthForm({ ...authForm, organization: e.target.value })}
                  placeholder="LifeCare ICU / NGO"
                />
              </label>
            </div>
            <button type="submit" className="btn btn--primary">
              Save and verify identity
            </button>
          </form>
        </div>
      </section>

      <section className="grid grid--two" id="donate">
        <div className="panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Donate</p>
              <h3>List available blood units</h3>
              <p className="hint">
                Add exact blood type, location, and readiness. We store this in the mock backend so
                receivers see fresh inventory instantly.
              </p>
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
                  placeholder="Pune, Mumbai..."
                  required
                />
              </label>
              <label>
                Hospital / collection center
                <input
                  type="text"
                  value={donationForm.hospital}
                  onChange={(e) => setDonationForm({ ...donationForm, hospital: e.target.value })}
                  placeholder="Trinity Care"
                />
              </label>
            </div>
            <div className="form__row">
              <label>
                Ready in
                <select
                  value={donationForm.readyIn}
                  onChange={(e) => setDonationForm({ ...donationForm, readyIn: e.target.value })}
                >
                  <option>Available now</option>
                  <option>Within 2 hours</option>
                  <option>Courier 4 hours</option>
                  <option>Same day</option>
                </select>
              </label>
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

        <div className="panel panel--muted" id="inventory">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Inventory</p>
              <h3>Blood units by type</h3>
              <p className="hint">
                Live counts from the mock backend. Totals update as soon as donors publish or
                receivers acknowledge a match.
              </p>
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

      <section className="grid grid--two" id="request">
        <div className="panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Receive</p>
              <h3>Place a blood request</h3>
              <p className="hint">
                Your request is stored in the backend mock API and shown to donors that are
                compatible by blood type.
              </p>
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
              <p className="hint">
                We filter donors whose blood type can serve this request. O- appears when no direct
                matches are available.
              </p>
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
                      <p className="hint">
                        {match.city} · {match.readyIn}
                      </p>
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
                    {item.city} · {item.readyIn} · {item.status}
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
    </main>
  );
};

export default Homepage;
