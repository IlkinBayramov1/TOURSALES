import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Calendar,
  Users,
  MapPin,
  Clock,
  ArrowRight,
  Plus,
  Loader2,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { customTourApi } from '../../api/customTourApi';
import { CustomTourRequest } from '@toursales/types';

export const MyCustomToursPage: React.FC = () => {
  const [requests, setRequests] = useState<CustomTourRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await customTourApi.getMyRequests();
        setRequests(data);
      } catch (err) {
        console.error('Failed to load my custom tours:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 20px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
            Fərdi Tur Sorğularım
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.92rem', margin: 0 }}>
            Özünüz qurduğunuz marşrutlar və agentliklərdən daxil olan təkliflər
          </p>
        </div>

        <Link
          to="/custom-tour"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: '#ffffff',
            fontWeight: 700,
            textDecoration: 'none',
            fontSize: '0.9rem',
          }}
        >
          <Plus size={18} />
          <span>Yeni Fərdi Tur Yarat</span>
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Loader2 size={36} className="animate-spin" color="#2563eb" />
          <p style={{ color: '#64748b', marginTop: 12 }}>Sorğular yüklənir...</p>
        </div>
      ) : requests.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #e2e8f0',
            padding: '60px 20px',
            textAlign: 'center',
          }}
        >
          <Compass size={48} color="#94a3b8" style={{ marginBottom: 12 }} />
          <h3 style={{ margin: '0 0 8px', color: '#0f172a' }}>Hələ heç bir fərdi tur sorğunuz yoxdur</h3>
          <p style={{ color: '#64748b', maxWidth: 440, margin: '0 auto 20px', fontSize: '0.9rem' }}>
            Ailəniz və ya dostlarınız üçün xüsusi marşrut, avtomobil və otel seçərək fərdi tur quraşdırın.
          </p>
          <Link
            to="/custom-tour"
            style={{
              padding: '10px 24px',
              borderRadius: 10,
              background: '#2563eb',
              color: '#ffffff',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Sparkles size={16} />
            <span>İndi Başla</span>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {requests.map(req => {
            const isConfirmed = req.status === 'PAID_CONFIRMED';
            return (
              <div
                key={req.id}
                style={{
                  background: '#ffffff',
                  borderRadius: 16,
                  border: '1px solid #e2e8f0',
                  padding: 24,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563eb', fontSize: '0.85rem' }}>
                      {req.requestNumber}
                    </span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: isConfirmed ? '#ecfdf5' : '#eff6ff',
                        color: isConfirmed ? '#059669' : '#2563eb',
                      }}
                    >
                      {req.status === 'OPEN_FOR_BIDS'
                        ? 'Tender Açıqdır'
                        : req.status === 'BIDS_REVIEW'
                        ? 'Təkliflər Nəzərdən Keçirilir'
                        : req.status === 'ACCEPTED'
                        ? 'Təklif Qəbul Edildi'
                        : isConfirmed
                        ? 'Təsdiqləndi (Ödənildi)'
                        : req.status}
                    </span>
                    <span
                      style={{
                        background: '#f1f5f9',
                        color: '#475569',
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {req.bidsCount || req.bids?.length || 0} Təklif
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 8px', fontSize: '1.15rem', color: '#0f172a' }}>
                    {req.title}
                  </h3>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: '0.85rem', color: '#64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={14} color="#2563eb" />
                      <span>{req.destinations.join(' & ')}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={14} />
                      <span>
                        {req.durationDays} gün • {new Date(req.startDate).toLocaleDateString('az-AZ')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Users size={14} />
                      <span>{req.totalPassengers} nəfər</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Link
                    to={`/custom-tour/${req.id}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '10px 18px',
                      borderRadius: 10,
                      background: '#eff6ff',
                      color: '#2563eb',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      textDecoration: 'none',
                    }}
                  >
                    <span>Təkliflərə Bax</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
