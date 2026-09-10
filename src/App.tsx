import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Car, ShieldAlert, MessageSquare, Phone, Star, Sparkles, CreditCard, DollarSign, ArrowRight, CheckCircle2, Clock, User, Globe, AlertTriangle, Sun, Moon } from 'lucide-react';
import { RideCategory, LocationPoint, RideRequest, Driver } from './types';
import { SOSButton } from './components/SOSButton';
import { DriverChat } from './components/DriverChat';

const DOMINICA_LOCATIONS: LocationPoint[] = [
  { id: 'dfw', name: 'Douglas-Charles Airport (DOM)', region: 'Marigot (NE)', description: 'Main international airport gateway', isPopular: true },
  { id: 'roseau', name: 'Roseau Capital City & Cruise Berth', region: 'Saint George', description: 'Downtown shopping & cruise terminal', isPopular: true },
  { id: 'canefield', name: 'Canefield Airport (DCF)', region: 'St. Paul', description: 'Regional commuter airport', isPopular: true },
  { id: 'trafalgar', name: 'Trafalgar Falls & Hot Springs', region: 'Roseau Valley', description: 'Twin majestic waterfalls & sulfur springs', isPopular: true },
  { id: 'emerald', name: 'Emerald Pool & Nature Trail', region: 'Morne Trois Pitons', description: 'UNESCO World Heritage rainforest pool', isPopular: true },
  { id: 'portsmouth', name: 'Portsmouth & Cabrits National Park', region: 'St. John', description: 'Historic Fort Shirley & northern hub', isPopular: true },
  { id: 'champagne', name: 'Champagne Reef Marine Reserve', region: 'St. Luke', description: 'World famous bubble snorkeling reef', isPopular: true },
  { id: 'titou', name: 'Titou Gorge', region: 'Wotten Waven', description: 'Magical canyon swim and gorge adventure', isPopular: true },
];

const SAMPLE_DRIVER: Driver = {
  id: 'd1',
  name: 'Garfield "Irie" Henderson',
  rating: 4.96,
  ridesCount: 1840,
  carModel: 'Toyota Land Cruiser Prado',
  carColor: 'Nature Emerald Green',
  licensePlate: 'DOM-767-E',
  photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  phone: '+1 767 275 4411',
  lat: 15.3015,
  lng: -61.3885
};

