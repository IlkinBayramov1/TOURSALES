import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Lazımi qovluqların mövcudluğunu yoxlayırıq və yoxdursa yaradırıq
const publicDir = './public/uploads';
const secureDir = './secure_uploads';

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
if (!fs.existsSync(secureDir)) {
  fs.mkdirSync(secureDir, { recursive: true });
}

// İctimai fayllar üçün yaddaş yeri (Məsələn: Tur şəkilləri)
const publicStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, publicDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'public-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Qorumalı fayllar üçün yaddaş yeri (Məsələn: Müştəri pasportları)
const secureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, secureDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'secure-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Maksimum 5MB ölçülü ictimai fayllar üçün
export const publicUpload = multer({
  storage: publicStorage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Maksimum 10MB ölçülü qorumalı fayllar üçün
export const secureUpload = multer({
  storage: secureStorage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

export default {
  publicUpload,
  secureUpload
};
