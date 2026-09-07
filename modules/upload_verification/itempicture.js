const multer = require("multer");
const { diskStorage } = multer;
const santize = require("sanitize-filename");

const storage = diskStorage({
    destination: function (req, file, cb) {
        cb(null, "Uploads/items/");
    },
    filename: function (req, file, cb) {
        const ext = file.mimetype.split("/")[1];
        const fileName = `${Date.now()}-${santize(file.originalname)}.${ext}`;
        cb(null, fileName);
    }
});

const upload = multer({ storage: storage,
    fileFilter: function (req, file, cb) {
        const type=file.mimetype.split("/")[0];
        if(type=="image"){
            return cb(null,true);
        }
        else {
            return cb(new Error("Only images files are allowed!"), false);
        }
    },
    limits: { fileSize: 20 * 1024 * 1024 }
});
const uploadMiddleware = (req, res, next) => {
    upload.array("images", 5)(req, res, function (err) { 
        if (err) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({ msg: "File size should be less than 20MB" });
            }
            return res.status(400).json({ msg: err.message });
        }
        next();
    });
}


module.exports = uploadMiddleware;