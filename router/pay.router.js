const router = require('express').Router();
const { createPay, deletePay, getAllPays, getisnotpayed, confirmPay, rejectPay, getMyPays } = require('../controller/pay.controller');
const tokenverify = require('../modules/authentication/tokenverify');
const { payvalidator, rejectPayValidator } = require('../modules/validator/validate_body');
const validationResult = require('../modules/validator/validate_result');
const allowedto = require('../modules/authentication/allowedto');
const role = require('../modules/authentication/role');

router.post('/:itemId/createpay', tokenverify, payvalidator, validationResult, createPay);
router.delete('/:payId/deletepay', tokenverify, deletePay);
router.get('/my', tokenverify, getMyPays);
router.get('/getallpays', tokenverify, allowedto(role.MANAGER,role.ADMIN), getAllPays);
router.get('/getisnotpayed', tokenverify, allowedto(role.MANAGER,role.ADMIN), getisnotpayed);
router.put('/:payId/confirm', tokenverify, allowedto(role.MANAGER,role.ADMIN), confirmPay);
router.put('/:payId/reject', tokenverify, allowedto(role.MANAGER,role.ADMIN), rejectPayValidator, validationResult, rejectPay);

module.exports = router;