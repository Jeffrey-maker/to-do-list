// src/MfaSetup.js
import React, { useState, useEffect } from "react";
import { TextField, Button, Container, Typography, Box } from "@mui/material";
import backgroundImage from "../images/background.jpg";
import "bootstrap/dist/css/bootstrap.min.css";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const MfaSetup = () => {
  const location = useLocation();
  // const { qrImage, secret } = location.state || {};
  const [secretCode, setSecretCode] = useState("");
  const [base64QrImage, setBase64QrImage] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const copySecret = () => {
    const copyText = document.getElementById("secret");
    copyText.select();
    copyText.setSelectionRange(0, 99999); // For mobile devices
    document.execCommand("copy");
    alert("Successfully copied TOTP secret token!");
  };

  useEffect(() => {
    const getSecretCode = async () => {
      console.log("CAll useffect verifyCode")
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/mfa-setup`, {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        });
        setSecretCode(response.data.secret_code);
        setBase64QrImage(response.data.base64_qr_image);
        console.log("USEEFFECT",response.data);
      } catch (err) {
        console.error(err);
      }
    };

    getSecretCode();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/mfa-setup`,
        {
          code: confirmationCode,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      console.log(response);

      if (response.data.success) {
        navigate("/login");
      } else {
        setError("Invalid confirmation code.");
      }
      navigate("/login");
    } catch (err) {
      setError(err.response.data.message || "An error occurred.");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        bgcolor: "#f0f0f0",
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
            Download{" "}
            <a
              href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2&hl=en&gl=US"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Authenticator
            </a>{" "}
            on your mobile.
          </li>
          <li>Set up a new authenticator.</li>
          <li>Once you have scanned the QR, enter the OTP code below.</li>
        </ul>
        <Box textAlign="center" my={2}>
          {base64QrImage ? (
            <img
            src={`data:image/png;base64,${base64QrImage}`}
              alt="Secret Token"
              style={{ width: "200px", height: "200px" }}
            />
          ) : (
            <Typography>Loading QR Code...</Typography>
          )}
        </Box>
        <Box textAlign="center" my={2}>
          <Typography
            variant="body1"
            id="secret"
            style={{ wordWrap: "break-word" }}
          >
            {secretCode}
          </Typography>
        </Box>
        <Box textAlign="center" my={2}>
          <Button variant="contained" color="primary" onClick={copySecret}>
            Copy Secret
          </Button>
        </Box>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            margin="normal"
            variant="outlined"
            id="otp"
            name="otp"
            placeholder="Enter OTP code"
            required
            value={confirmationCode}
            onChange={(e) => setConfirmationCode(e.target.value)}
          />
          <Button type="submit" variant="contained" color="success" fullWidth>
            Verify and Complete Setup
          </Button>
        </Box>
      </Container>
    </div>
  );
};

const containerStyle = {
  background: "white",
  padding: "30px",
  borderRadius: "8px",
  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
};

export default MfaSetup;
