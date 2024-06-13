// src/VerifyMFA.js
import React from 'react';
import { TextField, Button, Container, Typography, Box } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';
import backgroundImage from "../images/background.jpg";

const MfaVerify = () => {
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
      <Container maxWidth="xs" sx={containerStyle}>
        <main className="form-signin w-100 m-auto">
          <form method="POST">
            <Typography variant="h3" component="h1" gutterBottom>
              Verify Two-Factor Authentication
            </Typography>
            <TextField
              label="Enter OTP from your Authenticator App"
              fullWidth
              margin="normal"
              variant="outlined"
              id="otp"
              name="otp"
              placeholder="Enter OTP"
              required
              autoFocus
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{ mt: 3 }}
            >
              Verify
            </Button>
          </form>
        </main>
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

export default MfaVerify
