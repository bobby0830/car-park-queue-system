import React, { useState, useEffect } from 'react';
import { Card, Button } from 'react-bootstrap';
import { Html5Qrcode } from 'html5-qrcode';
import './QRScanner.css';

const QRScanner = ({ onScanSuccess }) => {
  const [scanning, setScanning] = useState(false);
  const [html5QrCode, setHtml5QrCode] = useState(null);
  const qrcodeRegionId = "qr-code-reader";

  useEffect(() => {
    return () => {
      // Clean up on unmount
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.error('Error stopping scanner:', err));
      }
    };
  }, [html5QrCode]);

  const startScanner = () => {
    const qrCodeReader = new Html5Qrcode(qrcodeRegionId);
    setHtml5QrCode(qrCodeReader);

    qrCodeReader.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      },
      (decodedText) => {
        // QR code successfully scanned
        try {
          const qrData = JSON.parse(decodedText);
          
          // Check if it's our carpark QR code
          if (qrData.type === 'carpark_queue' && qrData.parking_space) {
            // Stop scanning
            qrCodeReader.stop().then(() => {
              setScanning(false);
              // Send data to parent component
              onScanSuccess(qrData);
            }).catch(err => {
              console.error('Error stopping scanner:', err);
            });
          } else {
            console.log('Invalid QR code format:', qrData);
          }
        } catch (error) {
          console.error('Error parsing QR code data:', error);
        }
      },
      (errorMessage) => {
        // QR scan error (usually just means no QR code found yet)
        console.log('QR scan error:', errorMessage);
      }
    ).catch(err => {
      console.error('Error starting scanner:', err);
    });

    setScanning(true);
  };

  const stopScanner = () => {
    if (html5QrCode && html5QrCode.isScanning) {
      html5QrCode.stop().then(() => {
        setScanning(false);
      }).catch(err => {
        console.error('Error stopping scanner:', err);
      });
    }
  };

  return (
    <Card className="qr-scanner-card">
      <Card.Header as="h5">掃描車位 QR Code</Card.Header>
      <Card.Body>
        <div id={qrcodeRegionId} className="qr-reader-container"></div>
        
        {!scanning ? (
          <Button 
            variant="primary" 
            onClick={startScanner} 
            className="scanner-btn"
          >
            開始掃描
          </Button>
        ) : (
          <Button 
            variant="danger" 
            onClick={stopScanner} 
            className="scanner-btn"
          >
            停止掃描
          </Button>
        )}
        
        <div className="scanner-instructions">
          <p>請將車位處的 QR Code 對準相機</p>
        </div>
      </Card.Body>
    </Card>
  );
};

export default QRScanner;
