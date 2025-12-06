const STORAGE_KEY = 'lifeline-blood-center';
const SESSION_KEY = `${STORAGE_KEY}-session`;

const seedData = {
  inventory: [
    {
      id: 'don-001',
      bloodType: 'O+',
      units: 4,
      city: 'Pune',
      hospital: 'Trinity Care',
      readyIn: 'Available now',
      contact: '+91 90455 21011',
      addedBy: 'Blood bank desk',
      createdAt: '2024-02-10T11:00:00Z',
      status: 'Screened',
    },
    {
      id: 'don-002',
      bloodType: 'B-',
      units: 2,
      city: 'Mumbai',
      hospital: 'Civic Medical Center',
      readyIn: 'Within 2 hours',
      contact: '+91 99812 00473',
      addedBy: 'Mobile drive',
      createdAt: '2024-02-09T14:00:00Z',
      status: 'Ready',
    },
    {
      id: 'don-003',
      bloodType: 'A+',
      units: 6,
      city: 'Nagpur',
      hospital: 'Central City Hospital',
      readyIn: 'Available now',
      contact: '+91 90213 77891',
      addedBy: 'Hospital partner',
      createdAt: '2024-02-11T06:00:00Z',
      status: 'Screened',
    },
    {
      id: 'don-004',
      bloodType: 'O-',
      units: 3,
      city: 'Delhi',
      hospital: 'North Point Labs',
      readyIn: 'Courier 4 hours',
      contact: '+91 97622 55830',
      addedBy: 'Regional bank',
      createdAt: '2024-02-08T09:00:00Z',
      status: 'Ready',
    },
    {
      id: 'don-005',
      bloodType: 'AB+',
      units: 2,
      city: 'Pune',
      hospital: 'LifeLine ICU',
      readyIn: 'Same day',
      contact: '+91 90123 45678',
      addedBy: 'Hospital partner',
      createdAt: '2024-02-12T10:00:00Z',
      status: 'Ready',
    },
  ],
  requests: [
    {
      id: 'req-101',
      bloodType: 'A+',
      units: 2,
      city: 'Pune',
      urgency: 'Needed in 6 hours',
      clinicalReason: 'Post surgery',
      requestedBy: 'Sahyadri Hospital',
      contact: '+91 90213 55667',
      createdAt: '2024-02-11T07:30:00Z',
    },
    {
      id: 'req-102',
      bloodType: 'O-',
      units: 1,
      city: 'Mumbai',
      urgency: 'Needed in 2 hours',
      clinicalReason: 'NICU emergency',
      requestedBy: 'Lotus Children Care',
      contact: '+91 98111 78542',
      createdAt: '2024-02-11T05:00:00Z',
    },
    {
      id: 'req-103',
      bloodType: 'B+',
      units: 3,
      city: 'Nagpur',
      urgency: 'Same day',
      clinicalReason: 'Trauma case',
      requestedBy: 'Central City Hospital',
      contact: '+91 90213 77891',
      createdAt: '2024-02-12T09:00:00Z',
    },
  ],
  hospitals: [
    {
      id: 'hosp-001',
      name: 'Trinity Care',
      city: 'Pune',
      bankPartner: 'Red Cross Bank',
      contact: '+91 90455 21011',
      email: 'coord@trinitycare.org',
      readyTypes: ['O+', 'A+', 'B+'],
    },
    {
      id: 'hosp-002',
      name: 'Civic Medical Center',
      city: 'Mumbai',
      bankPartner: 'City Blood Center',
      contact: '+91 99812 00473',
      email: 'blooddesk@civic.in',
      readyTypes: ['B-', 'O-'],
    },
    {
      id: 'hosp-003',
      name: 'Central City Hospital',
      city: 'Nagpur',
      bankPartner: 'Regional Bloodline',
      contact: '+91 90213 77891',
      email: 'supply@centralcity.org',
      readyTypes: ['A+', 'AB+'],
    },
    {
      id: 'hosp-004',
      name: 'LifeLine ICU',
      city: 'Pune',
      bankPartner: 'Metro Blood Bank',
      contact: '+91 90123 45678',
      email: 'ops@lifelineicu.org',
      readyTypes: ['AB+', 'O-'],
    },
    {
      id: 'hosp-005',
      name: 'Sunrise Hospital',
      city: 'Delhi',
      bankPartner: 'Delhi Blood Center',
      contact: '+91 97622 55830',
      email: 'dispatch@sunrisehosp.in',
      readyTypes: ['O-', 'A+'],
    },
  ],
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const writeStore = (store) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  return store;
};

