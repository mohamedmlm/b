const Items = require('../data/item.shema');
const asyncwrapper = require("../modules/error/asyncwrapper");
const sanitizeHtml = require('sanitize-html');
const Comments = require('../data/comment.shema');
const { uploadFilesToBlob } = require("../modules/uploadverification/blobi");

const getAllItems = asyncwrapper(async (req, res) => {
    let pageNumber = parseInt(req.query.page) || 1;
    const nmOfitemPerPage = parseInt(req.query.limit) || 10;
    const skipitem = (pageNumber - 1) * nmOfitemPerPage;

    const search = req.query.search || "";
    const escapedSearch = sanitizeHtml(search, {
        allowedTags: [],
        allowedAttributes: {}
    });

    const minPrice = parseFloat(req.query.minPrice) || 0;
    const maxPrice = parseFloat(req.query.maxPrice) || Number.MAX_SAFE_INTEGER;

    const filter = {
        name: { $regex: escapedSearch, $options: "i" },
        price: { $gte: minPrice, $lte: maxPrice }
    };

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

    // ✅ ارفع الصور على Vercel Blob
    let uploadedImages = [];
    if (req.files && req.files.length > 0) {
        uploadedImages = await uploadFilesToBlob(req.files, "items");
    }

    const sanitizedData = {
        name: sanitizeHtml(name),
        description: sanitizeHtml(description),
        min,
        max,
        price,
        category: sanitizeHtml(category),
        images: uploadedImages
    };

    if (!sanitizedData.name || !sanitizedData.min || !sanitizedData.max || !sanitizedData.price || !sanitizedData.category || sanitizedData.images.length === 0) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    if (sanitizedData.max < sanitizedData.min) {
        return res.status(400).json({ error: "Max size must be bigger than min size" });
    }
    if (isNaN(sanitizedData.price) || sanitizedData.price <= 0) {
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

    // ✅ ارفع الصور الجديدة على Vercel Blob (لو في صور جديدة)
    let uploadedImages = [];
    if (req.files && req.files.length > 0) {
        uploadedImages = await uploadFilesToBlob(req.files, "items");
    }

    const sanitizedData = {
        name: sanitizeHtml(name),
        description: sanitizeHtml(description),
        min,
        max,
        price,
        category: sanitizeHtml(category),
        images: uploadedImages.length > 0 ? uploadedImages : existingItem.images
    };

    if (!sanitizedData.name || !sanitizedData.min || !sanitizedData.max || !sanitizedData.price || !sanitizedData.category || !sanitizedData.images || sanitizedData.images.length === 0) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    if (sanitizedData.max < sanitizedData.min) {
        return res.status(400).json({ error: "Max size must be bigger than min size" });
    }

    if (isNaN(sanitizedData.price) || sanitizedData.price <= 0) {
        return res.status(400).json({ error: "Price must be a positive number" });
    }

    const isSameItem =
        existingItem.name === sanitizedData.name &&
        existingItem.description === sanitizedData.description &&
        existingItem.min === sanitizedData.min &&
        existingItem.max === sanitizedData.max &&
        existingItem.price === sanitizedData.price &&
        existingItem.category === sanitizedData.category &&
        JSON.stringify(existingItem.images) === JSON.stringify(sanitizedData.images);

    if (isSameItem) {
        return res.status(400).json({
            message: "The new data is identical to the existing item"
        });
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