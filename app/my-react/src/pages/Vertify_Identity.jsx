import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import backgroundImage from "../images/background.jpg";

const Login = () => {
  const [inputs, setInputs] = useState({
    username: "",
    email: "",
  });

  const [err, setError] = useState(null);
  const [messages, setMessages] = useState([]);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:8000/vertify-identity",
        inputs,
        {
          withCredentials: true,
        }
      );
      console.log("response is", response.data.message);

      if (response.data.message == "Email does not exist") {
        alert("Email does not exist");
      }
      if (response.data.message == "Username does not exist") {
        alert("Username does not exist");
      }
      if (response.data.message == "Username and email do not match") {
        alert("Username and email do not match");
      } else {
        navigate("/confirm-user", {
          state: {
            email: inputs.email,
          },
        });
        await resendCode();
      }
    } catch (err) {
      console.log("error is: ", err);
    }
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
        Vertify Identity
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
          onChange={handleChange}
        />
        <TextField
          label="Email"
          variant="outlined"
          type="email"
          name="email"
          onChange={handleChange}
        />
        <Button variant="contained" color="primary" type="submit">
          Vertify
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