const readStore = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    let mutated = false;
    if (!parsed.hospitals) {
      parsed.hospitals = clone(seedData.hospitals);
      mutated = true;
    }
    return mutated ? writeStore(parsed) : parsed;
  }

  return writeStore(clone(seedData));
};

export const bootstrapStore = () => readStore();

export const syncFromBackend = async () => {
  try {
    const res = await fetch('/data/db.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed');
    const data = await res.json();
    writeStore({
      inventory: data.inventory || [],
      requests: data.requests || [],
      hospitals: data.hospitals || [],
    });
    return data;
  } catch (err) {
    return null;
  }
};

export const getInventory = () => readStore().inventory;

export const getRequests = () => readStore().requests;

export const getHospitals = () => readStore().hospitals;

export const getSession = () => {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const saveSession = ({ name, email, role, organization, contact, hospitalAccess }) => {
  const session = {
    id: `user-${Date.now()}`,
    name,
    email,
    role,
    organization,
    contact,
    hospitalAccess: role === 'Hospital' ? hospitalAccess ?? true : Boolean(hospitalAccess),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
};

export const isCompatible = (available, needed) => {
  const compatibility = {
    'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    'O+': ['O+', 'A+', 'B+', 'AB+'],
    'A-': ['A-', 'A+', 'AB-', 'AB+'],
    'A+': ['A+', 'AB+'],
    'B-': ['B-', 'B+', 'AB-', 'AB+'],
    'B+': ['B+', 'AB+'],
    'AB-': ['AB-', 'AB+'],
    'AB+': ['AB+'],
  };

  return compatibility[available]?.includes(needed) ?? false;
};

export const addDonation = (payload, actor) => {
  const store = readStore();
  const record = {
    id: `don-${Date.now()}`,
    bloodType: payload.bloodType,
    units: Number(payload.units),
    city: payload.city,
    hospital: payload.hospital || actor?.organization || actor?.name || 'Verified donor',
    readyIn: payload.readyIn || 'Available',
    contact: payload.contact || actor?.email || 'On file',
    addedBy: actor ? `${actor.name} (${actor.role})` : 'Guest',
    createdAt: new Date().toISOString(),
    status: payload.status || 'Ready',
  };

  store.inventory = [record, ...store.inventory].slice(0, 50);
  writeStore(store);

  return { inventory: store.inventory, record };
};

export const addRequest = (payload, actor) => {
  const store = readStore();
  const record = {
    id: `req-${Date.now()}`,
    bloodType: payload.bloodType,
    units: Number(payload.units),
    city: payload.city,
    urgency: payload.urgency,
    clinicalReason: payload.clinicalReason,
    requestedBy: payload.requestedBy || actor?.organization || actor?.name || 'Hospital team',
    contact: payload.contact || actor?.email || 'Verified contact',
    createdAt: new Date().toISOString(),
  };

  store.requests = [record, ...store.requests].slice(0, 50);
  writeStore(store);

  return { requests: store.requests, record };
};

export const findMatches = (neededType) => {
  const store = readStore();
  return store.inventory.filter((item) => isCompatible(item.bloodType, neededType));
};

export const findHospitalsByType = (neededType) => {
  const store = readStore();
  if (!neededType) return store.hospitals || [];
  return (store.hospitals || []).filter((hospital) =>
    hospital.readyTypes?.some((type) => isCompatible(type, neededType)),
  );
};
