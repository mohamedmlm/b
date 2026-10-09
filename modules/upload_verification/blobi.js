const { put } = require("@vercel/blob");
const sanitize = require("sanitize-filename");
const path = require("path");

async function uploadFileToBlob(file, folder = "items") {
  const originalExt = path.extname(file.originalname);
  const safeBaseName = sanitize(path.basename(file.originalname, originalExt)) || "file";
  const ext = originalExt || `.${file.mimetype.split("/")[1]}`;

  const filename = `${folder}/${Date.now()}-${safeBaseName}${ext}`;

  const blob = await put(filename, file.buffer, {
    access: "public",
    contentType: file.mimetype,
    addRandomSuffix: true,
  });

  return blob.url;
}

async function uploadFilesToBlob(files, folder = "items") {
  const uploads = files.map((file) => uploadFileToBlob(file, folder));
  return Promise.all(uploads);
}

module.exports = { uploadFileToBlob, uploadFilesToBlob };