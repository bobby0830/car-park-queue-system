import React, { useState, useEffect } from 'react';
import { Card, ListGroup, Badge, Button, Alert } from 'react-bootstrap';
import axios from 'axios';
import './UserQueueList.css';
import { API_URL } from '../config';

// 格式化秒數為分鐘:秒數
const formatTime = (seconds) => {
  if (seconds === undefined || seconds === null) return '00:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// 根據狀態返回對應顏色和名稱
const getStatusInfo = (status) => {
  switch (status) {
    case 'waiting':
      return { color: 'warning', text: '等候中', icon: '⏳' };
    case 'in_use':
      return { color: 'success', text: '使用中', icon: '✅' };
    case 'completed':
      return { color: 'secondary', text: '已完成', icon: '🏁' };
    default:
      return { color: 'info', text: '未知', icon: '❓' };
  }
};

const UserQueueList = ({ userId, onQueueCancelled, connectionManager }) => {
  const [queueEntries, setQueueEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (userId) {
      fetchUserQueues();
    }
  }, [userId]);

  useEffect(() => {
    // 清除成功消息
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // 監聽队列更新
  useEffect(() => {
    if (connectionManager && userId) {
      const handleQueueUpdate = (data) => {
        if (userId) {
          const userEntries = data.filter(entry => entry.user_id === userId);
          setQueueEntries(userEntries);
        }
      };
      
      // 使用连接管理器监听队列更新
      connectionManager.on('queueUpdate', handleQueueUpdate);
      
      return () => {
        connectionManager.off('queueUpdate', handleQueueUpdate);
      };
    }
  }, [connectionManager, userId]);

  const fetchUserQueues = async () => {
    try {
      setLoading(true);
      // 使用配置中的 API URL 而不是硬编码的地址
      const response = await axios.get(`${API_URL}/queue/user/${userId}/all`);
      setQueueEntries(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching user queues:', err);
      setError('獲取排隊資料失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelQueue = async (queueId) => {
    try {
      setCancellingId(queueId);
      // 使用配置中的 API URL
      await axios.delete(`${API_URL}/queue/${queueId}`);
      
      // 更新本地狀態
      const updatedEntries = queueEntries.filter(entry => entry.id !== queueId);
      setQueueEntries(updatedEntries);
      
      // 使用连接管理器发送取消事件
      connectionManager.emit('leaveQueue', { queueId });
      
      // 通知父組件
      if (onQueueCancelled) {
        onQueueCancelled(queueId);
      }
      
      setSuccessMessage('已成功取消排隊');
    } catch (err) {
      console.error('Cancel queue error:', err);
      setError('取消排隊失敗，請稍後再試');
    } finally {
      setCancellingId(null);
    }
  };

  if (!userId) {
    return null;
  }

  if (loading) {
    return (
      <Card className="user-queue-list">
        <Card.Header>
          <h5>您的排隊記錄</h5>
        </Card.Header>
        <Card.Body className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">載入中...</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="user-queue-list">
      <Card.Header>
        <h5>您的排隊記錄</h5>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {successMessage && <Alert variant="success">{successMessage}</Alert>}
        
        {queueEntries.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted">您目前沒有排隊記錄</p>
          </div>
        ) : (
          <ListGroup>
            {queueEntries.map(entry => {
              const statusInfo = getStatusInfo(entry.status);
              const canCancel = entry.status === 'waiting';
              
              return (
                <ListGroup.Item key={entry.id} className="queue-item">
                  <div className="queue-info">
                    <div className="queue-header">
                      <h6>排隊號碼: {entry.id}</h6>
                      <Badge bg={statusInfo.color}>
                        {statusInfo.icon} {statusInfo.text}
                      </Badge>
                    </div>
                    
                    <div className="queue-details">
                      <div className="detail-item">
                        <span className="detail-label">車位:</span>
                        <span className="detail-value">{entry.parking_space}</span>
                      </div>
                      
                      {entry.status === 'waiting' && (
                        <div className="detail-item">
                          <span className="detail-label">等候時間:</span>
                          <span className="detail-value highlight">{formatTime(entry.waiting_time)}</span>
                        </div>
                      )}
                      
                      {entry.status === 'in_use' && (
                        <div className="detail-item">
                          <span className="detail-label">剩餘時間:</span>
                          <span className="detail-value highlight">{formatTime(entry.usage_time)}</span>
                        </div>
                      )}
                      
                      <div className="detail-item">
                        <span className="detail-label">預約時間:</span>
                        <span className="detail-value">{formatTime(entry.reserved_time)}</span>
                      </div>
                      
                      <div className="detail-item">
                        <span className="detail-label">加入時間:</span>
                        <span className="detail-value">{new Date(entry.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    
                    {canCancel && (
                      <div className="queue-actions">
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleCancelQueue(entry.id)}
                          disabled={cancellingId === entry.id}
                        >
                          {cancellingId === entry.id ? '取消中...' : '取消排隊'}
                        </Button>
                      </div>
                    )}
                  </div>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        )}
      </Card.Body>
    </Card>
  );
};

export default UserQueueList;
