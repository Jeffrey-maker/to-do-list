import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate,useLocation } from "react-router-dom";
import axios from "axios";
import { Container, Box, Button, Typography, TextField } from "@mui/material";
import backgroundImage from "../images/background.jpg";

const ResetPassword = () => {

  const [err, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [passwordValid, setPasswordValid] = useState(true);
  const location = useLocation();
  const { email, username } = location.state || {};

  const [inputs, setInputs] = useState({
    password: "",
    repassword: "",
    verification_code: ""
  });

  const navigate = useNavigate();

  const passwordRegex = new RegExp(
    "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"
  );

  useEffect(() => {
    // console.log(inputs);
    setPasswordValid(passwordRegex.test(inputs.password));
    setPasswordMatch(inputs.password === inputs.repassword);
  }, [inputs.password, inputs.repassword]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!passwordValid) {
      alert("Password does not meet the requirements!");
      return;
    } else if (!passwordMatch) {
      alert("Passwords do not match!");
      return;
    }
    try {
      console.log(inputs)
      const response = await axios.post(
        "http://3.133.94.246:8000/reset-password",
        inputs,
        {
          withCredentials: true,
        }
      );
      console.log("response is", response.data.message);

      navigate("/login");
    } catch (err) {
      console.log(err)
    }
  };

  const resendCode = async () => {
    try {
      const response = await axios.post(
        "http://3.133.94.246:8000/forgot-password",
        {username: username},
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      alert("Password reset code sent to your email");
    } catch (err) {
      alert("Error sending password reset code");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",

        height: "100vh",
        background: `url(${backgroundImage}) no-repeat center center fixed`,
        backgroundSize: "cover",
      }}
    >
      {messages.map((msg, index) => (
        <div key={index} className={`alert ${msg.type}`}>
          {msg.text}
        </div>
      ))}
      <h1
        style={{
          fontSize: "50px",
          color: "black",
          marginBottom: "20px",
          marginTop: "50px",
        }}
      >
        Reset Password
      </h1>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          paddingTop: "50px",
          paddingLeft: "70px",
          paddingRight: "70px",
          paddingBottom: "50px",
          backgroundColor: "white",
          width: "450px",
          gap: "20px",
        }}
      >
        <Typography variant="body1">
          Your code is on the way. To log in, enter the code we emailed to{" "}
          {email}. It may take a minute to arrive.
        </Typography>
      
        <TextField
          variant="outlined"
          label="Verification Code"
          id="verification_code"
          name="verification_code"
          placeholder="Enter your code"
          required
          onChange={handleChange}
        />
  
        <TextField
          label="Password"
          variant="outlined"
          type="password"
          name="password"
          required
          onChange={handleChange}
          helperText="Use at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character."
        />
        <TextField
          label="Re-Password"
          variant="outlined"
          type="password"
          name="repassword"
          required
          onChange={handleChange}
        />
        {!passwordValid && inputs.password !== "" && (
          <p style={{ color: "red" }}>
            Password does not meet the requirements!
          </p>
        )}
        {!passwordMatch &&
          passwordValid &&
          inputs.repassword !== "" &&
          inputs.password !== "" && (
            <p style={{ color: "red" }}>Passwords do not match!</p>
          )}
        <Button variant="contained" color="primary" type="submit">
          Reset Password
        </Button>
        <Button
            variant="contained"
            color="secondary"
            onClick={resendCode}
          >
            Resend Code
        </Button>
        <span
          style={{
            fontSize: "15px",
            textAlign: "center",
          }}
        >
          Remember password? <Link to="/login">Login</Link>
        </span>
      </form>
    </div>
  );
};
export default ResetPassword;
