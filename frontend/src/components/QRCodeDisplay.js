import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Alert } from 'react-bootstrap';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import './QRCodeDisplay.css';
import { API_URL } from '../config';

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
      console.log('获取 QR 码 URL:', `${API_URL}/qrcode`);
      const response = await axios.get(`${API_URL}/qrcode`);
      console.log('获取到的 QR 码数据:', response.data);
      
      if (!response.data || response.data.length === 0) {
        // 如果没有数据，自动生成 10 个车位的 QR 码
        const generatedQRCodes = Array.from({ length: 10 }, (_, index) => ({
          parking_space: index + 1,
          id: `parking-${index + 1}`
        }));
        setQrCodes(generatedQRCodes);
      } else {
        setQrCodes(response.data);
      }
      
      setError('');
    } catch (err) {
      console.error('Error fetching QR codes:', err);
      // 捕获到错误时，依然生成 10 个默认的 QR 码
      const defaultQRCodes = Array.from({ length: 10 }, (_, index) => ({
        parking_space: index + 1,
        id: `parking-${index + 1}`
      }));
      setQrCodes(defaultQRCodes);
      setError('無法取得 QR 碼，已自動生成資料');
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

      {error && <Alert variant="warning">{error}</Alert>}

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
                      value={`${window.location.origin}/?parking=${qrCode.parking_space}&join=true`}
                      size={200}
                      level="H"
                      includeMargin={true}
                      title={`车位 #${qrCode.parking_space} 排队链接`}
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
