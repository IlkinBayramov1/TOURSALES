import { useState, useEffect, useCallback } from 'react';
import { SeatMatrix, BusSeat } from '@toursales/types';
import { bookingApi } from '../api/bookingApi';
import { useToast } from '../../../shared/context/ToastContext';

export const useSeatSelection = (tourId: string) => {
  const [seatMatrix, setSeatMatrix] = useState<SeatMatrix | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lockTimeRemaining, setLockTimeRemaining] = useState<number>(300); // 5 minutes in seconds
  const { warning, error: toastError } = useToast();

  const fetchSeats = useCallback(async () => {
    if (!tourId) return;
    try {
      const data = await bookingApi.getSeats(tourId);
      if (data) setSeatMatrix(data);
    } catch (err: any) {
      toastError(err?.message || 'Oturacaq planı yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  }, [tourId]);

  useEffect(() => {
    fetchSeats();
  }, [fetchSeats]);

  // Lock timer effect
  useEffect(() => {
    if (selectedSeats.length === 0) return;

    const timer = setInterval(() => {
      setLockTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          warning('Oturacaqların 5 dəqiqəlik rezervasiya müddəti bitdi. Zəhmət olmasa yenidən seçin.', 'Müddət bitdi');
          setSelectedSeats([]);
          fetchSeats();
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedSeats.length, fetchSeats]);

  const toggleSeat = async (seatNumber: number) => {
    if (selectedSeats.includes(seatNumber)) {
      // Deselect
      const updated = selectedSeats.filter((s) => s !== seatNumber);
      setSelectedSeats(updated);
      try {
        await bookingApi.releaseSeat(tourId, [seatNumber]);
      } catch {
        // ignore
      }
    } else {
      // Maximum 8 seats per booking
      if (selectedSeats.length >= 8) {
        warning('Bir sifarişdə ən çox 8 yer seçə bilərsiniz');
        return;
      }

      const updated = [...selectedSeats, seatNumber];
      setSelectedSeats(updated);
      setLockTimeRemaining(300); // Reset 5 min timer

      try {
        await bookingApi.lockSeat(tourId, [seatNumber]);
      } catch (err: any) {
        // Rollback optimistic selection if another user grabbed it
        setSelectedSeats(selectedSeats.filter((s) => s !== seatNumber));
        toastError(err?.message || 'Bu yer artıq başqa müştəri tərəfindən seçilib');
        fetchSeats();
      }
    }
  };

  return {
    seatMatrix,
    selectedSeats,
    toggleSeat,
    loading,
    lockTimeRemaining,
    refetchSeats: fetchSeats,
  };
};
