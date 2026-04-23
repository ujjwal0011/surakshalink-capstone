import { useState, useEffect, useCallback } from 'react';

// ─── Fallback data (embedded for guaranteed offline access) ────
const FALLBACK_CONTACTS = {
  categories: [
    {
      id: 'universal', title: 'Universal Emergency', icon: '🚨', color: 'red',
      description: 'For any life-threatening emergency',
      contacts: [
        { name: 'National Emergency Number', number: '112', description: 'Single number for all emergencies — police, fire, ambulance. Works even without SIM.' },
        { name: 'Police', number: '100', description: 'Report crimes, theft, violence, or any law & order situation.' },
        { name: 'Fire Brigade', number: '101', description: 'Fire emergencies, building collapse, or rescue operations.' },
        { name: 'Ambulance', number: '102', description: 'Free ambulance service by the Government of India.' },
        { name: 'Emergency Medical Service', number: '108', description: '24/7 emergency ambulance and medical aid.' },
      ],
    },
    {
      id: 'medical', title: 'Medical Services', icon: '🏥', color: 'blue',
      description: 'Health emergencies and medical assistance',
      contacts: [
        { name: 'Ambulance (Govt.)', number: '102', description: 'Government-run free ambulance service across India.' },
        { name: 'Emergency Response (EMRI)', number: '108', description: 'Emergency Management & Research Institute ambulance.' },
        { name: 'Blood Bank Helpline', number: '104', description: 'Locate nearby blood banks and request blood units.' },
        { name: 'COVID-19 Helpline', number: '1075', description: 'Ministry of Health helpline for pandemic-related queries.' },
      ],
    },
    {
      id: 'disaster', title: 'Disaster Management', icon: '🌊', color: 'orange',
      description: 'Natural disasters and crisis response',
      contacts: [
        { name: 'Disaster Management (NDMA)', number: '1070', description: 'National Disaster Management Authority helpline for floods, earthquakes, cyclones.' },
        { name: 'Disaster Relief (NDRF)', number: '1077', description: 'National Disaster Response Force — search, rescue, and relief.' },
      ],
    },
    {
      id: 'safety', title: 'Safety & Protection', icon: '🛡️', color: 'purple',
      description: 'Personal safety and women/child protection',
      contacts: [
        { name: 'Women Helpline', number: '1091', description: 'Report domestic violence, harassment, or seek immediate help.' },
        { name: 'Women Helpline (NCW)', number: '1098', description: 'National Commission for Women — legal aid and counseling.' },
        { name: 'Women Helpline (Universal)', number: '181', description: 'Available 24/7. Supports rescue, medical help, and shelter.' },
      ],
    },
    {
      id: 'utilities', title: 'Utilities & Services', icon: '⚡', color: 'teal',
      description: 'Gas leaks, electricity, and essential services',
      contacts: [
        { name: 'Gas Leak Emergency', number: '1906', description: 'Report LPG gas leaks or cylinder-related emergencies.' },
        { name: 'Electricity Complaint', number: '1912', description: 'Report power outages, electric shocks, or fallen wires.' },
        { name: 'Railway Helpline', number: '155303', description: 'Indian Railways security and complaint helpline.' },
      ],
    },
    {
      id: 'transport', title: 'Transport & Travel', icon: '🚆', color: 'green',
      description: 'Road, rail, and travel emergencies',
      contacts: [
        { name: 'Railway Enquiry', number: '139', description: 'Train timings, PNR status, and railway information.' },
        { name: 'Road Accident Emergency', number: '1033', description: 'Report road accidents and request emergency response.' },
        { name: 'Tourist Helpline', number: '1363', description: 'Assistance for tourists — safety, complaints, and guidance.' },
      ],
    },
  ],
};

