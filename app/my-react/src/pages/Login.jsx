import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import backgroundImage from "../images/background.jpg";

const Login = () => {
  const [inputs, setInputs] = useState({
    username: "",
    password: "",
  });

  const [err, setError] = useState(null);
  const [messages, setMessages] = useState([]);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
      const response = await axios.post("http://localhost:8000/login", inputs, {
        withCredentials: true,
      });
      console.log("response is", response.data.message);

      if (response.data.message == "Email not confirmed") {
        navigate("/confirm-user", {
          state: {
            email: response.data.email,
          },
        });
        console.log("email is", response.data.email);
        await resendCode();
        console.log("Finish resend code");
      }
      if (response.data.message == "Need MFA setup") {
        navigate("/mfa-setup");
      }
      if (response.data.message === "Need MFA verify") {
        navigate("/mfa-verify", { state: inputs });
      }
    } catch (err) {
      navigate("/login");
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
          marginTop: "130px",
        }}
      >
        Login
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
          type="text"
          label="Username"
          variant="outlined"
          name="username"
          required
          onChange={handleChange}
        />
        <TextField
          type="password"
          label="Password"
          variant="outlined"
          name="password"
          required
          onChange={handleChange}
        />
        <Button variant="contained" color="primary" type="submit">
          Login
        </Button>
        {err && <p>{err}</p>}
        <span
          style={{
            fontSize: "15px",
            textAlign: "center",
          }}
        >
          Don't you have an account? <Link to="/register">Register</Link>
        </span>
        <span
          style={{
            fontSize: "15px",
            textAlign: "center",
          }}
        >
          Forget password? <Link to="/vertify-identity">Reset Password</Link>
        </span>
      </form>
    </div>
  );
};

export default Login;
