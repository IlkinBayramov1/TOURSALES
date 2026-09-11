import { useState, useEffect, useCallback } from 'react';
import { PassengerInfo, PriceCalculationResult, PaymentMethod, Tour } from '@toursales/types';
import { bookingApi } from '../api/bookingApi';
import { useToast } from '../../../shared/context/ToastContext';

export const useBookingFlow = (tour: Tour | null) => {
  const [step, setStep] = useState<number>(1); // 1: Seats, 2: Passengers, 3: Checkout
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
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
            passportUrl: '',
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
      const subtotal = tour.basePrice * selectedSeats.length;
      setPriceBreakdown({
        basePrice: tour.basePrice,
        seatsCount: selectedSeats.length,
        subtotal,
        earlyBirdDiscount: 0,
        loyaltyDiscount: 0,
        promoDiscount: 0,
        totalPrice: subtotal,
        currency: 'AZN',
      });
    }
  }, [tour, selectedSeats.length, promoCode]);

  useEffect(() => {
    calculatePrice();
  }, [calculatePrice]);

  const updatePassenger = (seatNumber: number, field: keyof PassengerInfo, value: string) => {
    setPassengers((prev) =>
      prev.map((p) => (p.seatNumber === seatNumber ? { ...p, [field]: value } : p))
    );
  };

  return {
    step,
    setStep,
    selectedSeats,
    setSelectedSeats,
    passengers,
    updatePassenger,
    promoCode,
    setPromoCode,
    priceBreakdown,
    recalculatePrice: calculatePrice,
    isSubmitting,
    setIsSubmitting,
  };
};
