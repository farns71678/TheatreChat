const { Router } = require('express');
const { checkUser, requireAdminAuth } = require('../middleware/authMiddleware');
const dataController = require('../controllers/dataController');

const router = Router();

router.post('/chatmsg', dataController.chatmsg_post);
router.get('/purchaseoptions', dataController.purchaseOptions_get);
router.post('/modifypurchaseoptions', checkUser, requireAdminAuth, dataController.modifyPurchaseOptions_post);
router.post('/purchaseitem', dataController.purchaseItem_post);

module.exports = router;