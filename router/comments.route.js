const route = require('express').Router();
const { createComment , getItemComments, deleteComment, editComment, getCommentForEdit} = require('../controller/comment.controller');
const tokenverify = require('../modules/authentication/tokenverify');

route.post('/item/:itemid', tokenverify, createComment);
route.get('/item/:itemid', getItemComments);
route.delete('/delete/:commentid', tokenverify, deleteComment);
route.put('/edit/:commentid', tokenverify, editComment);
route.get('/edit/:commentid', tokenverify, getCommentForEdit);

module.exports = route;