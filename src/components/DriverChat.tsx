import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Phone, CheckCheck, X, Car, Sparkles } from 'lucide-react';
import { Driver, ChatMessage } from '../types';

interface DriverChatProps {
  driver: Driver;
  onClose?: () => void;
  isOpen: boolean;
}

export const DriverChat: React.FC<DriverChatProps> = ({ driver, onClose, isOpen }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'driver',
      text: `Hello! I'm ${driver.name}, your driver in the ${driver.carColor} ${driver.carModel}. I'm on my way to your pickup location.`,
      timestamp: new Date(Date.now() - 120000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'passenger',
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    // Simulate driver typing and automated friendly response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const driverReplies = [
        "Got it! See you in just a minute.",
        "Understood, thank you for letting me know.",
        "No problem at all. Driving safely towards you now!",
        "Perfect, I know the exact spot. See you soon!"
      ];
      const randomReply = driverReplies[Math.floor(Math.random() * driverReplies.length)];

      const driverMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'driver',
        text: randomReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, driverMsg]);
    }, 2000);
  };

  const sendQuickReply = (text: string) => {
    setInputText(text);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-800/80 px-5 py-4 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={driver.photoUrl}
                alt={driver.name}
                className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {driver.name}
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Car className="w-3.5 h-3.5 text-emerald-400" /> {driver.carColor} {driver.carModel} • <span className="font-mono text-emerald-400">{driver.licensePlate}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`tel:${driver.phone}`}
              className="p-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-xl transition border border-emerald-500/30"
              title="Call Driver"
            >
              <Phone className="w-5 h-5" />
            </a>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50">
          <div className="text-center my-2">
            <span className="text-[10px] uppercase tracking-wider bg-slate-800/80 text-slate-400 px-3 py-1 rounded-full border border-slate-700">
              Secure Encrypted Ride Chat
            </span>
          </div>

          {messages.map((msg) => {
            const isPassenger = msg.sender === 'passenger';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isPassenger ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-md ${
                    isPassenger
                      ? 'bg-emerald-600 text-white rounded-br-sm'
                      : 'bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700/60'
                  }`}
                >
                  {msg.text}
                </div>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 px-1">
                  <span>{msg.timestamp}</span>
                  {isPassenger && <CheckCheck className="w-3 h-3 text-emerald-400" />}
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-2 text-slate-400 text-xs bg-slate-900 border border-slate-800 px-3 py-2 rounded-2xl w-fit">
              <span className="animate-bounce">•</span>
              <span className="animate-bounce delay-100">•</span>
              <span className="animate-bounce delay-200">•</span>
              <span className="ml-1 text-[11px] text-emerald-400">{driver.name} is typing...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions */}
        <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => sendQuickReply("I'm at the pickup spot now!")}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full whitespace-nowrap border border-slate-700 transition"
          >
            📍 I'm at pickup spot
          </button>
          <button
            onClick={() => sendQuickReply("Be right there in 2 minutes.")}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full whitespace-nowrap border border-slate-700 transition"
          >
            ⏱️ Be there in 2 mins
          </button>
          <button
            onClick={() => sendQuickReply("Thank you for the ride!")}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full whitespace-nowrap border border-slate-700 transition"
          >
            👍 Thanks!
          </button>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            placeholder={`Message ${driver.name}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl transition shadow-lg shadow-emerald-600/30"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
