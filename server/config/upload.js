import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, '../uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.mkdirSync(path.join(UPLOAD_DIR, 'reading'), { recursive: true });
  fs.mkdirSync(path.join(UPLOAD_DIR, 'listening'), { recursive: true });
  fs.mkdirSync(path.join(UPLOAD_DIR, 'writing'), { recursive: true });
  fs.mkdirSync(path.join(UPLOAD_DIR, 'students'), { recursive: true });
  fs.mkdirSync(path.join(UPLOAD_DIR, 'tests'), { recursive: true });
  fs.mkdirSync(path.join(UPLOAD_DIR, 'results'), { recursive: true });
  fs.mkdirSync(path.join(UPLOAD_DIR, 'keys'), { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fieldName = file.fieldname;
    let uploadPath = UPLOAD_DIR;
    
    if (fieldName === 'readingFile') {
      uploadPath = path.join(UPLOAD_DIR, 'reading');
    } else if (fieldName === 'listeningFile' || fieldName === 'listeningAudio') {
      uploadPath = path.join(UPLOAD_DIR, 'listening');
    } else if (fieldName === 'writingFile') {
      uploadPath = path.join(UPLOAD_DIR, 'writing');
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  cb(null, true);
};

export const upload = multer({
  storage,
  limits: { fileSize: 16 * 1024 * 1024 },
  fileFilter
});

