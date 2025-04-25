const express = require('express');
const router = express.Router();
const qrCodeController = require('../controllers/qrCodeController');

// Generate QR code for a specific parking space
router.get('/:parkingSpace', qrCodeController.generateQRCode);

// Generate all QR codes (for admin display)
router.get('/', qrCodeController.generateAllQRCodes);

module.exports = router;
