const express = require('express');
const { connect, produce, consume, getQueues } = require('../controllers/rabbitController');

const router = express.Router();

router.post('/connect', connect);
router.post('/queues', getQueues);
router.post('/produce', produce);
router.post('/consume', consume);

module.exports = router;
