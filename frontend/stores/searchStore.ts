/**
 * SEARCH STORE
 * Zustand store for search state management
 */

import { create } from 'zustand';
import { 
  BusSearchParams, 
  FlightSearchParams, 
  HotelSearchParams,
  BusSearchResult,
  FlightSearchResult,
  HotelSearchResult 
} from '@/types';

interface SearchState {
  // Bus search
  busSearchParams: BusSearchParams | null;
  busResults: BusSearchResult[];
  selectedBus: BusSearchResult | null;
  
  // Flight search
  flightSearchParams: FlightSearchParams | null;
  flightResults: FlightSearchResult[];
  selectedFlight: FlightSearchResult | null;
  selectedCabinClass: string;
  
  // Hotel search
  hotelSearchParams: HotelSearchParams | null;
  hotelResults: HotelSearchResult[];
  selectedHotel: HotelSearchResult | null;
  selectedRoom: any | null;
  
  // Common
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setBusSearchParams: (params: BusSearchParams) => void;
  setBusResults: (results: BusSearchResult[]) => void;
  setSelectedBus: (bus: BusSearchResult | null) => void;
  
  setFlightSearchParams: (params: FlightSearchParams) => void;
  setFlightResults: (results: FlightSearchResult[]) => void;
  setSelectedFlight: (flight: FlightSearchResult | null) => void;
  setSelectedCabinClass: (cabinClass: string) => void;
  
  setHotelSearchParams: (params: HotelSearchParams) => void;
  setHotelResults: (results: HotelSearchResult[]) => void;
  setSelectedHotel: (hotel: HotelSearchResult | null) => void;
  setSelectedRoom: (room: any | null) => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearSearch: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  // Initial state
  busSearchParams: null,
  busResults: [],
  selectedBus: null,
  
  flightSearchParams: null,
  flightResults: [],
  selectedFlight: null,
  selectedCabinClass: 'ECONOMY',
  
  hotelSearchParams: null,
  hotelResults: [],
  selectedHotel: null,
  selectedRoom: null,
  
  isLoading: false,
  error: null,
  
  // Bus actions
  setBusSearchParams: (params) => set({ busSearchParams: params }),
  setBusResults: (results) => set({ busResults: results }),
  setSelectedBus: (bus) => set({ selectedBus: bus }),
  
  // Flight actions
  setFlightSearchParams: (params) => set({ flightSearchParams: params }),
  setFlightResults: (results) => set({ flightResults: results }),
  setSelectedFlight: (flight) => set({ selectedFlight: flight }),
  setSelectedCabinClass: (cabinClass) => set({ selectedCabinClass: cabinClass }),
  
  // Hotel actions
  setHotelSearchParams: (params) => set({ hotelSearchParams: params }),
  setHotelResults: (results) => set({ hotelResults: results }),
  setSelectedHotel: (hotel) => set({ selectedHotel: hotel }),
  setSelectedRoom: (room) => set({ selectedRoom: room }),
  
  // Common actions
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  clearSearch: () => set({
    busSearchParams: null,
    busResults: [],
    selectedBus: null,
    flightSearchParams: null,
    flightResults: [],
    selectedFlight: null,
    selectedCabinClass: 'ECONOMY',
    hotelSearchParams: null,
    hotelResults: [],
    selectedHotel: null,
    selectedRoom: null,
    error: null,
  }),
}));