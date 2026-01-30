'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bus, 
  Plane, 
  Hotel, 
  Search, 
  Calendar, 
  Users, 
  MapPin,
  ArrowRight,
  Star,
  Shield,
  Clock,
  Headphones
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

type SearchTab = 'bus' | 'flight' | 'hotel';

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SearchTab>('bus');
  
  // Bus search state
  const [busFrom, setBusFrom] = useState('');
  const [busTo, setBusTo] = useState('');
  const [busDate, setBusDate] = useState(formatDate(new Date().toISOString(), { year: 'numeric', month: '2-digit', day: '2-digit' }));
  
  // Flight search state
  const [flightFrom, setFlightFrom] = useState('');
  const [flightTo, setFlightTo] = useState('');
  const [flightDate, setFlightDate] = useState(formatDate(new Date().toISOString(), { year: 'numeric', month: '2-digit', day: '2-digit' }));
  const [flightPassengers, setFlightPassengers] = useState('1');
  
  // Hotel search state
  const [hotelCity, setHotelCity] = useState('');
  const [hotelCheckIn, setHotelCheckIn] = useState(formatDate(new Date().toISOString(), { year: 'numeric', month: '2-digit', day: '2-digit' }));
  const [hotelCheckOut, setHotelCheckOut] = useState(formatDate(new Date(Date.now() + 86400000).toISOString(), { year: 'numeric', month: '2-digit', day: '2-digit' }));
  const [hotelGuests, setHotelGuests] = useState('2');

  const handleBusSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (busFrom && busTo && busDate) {
      router.push(`/search/bus?source=${encodeURIComponent(busFrom)}&destination=${encodeURIComponent(busTo)}&travelDate=${busDate}`);
    }
  };

  const handleFlightSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (flightFrom && flightTo && flightDate) {
      router.push(`/search/flight?source=${encodeURIComponent(flightFrom)}&destination=${encodeURIComponent(flightTo)}&departureDate=${flightDate}&passengers=${flightPassengers}&tripType=one-way`);
    }
  };

  const handleHotelSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (hotelCity && hotelCheckIn && hotelCheckOut) {
      router.push(`/search/hotel?city=${encodeURIComponent(hotelCity)}&checkInDate=${hotelCheckIn}&checkOutDate=${hotelCheckOut}&guests=${hotelGuests}`);
    }
  };

  const tabs = [
    { id: 'bus' as SearchTab, label: 'Bus', icon: Bus },
    { id: 'flight' as SearchTab, label: 'Flight', icon: Plane },
    { id: 'hotel' as SearchTab, label: 'Hotel', icon: Hotel },
  ];

  const features = [
    {
      icon: Shield,
      title: 'Secure Booking',
      description: 'Your payments are protected with industry-standard encryption.',
    },
    {
      icon: Clock,
      title: '24/7 Support',
      description: 'Our customer support team is available round the clock.',
    },
    {
      icon: Star,
      title: 'Best Prices',
      description: 'Get the best deals and exclusive discounts on bookings.',
    },
    {
      icon: Headphones,
      title: 'Easy Cancellation',
      description: 'Hassle-free cancellation with instant refunds.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand-600 to-brand-800 py-20 lg:py-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-500 rounded-full opacity-20 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-400 rounded-full opacity-20 blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              Book Your Next Journey
            </h1>
            <p className="text-lg md:text-xl text-brand-100 max-w-2xl mx-auto">
              Find and book buses, flights, and hotels at the best prices. 
              Travel smart with Lean Travel.
            </p>
          </div>

          {/* Search Card */}
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl mx-auto overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'bg-brand-50 text-brand-600 border-b-2 border-brand-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Forms */}
            <div className="p-6">
              {activeTab === 'bus' && (
                <form onSubmit={handleBusSearch} className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="From"
                        value={busFrom}
                        onChange={(e) => setBusFrom(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="To"
                        value={busTo}
                        onChange={(e) => setBusTo(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="date"
                        value={busDate}
                        onChange={(e) => setBusDate(e.target.value)}
                        className="pl-10"
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" size="lg">
                    <Search className="w-5 h-5 mr-2" />
                    Search Buses
                  </Button>
                </form>
              )}

              {activeTab === 'flight' && (
                <form onSubmit={handleFlightSearch} className="space-y-4">
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="From"
                        value={flightFrom}
                        onChange={(e) => setFlightFrom(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="To"
                        value={flightTo}
                        onChange={(e) => setFlightTo(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="date"
                        value={flightDate}
                        onChange={(e) => setFlightDate(e.target.value)}
                        className="pl-10"
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        value={flightPassengers}
                        onChange={(e) => setFlightPassengers(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                          <option key={n} value={n}>
                            {n} Passenger{n > 1 ? 's' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" size="lg">
                    <Search className="w-5 h-5 mr-2" />
                    Search Flights
                  </Button>
                </form>
              )}

              {activeTab === 'hotel' && (
                <form onSubmit={handleHotelSearch} className="space-y-4">
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="City or Hotel"
                        value={hotelCity}
                        onChange={(e) => setHotelCity(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="date"
                        placeholder="Check-in"
                        value={hotelCheckIn}
                        onChange={(e) => setHotelCheckIn(e.target.value)}
                        className="pl-10"
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="date"
                        placeholder="Check-out"
                        value={hotelCheckOut}
                        onChange={(e) => setHotelCheckOut(e.target.value)}
                        className="pl-10"
                        min={hotelCheckIn}
                        required
                      />
                    </div>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        value={hotelGuests}
                        onChange={(e) => setHotelGuests(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                          <option key={n} value={n}>
                            {n} Guest{n > 1 ? 's' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" size="lg">
                    <Search className="w-5 h-5 mr-2" />
                    Search Hotels
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Lean Travel?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We make travel booking simple, secure, and affordable.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-brand-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-brand-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-lg text-brand-100 mb-8">
            Join millions of travelers who trust Lean Travel for their bookings.
          </p>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => router.push('/register')}
          >
            Sign Up Now
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}