const Comments = require('../data/comment.shema');
const asyncwrapper = require('../modules/error/asyncwrapper');
const User = require('../data/user.shema');
const Item = require('../data/item.shema');
const sanitizeHtml = require('sanitize-html');

const createComment = asyncwrapper(async (req, res) => {
    const { content, rating } = req.body;
    const userid = req.user._id;
    const itemid = req.params.itemid;

    const item = await Item.findById(itemid);
    if (!item) {
        return res.status(404).json({ message: "Item not found" });
    }

    const sanitizedContent = sanitizeHtml(content || "", {
        allowedTags: [],
        allowedAttributes: {}
    }).trim();

    if (!sanitizedContent) {
        return res.status(400).json({ message: "Content is required" });
    }

    const comment = await Comments.create({
        content: sanitizedContent,
        rating: rating || null,
        user: userid,
        itemId: itemid
    });

    await User.findByIdAndUpdate(userid, { $push: { comments: comment._id } });
    await Item.findByIdAndUpdate(itemid, { $push: { comments: comment._id } });

    res.status(201).json({
        data: comment
    });
});

const getItemComments = asyncwrapper(async (req, res) => {
    const itemid = req.params.itemid;
    const item = await Item.findById(itemid);

    if (!item) {
        return res.status(404).json({ message: "Item not found" });
    }

    const comments = await Comments.find({ itemId: itemid })
        .populate('user', 'username avatar')
        .sort({ createdAt: -1 });

    const formattedComments = comments.map((comment) => {
        const commentData = comment.toObject();
        const user = comment.user;
        commentData.username = user?.username || "مستخدم";
        commentData.userAvatar = user?.avatar || null;
        commentData.user = user?._id ? user._id.toString() : commentData.user?.toString?.() || commentData.user;
        return commentData;
    });

    res.status(200).json({
        data: formattedComments
    });
});

const deleteComment = asyncwrapper(async (req, res) => {
    const commentid = req.params.commentid;
    const comment = await Comments.findById(commentid);

    if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
    }

    const userid = req.user._id;
    const userRole = req.user.role;
    const commentUserId = comment.user;

    const isAdmin = userRole === 'admin';
    const isOwner = userid.toString() === commentUserId.toString();

    if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: "Unauthorized to delete this comment" });
    }

    await Comments.findByIdAndDelete(commentid);
    await User.findByIdAndUpdate(comment.user, { $pull: { comments: commentid } });
    await Item.findByIdAndUpdate(comment.itemId, { $pull: { comments: commentid } });

    res.status(200).json({
        message: "Comment deleted successfully"
    });
});

const editComment = asyncwrapper(async (req, res) => {
    const commentid = req.params.commentid;
    const { content, rating } = req.body;
    const userid = req.user._id;

    const existingComment = await Comments.findById(commentid);

    if (!existingComment) {
        return res.status(404).json({ message: "Comment not found" });
    }

    if (userid.toString() !== existingComment.user.toString()) {
        return res.status(403).json({ message: "Unauthorized to edit this comment" });
    }

    const sanitizedData = {};

    if (content) {
        const sanitizedContent = sanitizeHtml(content, {
            allowedTags: [],
            allowedAttributes: {}
        }).trim();
        if (sanitizedContent) sanitizedData.content = sanitizedContent;
    }

    if (rating !== undefined) sanitizedData.rating = rating;

    if (Object.keys(sanitizedData).length === 0) {
        return res.status(400).json({ message: "No valid data to update" });
    }

    if (existingComment.content === sanitizedData.content &&
        existingComment.rating === sanitizedData.rating) {
        return res.status(400).json({ message: "No changes detected" });
    }

    const comment = await Comments.findByIdAndUpdate(
        commentid,
        sanitizedData,
        { new: true, runValidators: true }
    );

    res.status(200).json({
        data: comment
    });
});

const getCommentForEdit = asyncwrapper(async (req, res) => {
    const commentid = req.params.commentid;
    const comment = await Comments.findById(commentid);

    if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
    }

    res.status(200).json({
        data: {
            content: comment.content,
            rating: comment.rating
        }
    });
});

module.exports = {
    createComment,
    getItemComments,
    deleteComment,
    editComment,
    getCommentForEdit
};