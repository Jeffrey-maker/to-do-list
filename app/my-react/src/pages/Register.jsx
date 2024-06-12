import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import backgroundImage from "../images/background.jpg";

const Register = () => {
  const [inputs, setInputs] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [err, setError] = useState(null);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8800/api/auth/register", inputs, {
        withCredentials: true,
      });
      navigate("/login");
    } catch (err) {
      setError(err.response.data);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: `url(${backgroundImage}) no-repeat center center fixed`,
        backgroundSize: "cover",
      }}
    >
      <h1 style={{ fontSize: "50px", color: "black", marginBottom: "20px" }}>
        Register
      </h1>
      <form
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "50px",
          backgroundColor: "white",
          width: "300px",
          gap: "20px",
        }}
      >
        <TextField
          label="Username"
          variant="outlined"
          type="text"
          name="username"
          onChange={handleChange}
        />
        <TextField
          label="email"
          variant="outlined"
          type="email"
          name="email"
          onChange={handleChange}
        />
        <TextField
          label="password"
          variant="outlined"
          type="password"
          name="password"
          onChange={handleChange}
        />
        <Button variant="contained" color="primary" type="submit">
          Register
        </Button>
        {err && <p>{err}</p>}
        <span
          style={{
            fontSize: "15px",
            textAlign: "center",
          }}
        >
          Do you have an account? <Link to="/login">Login</Link>
        </span>
      </form>
    </div>
  );
};

export default Register;
