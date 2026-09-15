import { useState, useEffect, useCallback } from 'react';
import { PassengerInfo, PriceCalculationResult, PaymentMethod, Tour } from '@toursales/types';
import { bookingApi } from '../api/bookingApi';
import { useToast } from '../../../shared/context/ToastContext';

export const useBookingFlow = (tour: Tour | null, externalSeats?: number[]) => {
  const [step, setStep] = useState<number>(1); // 1: Seats, 2: Passengers, 3: Checkout
  const [internalSeats, setInternalSeats] = useState<number[]>([]);
  const selectedSeats = externalSeats !== undefined ? externalSeats : internalSeats;
  const setSelectedSeats = setInternalSeats;

  const [passengers, setPassengers] = useState<PassengerInfo[]>([]);
  const [promoCode, setPromoCode] = useState<string>('');
  const [priceBreakdown, setPriceBreakdown] = useState<PriceCalculationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { error: toastError } = useToast();

  // Auto initialize passenger form when seats change
  useEffect(() => {
    setPassengers((prev) => {
      return selectedSeats.map((seatNum) => {
        const existing = prev.find((p) => p.seatNumber === seatNum);
        return (
          existing || {
            seatNumber: seatNum,
            fullName: '',
            phone: '',
            idNumber: '',
            finCode: '',
            passportNumber: '',
            passportUrl: '',
            birthDate: '',
            gender: undefined,
            emergencyPhone: '',
            notes: '',
          }
        );
      });
    });
  }, [selectedSeats]);

  // Recalculate price when seats count or promoCode change
  const calculatePrice = useCallback(async () => {
    if (!tour || selectedSeats.length === 0) {
      setPriceBreakdown(null);
      return;
    }
    try {
      const data = await bookingApi.calculatePrice(tour.id, {
        seatsCount: selectedSeats.length,
        promoCode: promoCode || undefined,
      });
      if (data) setPriceBreakdown(data);
    } catch (err: any) {
      // fallback calculation if API calculation error
      const tourPrice = Number((tour as any).price ?? (tour as any).basePrice ?? 0);
      const subtotal = tourPrice * selectedSeats.length;
      setPriceBreakdown({
        basePrice: tourPrice,
        seatsCount: selectedSeats.length,
        subtotal,
        earlyBirdDiscount: 0,
        loyaltyDiscount: 0,
        promoDiscount: 0,
        totalPrice: subtotal,
        currency: tour.currency || 'AZN',
      });
    }
  }, [tour, selectedSeats.length, promoCode]);

  useEffect(() => {
    calculatePrice();
  }, [calculatePrice]);

  const updatePassenger = (seatNumber: number, field: keyof PassengerInfo, value: any) => {
    setPassengers((prev) =>
      prev.map((p) => (p.seatNumber === seatNumber ? { ...p, [field]: value } : p))
    );
  };

  const copyPassengerDetailsToAll = (sourceSeatNumber: number) => {
    setPassengers((prev) => {
      const source = prev.find((p) => p.seatNumber === sourceSeatNumber);
      if (!source) return prev;
      return prev.map((p) => {
        if (p.seatNumber === sourceSeatNumber) return p;
        return {
          ...p,
          phone: p.phone || source.phone,
          emergencyPhone: p.emergencyPhone || source.emergencyPhone,
        };
      });
    });
  };

  return {
    step,
    setStep,
    selectedSeats,
    setSelectedSeats,
    passengers,
    setPassengers,
    updatePassenger,
    copyPassengerDetailsToAll,
    promoCode,
    setPromoCode,
    priceBreakdown,
    recalculatePrice: calculatePrice,
    isSubmitting,
    setIsSubmitting,
  };
};
