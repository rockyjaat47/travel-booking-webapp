/**
 * BOOKING STORE
 * Zustand store for booking state management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Booking, Passenger, AddOn } from '@/types';

interface BookingState {
  // Current booking
  currentBooking: Booking | null;
  passengers: Passenger[];
  addOns: AddOn[];
  selectedSeats: string[];
  couponCode: string | null;
  discountAmount: number;
  
  // Booking flow
  step: number;
  
  // Actions
  setCurrentBooking: (booking: Booking | null) => void;
  setPassengers: (passengers: Passenger[]) => void;
  addPassenger: (passenger: Passenger) => void;
  removePassenger: (index: number) => void;
  updatePassenger: (index: number, passenger: Partial<Passenger>) => void;
  
  setAddOns: (addOns: AddOn[]) => void;
  addAddOn: (addOn: AddOn) => void;
  removeAddOn: (name: string) => void;
  
  setSelectedSeats: (seats: string[]) => void;
  toggleSeat: (seat: string) => void;
  
  setCouponCode: (code: string | null) => void;
  setDiscountAmount: (amount: number) => void;
  
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  
  resetBooking: () => void;
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentBooking: null,
      passengers: [],
      addOns: [],
      selectedSeats: [],
      couponCode: null,
      discountAmount: 0,
      step: 1,
      
      // Booking actions
      setCurrentBooking: (booking) => set({ currentBooking: booking }),
      
      // Passenger actions
      setPassengers: (passengers) => set({ passengers }),
      addPassenger: (passenger) => set((state) => ({
        passengers: [...state.passengers, passenger],
      })),
      removePassenger: (index) => set((state) => ({
        passengers: state.passengers.filter((_, i) => i !== index),
      })),
      updatePassenger: (index, passenger) => set((state) => ({
        passengers: state.passengers.map((p, i) => 
          i === index ? { ...p, ...passenger } : p
        ),
      })),
      
      // Add-on actions
      setAddOns: (addOns) => set({ addOns }),
      addAddOn: (addOn) => set((state) => ({
        addOns: [...state.addOns, addOn],
      })),
      removeAddOn: (name) => set((state) => ({
        addOns: state.addOns.filter((a) => a.name !== name),
      })),
      
      // Seat actions
      setSelectedSeats: (seats) => set({ selectedSeats: seats }),
      toggleSeat: (seat) => set((state) => {
        const exists = state.selectedSeats.includes(seat);
        if (exists) {
          return { selectedSeats: state.selectedSeats.filter((s) => s !== seat) };
        }
        return { selectedSeats: [...state.selectedSeats, seat] };
      }),
      
      // Coupon actions
      setCouponCode: (code) => set({ couponCode: code }),
      setDiscountAmount: (amount) => set({ discountAmount: amount }),
      
      // Step actions
      setStep: (step) => set({ step }),
      nextStep: () => set((state) => ({ step: Math.min(state.step + 1, 4) })),
      prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 1) })),
      
      // Reset
      resetBooking: () => set({
        currentBooking: null,
        passengers: [],
        addOns: [],
        selectedSeats: [],
        couponCode: null,
        discountAmount: 0,
        step: 1,
      }),
    }),
    {
      name: 'booking-storage',
      partialize: (state) => ({
        currentBooking: state.currentBooking,
        passengers: state.passengers,
        addOns: state.addOns,
        selectedSeats: state.selectedSeats,
        couponCode: state.couponCode,
        discountAmount: state.discountAmount,
        step: state.step,
      }),
    }
  )
);