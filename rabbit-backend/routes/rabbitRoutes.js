const express = require('express');
const { connect, produce, consume } = require('../controllers/rabbitController');

const router = express.Router();

router.post('/connect', connect);
router.post('/produce', produce);
router.post('/consume', consume);

module.exports = router;
