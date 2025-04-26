import { io } from 'socket.io-client';
import axios from 'axios';
import { SOCKET_URL, API_URL, APP_CONFIG } from '../config';

/**
 * 连接管理器 - 处理 Socket.io 连接和 REST API 轮询的降级策略
 * 自动从实时 Socket.io 降级为 REST API 轮询以提高可靠性
 */
class ConnectionManager {
  constructor() {
    this.socket = null;
    this.listeners = {}; // 存储所有事件监听器
    this.pollingInterval = null;
    this.isPolling = false;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    
    // 连接状态事件
    this.onConnectionChange = null;
  }

  /**
   * 初始化连接
   * @param {Function} onConnectionChange 连接状态变化回调
   */
  initialize(onConnectionChange = null) {
    this.onConnectionChange = onConnectionChange;
    
    console.log('初始化连接到服务器:', SOCKET_URL);
    try {
      // 配置 Socket.io 连接
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 10000,
        reconnectionDelay: 3000
      });

      // 监听连接事件
      this.socket.on('connect', () => {
        console.log('Socket.io 连接成功!');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.stopPolling(); // 连接成功后停止轮询
        
        if (this.onConnectionChange) {
          this.onConnectionChange(true, 'socket');
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.io 连接失败:', error);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.warn(`Socket.io 重连尝试 ${this.reconnectAttempts}/${this.maxReconnectAttempts} 次失败，降级为 REST API 轮询`);
          this.isConnected = false;
          this.startPolling();
          
          if (this.onConnectionChange) {
            this.onConnectionChange(false, 'polling');
          }
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.warn('Socket.io 断开连接:', reason);
        this.isConnected = false;
        
        // 如果是服务器主动断开或客户端离开，不自动降级
        if (reason !== 'io server disconnect' && reason !== 'io client disconnect') {
          this.startPolling();
          
          if (this.onConnectionChange) {
            this.onConnectionChange(false, 'polling');
          }
        }
      });
    } catch (error) {
      console.error('初始化 Socket.io 连接失败:', error);
      this.startPolling();
    }
  }

  /**
   * 添加事件监听器
   * @param {string} event 事件名称
   * @param {Function} callback 回调函数
   */
  on(event, callback) {
    // 存储监听器以便轮询时使用
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    
    // 如果 socket 连接存在，添加实时监听
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * 移除事件监听器
   * @param {string} event 事件名称
   * @param {Function} callback 可选的特定回调函数
   */
  off(event, callback = null) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
        
        // 从存储的监听器中移除
        if (this.listeners[event]) {
          this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
      } else {
        this.socket.off(event);
        delete this.listeners[event];
      }
    }
  }

  /**
   * 启动 REST API 轮询作为 Socket.io 的备用方案
   */
  startPolling() {
    if (this.isPolling) return;
    
    console.log('启动 REST API 轮询作为备用方案');
    this.isPolling = true;
    
    // 使用配置的轮询间隔，默认 5 秒
    const interval = APP_CONFIG.pollingInterval || 5000;
    
    this.pollingInterval = setInterval(async () => {
      try {
        // 轮询队列数据
        if (this.listeners['queueUpdate']) {
          const response = await axios.get(`${API_URL}/queue`);
          this.listeners['queueUpdate'].forEach(callback => {
            callback(response.data);
          });
        }
        
        // 轮询其他可能需要的 API 端点
        // 例如 QR 码数据
        if (this.listeners['qrcodesUpdate']) {
          const response = await axios.get(`${API_URL}/qrcode`);
          this.listeners['qrcodesUpdate'].forEach(callback => {
            callback(response.data);
          });
        }
      } catch (error) {
        console.error('轮询 API 失败:', error);
      }
    }, interval);
  }

  /**
   * 停止 REST API 轮询
   */
  stopPolling() {
    if (!this.isPolling) return;
    
    console.log('停止 REST API 轮询');
    clearInterval(this.pollingInterval);
    this.pollingInterval = null;
    this.isPolling = false;
  }

  /**
   * 向服务器发送事件
   * @param {string} event 事件名称
   * @param {any} data 事件数据
   */
  emit(event, data) {
    if (this.isConnected && this.socket) {
      // 如果 Socket.io 连接可用，使用 Socket.io 发送
      this.socket.emit(event, data);
    } else {
      // 否则尝试使用 REST API 发送
      console.log(`Socket.io 不可用，使用 REST API 发送 ${event}`);
      
      // 映射 Socket.io 事件到 REST API 端点
      const endpoints = {
        'joinQueue': `${API_URL}/queue`,
        'leaveQueue': `${API_URL}/queue/leave`,
        'updateQRCode': `${API_URL}/qrcode`,
        // 可以添加更多事件映射
      };
      
      if (endpoints[event]) {
        axios.post(endpoints[event], data)
          .catch(error => console.error(`通过 REST API 发送 ${event} 失败:`, error));
      } else {
        console.warn(`未找到 ${event} 的 REST API 端点映射`);
      }
    }
  }

  /**
   * 获取连接状态
   * @returns {Object} 连接状态对象
   */
  getStatus() {
    return {
      connected: this.isConnected,
      mode: this.isConnected ? 'socket' : (this.isPolling ? 'polling' : 'disconnected'),
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * 清理和断开连接
   */
  cleanup() {
    this.stopPolling();
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.listeners = {};
    this.isConnected = false;
  }
}

// 创建单例实例
const connectionManager = new ConnectionManager();
export default connectionManager;
