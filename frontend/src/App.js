import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Navbar, Nav, Alert, Button } from 'react-bootstrap';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import io from 'socket.io-client';
import axios from 'axios';

// 導入元件
import QueueStatus from './components/QueueStatus';
import QueueJoin from './components/QueueJoin';
import UserQueue from './components/UserQueue';
import UserQueueList from './components/UserQueueList';
import QRCodeDisplay from './components/QRCodeDisplay';

// Import configuration
import { API_URL, SOCKET_URL } from './config';

function App() {
  const [queue, setQueue] = useState([]);
  const [userId, setUserId] = useState(() => {
    // 從 localStorage 讀取之前的用戶 ID
    return localStorage.getItem('queueUserId') || '';
  });
  const [userQueueEntry, setUserQueueEntry] = useState(null);  // 保留向後兼容
  const [userQueueEntries, setUserQueueEntries] = useState([]);
  const [showNewQueueForm, setShowNewQueueForm] = useState(true);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');

  // 初始化 Socket.io 連接
  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // 連接事件處理
    newSocket.on('connect', () => {
      setConnected(true);
      setError('');
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket.io 連接錯誤:', err);
      setConnected(false);
      setError('無法連接到伺服器，請檢查伺服器是否運行。');
    });

    // 監聽實時更新
    newSocket.on('queueUpdate', (data) => {
      setQueue(data);
      if (userId) {
        const userEntry = data.find(entry => entry.user_id === userId);
        setUserQueueEntry(userEntry || null);
      }
    });

    // 組件卸載時斷開連接
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // 當 userId 改變時更新 localStorage 並查找用戶的排隊資訊
  useEffect(() => {
    localStorage.setItem('queueUserId', userId);

    if (userId && queue.length > 0) {
      // 獲取用戶所有的排隊記錄
      const entries = queue.filter(entry => entry.user_id === userId);
      setUserQueueEntries(entries);
      
      // 向後兼容，維持首個排隊記錄
      const userEntry = entries.length > 0 ? entries[0] : null;
      setUserQueueEntry(userEntry);
      
      // 如果用戶有排隊記錄，預設不顯示表單
      setShowNewQueueForm(entries.length === 0);
    } else {
      setUserQueueEntries([]);
      setUserQueueEntry(null);
      setShowNewQueueForm(true);
    }
  }, [userId, queue]);

  // 如果沒有 Socket.io 更新，則通過 API 獲取數據
  useEffect(() => {
    if (!connected && queue.length === 0) {
      fetchQueueData();
    }
  }, [connected]);

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
    setQueue(prev => [...prev, newEntry]);
    setUserQueueEntries(prev => [...prev, newEntry]);
    setUserQueueEntry(newEntry);  // 向後兼容
    setShowNewQueueForm(false);
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
                伺服器連接中斷
              </span>
            )}
            {connected && (
              <span className="navbar-text text-success">
                伺服器已連接
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
                        socket={socket}
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
