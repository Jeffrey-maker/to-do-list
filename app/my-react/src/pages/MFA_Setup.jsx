// src/MfaSetup.js
import React from 'react';
import { TextField, Button, Container, Typography, Box } from '@mui/material';
import backgroundImage from "../images/background.jpg";
import 'bootstrap/dist/css/bootstrap.min.css';

const MfaSetup = ({ qrImage, secret }) => {
  const copySecret = () => {
    const copyText = document.getElementById('secret');
    copyText.select();
    copyText.setSelectionRange(0, 99999); // For mobile devices
    document.execCommand('copy');
    alert('Successfully copied TOTP secret token!');
  };

  return (
    <div
      style={{
      display:"flex",
      justifyContent:"center",
      alignItems:"center",
      height:"100vh",
      bgcolor:"#f0f0f0",
      background: `url(${backgroundImage}) no-repeat center center fixed`,
      backgroundSize: "cover",
      }}
    >
      <Container maxWidth="sm" sx={containerStyle}>
        <Typography variant="h5" gutterBottom>
          Instructions!
        </Typography>
        <ul>
          <li>
            Download{' '}
            <a
              href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2&hl=en&gl=US"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Authenticator
            </a>{' '}
            on your mobile.
          </li>
          <li>Set up a new authenticator.</li>
          <li>Once you have scanned the QR, enter the OTP code below.</li>
        </ul>
        <Box textAlign="center" my={2}>
          <img src={qrImage} alt="Secret Token" style={{ width: '200px', height: '200px' }} />
        </Box>
        <Box textAlign="center" my={2}>
          <Typography variant="body1" id="secret" style={{ wordWrap: 'break-word' }}>
            {secret}
          </Typography>
        </Box>
        <Box textAlign="center" my={2}>
          <Button variant="contained" color="primary" onClick={copySecret}>
            Copy Secret
          </Button>
        </Box>
        <TextField
          label="Enter OTP Code"
          fullWidth
          margin="normal"
          variant="outlined"
          id="otp"
          name="otp"
          placeholder="Enter OTP code"
          required
        />
        <Button type="submit" variant="contained" color="success" fullWidth>
          Verify and Complete Setup
        </Button>
      </Container>
    </div>
  );
};

const containerStyle = {
  background: 'white',
  padding: '30px',
  borderRadius: '8px',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
};

export default MfaSetup;
