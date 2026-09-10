import React, { useState } from 'react';
import { ShieldAlert, Phone, Users, MapPin, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { EmergencyContact } from '../types';

interface SOSButtonProps {
  currentLocationName: string;
}

export const SOSButton: React.FC<SOSButtonProps> = ({ currentLocationName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isSent, setIsSent] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>([
    { id: '1', name: 'Police Emergency (Dominica)', phone: '999', relationship: 'Emergency Services' },
    { id: '2', name: 'Roseau Police Station', phone: '+1 767 448 2222', relationship: 'Local Precinct' },
    { id: '3', name: 'Maria Joseph (Spouse/Next of Kin)', phone: '+1 767 235 8890', relationship: 'Family' },
  ]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);

  // Trigger Countdown
  const startEmergencyCountdown = () => {
    setCountdown(5);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          triggerSOSDispatch();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelCountdown = () => {
    setCountdown(null);
  };

  const triggerSOSDispatch = () => {
    setIsSent(true);
    // In real environment, trigger SMS / API dispatch to emergency contacts with geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.log(`SOS Dispatched! Lat: ${pos.coords.latitude}, Lng: ${pos.coords.longitude}`);
        },
        () => {
          console.log('SOS Dispatched with location name:', currentLocationName);
        }
      );
    }
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName || !newContactPhone) return;
    const newC: EmergencyContact = {
      id: Date.now().toString(),
      name: newContactName,
      phone: newContactPhone,
      relationship: 'Personal Contact'
    };
    setContacts([...contacts, newC]);
    setNewContactName('');
    setNewContactPhone('');
    setShowAddContact(false);
  };

  return (
    <>
      {/* Floating SOS Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-black px-5 py-3.5 rounded-full shadow-2xl shadow-red-600/50 border-2 border-red-400 animate-pulse hover:animate-none transition-all transform hover:scale-105 active:scale-95"
          title="Emergency SOS"
        >
          <ShieldAlert className="w-6 h-6" />
          <span className="tracking-wider text-sm">SOS EMERGENCY</span>
        </button>
      </div>

      {/* SOS Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/40 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-950 to-slate-900 px-6 py-4 border-b border-red-900/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Emergency SOS Center
                  </h3>
                  <p className="text-xs text-red-300">Instant Alert & Geolocation Broadcast</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setCountdown(null);
                  setIsSent(false);
                }}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {isSent ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-20 h-20 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h4 className="text-2xl font-bold text-white">SOS Alert Dispatched!</h4>
                  <p className="text-slate-300 text-sm max-w-md mx-auto">
                    Your emergency contacts and local authorities have been sent your live location: <span className="text-emerald-400 font-semibold">{currentLocationName}</span>. Help is on the way.
                  </p>
                  <button
                    onClick={() => {
                      setIsSent(false);
                      setIsOpen(false);
                    }}
                    className="mt-4 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition"
                  >
                    Close & Return
                  </button>
                </div>
              ) : countdown !== null ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-24 h-24 bg-red-600/20 border-4 border-red-500 rounded-full flex items-center justify-center mx-auto text-red-500 text-4xl font-black animate-ping">
                    {countdown}
                  </div>
                  <h4 className="text-xl font-bold text-white">Broadcasting Emergency in {countdown}s...</h4>
                  <p className="text-slate-300 text-sm">
                    Tap cancel if this was an accidental trigger.
                  </p>
                  <button
                    onClick={cancelCountdown}
                    className="mt-4 px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold border border-slate-700 transition shadow-lg"
                  >
                    CANCEL SOS
                  </button>
                </div>
              ) : (
                <>
                  {/* Big Trigger Button */}
                  <div className="bg-red-950/40 border border-red-600/30 rounded-2xl p-5 text-center space-y-4">
                    <div className="flex items-center justify-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4" /> Immediate Assistance
                    </div>
                    <p className="text-slate-300 text-sm">
                      Pressing this button will instantly share your GPS coordinates and a predefined distress message with all emergency contacts and local authorities.
                    </p>
                    <button
                      onClick={startEmergencyCountdown}
                      className="w-full py-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-lg rounded-xl shadow-xl shadow-red-600/40 border border-red-400 transition transform hover:-translate-y-0.5"
                    >
                      TRIGGER EMERGENCY SOS NOW
                    </button>
                  </div>

                  {/* Location Preview */}
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Current Broadcast Location</div>
                      <div className="text-sm font-semibold text-white">{currentLocationName} (Dominica Nature Island)</div>
                    </div>
                  </div>

                  {/* Contacts List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                        <Users className="w-4 h-4" /> Emergency Contacts ({contacts.length})
                      </h4>
                      <button
                        onClick={() => setShowAddContact(!showAddContact)}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                      >
                        + Add Contact
                      </button>
                    </div>

                    {showAddContact && (
                      <form onSubmit={handleAddContact} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                        <input
                          type="text"
                          placeholder="Contact Name"
                          value={newContactName}
                          onChange={(e) => setNewContactName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Phone Number (+1 767 ...)"
                          value={newContactPhone}
                          onChange={(e) => setNewContactPhone(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                          required
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowAddContact(false)}
                            className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg"
                          >
                            Save Contact
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {contacts.map((c) => (
                        <div key={c.id} className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-white">{c.name}</div>
                            <div className="text-xs text-slate-400">{c.phone} • <span className="text-emerald-400">{c.relationship}</span></div>
                          </div>
                          <a
                            href={`tel:${c.phone}`}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg transition"
                            title="Call Contact"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
