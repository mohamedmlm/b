const { put } = require("@vercel/blob");
const santize = require("sanitize-filename");

async function uploadFileToBlob(file, folder = "items") {
  const ext = file.mimetype.split("/")[1];
  const safeName = santize(file.originalname);
  const filename = `${folder}/${Date.now()}-${safeName}.${ext}`;

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
