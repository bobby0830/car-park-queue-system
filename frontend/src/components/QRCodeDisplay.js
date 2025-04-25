import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button } from 'react-bootstrap';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import './QRCodeDisplay.css';

const QRCodeDisplay = () => {
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQRCodes();
  }, []);

  const fetchQRCodes = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/qrcode');
      setQrCodes(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching QR codes:', err);
      setError('無法獲取 QR 碼，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="qr-display-container">
      <div className="qr-display-header">
        <h2>車位 QR 碼</h2>
        <Button 
          variant="primary" 
          onClick={handlePrint}
          className="print-btn"
        >
          列印 QR 碼
        </Button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">載入中...</p>
        </div>
      ) : (
        <Row className="qr-code-grid">
          {qrCodes.map((qrCode) => (
            <Col key={qrCode.parking_space} xs={12} sm={6} md={4} lg={3} className="mb-4">
              <Card className="qr-code-card">
                <Card.Body className="text-center">
                  <div className="qr-wrapper">
                    <QRCodeSVG 
                      value={JSON.stringify({
                        parking_space: qrCode.parking_space,
                        timestamp: Date.now(),
                        type: 'carpark_queue'
                      })}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <div className="parking-space-label">
                    車位 #{qrCode.parking_space}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default QRCodeDisplay;
