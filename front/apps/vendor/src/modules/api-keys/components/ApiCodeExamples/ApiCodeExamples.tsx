import React, { useState } from 'react';
import { Button } from '@toursales/ui';
import { Copy, Check, Terminal, Shield, Cpu, Download, FileJson, Lock, Webhook } from 'lucide-react';
import './ApiCodeExamples.css';

type Language = 'curl' | 'node' | 'python' | 'php';
type DocSection = 'API' | 'WEBHOOK_SIGNATURE';

export const ApiCodeExamples: React.FC = () => {
  const [section, setSection] = useState<DocSection>('API');
  const [lang, setLang] = useState<Language>('curl');
  const [copied, setCopied] = useState(false);

  const getApiSnippets = () => {
    switch (lang) {
      case 'curl':
        return `# 1. Turların Siyahısını Gətirmək
curl -X GET "https://api.toursales.az/api/v1/external/tours/my-tours" \\
  -H "Authorization: Bearer ts_live_sec_your_secret_key" \\
  -H "Content-Type: application/json"

# 2. Xarici Vebsaytdan Yeni Sifariş Yaratmaq
curl -X POST "https://api.toursales.az/api/v1/external/bookings" \\
  -H "Authorization: Bearer ts_live_sec_your_secret_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tourId": "TR-1001",
    "customerName": "Rəşad Məmmədov",
    "customerEmail": "rashad@example.com",
    "customerPhone": "+994501234567",
    "seats": 2,
    "paidAmount": 130.00
  }'

# 3. İnteqrasiya Statistika və Maliyyə Hesabatı
curl -X GET "https://api.toursales.az/api/v1/external/stats" \\
  -H "Authorization: Bearer ts_live_sec_your_secret_key"`;

      case 'node':
        return `// Node.js (v18+) Fetch və ya Axios ilə TOURSALES API İnteqrasiyası
const API_KEY = 'ts_live_sec_your_secret_key';
const BASE_URL = 'https://api.toursales.az/api/v1/external';

async function fetchMyTours() {
  const res = await fetch(\`\${BASE_URL}/tours/my-tours\`, {
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`,
      'Content-Type': 'application/json'
    }
  });
  const data = await res.json();
  console.log('Aktiv Turlar:', data);
}

