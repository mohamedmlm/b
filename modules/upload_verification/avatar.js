const multer = require("multer");
const { uploadFileToBlob } = require("./blobi");

const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        const type = file.mimetype.split("/")[0];
        if (type === "image") {
            return cb(null, true);
        } else {
            return cb(new Error("Only images files are allowed!"), false);
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadMiddleware = (req, res, next) => {
    upload.single("avatar")(req, res, async function (err) {
        if (err) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({ msg: "File size should be less than 5MB" });
            }
            return res.status(400).json({ msg: err.message });
        }

        if (req.file) {
            try {
                req.file.blobUrl = await uploadFileToBlob(req.file, "avatar");
            } catch (uploadErr) {
                return res.status(500).json({ msg: "Failed to upload avatar" });
            }
        }

        next();
    });
};

module.exports = uploadMiddleware;