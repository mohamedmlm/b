const Pay = require("../data/pay.shema");
const Item = require("../data/item.shema");
const sanitizeHtml = require("sanitize-html");
const asyncwrapper = require("../modules/error/asyncwrapper");

const createPay = asyncwrapper(async (req, res) => {
    const {
        callnumber,
        addressDetails,
        min: requestedMin,
        max: requestedMax
    } = req.body;
    const { itemId } = req.params;
    const username = req.user?.username;
    if (!username) {
        return res.status(401).json({ message: 'Authenticated username is required' });
    }

    const item = await Item.findById(itemId);
    const itemMin = item?.min;
    const itemMax = item?.max;

    if (!item) {
        return res.status(404).json({ message: 'Item not found' });
    }

    const minNum = Number(requestedMin);
    const maxNum = Number(requestedMax);
    if (isNaN(minNum) || isNaN(maxNum)) {
        return res.status(400).json({ message: 'min and max must be numeric and provided' });
    }
    if (minNum < itemMin || maxNum > itemMax) {
        return res.status(400).json({ message: `Invalid min or max values. Min should be >= ${itemMin} and Max should be <= ${itemMax}` });
    }
    if (minNum > maxNum) {
        return res.status(400).json({ message: 'min cannot be greater than max' });
    }

    const itempicture = Array.isArray(item.images)
        ? item.images[0]
        : item.images;

    const sanitizedAddress = {
        street: sanitizeHtml(addressDetails.street || "", { allowedTags: [], allowedAttributes: {} }).trim(),
        city: sanitizeHtml(addressDetails.city || "", { allowedTags: [], allowedAttributes: {} }).trim(),
        district: sanitizeHtml(addressDetails.district || "", { allowedTags: [], allowedAttributes: {} }).trim(),
        buildingNumber: sanitizeHtml(addressDetails.buildingNumber || "", { allowedTags: [], allowedAttributes: {} }).trim(),
        apartmentNumber: sanitizeHtml(addressDetails.apartmentNumber || "", { allowedTags: [], allowedAttributes: {} }).trim(),
        distinctiveMark: sanitizeHtml(addressDetails.distinctiveMark || "", { allowedTags: [], allowedAttributes: {} }).trim(),
    };

    const pay = await Pay.create({
        username: sanitizeHtml(username, { allowedTags: [], allowedAttributes: {} }).trim(),
        itemId,
        itemname: sanitizeHtml(item.name || "", { allowedTags: [], allowedAttributes: {} }).trim(),
        itemprice: item.price,
        itempicture: sanitizeHtml(itempicture || "", { allowedTags: [], allowedAttributes: {} }).trim(),
        callnumber: sanitizeHtml(callnumber || "", { allowedTags: [], allowedAttributes: {} }).trim(),
        addressDetails: sanitizedAddress,
        min: minNum,
        max: maxNum,
        ispayed: false,
        isRejected: false
    });

    res.status(201).json({
        message: "Payment request created successfully",
        pay
    });
});

const deletePay = asyncwrapper(async (req, res) => {
    const { payId } = req.params;
    const username = req.user?.username;
    const pay = await Pay.findOneAndDelete({ _id: payId, username });

    if (!pay) {
        return res.status(404).json({ message: 'Payment request not found or you do not have permission to delete it' });
    }
    if (pay.ispayed) {
        return res.status(400).json({ message: 'Cannot delete a payment request that has already been paid' });
    }

    res.status(200).json({ message: 'Payment request deleted successfully' });
})

