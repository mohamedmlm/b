const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const sanitize = require("sanitize-filename");
const path = require("path");

// R2 متوافق مع S3 API، فبنستخدم نفس الـ SDK بتاع AWS مع endpoint مخصص بتاع Cloudflare
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;
// دومين الوصول العام للملفات — إما r2.dev subdomain أو custom domain ربطته بالـ bucket
const PUBLIC_BASE_URL = process.env.R2_PUBLIC_URL; // مثال: https://pub-xxxxx.r2.dev أو https://files.crocsstorefm.com

async function uploadFileToBlob(file, folder = "items") {
  const originalExt = path.extname(file.originalname);
  const safeBaseName = sanitize(path.basename(file.originalname, originalExt)) || "file";
  const ext = originalExt || `.${file.mimetype.split("/")[1]}`;

  // بنولّد جزء عشوائي بدل addRandomSuffix اللي كانت بتعملها @vercel/blob تلقائياً
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const key = `${folder}/${Date.now()}-${randomSuffix}-${safeBaseName}${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  return `${PUBLIC_BASE_URL}/${key}`;
}

async function uploadFilesToBlob(files, folder = "items") {
  const uploads = files.map((file) => uploadFileToBlob(file, folder));
  return Promise.all(uploads);
}

// بديل دالة del بتاعة @vercel/blob — بتاخد الرابط الكامل وتستخرج منه الـ key عشان تحذفه
async function deleteFileFromBlob(fileUrl) {
  if (!fileUrl || !fileUrl.startsWith(PUBLIC_BASE_URL)) return;
  const key = fileUrl.replace(`${PUBLIC_BASE_URL}/`, "");

  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
  );
}

module.exports = { uploadFileToBlob, uploadFilesToBlob, deleteFileFromBlob };