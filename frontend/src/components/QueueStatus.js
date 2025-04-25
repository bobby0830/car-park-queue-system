import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Badge } from 'react-bootstrap';
import './QueueStatus.css';

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
      return { color: 'warning', text: '等候中' };
    case 'in_use':
      return { color: 'success', text: '使用中' };
    case 'completed':
      return { color: 'secondary', text: '已完成' };
    default:
      return { color: 'info', text: '未知' };
  }
};

const QueueStatus = ({ queue, currentUserId }) => {
  return (
    <div className="queue-status">
      <h2>排隊狀態</h2>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>狀態</th>
            <th>等候時間</th>
            <th>預約時間</th>
            <th>使用時間</th>
          </tr>
        </thead>
        <tbody>
          {queue.map((item) => {
            const statusInfo = getStatusInfo(item.status);
            const isCurrentUser = item.user_id === currentUserId;
            
            return (
              <tr key={item.id} className={isCurrentUser ? 'current-user' : ''}>
                <td>{item.id}</td>
                <td>
                  <Badge bg={statusInfo.color}>{statusInfo.text}</Badge>
                </td>
                <td>
                  {item.status === 'waiting' ? formatTime(item.waiting_time) : '-'}
                </td>
                <td>{formatTime(item.reserved_time)}</td>
                <td>
                  {item.status === 'in_use' ? formatTime(item.usage_time) : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
};

export default QueueStatus;