const getAllPays = asyncwrapper(async (req, res) => {
    const searchQuery = req.query.search || '';
    const safeQuery = sanitizeHtml(searchQuery, {
             allowedTags: [], 
            allowedAttributes: {} 
    });
    const searchFilter = safeQuery 
        ? { username: { $regex: safeQuery, $options: 'i' } } 
        : {};

    const recentFlag = req.query.recent === 'true';
    const olderFlag = req.query.older === 'true';
    const minutes = parseInt(req.query.minutes, 10);
    let timeFilter = {};
    if (recentFlag || olderFlag || (!isNaN(minutes) && minutes > 0)) {
        const mins = recentFlag ? 30 : (olderFlag ? 30 : minutes);
        const threshold = new Date(Date.now() - mins * 60 * 1000);
        timeFilter = olderFlag ? { createdAt: { $lte: threshold } } : { createdAt: { $gte: threshold } };
    }

    const pay = await Pay.find({ ...searchFilter, ...timeFilter }).sort({ createdAt: 1 });   

    res.status(200).json({
        pays: pay
    });
});   

const getMyPays = asyncwrapper(async (req, res) => {
    const username = req.user?.username;
    if (!username) return res.status(401).json({ message: 'Unauthorized' });

    const recentFlag = req.query.recent === 'true';
    const olderFlag = req.query.older === 'true';
    const minutes = parseInt(req.query.minutes, 10);
    let timeFilter = {};
    if (recentFlag || olderFlag || (!isNaN(minutes) && minutes > 0)) {
        const mins = recentFlag ? 30 : (olderFlag ? 30 : minutes);
        const threshold = new Date(Date.now() - mins * 60 * 1000);
        timeFilter = olderFlag ? { createdAt: { $lte: threshold } } : { createdAt: { $gte: threshold } };
    }

    const pays = await Pay.find({ username, ...timeFilter }).sort({ createdAt: 1 });

    res.status(200).json({ pays });
});

const getisnotpayed = asyncwrapper(async (req, res) => {
    const recentFlag = req.query.recent === 'true';
    const olderFlag = req.query.older === 'true';
    const minutes = parseInt(req.query.minutes, 10);
    let timeFilter = {};
    if (recentFlag || olderFlag || (!isNaN(minutes) && minutes > 0)) {
        const mins = recentFlag ? 30 : (olderFlag ? 30 : minutes);
        const threshold = new Date(Date.now() - mins * 60 * 1000);
        timeFilter = olderFlag ? { createdAt: { $lte: threshold } } : { createdAt: { $gte: threshold } };
    }

    const pay = await Pay.find({ ispayed: false, isRejected: { $ne: true }, ...timeFilter }).sort({ createdAt: 1 });

    res.status(200).json({
        pays: pay
    });
})

const confirmPay = asyncwrapper(async (req, res) => {
    const { payId } = req.params;

    const pay = await Pay.findOneAndUpdate(
        { _id: payId, ispayed: false, isRejected: { $ne: true } },
        { ispayed: true },
        { new: true }
    );

    if (!pay) {
        const existing = await Pay.findById(payId);
        if (!existing) {
            return res.status(404).json({ message: 'Payment request not found' });
        }
        if (existing.isRejected) {
            return res.status(400).json({ message: 'Cannot confirm a payment request that has already been rejected' });
        }
        return res.status(400).json({ message: 'Payment request has already been confirmed' });
    }

    res.status(200).json({ 
        message: 'تم تأكيد الدفع بنجاح', 
        pay 
    });
});

const rejectPay = asyncwrapper(async (req, res) => {
    const { payId } = req.params;
    const reason = sanitizeHtml(req.body.reason || "", {
        allowedTags: [],
        allowedAttributes: {}
    }).trim();

    const pay = await Pay.findOneAndUpdate(
        { _id: payId, ispayed: false, isRejected: { $ne: true } },
        { isRejected: true, rejectionReason: reason },
        { new: true }
    );

    if (!pay) {
        const existing = await Pay.findById(payId);
        if (!existing) {
            return res.status(404).json({ message: 'Payment request not found' });
        }
        if (existing.ispayed) {
            return res.status(400).json({ message: 'Cannot reject a payment request that has already been paid' });
        }
        return res.status(400).json({ message: 'Payment request has already been rejected' });
    }

    res.status(200).json({
        message: 'تم رفض الطلب',
        pay
    });
});

module.exports = {
    createPay,
    deletePay,
    getAllPays,
    getisnotpayed,
    confirmPay,
    rejectPay,
    getMyPays
};