import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import backgroundImage from "../images/background.jpg";

const Login = () => {
  const [inputs, setInputs] = useState({
    password: "",
  });

  const [err, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [passwordValid, setPasswordValid] = useState(true);

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

  const resendCode = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8000/resend_confirmation_code",
        {},
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      if (response.data.success) {
        alert("A new confirmation code has been sent to your email.");
      } else {
        alert("Error resending confirmation code.");
      }
    } catch (error) {
      console.error("There was a problem with the axios request:", error);
      alert("An error occurred while resending the code.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      // const response = await axios.post("http://localhost:8000/login", inputs, {
      //   withCredentials: true,
      // });
      // console.log("response is", response.data.message);

      // if (response.data.message == "Need MFA setup") {
      //   navigate("/mfa-setup");
      // } else {
      //   navigate("/login");
      // }
      navigate("/login");
    } catch (err) {}
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
          marginTop: "130px",
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
          width: "400px",
          gap: "20px",
        }}
      >
        <TextField
          label="Password"
          variant="outlined"
          type="password"
          name="password"
          onChange={handleChange}
          helperText="Use at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character."
        />
        <TextField
          label="Re-Password"
          variant="outlined"
          type="password"
          name="repassword"
          onChange={handleChange}
        />
        <Button variant="contained" color="primary" type="submit">
          Reset Password
        </Button>
        {err && <p>{err}</p>}
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

export default Login;