export function App() {
  const [pickup, setPickup] = useState<LocationPoint>(DOMINICA_LOCATIONS[0]);
  const [dropoff, setDropoff] = useState<LocationPoint>(DOMINICA_LOCATIONS[1]);
  const [category, setCategory] = useState<RideCategory>('eco');
  const [passengerCount, setPassengerCount] = useState<number>(2);
  const [promoCode, setPromoCode] = useState<string>('');
  const [tipUSD, setTipUSD] = useState<number>(5);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'apple_pay' | 'local_pay'>('local_pay');

  const [bookingState, setBookingState] = useState<'idle' | 'searching' | 'confirmed' | 'arrived' | 'trip_in_progress' | 'completed'>('idle');
  const [fareEstimate, setFareEstimate] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [currencyMode, setCurrencyMode] = useState<'XCD' | 'USD'>('XCD');
  const [themeMode, setThemeMode] = useState<'night' | 'day'>('night');

  useEffect(() => {
    const baseDist = pickup.id === dropoff.id ? 5 : 24.5;
    const perMileXCD = category === 'suv' ? 18 : category === 'island_tour' ? 22 : 13;
    const distFareXCD = baseDist * perMileXCD;
    const mtnFeeXCD = 5;
    const discount = promoCode === 'NATUREISLE' ? distFareXCD * 0.15 : 0;
    const subtotalXCD = Math.max(10, distFareXCD + mtnFeeXCD - discount);
    const vatXCD = subtotalXCD * 0.1;
    const totalXCD = subtotalXCD + vatXCD + (tipUSD * 2.7);
    const totalUSD = totalXCD / 2.7;

    setFareEstimate({
      distanceMiles: Math.round(baseDist * 10) / 10,
      subtotalXCD: Math.round(subtotalXCD * 100) / 100,
      subtotalUSD: Math.round((subtotalXCD / 2.7) * 100) / 100,
      totalXCD: Math.round(totalXCD * 100) / 100,
      totalUSD: Math.round(totalUSD * 100) / 100,
    });
  }, [pickup, dropoff, category, promoCode, tipUSD]);

  const handleBookRide = () => {
    setBookingState('searching');
    setTimeout(() => {
      setBookingState('confirmed');
    }, 3000);
  };

  const isDay = themeMode === 'day';

  return (
    <div className={`min-h-screen flex flex-col font-sans pb-24 transition-colors duration-300 ${isDay ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'}`}>
      {/* Top Navbar */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between transition-colors duration-300 ${isDay ? 'bg-white/90 border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-500 font-black text-xl shadow-lg shadow-emerald-900/10">
            🏔️
          </div>
          <div>
            <h1 className={`text-lg font-black tracking-tight flex items-center gap-2 ${isDay ? 'text-slate-900' : 'text-white'}`}>
              ELITE RIDE <span className="text-xs uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 font-semibold border border-emerald-500/30">Dominica</span>
            </h1>
            <p className={`text-xs ${isDay ? 'text-slate-500' : 'text-slate-400'}`}>Nature Island Mountain & Airport Transit</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Day / Night Toggle */}
          <button
            onClick={() => setThemeMode(isDay ? 'night' : 'day')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
              isDay
                ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                : 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
            }`}
            title="Toggle Day / Night Mode"
          >
            {isDay ? <Sun className="w-4 h-4 text-amber-600" /> : <Moon className="w-4 h-4 text-amber-400" />}
            <span>{isDay ? 'Day Mode' : 'Night Mode'}</span>
          </button>

          <button
            onClick={() => setCurrencyMode(currencyMode === 'XCD' ? 'USD' : 'XCD')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
              isDay
                ? 'bg-slate-100 border-slate-200 text-emerald-700 hover:bg-slate-200'
                : 'bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-700'
            }`}
          >
            Currency: {currencyMode} ({currencyMode === 'XCD' ? 'EC$' : 'US$'})
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Ride Booking & Status */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Booking State Machine */}
          {bookingState === 'idle' && (
            <div className={`backdrop-blur-md border rounded-3xl p-6 shadow-2xl space-y-6 transition-colors duration-300 ${isDay ? 'bg-white border-slate-200 shadow-slate-200/50' : 'bg-slate-900/90 border-slate-800'}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-xl font-bold flex items-center gap-2 ${isDay ? 'text-slate-900' : 'text-white'}`}>
                  <Navigation className="w-5 h-5 text-emerald-500" /> Book Nature Ride
                </h2>
                <span className={`text-xs ${isDay ? 'text-slate-500' : 'text-slate-400'}`}>Official Eco-Transit</span>
              </div>

              {/* Pickup & Dropoff Selectors */}
              <div className="space-y-4 relative">
                <div className="absolute left-6 top-10 bottom-10 w-0.5 bg-emerald-500/30 border-l border-dashed border-emerald-400"></div>
                
                <div className={`p-4 rounded-2xl border space-y-1 relative z-10 transition-colors ${isDay ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Pickup Location
                  </label>
                  <select
                    value={pickup.id}
                    onChange={(e) => setPickup(DOMINICA_LOCATIONS.find(l => l.id === e.target.value) || pickup)}
                    className={`w-full border rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-emerald-500 transition ${isDay ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'}`}
                  >
                    {DOMINICA_LOCATIONS.map(loc => (
                      <option key={`pickup-${loc.id}`} value={loc.id}>{loc.name} ({loc.region})</option>
                    ))}
                  </select>
                </div>

                <div className={`p-4 rounded-2xl border space-y-1 relative z-10 transition-colors ${isDay ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> Dropoff Destination
                  </label>
                  <select
                    value={dropoff.id}
                    onChange={(e) => setDropoff(DOMINICA_LOCATIONS.find(l => l.id === e.target.value) || dropoff)}
                    className={`w-full border rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-emerald-500 transition ${isDay ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'}`}
                  >
                    {DOMINICA_LOCATIONS.map(loc => (
                      <option key={`dropoff-${loc.id}`} value={loc.id}>{loc.name} ({loc.region})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ride Categories */}
              <div className="space-y-3">
                <label className={`text-xs font-bold uppercase tracking-wider ${isDay ? 'text-slate-600' : 'text-slate-400'}`}>Select Vehicle Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'eco', title: 'Eco Ride', desc: 'Hybrid Sedan', icon: '🍃' },
                    { id: 'comfort', title: 'Comfort', desc: 'Spacious SUV', icon: '🚙' },
                    { id: 'suv', title: '4x4 Mountain', desc: 'Rainforest Pro', icon: '⛰️' },
                    { id: 'island_tour', title: 'Island Tour', desc: 'Guided Excursion', icon: '🌺' },
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id as RideCategory)}
                      className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                        category === cat.id
                          ? isDay ? 'bg-emerald-50 border-emerald-500 text-slate-900 shadow-md shadow-emerald-500/10' : 'bg-emerald-600/20 border-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                          : isDay ? 'bg-white border-slate-200 text-slate-600 hover:border-slate-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-2xl mb-1">{cat.icon}</div>
                      <div>
                        <div className={`text-sm font-bold ${isDay && category === cat.id ? 'text-emerald-900' : 'text-white'}`}>{cat.title}</div>
                        <div className={`text-[10px] ${isDay ? 'text-slate-500' : 'text-slate-400'}`}>{cat.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Promo & Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={`text-xs font-bold uppercase tracking-wider ${isDay ? 'text-slate-600' : 'text-slate-400'}`}>Promo Code</label>
                  <input
                    type="text"
                    placeholder="e.g. NATUREISLE"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-mono transition ${isDay ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'}`}
                  />
                </div>
                <div className="space-y-1">
                  <label className={`text-xs font-bold uppercase tracking-wider ${isDay ? 'text-slate-600' : 'text-slate-400'}`}>Driver Tip</label>
                  <select
                    value={tipUSD}
                    onChange={(e) => setTipUSD(Number(e.target.value))}
                    className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition ${isDay ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'}`}
                  >
                    <option value={2}>US$2 (EC$5.40)</option>
                    <option value={5}>US$5 (EC$13.50)</option>
                    <option value={10}>US$10 (EC$27.00)</option>
                    <option value={15}>US$15 (EC$40.50)</option>
                  </select>
                </div>
              </div>

              {/* Fare Summary & CTA */}
              {fareEstimate && (
                <div className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${isDay ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                  <div>
                    <div className={`text-xs ${isDay ? 'text-slate-500' : 'text-slate-400'}`}>Estimated Fare ({fareEstimate.distanceMiles} miles)</div>
                    <div className={`text-2xl font-black ${isDay ? 'text-slate-900' : 'text-white'}`}>
                      {currencyMode === 'XCD' ? `EC$ ${fareEstimate.totalXCD}` : `US$ ${fareEstimate.totalUSD}`}
                    </div>
                  </div>
                  <button
                    onClick={handleBookRide}
                    className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl shadow-xl shadow-emerald-600/30 transition flex items-center gap-2"
                  >
                    <span>Request Elite Ride</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {bookingState === 'searching' && (
            <div className={`border rounded-3xl p-10 text-center space-y-6 shadow-2xl transition-colors ${isDay ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'}`}>
              <div className="w-20 h-20 bg-emerald-600/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-500 animate-spin">
                <Car className="w-10 h-10" />
              </div>
              <h3 className={`text-2xl font-bold ${isDay ? 'text-slate-900' : 'text-white'}`}>Connecting with Nature Island Captains...</h3>
              <p className={`text-sm max-w-sm mx-auto ${isDay ? 'text-slate-600' : 'text-slate-400'}`}>
                Finding the closest verified 4x4 mountain driver near {pickup.name}.
              </p>
            </div>
          )}

          {(bookingState === 'confirmed' || bookingState === 'arrived' || bookingState === 'trip_in_progress') && (
            <div className={`border rounded-3xl p-6 shadow-2xl space-y-6 transition-colors ${isDay ? 'bg-white border-emerald-400' : 'bg-slate-900/90 border-emerald-500/40'}`}>
              <div className={`flex items-center justify-between border-b pb-4 ${isDay ? 'border-slate-200' : 'border-slate-800'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 text-xl font-bold">
                    ✓
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${isDay ? 'text-slate-900' : 'text-white'}`}>Driver Assigned & En Route</h3>
                    <p className="text-xs text-emerald-600 font-semibold">Estimated Arrival: 3 minutes</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/30 transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat with Driver</span>
                </button>
              </div>

              {/* Driver Card */}
              <div className={`p-4 rounded-2xl border flex items-center gap-4 transition-colors ${isDay ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                <img
                  src={SAMPLE_DRIVER.photoUrl}
                  alt={SAMPLE_DRIVER.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-base font-bold ${isDay ? 'text-slate-900' : 'text-white'}`}>{SAMPLE_DRIVER.name}</h4>
                    <span className="flex items-center gap-1 text-xs bg-amber-500/20 text-amber-600 px-2 py-0.5 rounded-full font-bold">
                      <Star className="w-3 h-3 fill-current" /> {SAMPLE_DRIVER.rating}
                    </span>
                  </div>
                  <p className={`text-xs mt-0.5 ${isDay ? 'text-slate-600' : 'text-slate-400'}`}>{SAMPLE_DRIVER.carColor} {SAMPLE_DRIVER.carModel}</p>
                  <p className="text-xs font-mono text-emerald-600 mt-1 font-bold">{SAMPLE_DRIVER.licensePlate}</p>
                </div>
                <a
                  href={`tel:${SAMPLE_DRIVER.phone}`}
                  className={`p-3 rounded-xl transition ${isDay ? 'bg-slate-200 hover:bg-slate-300 text-emerald-700' : 'bg-slate-800 hover:bg-slate-700 text-emerald-400'}`}
                >
                  <Phone className="w-5 h-5" />
                </a>
              </div>

              {/* Trip Route Details */}
              <div className={`space-y-3 p-4 rounded-2xl border transition-colors ${isDay ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 mt-1.5 ring-4 ring-emerald-500/20"></div>
                  <div>
                    <div className={`text-[10px] uppercase tracking-wider font-bold ${isDay ? 'text-slate-500' : 'text-slate-400'}`}>Pickup</div>
                    <div className={`text-sm font-semibold ${isDay ? 'text-slate-900' : 'text-white'}`}>{pickup.name}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-amber-500 mt-1.5 ring-4 ring-amber-500/20"></div>
                  <div>
                    <div className={`text-[10px] uppercase tracking-wider font-bold ${isDay ? 'text-slate-500' : 'text-slate-400'}`}>Destination</div>
                    <div className={`text-sm font-semibold ${isDay ? 'text-slate-900' : 'text-white'}`}>{dropoff.name}</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setBookingState('idle')}
                className={`w-full py-3 font-bold rounded-xl text-sm transition ${isDay ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
              >
                Cancel / Book Another Ride
              </button>
            </div>
          )}

        </div>

        {/* Right Column: Interactive Map Simulation & Features */}
        <div className="lg:col-span-5 space-y-6">
          <div className={`border rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col h-[480px] transition-colors ${isDay ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-base font-bold flex items-center gap-2 ${isDay ? 'text-slate-900' : 'text-white'}`}>
                <MapPin className="w-4 h-4 text-emerald-500" /> Dominica Live Radar Map
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600">
                GPS Active
              </span>
            </div>

            {/* Simulated SVG Map of Dominica */}
            <div className={`flex-1 rounded-2xl border relative overflow-hidden flex items-center justify-center p-4 transition-colors ${isDay ? 'bg-emerald-50/50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]"></div>
              
              {/* SVG Island Outline Representation */}
              <svg viewBox="0 0 400 400" className="w-full h-full max-h-[340px] drop-shadow-2xl">
                <path
                  d="M180,50 Q240,70 270,120 Q310,180 290,260 Q260,330 200,360 Q130,340 100,270 Q70,180 110,110 Q140,60 180,50 Z"
                  fill={isDay ? '#a7f3d0' : '#064e3b'}
                  stroke="#10b981"
                  strokeWidth="3"
                  className="opacity-85"
                />
                {/* Terrain peaks */}
                <circle cx="190" cy="180" r="8" fill="#f59e0b" className="animate-pulse" />
                <text x="205" y="184" fill={isDay ? '#92400e' : '#fbbf24'} fontSize="10" fontWeight="bold">Morne Diablotins</text>

                {/* Pickup marker */}
                <circle cx="140" cy="110" r="7" fill="#10b981" />
                <text x="152" y="114" fill={isDay ? '#065f46' : '#34d399'} fontSize="10" fontWeight="bold">Pickup ({pickup.name.split(' ')[0]})</text>

                {/* Dropoff marker */}
                <circle cx="230" cy="280" r="7" fill="#ef4444" />
                <text x="242" y="284" fill={isDay ? '#991b1b' : '#f87171'} fontSize="10" fontWeight="bold">Dropoff ({dropoff.name.split(' ')[0]})</text>

                {/* Driver Live GPS Pin */}
                <g className="animate-bounce">
                  <circle cx="165" cy="140" r="12" fill="#3b82f6" opacity="0.4" />
                  <circle cx="165" cy="140" r="6" fill="#3b82f6" />
                  <text x="180" y="144" fill={isDay ? '#1e40af' : '#93c5fd'} fontSize="10" fontWeight="bold">Captain Garfield</text>
                </g>
              </svg>
            </div>

            <div className={`mt-4 flex items-center justify-between text-xs ${isDay ? 'text-slate-600' : 'text-slate-400'}`}>
              <span>📍 Lat: 15.3015° N, Lng: -61.3885° W</span>
              <span className="text-emerald-600 font-semibold">Secure SSL Tracking</span>
            </div>
          </div>

          {/* Trust Banner */}
          <div className={`border rounded-3xl p-5 flex items-center gap-4 transition-colors ${isDay ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-950/40 border-emerald-500/30'}`}>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 text-xl font-bold flex-shrink-0">
              🌿
            </div>
            <div>
              <h4 className={`text-sm font-bold ${isDay ? 'text-emerald-950' : 'text-white'}`}>Nature Island Certified Transit</h4>
              <p className={`text-xs mt-0.5 ${isDay ? 'text-emerald-800' : 'text-slate-300'}`}>
                All drivers are licensed by the Dominica Tourism Authority with 4x4 mountain clearance and secure local payments (EC$ & USD).
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* Floating Emergency SOS Button */}
      <SOSButton currentLocationName={pickup.name} />

      {/* Driver Chat Modal */}
      <DriverChat
        driver={SAMPLE_DRIVER}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
}
export default App;
