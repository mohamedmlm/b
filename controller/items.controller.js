const Items = require('../data/item.shema');
const asyncwrapper = require("../modules/error/asyncwrapper");
const sanitizeHtml = require('sanitize-html');
const Comments = require('../data/comment.shema');
const { uploadFilesToBlob } = require("../modules/upload_verification/blobi");
const { del } = require("@vercel/blob");

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function deleteBlobUrls(urls = []) {
    if (!urls.length) return;
    try {
        await Promise.all(urls.map((url) => del(url)));
    } catch (err) {
        console.log("Failed to delete blob(s):", err);
    }
}

const getAllItems = asyncwrapper(async (req, res) => {
    let pageNumber = parseInt(req.query.page) || 1;
    const nmOfitemPerPage = parseInt(req.query.limit) || 10;
    const skipitem = (pageNumber - 1) * nmOfitemPerPage;

    const search = req.query.search || "";
    const escapedSearch = sanitizeHtml(search, {
        allowedTags: [],
        allowedAttributes: {}
    });
    const safeRegexSearch = escapeRegex(escapedSearch);

    const categoryQuery = req.query.categoryquery || "";
    const escapedCategory = sanitizeHtml(categoryQuery, {
        allowedTags: [],
        allowedAttributes: {}
    });
    const safeRegexCategory = escapeRegex(escapedCategory);

    const minPrice = parseFloat(req.query.minPrice) || 0;
    const maxPrice = parseFloat(req.query.maxPrice) || Number.MAX_SAFE_INTEGER;

    const filter = {
        name: { $regex: safeRegexSearch, $options: "i" },
        price: { $gte: minPrice, $lte: maxPrice }
    };

    // ✅ نضيف شرط الـ category بس لو المستخدم فعلاً بعت قيمة له
    if (safeRegexCategory) {
        filter.category = { $regex: safeRegexCategory, $options: "i" };
    }

    const items = await Items.find(filter, { __v: false })
        .skip(skipitem)
        .limit(nmOfitemPerPage);

    const sanitizedItems = items.map(item => ({
        id: item._id,
        name: sanitizeHtml(item.name),
        images: item.images && item.images.length > 0 ? sanitizeHtml(item.images[0]) : null,
        price: item.price,
        category: sanitizeHtml(item.category),
        min: item.min,
        max: item.max
    }));
    res.status(200).json({ items: sanitizedItems });
});

const createItem = asyncwrapper(async (req, res) => {
    const { name, description, min, max, price, category } = req.body;

    const parsedMin = parseFloat(min);
    const parsedMax = parseFloat(max);
    const parsedPrice = parseFloat(price);

    let uploadedImages = [];
    if (req.files && req.files.length > 0) {
        uploadedImages = await uploadFilesToBlob(req.files, "items");
    }

    const sanitizedData = {
        name: sanitizeHtml(name),
        description: sanitizeHtml(description),
        min: parsedMin,
        max: parsedMax,
        price: parsedPrice,
        category: sanitizeHtml(category),
        images: uploadedImages
    };

    if (!sanitizedData.name || isNaN(sanitizedData.min) || isNaN(sanitizedData.max) || isNaN(sanitizedData.price) || !sanitizedData.category || sanitizedData.images.length === 0) {
        await deleteBlobUrls(uploadedImages);
        return res.status(400).json({ error: "Missing required fields" });
    }

    if (sanitizedData.max < sanitizedData.min) {
        await deleteBlobUrls(uploadedImages);
        return res.status(400).json({ error: "Max size must be bigger than min size" });
    }
    if (sanitizedData.price <= 0) {
        await deleteBlobUrls(uploadedImages);
        return res.status(400).json({ error: "Price must be a positive number" });
    }
    const newItem = await Items.create(sanitizedData);
    res.status(201).json(newItem);
});

const editItem = asyncwrapper(async (req, res) => {
    const { name, description, min, max, price, category } = req.body;

    const existingItem = await Items.findById(req.params.id);
    if (!existingItem) {
        return res.status(404).json({ error: "Item not found" });
    }

    const parsedMin = parseFloat(min);
    const parsedMax = parseFloat(max);
    const parsedPrice = parseFloat(price);

    let uploadedImages = [];
    if (req.files && req.files.length > 0) {
        uploadedImages = await uploadFilesToBlob(req.files, "items");
    }

    const sanitizedData = {
        name: sanitizeHtml(name),
        description: sanitizeHtml(description),
        min: parsedMin,
        max: parsedMax,
        price: parsedPrice,
        category: sanitizeHtml(category),
        images: uploadedImages.length > 0 ? uploadedImages : existingItem.images
    };

    if (!sanitizedData.name || isNaN(sanitizedData.min) || isNaN(sanitizedData.max) || isNaN(sanitizedData.price) || !sanitizedData.category || !sanitizedData.images || sanitizedData.images.length === 0) {
        await deleteBlobUrls(uploadedImages);
        return res.status(400).json({ error: "Missing required fields" });
    }

    if (sanitizedData.max < sanitizedData.min) {
        await deleteBlobUrls(uploadedImages);
        return res.status(400).json({ error: "Max size must be bigger than min size" });
    }

    if (sanitizedData.price <= 0) {
        await deleteBlobUrls(uploadedImages);
        return res.status(400).json({ error: "Price must be a positive number" });
    }

    const isSameItem =
        existingItem.name === sanitizedData.name &&
        existingItem.description === sanitizedData.description &&
        Number(existingItem.min) === sanitizedData.min &&
        Number(existingItem.max) === sanitizedData.max &&
        Number(existingItem.price) === sanitizedData.price &&
        existingItem.category === sanitizedData.category &&
        JSON.stringify(existingItem.images) === JSON.stringify(sanitizedData.images);

    if (isSameItem) {
        await deleteBlobUrls(uploadedImages);
        return res.status(400).json({
            message: "The new data is identical to the existing item"
        });
    }

    // لو اتحطت صور جديدة، امسح الصور القديمة من الـ Blob
    if (uploadedImages.length > 0 && existingItem.images && existingItem.images.length > 0) {
        await deleteBlobUrls(existingItem.images);
    }

    const item = await Items.findByIdAndUpdate(
        req.params.id,
        sanitizedData,
        { new: true, runValidators: true }
    );

    res.status(200).json(item);
});

const deleteItem = asyncwrapper(async (req, res) => {
    const item = await Items.findByIdAndDelete(req.params.id);
    if (!item) {
        return res.status(404).json({ error: "Item not found" });
    }
    await deleteBlobUrls(item.images);
    await Comments.deleteMany({ itemId: req.params.id });

    res.status(200).json({ message: "Item deleted successfully" });
});

const getItemForEdit = asyncwrapper(async (req, res) => {
    const item = await Items.findById(req.params.id);

    if (!item) {
        return res.status(404).json({ error: "Item not found" });
    }

    res.status(200).json({
        item: {
            id: item._id,
            name: item.name,
            description: item.description,
            min: item.min,
            max: item.max,
            price: item.price,
            category: item.category,
            images: item.images
        }
    });
});

const getItemDetails = asyncwrapper(async (req, res) => {
    const item = await Items.findById(req.params.id);
    if (!item) {
        return res.status(404).json({ error: "Item not found" });
    }
    res.status(200).json({
        item: {
            id: item._id,
            name: item.name,
            description: item.description,
            min: item.min,
            max: item.max,
            price: item.price,
            category: item.category,
            images: item.images
        }
    });
});

module.exports = {
    getAllItems,
    createItem,
    editItem,
    deleteItem,
    getItemForEdit,
    getItemDetails
};