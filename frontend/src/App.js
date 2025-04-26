import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Navbar, Nav, Alert, Button, Badge } from 'react-bootstrap';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import axios from 'axios';

// 導入元件
import QueueStatus from './components/QueueStatus';
import QueueJoin from './components/QueueJoin';
import UserQueue from './components/UserQueue';
import UserQueueList from './components/UserQueueList';
import QRCodeDisplay from './components/QRCodeDisplay';

// Import configuration
import { API_URL } from './config';

// Import our new ConnectionManager that handles Socket.io with REST API fallback
import connectionManager from './utils/ConnectionManager';

function App() {
  // 获取URL参数
  const [urlParams] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      parking: params.get('parking'),
      join: params.get('join') === 'true'
    };
  });
  
  const [queue, setQueue] = useState([]);
  const [userId, setUserId] = useState(() => {
    // 從 localStorage 讀取之前的用戶 ID
    return localStorage.getItem('queueUserId') || '';
  });
  const [userQueueEntry, setUserQueueEntry] = useState(null);  // 保留向後兼容
  const [userQueueEntries, setUserQueueEntries] = useState([]);
  const [showNewQueueForm, setShowNewQueueForm] = useState(() => {
    // 如果URL中有join=true参数，则显示表单
    return urlParams.join || true;
  });
  const [selectedParkingSpace, setSelectedParkingSpace] = useState(urlParams.parking ? Number(urlParams.parking) : null);
  const [connected, setConnected] = useState(false);
  const [connectionMode, setConnectionMode] = useState('disconnected'); // 'socket' 或 'polling' 或 'disconnected'
  const [error, setError] = useState('');

  // 初始化连接管理器
  useEffect(() => {
    // 处理连接状态变化
    const handleConnectionChange = (isConnected, mode) => {
      console.log(`连接状态变化: ${isConnected ? '已连接' : '已断开'}, 模式: ${mode}`);
      setConnected(isConnected);
      setConnectionMode(mode);
      
      if (!isConnected) {
        setError('无法建立实时连接，已切换到轮询模式。');
      } else {
        setError('');
      }
    };

    // 初始化连接管理器
    connectionManager.initialize(handleConnectionChange);
    
    // 监听队列更新
    connectionManager.on('queueUpdate', (data) => {
      console.log('收到队列更新:', data);
      setQueue(data);
      if (userId) {
        const userEntries = data.filter(entry => entry.user_id === userId);
        setUserQueueEntries(userEntries);
        setUserQueueEntry(userEntries.length > 0 ? userEntries[0] : null); // 保留向後兼容
      }
    });

    // 组件卸载时清理
    return () => {
      connectionManager.cleanup();
    };
  }, []);

  // 组件加载时立即获取队列数据
  useEffect(() => {
    fetchQueueData();
    // 每 30 秒刷新一次数据，作为额外保障
    const refreshInterval = setInterval(fetchQueueData, 30000);
    return () => clearInterval(refreshInterval);
  }, []);

  // 在 userId 变化时更新用户数据
  useEffect(() => {
    if (userId && queue.length > 0) {
      // 获取用户的所有排队条目
      const entries = queue.filter(entry => entry.user_id === userId);
      setUserQueueEntries(entries);
      
      // 保持向后兼容，保留第一个排队条目
      setUserQueueEntry(entries.length > 0 ? entries[0] : null);
      
      // 如果用户有排队记录，默认不显示表单
      setShowNewQueueForm(entries.length === 0);
    } else {
      setUserQueueEntries([]);
      setUserQueueEntry(null);
      setShowNewQueueForm(true);
    }
    
    // 保存用户ID到本地存储
    localStorage.setItem('queueUserId', userId);
  }, [userId, queue]);

  // 透過 API 獲取排隊數據
  const fetchQueueData = async () => {
    try {
      const response = await axios.get(`${API_URL}/queue`);
      setQueue(response.data);
      if (userId) {
        const userEntry = response.data.find(entry => entry.user_id === userId);
        setUserQueueEntry(userEntry || null);
      }
    } catch (err) {
      console.error('獲取排隊數據錯誤:', err);
      setError('無法獲取排隊數據，請稍後再試。');
    }
  };

  // 用戶加入排隊後的處理
  const handleJoinQueue = (newEntry) => {
    // 更新本地状态
    setQueue(prev => [...prev, newEntry]);
    setUserQueueEntries(prev => [...prev, newEntry]);
    setUserQueueEntry(newEntry);  // 向後兼容
    setShowNewQueueForm(false);
    
    // 通过连接管理器发送事件
    connectionManager.emit('joinQueue', newEntry);
  };
  
  // 用戶取消排隊後的處理
  const handleQueueCancelled = (queueId) => {
    // 更新隊列中的記錄
    setQueue(prev => prev.filter(entry => entry.id !== queueId));
    
    // 更新用戶排隊記錄
    const updatedEntries = userQueueEntries.filter(entry => entry.id !== queueId);
    setUserQueueEntries(updatedEntries);
    
    // 如果沒有排隊記錄了，顯示新增表單
    if (updatedEntries.length === 0) {
      setShowNewQueueForm(true);
    }
    
    // 通过连接管理器发送取消事件
    connectionManager.emit('leaveQueue', { queueId });
  };
  
  // 切換顯示新排隊表單
  const toggleNewQueueForm = () => {
    setShowNewQueueForm(!showNewQueueForm);
  };

  return (
    <Router>
      <div className="App">
        <Navbar bg="dark" variant="dark" expand="lg">
          <Container>
            <Navbar.Brand as={Link} to="/">排隊系統</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/">首頁</Nav.Link>
                <Nav.Link as={Link} to="/admin/qrcodes">車位QR碼</Nav.Link>
              </Nav>
            {!connected && (
              <span className="navbar-text text-danger">
                <Badge bg="danger">離線</Badge> 伺服器連接中斷
              </span>
            )}
            {connected && connectionMode === 'socket' && (
              <span className="navbar-text text-success">
                <Badge bg="success">即時</Badge> 實時連接已建立
              </span>
            )}
            {connected && connectionMode === 'polling' && (
              <span className="navbar-text text-warning">
                <Badge bg="warning" text="dark">輪詢</Badge> 使用備用連接
              </span>
            )}
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="mt-4">
        {error && <Alert variant="danger">{error}</Alert>}

        <Routes>
          <Route path="/" element={
            <>
              <h1 className="text-center mb-4">即時排隊系統</h1>
              <Row>
                <Col lg={8} className="mb-4">
                  <QueueStatus queue={queue} currentUserId={userId} />
                </Col>
                <Col lg={4} className="mb-4">
                  {userId && userQueueEntries.length > 0 && (
                    <>
                      <UserQueueList 
                        userId={userId}
                        onQueueCancelled={handleQueueCancelled}
                        connectionManager={connectionManager}
                      />
                      
                      <div className="text-center mt-3 mb-4">
                        <Button 
                          variant={showNewQueueForm ? "outline-secondary" : "primary"}
                          onClick={toggleNewQueueForm}
                        >
                          {showNewQueueForm ? '取消新增' : '新增排隊'}
                        </Button>
                      </div>
                    </>
                  )}
                  
                  {(showNewQueueForm || userQueueEntries.length === 0) && (
                    <QueueJoin 
                      onJoinQueue={handleJoinQueue} 
                      userId={userId} 
                      setUserId={setUserId}
                      initialParkingSpace={selectedParkingSpace}
                    />
                  )}
                </Col>
              </Row>
            </>
          } />
          <Route path="/admin/qrcodes" element={<QRCodeDisplay />} />
        </Routes>
      </Container>

      <footer className="bg-light py-3 mt-5">
        <Container>
          <p className="text-center text-muted mb-0">
            &copy; {new Date().getFullYear()} 排隊系統 - 使用 React, Node.js, MongoDB 開發
          </p>
        </Container>
      </footer>
    </div>
    </Router>
  );
}

export default App;
