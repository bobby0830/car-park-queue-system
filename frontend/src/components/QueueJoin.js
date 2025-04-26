import React, { useState } from 'react';
import { Form, Button, Alert, Card, Badge } from 'react-bootstrap';
import axios from 'axios';
import './QueueJoin.css';
import QRScanner from './QRScanner';
import { API_URL } from '../config';

const QueueJoin = ({ onJoinQueue, userId, setUserId, initialParkingSpace }) => {
  const [reservedTime, setReservedTime] = useState(10);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [parkingSpace, setParkingSpace] = useState(initialParkingSpace || null);
  
  // 当initialParkingSpace变化时更新parkingSpace
  React.useEffect(() => {
    if (initialParkingSpace) {
      setParkingSpace(initialParkingSpace);
    }
  }, [initialParkingSpace]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // 轉換分鐘為秒
      const reservedTimeInSeconds = reservedTime * 60;
      
      if (!parkingSpace) {
        throw new Error('請先掃描車位 QR 碼或選擇車位編號');
      }
      
      console.log('提交排队请求:', `${API_URL}/queue`, {
        user_id: userId,
        reserved_time: reservedTimeInSeconds,
        parking_space: parkingSpace
      });
      
      const response = await axios.post(`${API_URL}/queue`, {
        user_id: userId,
        reserved_time: reservedTimeInSeconds,
        parking_space: parkingSpace
      });
      
      onJoinQueue(response.data);
      setSuccess(true);
      
      // 5秒後清除成功訊息
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err) {
      setError(err.response?.data?.message || '無法加入排隊，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  // Handle QR code scan result
  const handleScanSuccess = (qrData) => {
    if (qrData && qrData.parking_space) {
      setParkingSpace(qrData.parking_space);
      setShowScanner(false);
    }
  };

  // Handle manual parking space selection
  const handleParkingSpaceChange = (e) => {
    setParkingSpace(parseInt(e.target.value));
  };

  return (
    <>
      {showScanner ? (
        <QRScanner onScanSuccess={handleScanSuccess} />
      ) : (
        <Card className="queue-join-card">
          <Card.Header as="h5">加入排隊</Card.Header>
          <Card.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">成功加入排隊！</Alert>}
            
            {parkingSpace && (
              <Alert variant="info">
                已選擇 <Badge bg="primary">車位 #{parkingSpace}</Badge>
              </Alert>
            )}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>用戶 ID</Form.Label>
            <Form.Control
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="請輸入您的用戶 ID"
              required
            />
            <Form.Text className="text-muted">
              請輸入您的用戶 ID，以便識別您的排隊記錄
            </Form.Text>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>車位編號</Form.Label>
            {!parkingSpace ? (
              <div className="d-grid gap-2">
                <Button 
                  variant="outline-primary" 
                  onClick={() => setShowScanner(true)}
                >
                  掃描車位 QR 碼
                </Button>
                <div className="text-center my-2">- 或 -</div>
                <Form.Select 
                  onChange={handleParkingSpaceChange}
                  defaultValue=""
                >
                  <option value="" disabled>選擇車位編號</option>
                  {[...Array(10).keys()].map(i => (
                    <option key={i+1} value={i+1}>車位 #{i+1}</option>
                  ))}
                </Form.Select>
              </div>
            ) : (
              <div className="d-flex justify-content-between align-items-center">
                <strong>車位 #{parkingSpace}</strong>
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => setParkingSpace(null)}
                >
                  更換車位
                </Button>
              </div>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>預約時間（分鐘）</Form.Label>
            <Form.Control
              type="number"
              min="1"
              max="60"
              value={reservedTime}
              onChange={(e) => setReservedTime(parseInt(e.target.value))}
              required
            />
            <Form.Text className="text-muted">
              請選擇您需要的時間（1-60分鐘）
            </Form.Text>
          </Form.Group>

          <Button 
            variant="primary" 
            type="submit" 
            className="w-100" 
            disabled={loading || !userId || reservedTime < 1 || !parkingSpace}
          >
            {loading ? '處理中...' : '加入排隊'}
          </Button>
        </Form>
          </Card.Body>
        </Card>
      )}
    </>
  );
};

export default QueueJoin;