// ─── Color scheme mapping ──────────────────────────────────────
const COLOR_MAP = {
  red: {
    card: 'bg-white border-gray-200',
    header: 'bg-red-600',
    badge: 'bg-red-100 text-red-700 border-red-200',
    icon: 'bg-red-50 text-red-600',
    callBtn: 'bg-red-600 hover:bg-red-700',
    copyBtn: 'border-gray-200 text-gray-600 hover:bg-gray-50',
    glow: 'hover:shadow-md',
  },
  blue: {
    card: 'bg-white border-gray-200',
    header: 'bg-blue-600',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: 'bg-blue-50 text-blue-600',
    callBtn: 'bg-blue-600 hover:bg-blue-700',
    copyBtn: 'border-gray-200 text-gray-600 hover:bg-gray-50',
    glow: 'hover:shadow-md',
  },
  orange: {
    card: 'bg-white border-gray-200',
    header: 'bg-orange-600',
    badge: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: 'bg-orange-50 text-orange-600',
    callBtn: 'bg-orange-600 hover:bg-orange-700',
    copyBtn: 'border-gray-200 text-gray-600 hover:bg-gray-50',
    glow: 'hover:shadow-md',
  },
  purple: {
    card: 'bg-white border-gray-200',
    header: 'bg-purple-600',
    badge: 'bg-purple-100 text-purple-700 border-purple-200',
    icon: 'bg-purple-50 text-purple-600',
    callBtn: 'bg-purple-600 hover:bg-purple-700',
    copyBtn: 'border-gray-200 text-gray-600 hover:bg-gray-50',
    glow: 'hover:shadow-md',
  },
  teal: {
    card: 'bg-white border-gray-200',
    header: 'bg-teal-600',
    badge: 'bg-teal-100 text-teal-700 border-teal-200',
    icon: 'bg-teal-50 text-teal-600',
    callBtn: 'bg-teal-600 hover:bg-teal-700',
    copyBtn: 'border-gray-200 text-gray-600 hover:bg-gray-50',
    glow: 'hover:shadow-md',
  },
  green: {
    card: 'bg-white border-gray-200',
    header: 'bg-green-600',
    badge: 'bg-green-100 text-green-700 border-green-200',
    icon: 'bg-green-50 text-green-600',
    callBtn: 'bg-green-600 hover:bg-green-700',
    copyBtn: 'border-gray-200 text-gray-600 hover:bg-gray-50',
    glow: 'hover:shadow-md',
  },
};

