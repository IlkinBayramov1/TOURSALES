import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Spinner } from '@toursales/ui';

import { TourFormWizard } from '../../components/TourFormWizard/TourFormWizard';
import { tourManageApi, CreateTourPayload } from '../../api/tourManageApi';
import { Tour } from '@toursales/types';
import './EditTourPage.css';

export const EditTourPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTour = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await tourManageApi.getTourById(id);
        setTour(res.data);
      } catch (err) {
        console.error('Tur tapılmadı:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTour();
  }, [id]);

  const handleUpdate = async (payload: CreateTourPayload) => {
    if (!id) return;
    try {
      setSubmitting(true);
      await tourManageApi.updateTour(id, payload);
      alert('Tur məlumatları uğurla yeniləndi!');
      navigate('/tours');
    } catch (err: any) {
      console.error('Yeniləmə xətası:', err);
      alert(err.response?.data?.message || 'Tur yenilənərkən xəta baş verdi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="vendor-edit-tour-page">
      <div className="vendor-page-header">
        <div>
          <h1 className="vendor-page-title">Turu Redaktə Et</h1>
          <p className="vendor-page-subtitle">{tour?.title ? `“${tour.title}” məlumatlarının redaktəsi` : 'Tur parametrlərinin yenilənməsi'}</p>
        </div>
      </div>

      <div className="vendor-page-content">
        <div className="vendor-form-back-bar">
          <Link to="/tours" className="vendor-back-link">
            <ArrowLeft size={16} />
            <span>Turların Siyahısına Qayıt</span>
          </Link>
        </div>

        {loading ? (
          <div className="vendor-edit-loading">
            <Spinner size="lg" />
            <p>Tur məlumatları yüklənir...</p>
          </div>
        ) : (
          <div className="vendor-wizard-container">
            <TourFormWizard
              initialData={{
                title: tour?.title,
                description: tour?.description,
                type: tour?.type,
                region: tour?.region,
                destinationCountry: tour?.destinationCountry || tour?.hotelName,
                basePrice: tour?.basePrice,
                startDate: tour?.startDate,
                endDate: tour?.endDate,
                meetingPoint: tour?.meetingPoint,
                images: tour?.images,
                capacity: tour?.capacity,
                busType: tour?.busType as any,
                hotelName: tour?.hotelName,
                hotelCategory: tour?.hotelCategory,
                flightIncluded: tour?.flightIncluded ?? tour?.hasFlight,
                passportVisaRequired: tour?.passportVisaRequired ?? tour?.hasVisaSupport,
                inclusions: tour?.inclusions,
                exclusions: tour?.exclusions,
                itinerary: tour?.itinerary,
              }}
              onSubmit={handleUpdate}
              isLoading={submitting}
            />
          </div>
        )}
      </div>
    </div>
  );
};
