import React, { useState } from "react";
import axios from "axios";
import { Container, Box, Button, Typography, TextField } from "@mui/material";
import backgroundImage from "../images/background.jpg";
import "bootstrap/dist/css/bootstrap.min.css";
import { useLocation, useNavigate } from "react-router-dom";

const ConfirmUser = () => {
  const [confirmationCode, setConfirmationCode] = useState("");
  const location = useLocation();
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { email, resendConfirmationCodeUrl } = location.state;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:8000/confirm-user",
        {
          email: email,
          code: confirmationCode,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        navigate("/mfa-setup");
      } else {
        setError("Invalid confirmation code.");
      }
      navigate("/mfa-setup", {
        state: {
          qrImage: confirmationCode,
          secret: confirmationCode,
        },
      });
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.errors || "An error occurred.");
    }
  };

  const resendCode = () => {
    axios
      .post(
        resendConfirmationCodeUrl,
        {},
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      )
      .then((response) => {
        if (response.status === 200 && response.data.success) {
          alert("A new confirmation code has been sent to your email.");
        } else {
          alert("Error resending confirmation code.");
        }
      })
      .catch((error) => {
        console.error("There was a problem with the axios request:", error);
        alert("An error occurred while resending the code.");
      });
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: `url(${backgroundImage}) no-repeat center center fixed`,
        backgroundSize: "cover",
      }}
    >
      <Container maxWidth="sm" sx={containerStyle}>
        <Typography variant="h5" gutterBottom component="div">
          We Emailed You
        </Typography>
        <Typography variant="body1">
          Your code is on the way. To log in, enter the code we emailed to{" "}
          {email}. It may take a minute to arrive.
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            margin="normal"
            variant="outlined"
            label="Confirmation Code"
            id="confirmation_code"
            name="confirmation_code"
            placeholder="Enter your code"
            required
            value={confirmationCode}
            onChange={(e) => setConfirmationCode(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
          >
            Confirm
          </Button>
          <Button
            type="button"
            fullWidth
            variant="contained"
            color="secondary"
            sx={{ mt: 2 }}
            onClick={resendCode}
          >
            Resend Code
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

export default ConfirmUser;