const EmergencyContacts = () => {
  const [contacts, setContacts] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedNumber, setCopiedNumber] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [locationStatus, setLocationStatus] = useState('idle'); // idle | loading | success | error
  const [locationData, setLocationData] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);

  // ─── Fetch contacts ────────────────────────────────────────
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const response = await fetch('/contacts.json');
        if (response.ok) {
          const data = await response.json();
          setContacts(data);
        } else {
          throw new Error('Fetch failed');
        }
      } catch {
        // Graceful fallback to embedded data
        console.warn('[EmergencyContacts] Using fallback embedded data');
        setContacts(FALLBACK_CONTACTS);
      }
    };
    loadContacts();
  }, []);

  // ─── Online/Offline listener ───────────────────────────────
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ─── Copy to clipboard ────────────────────────────────────
  const handleCopy = useCallback(async (number) => {
    try {
      await navigator.clipboard.writeText(number);
      setCopiedNumber(number);
      setTimeout(() => setCopiedNumber(null), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = number;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedNumber(number);
      setTimeout(() => setCopiedNumber(null), 2000);
    }
  }, []);

  // ─── Share location ────────────────────────────────────────
  const handleShareLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocationData({ latitude, longitude });
        setLocationStatus('success');
        // Copy to clipboard
        const locationText = `My Location: https://www.google.com/maps?q=${latitude},${longitude}`;
        navigator.clipboard.writeText(locationText).catch(() => {});
      },
      () => {
        setLocationStatus('error');
        setTimeout(() => setLocationStatus('idle'), 3000);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // ─── Filter logic ─────────────────────────────────────────
  const getFilteredCategories = () => {
    if (!contacts) return [];
    const query = searchQuery.toLowerCase().trim();
    if (!query && !activeCategory) return contacts.categories;

    return contacts.categories
      .filter((cat) => !activeCategory || cat.id === activeCategory)
      .map((category) => ({
        ...category,
        contacts: category.contacts.filter(
          (c) =>
            !query ||
            c.name.toLowerCase().includes(query) ||
            c.number.includes(query) ||
            c.description.toLowerCase().includes(query)
        ),
      }))
      .filter((category) => category.contacts.length > 0);
  };

  const filteredCategories = getFilteredCategories();
  const totalContacts = contacts
    ? contacts.categories.reduce((sum, cat) => sum + cat.contacts.length, 0)
    : 0;

  // ─── Loading state ─────────────────────────────────────────
  if (!contacts) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Loading emergency contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── Header ──────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Offline Banner */}
          <div
            className={`mb-6 flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
              isOnline
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-amber-50 border border-amber-200 text-amber-700'
            }`}
          >
            <span className="text-lg">{isOnline ? '🟢' : '🔴'}</span>
            <span>
              {isOnline
                ? 'Works offline in emergencies — contacts are cached on your device'
                : 'You are offline — showing cached emergency contacts'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Emergency Contacts
              </h1>
              <p className="mt-2 text-gray-500 text-sm max-w-xl">
                India's essential emergency helplines. One tap to call. Works without internet.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Share Location Button */}
              <button
                id="share-location-btn"
                onClick={handleShareLocation}
                disabled={locationStatus === 'loading'}
                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  locationStatus === 'success'
                    ? 'bg-green-600 text-white'
                    : locationStatus === 'error'
                    ? 'bg-red-600 text-white'
                    : locationStatus === 'loading'
                    ? 'bg-gray-200 text-gray-500 cursor-wait'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {locationStatus === 'loading' && (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                  </svg>
                )}
                {locationStatus === 'success' ? '✓ Location Copied!' : locationStatus === 'error' ? '✕ Access Denied' : '📍 Share My Location'}
              </button>

              {/* Stats badge */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-xl font-bold text-gray-900">{totalContacts}</span>
                <span className="text-gray-500 text-xs font-medium">helpline<br />numbers</span>
              </div>
            </div>
          </div>

          {/* Location result */}
          {locationStatus === 'success' && locationData && (
            <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
              <span className="text-lg">📍</span>
              <div>
                <p className="text-green-700 text-sm font-medium">Location shared & copied to clipboard</p>
                <a
                  href={`https://www.google.com/maps?q=${locationData.latitude},${locationData.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 text-xs underline hover:text-green-800"
                >
                  {locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)} — Open in Google Maps ↗
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Search & Filter Bar ─────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                id="emergency-search"
                type="text"
                placeholder="Search by name, number, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-200 hover:bg-slate-300 rounded-full flex items-center justify-center text-slate-500 text-xs transition-colors"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category filter pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setActiveCategory(null)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                  !activeCategory
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              {contacts.categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                    activeCategory === cat.id
                      ? `${COLOR_MAP[cat.color]?.badge || 'bg-slate-200 text-slate-700'} border shadow-sm`
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="hidden sm:inline">{cat.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Categories Grid ─────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">No contacts found</h3>
            <p className="text-slate-500">Try a different search term or clear filters</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory(null); }}
              className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {filteredCategories.map((category, catIndex) => {
              const colors = COLOR_MAP[category.color] || COLOR_MAP.blue;
              return (
                <div
                  key={category.id}
                  className={`rounded-2xl border overflow-hidden shadow-sm hover:shadow-xl ${colors.glow} transition-all duration-500`}
                  style={{ animationDelay: `${catIndex * 100}ms` }}
                >
                  {/* Category Header */}
                  <div className={`${colors.header} px-6 py-5`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                          <span className="text-xl">{category.icon}</span>
                        </div>
                        <div>
                          <h2 className="text-white font-bold text-lg">{category.title}</h2>
                          <p className="text-white/70 text-xs font-medium">{category.description}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-white/20 rounded text-xs font-medium text-white">
                        {category.contacts.length} {category.contacts.length === 1 ? 'number' : 'numbers'}
                      </span>
                    </div>
                  </div>

                  {/* Contacts List */}
                  <div className={`${colors.card} divide-y divide-slate-200/50`}>
                    {category.contacts.map((contact, index) => (
                      <div
                        key={`${contact.number}-${index}`}
                        className="px-6 py-4 hover:bg-white/60 transition-colors duration-200 group"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-slate-900 text-sm truncate">
                                {contact.name}
                              </h3>
                            </div>
                            <p className="text-slate-500 text-xs leading-relaxed mb-3">
                              {contact.description}
                            </p>

                            {/* Number display */}
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${colors.icon} text-sm font-mono font-bold`}>
                                📞 {contact.number}
                              </span>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            <a
                              href={`tel:${contact.number}`}
                              id={`call-${contact.number}-${index}`}
                              className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-white text-xs font-medium ${colors.callBtn} transition-colors`}
                            >
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                              </svg>
                              Call
                            </a>
                            <button
                              onClick={() => handleCopy(contact.number)}
                              id={`copy-${contact.number}-${index}`}
                              className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border-2 ${
                                copiedNumber === contact.number
                                  ? 'bg-emerald-50 border-emerald-400 text-emerald-600'
                                  : `bg-white ${colors.copyBtn}`
                              } transition-all duration-200 hover:scale-105 active:scale-95`}
                            >
                              {copiedNumber === contact.number ? (
                                <>
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                  </svg>
                                  Copy
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Bottom info ──────────────────────────────────────── */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-4 bg-slate-100 rounded-2xl border border-slate-200">
            <span className="text-2xl">🇮🇳</span>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-700">India Emergency Numbers</p>
              <p className="text-xs text-slate-500">Dial <span className="font-bold text-red-600">112</span> for any emergency. Works without SIM or balance.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyContacts;
