const QRCode = require('qrcode');

// Generate a QR code for a specific parking space
exports.generateQRCode = async (req, res) => {
  try {
    const { parkingSpace } = req.params;
    
    // Validate parking space is between 1-10
    const space = parseInt(parkingSpace);
    if (isNaN(space) || space < 1 || space > 10) {
      return res.status(400).json({ message: 'Invalid parking space. Must be between 1 and 10.' });
    }
    
    // Create the data to be encoded in the QR code
    // We encode the parking space and potentially a token/timestamp for security
    const qrData = JSON.stringify({
      parking_space: space,
      timestamp: Date.now(),
      type: 'carpark_queue'
    });
    
    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(qrData);
    
    // Return QR code data URL
    res.json({ 
      parking_space: space, 
      qrcode: qrCodeDataURL 
    });
  } catch (err) {
    console.error('QR Code generation error:', err);
    res.status(500).json({ message: 'Failed to generate QR code' });
  }
};

// Generate all QR codes (for admin display)
exports.generateAllQRCodes = async (req, res) => {
  try {
    const qrCodes = [];
    
    // Generate QR codes for all 10 parking spaces
    for (let space = 1; space <= 10; space++) {
      // Create the data to be encoded in the QR code
      const qrData = JSON.stringify({
        parking_space: space,
        timestamp: Date.now(),
        type: 'carpark_queue'
      });
      
      // Generate QR code as data URL
      const qrCodeDataURL = await QRCode.toDataURL(qrData);
      
      qrCodes.push({
        parking_space: space,
        qrcode: qrCodeDataURL
      });
    }
    
    // Return all QR codes
    res.json(qrCodes);
  } catch (err) {
    console.error('QR Code generation error:', err);
    res.status(500).json({ message: 'Failed to generate QR codes' });
  }
};