async function createBooking(tourData) {
  const res = await fetch(\`\${BASE_URL}/bookings\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(tourData)
  });
  return await res.json();
}`;

      case 'python':
        return `# Python (requests) ilə TOURSALES API İnteqrasiyası
import requests

API_KEY = "ts_live_sec_your_secret_key"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# 1. Turların siyahısını oxumaq
response = requests.get("https://api.toursales.az/api/v1/external/tours/my-tours", headers=HEADERS)
print("Turlar:", response.json())

# 2. Yeni bilet satışı / sifariş göndərmək
booking_payload = {
    "tourId": "TR-1001",
    "customerName": "Rəşad Məmmədov",
    "customerEmail": "rashad@example.com",
    "customerPhone": "+994501234567",
    "seats": 2,
    "paidAmount": 130.00
}
res = requests.post("https://api.toursales.az/api/v1/external/bookings", json=booking_payload, headers=HEADERS)
print("Sifariş Cavabı:", res.json())`;

      case 'php':
        return `<?php
// PHP cURL ilə TOURSALES API İnteqrasiyası
$apiKey = "ts_live_sec_your_secret_key";
$url = "https://api.toursales.az/api/v1/external/tours/my-tours";

$ch = curl_init($url);
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

  const getWebhookSnippets = () => {
    switch (lang) {
      case 'curl':
      case 'node':
        return `// Node.js (Express) Webhook İmzası Doğrulama (HMAC-SHA256)
const crypto = require('crypto');
const express = require('express');
const app = express();

// QEYD: Raw body tələb olunur, json parsing-dən əvvəl buffer kimi oxuyun!
app.post('/api/webhook-receiver', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-toursales-signature'];
  const webhookSecret = 'whsec_your_webhook_signing_secret'; // Webhook cədvəlindən əldə edin

  // Hesablanan imza
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(req.body)
    .digest('hex');

  // Zaman fərqi hücumlarının (Timing attack) qarşısını almaq üçün timingSafeEqual istifadə edin
  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature || '', 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );

  if (!isValid) {
    console.error('İmza düzgün deyil! Saxta hadisə.');
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(req.body.toString());
  console.log('Uğurlu Hadisə:', event.eventType, event.payload);

  res.status(200).json({ received: true });
});`;

      case 'python':
        return `# Python (Flask / FastAPI) Webhook İmzası Doğrulama (HMAC-SHA256)
import hmac
import hashlib
from fastapi import FastAPI, Request, HTTPException

app = FastAPI()
WEBHOOK_SECRET = "whsec_your_webhook_signing_secret"

@app.post("/api/webhook-receiver")
async def receive_webhook(request: Request):
    signature = request.headers.get("x-toursales-signature")
    raw_body = await request.body()

    # HMAC-SHA256 hesablama
    expected_sig = hmac.new(
        WEBHOOK_SECRET.encode("utf-8"),
        raw_body,
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(signature or "", expected_sig):
        raise HTTPException(status_code=401, detail="Invalid signature")

    event_data = await request.json()
    print("Qəbul edilən hadisə:", event_data)
    return {"received": True}`;

      case 'php':
        return `<?php
// PHP Webhook Receiver & HMAC-SHA256 İmza Yoxlanışı
$webhookSecret = "whsec_your_webhook_signing_secret";
$receivedSignature = $_SERVER['HTTP_X_TOURSALES_SIGNATURE'] ?? '';

// Xam POST məlumatını oxuyun
$rawPayload = file_get_contents('php://input');

// HMAC-SHA256 heşini hesablayın
$expectedSignature = hash_hmac('sha256', $rawPayload, $webhookSecret);

if (!hash_equals($expectedSignature, $receivedSignature)) {
    http_response_code(401);
    die(json_encode(["error" => "Invalid HMAC Signature"]));
}

$event = json_decode($rawPayload, true);
// Sifariş və ya ödəniş hadisəsini qeyd edin
file_put_contents('webhook.log', print_r($event, true), FILE_APPEND);

http_response_code(200);
echo json_encode(["received" => true]);
?>`;
    }
  };

  const currentCode = section === 'API' ? getApiSnippets() : getWebhookSnippets();

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPostman = () => {
    const postmanCollection = {
      info: {
        name: 'TOURSALES Vendor API Collection v1',
        description: 'TOURSALES Tur və Bilet Satışı Rəsmi REST API Kolleksiyası',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      variable: [
        {
          key: 'baseUrl',
          value: 'https://api.toursales.az/api/v1/external',
          type: 'string'
        },
        {
          key: 'apiKey',
          value: 'ts_live_sec_your_api_key_here',
          type: 'string'
        }
      ],
      item: [
        {
          name: '1. Turların Siyahısı (All Tours)',
          request: {
            method: 'GET',
            header: [
              { key: 'Authorization', value: 'Bearer {{apiKey}}', type: 'text' },
              { key: 'Content-Type', value: 'application/json', type: 'text' }
            ],
            url: {
              raw: '{{baseUrl}}/tours',
              host: ['{{baseUrl}}'],
              path: ['tours']
            }
          }
        },
        {
          name: '2. Agentliyin Aktiv Turları (My Tours)',
          request: {
            method: 'GET',
            header: [
              { key: 'Authorization', value: 'Bearer {{apiKey}}', type: 'text' },
              { key: 'Content-Type', value: 'application/json', type: 'text' }
            ],
            url: {
              raw: '{{baseUrl}}/tours/my-tours',
              host: ['{{baseUrl}}'],
              path: ['tours', 'my-tours']
            }
          }
        },
        {
          name: '3. Yeni Tur Rezervasiyası Yarat (Create Booking)',
          request: {
            method: 'POST',
            header: [
              { key: 'Authorization', value: 'Bearer {{apiKey}}', type: 'text' },
              { key: 'Content-Type', value: 'application/json', type: 'text' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  tourId: 'TR-1001',
                  customerName: 'Samir Qasımov',
                  customerEmail: 'samir@example.com',
                  customerPhone: '+994501234567',
                  seats: 2,
                  paidAmount: 140.0,
                  notes: 'Postman vasitəsilə test sifariş'
                },
                null,
                2
              )
            },
            url: {
              raw: '{{baseUrl}}/bookings',
              host: ['{{baseUrl}}'],
              path: ['bookings']
            }
          }
        },
        {
          name: '4. Satış & Maliyyə İnteqrasiya Statistikası',
          request: {
            method: 'GET',
            header: [
              { key: 'Authorization', value: 'Bearer {{apiKey}}', type: 'text' },
              { key: 'Content-Type', value: 'application/json', type: 'text' }
            ],
            url: {
              raw: '{{baseUrl}}/stats',
              host: ['{{baseUrl}}'],
              path: ['stats']
            }
          }
        }
      ]
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(postmanCollection, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'toursales-api-postman-collection.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="code-examples-card">
      {/* Top Banner with Postman Export */}
      <div className="docs-top-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#ff6c37', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
            <FileJson size={24} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
              Rəsmi Postman Kolleksiyası (v2.1.0)
            </h4>
            <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: '#6b7280' }}>
              Bütün hazır endpoint-ləri, nümunə JSON sorğularını və parametrləri 1 kliklə Postman-a idxal edin
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          onClick={handleDownloadPostman}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#ffffff', borderColor: '#d1d5db', color: '#111827', fontWeight: 600 }}
        >
          <Download size={15} />
          <span>Postman Kolleksiyasını Yüklə (.JSON)</span>
        </Button>
      </div>

      {/* Section Switcher Tabs */}
      <div className="docs-section-switcher">
        <button
          type="button"
          className={`docs-section-btn ${section === 'API' ? 'active' : ''}`}
          onClick={() => setSection('API')}
        >
          <Terminal size={15} />
          <span>1. REST API Sorğu Nümunələri</span>
        </button>

        <button
          type="button"
          className={`docs-section-btn ${section === 'WEBHOOK_SIGNATURE' ? 'active' : ''}`}
          onClick={() => setSection('WEBHOOK_SIGNATURE')}
        >
          <Webhook size={15} />
          <span>2. Webhook İmzası Doğrulama (HMAC-SHA256)</span>
        </button>
      </div>

      {/* Code Header Row with Language Selector */}
      <div className="code-header-row">
        <div>
          <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.0625rem', fontWeight: 700 }}>
            {section === 'API'
              ? 'REST API Sorğularının Proqramlaşdırılması'
              : 'Xarici Serverinizdə Webhook İmzalarının Yoxlanılması'}
          </h3>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b' }}>
            {section === 'API'
              ? 'Sorğu başlıqlarına Bearer Token daxil edərək turları oxuyun və bilet satışı icra edin.'
              : 'x-toursales-signature başlığını HMAC-SHA256 heşləməsi ilə müqayisə edərək saxtakarlıqdan qorunun.'}
          </p>
        </div>

        <div className="code-lang-selector">
          <button
            type="button"
            className={`code-lang-btn ${lang === 'curl' ? 'active' : ''}`}
            onClick={() => setLang('curl')}
          >
            {section === 'API' ? 'cURL' : 'Node.js'}
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

      {/* Code Snippet Box */}
      <div className="code-block-wrapper">
        <button type="button" className="code-copy-btn" onClick={handleCopy}>
          {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
          <span>{copied ? 'Kopyalandı' : 'Kodu Kopyala'}</span>
        </button>
        <pre className="code-snippet">
          <code>{currentCode}</code>
        </pre>
      </div>

      {/* Architecture & Security Highlights */}
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
            <Lock size={18} color="#059669" />
            <span>Replay Attack Qoruması</span>
          </div>
          <p className="doc-info-desc">
            Webhook bildirişlərində payload içərisində <code>timestamp</code> ötürülür. Serverinizdə 5 dəqiqədən köhnə hadisələri rədd edərək təkrar hücumların qarşısını alın.
          </p>
        </div>

        <div className="doc-info-box">
          <div className="doc-info-title">
            <Cpu size={18} color="#7c3aed" />
            <span>Rate Limiting & Kvota</span>
          </div>
          <p className="doc-info-desc">
            Hər açar üçün dəqiqədə 120 sorğu limiti tətbiq olunur. Aşma hallarında <code>429 Too Many Requests</code> HTTP statusu qaytarılır.
          </p>
        </div>
      </div>
    </div>
  );
};
