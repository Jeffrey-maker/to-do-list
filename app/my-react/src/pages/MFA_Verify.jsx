// src/VerifyMFA.js
import React from "react";
import { TextField, Button, Container, Typography, Box } from "@mui/material";
import "bootstrap/dist/css/bootstrap.min.css";
import backgroundImage from "../images/background.jpg";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/authContext.jsx";

const MfaVerify = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const { login } = useContext(AuthContext);
  const state = useLocation().state;

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting form...");
    try {
      console.log("Into try");
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/mfa-verify`,
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

      console.log("Response received:", response);

      if (response.data.message == "MFA verify successfully!") {
        await login(state.username);
        navigate("/");
      } else {
        setError("Invalid confirmation code.");
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("An error occurred.");
      }
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
      <Container maxWidth="xs" sx={containerStyle}>
        <main className="form-signin w-100 m-auto">
          <Typography variant="h3" component="h1" gutterBottom>
            Verify Two-Factor Authentication
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
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
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
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
          </Box>
        </main>
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

export default MfaVerify;
