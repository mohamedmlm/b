const router = require('express').Router();
const { getAllItems, createItem, editItem, deleteItem, getItemForEdit, getItemDetails } = require('../controller/items.controller');
const { itemValidator } = require('../modules/validator/validate_body');
const validationResult = require('../modules/validator/validate_result');
const role = require('../modules/authentication/role');
const allowedto = require('../modules/authentication/allowedto');
const imageUpload = require('../modules/upload_verification/itempicture');
const token_verify = require("../modules/authentication/tokenverify");

router.get('/', getAllItems);
router.post('/create',
  token_verify,
  allowedto(role.MANAGER, role.ADMIN),
  imageUpload,
  itemValidator,
  validationResult,
  createItem
);

router.put('/:id/edit', token_verify, allowedto(role.MANAGER, role.ADMIN), imageUpload, editItem);
router.delete('/:id/delete', token_verify, allowedto(role.MANAGER, role.ADMIN), deleteItem);
router.get('/:id/edit', getItemForEdit);
router.get('/:id/details', getItemDetails);

module.exports = router;