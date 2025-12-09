const { Router } = require('express');
const { checkUser, requireAuth, requireAdminAuth } = require('../middleware/authMiddleware');
const dataController = require('../controllers/dataController');

const router = Router();

router.post('/chatmsg', dataController.chatmsg_post);
router.get('/purchaseoptions', dataController.purchaseOptions_get);
router.post('/modifypurchaseoptions', checkUser, requireAdminAuth, dataController.modifyPurchaseOptions_post);
router.post('/purchaseitem', dataController.purchaseItem_post);
router.post('/confirmpurchase', checkUser, requireAuth, dataController.confirmPurchase_post);
router.post('/discardpurchase', checkUser, requireAuth, dataController.discardPurchase_post);
router.post('/unconfirmpurchase', checkUser, requireAuth, dataController.unconfirmPurchase_post);

module.exports = router;