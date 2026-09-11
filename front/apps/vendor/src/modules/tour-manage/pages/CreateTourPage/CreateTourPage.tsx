import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@toursales/ui';

import { TourFormWizard } from '../../components/TourFormWizard/TourFormWizard';
import { tourManageApi, CreateTourPayload } from '../../api/tourManageApi';
import './CreateTourPage.css';

export const CreateTourPage: React.FC = () => {
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async (payload: CreateTourPayload) => {
    try {
      setSubmitting(true);
      await tourManageApi.createTour(payload);
      alert('Tur uğurla yaradıldı və satışa çıxarıldı!');
      navigate('/tours');
    } catch (err: any) {
      console.error('Tur yaradılarkən xəta:', err);
      alert(err.response?.data?.message || 'Tur yaradılarkən xəta baş verdi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="vendor-create-tour-page">
      <div className="vendor-page-header">
        <div>
          <h1 className="vendor-page-title">Yeni Tur Yarat</h1>
          <p className="vendor-page-subtitle">Avtobus oturacaq planı və marşrut qrafiki ilə yeni tur tərtib edin</p>
        </div>
      </div>

      <div className="vendor-page-content">
        <div className="vendor-form-back-bar">
          <Link to="/tours" className="vendor-back-link">
            <ArrowLeft size={16} />
            <span>Turların Siyahısına Qayıt</span>
          </Link>
        </div>

        <div className="vendor-wizard-container">
          <TourFormWizard onSubmit={handleCreate} isLoading={submitting} />
        </div>
      </div>
    </div>
  );
};
