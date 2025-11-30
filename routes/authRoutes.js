const { Router } = require('express');
const { checkUser } = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');

const router = Router();

router.get('/login', checkUser, authController.login_get);
router.post('/login', authController.login_post);

module.exports = router;