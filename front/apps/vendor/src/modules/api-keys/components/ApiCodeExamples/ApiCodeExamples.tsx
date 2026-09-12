import React, { useState } from 'react';
import { Copy, Check, Terminal, Shield, Cpu, ExternalLink } from 'lucide-react';
import './ApiCodeExamples.css';

type Language = 'curl' | 'node' | 'python' | 'php';

export const ApiCodeExamples: React.FC = () => {
  const [lang, setLang] = useState<Language>('curl');
  const [copied, setCopied] = useState(false);

  const getSnippets = () => {
    switch (lang) {
      case 'curl':
        return `# 1. Turların Siyahısını Gətirmək
curl -X GET "https://api.toursales.az/api/v1/tours/my-tours" \\
  -H "Authorization: Bearer ts_live_sec_your_secret_key" \\
  -H "Content-Type: application/json"

# 2. Xarici Vebsaytdan Yeni Sifariş Yaratmaq
curl -X POST "https://api.toursales.az/api/v1/bookings" \\
  -H "Authorization: Bearer ts_live_sec_your_secret_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tourId": "T-128948",
    "customerName": "Rəşad Məmmədov",
    "customerEmail": "rashad@example.com",
    "customerPhone": "+994501234567",
    "seats": 2,
    "paidAmount": 130.00
  }'`;

      case 'node':
        return `// Node.js (v18+) ilə API Sorğusu
const API_KEY = 'ts_live_sec_your_secret_key';
const BASE_URL = 'https://api.toursales.az/api/v1';

async function fetchMyTours() {
  const res = await fetch(\`\${BASE_URL}/tours/my-tours\`, {
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`,
      'Content-Type': 'application/json'
    }
  });
  const data = await res.json();
  console.log('Turlar:', data);
}

async function createBooking(tourId, customer) {
  const res = await fetch(\`\${BASE_URL}/bookings\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ tourId, ...customer })
  });
  return await res.json();
}`;

      case 'python':
        return `# Python (requests) ilə API Sorğusu
import requests

API_KEY = "ts_live_sec_your_secret_key"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Turları oxumaq
response = requests.get("https://api.toursales.az/api/v1/tours/my-tours", headers=HEADERS)
tours = response.json()
print("Turlar:", tours)

# Yeni rezervasiya göndərmək
booking_payload = {
    "tourId": "T-128948",
    "customerName": "Rəşad Məmmədov",
    "customerPhone": "+994501234567",
    "seats": 2,
    "paidAmount": 130.00
}
res = requests.post("https://api.toursales.az/api/v1/bookings", json=booking_payload, headers=HEADERS)
print("Sifariş statusu:", res.json())`;

      case 'php':
        return `<?php
// PHP cURL ilə TOURSALES API İnteqrasiyası
$apiKey = "ts_live_sec_your_secret_key";
$ch = curl_init("https://api.toursales.az/api/v1/tours/my-tours");

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer " . $apiKey,
    "Content-Type: application/json"
]);

$response = curl_exec($ch);
curl_close($ch);

$tours = json_decode($response, true);
print_r($tours);
?>`;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getSnippets());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-examples-card">
      <div className="code-header-row">
        <div>
          <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.125rem', fontWeight: 700 }}>
            İnteraktiv Developer Sənədləri və İnteqrasiya Nümunələri
          </h3>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b' }}>
            Aşağıdakı nümunə kodları öz proqramlaşdırma dilinizdə tətbiq edərək bir neçə dəqiqəyə inteqrasiya qura bilərsiniz.
          </p>
        </div>

        <div className="code-lang-selector">
          <button
            type="button"
            className={`code-lang-btn ${lang === 'curl' ? 'active' : ''}`}
            onClick={() => setLang('curl')}
          >
            cURL
          </button>
          <button
            type="button"
            className={`code-lang-btn ${lang === 'node' ? 'active' : ''}`}
            onClick={() => setLang('node')}
          >
            Node.js
          </button>
          <button
            type="button"
            className={`code-lang-btn ${lang === 'python' ? 'active' : ''}`}
            onClick={() => setLang('python')}
          >
            Python
          </button>
          <button
            type="button"
            className={`code-lang-btn ${lang === 'php' ? 'active' : ''}`}
            onClick={() => setLang('php')}
          >
            PHP
          </button>
        </div>
      </div>

      <div className="code-block-wrapper">
        <button type="button" className="code-copy-btn" onClick={handleCopy}>
          {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
          <span>{copied ? 'Kopyalandı' : 'Kodu Kopyala'}</span>
        </button>
        <pre className="code-snippet">
          <code>{getSnippets()}</code>
        </pre>
      </div>

      <div className="docs-features-grid">
        <div className="doc-info-box">
          <div className="doc-info-title">
            <Shield size={18} color="#2563eb" />
            <span>Təhlükəsiz Autentifikasiya</span>
          </div>
          <p className="doc-info-desc">
            Bütün sorğuların başlıq hissəsinə <code>Authorization: Bearer ts_live_...</code> ötürülməlidir. Açar heç vaxt müştəri tərəfi (frontend) kodlarında ifşa edilməməlidir.
          </p>
        </div>

        <div className="doc-info-box">
          <div className="doc-info-title">
            <Cpu size={18} color="#059669" />
            <span>Rate Limiting & Kvota</span>
          </div>
          <p className="doc-info-desc">
            Hər açar üçün dəqiqədə maksimum 120 sorğu nəzərdə tutulub. Limiti aşdıqda sistem <code>429 Too Many Requests</code> cavabı qaytarır.
          </p>
        </div>

        <div className="doc-info-box">
          <div className="doc-info-title">
            <Terminal size={18} color="#7c3aed" />
            <span>Sandbox / Test Mühiti</span>
          </div>
          <p className="doc-info-desc">
            İnteqrasiyanı canlı istifadəyə verməzdən əvvəl <code>ts_test_...</code> prefiksli sandbox açarları ilə təhlükəsiz sınaqdan keçirin.
          </p>
        </div>
      </div>
    </div>
  );
};
