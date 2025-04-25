import React from 'react';
import { Card, Badge } from 'react-bootstrap';
import './UserQueue.css';

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

const UserQueue = ({ userEntry }) => {
  if (!userEntry) {
    return null;
  }

  const statusInfo = getStatusInfo(userEntry.status);

  return (
    <Card className="user-queue-card">
      <Card.Header>
        <h5>
          {statusInfo.icon} 您的排隊狀態 
          <Badge bg={statusInfo.color} className="ms-2">
            {statusInfo.text}
          </Badge>
        </h5>
      </Card.Header>
      <Card.Body>
        <div className="queue-info">
          <div className="info-item">
            <div className="info-label">序號</div>
            <div className="info-value">{userEntry.id}</div>
          </div>
          
          <div className="info-item highlight">
            <div className="info-label">車位編號</div>
            <div className="info-value">{userEntry.parking_space}</div>
          </div>
          
          {userEntry.status === 'waiting' && (
            <div className="info-item highlight">
              <div className="info-label">預計等候</div>
              <div className="info-value timer">{formatTime(userEntry.waiting_time)}</div>
            </div>
          )}
          
          {userEntry.status === 'in_use' && (
            <div className="info-item highlight">
              <div className="info-label">剩餘時間</div>
              <div className="info-value timer">{formatTime(userEntry.usage_time)}</div>
            </div>
          )}
          
          <div className="info-item">
            <div className="info-label">預約時間</div>
            <div className="info-value">{formatTime(userEntry.reserved_time)}</div>
          </div>
          
          <div className="info-item">
            <div className="info-label">加入時間</div>
            <div className="info-value">
              {new Date(userEntry.created_at).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default UserQueue;
