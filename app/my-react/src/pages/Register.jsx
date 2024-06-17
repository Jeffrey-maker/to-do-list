import React, { useEffect, useState } from "react";
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
    repassword: "",
  });

  const [passwordMatch, setPasswordMatch] = useState(true);
  const [passwordValid, setPasswordValid] = useState(true);
  const [err, setError] = useState([]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!passwordValid) {
      alert("Password does not meet the requirements!");
      return;
    } else if (!passwordMatch) {
      alert("Passwords do not match!");
      return;
    }
    try {
      let result = await axios.post("http://localhost:8000/register", inputs, {
        withCredentials: true,
      });
      console.log(result);
      navigate("/confirm-user", {
        state: {
          email: inputs.email,
          resendConfirmationCodeUrl: "http://localhost:8800/api/auth/resend",
        },
      });
    } catch (err) {
      console.log(err);
      setError(err.response.data.errors);
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
      <h1
        style={{
          fontSize: "50px",
          color: "black",
          marginBottom: "20px",
          marginTop: "60px",
        }}
      >
        Register
      </h1>
      <form
        style={{
          display: "flex",
          flexDirection: "column",
          paddingTop: "50px",
          paddingLeft: "70px",
          paddingRight: "70px",
          paddingBottom: "50px",
          backgroundColor: "white",
          width: "400px",
          gap: "18px",
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
          helperText="Use at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character."
        />
        <TextField
          label="re-password"
          variant="outlined"
          type="password"
          name="repassword"
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
        <Button
          variant="contained"
          color="primary"
          type="submit"
          onClick={handleSubmit}
        >
          Register
        </Button>

        <span
          style={{
            fontSize: "15px",
            textAlign: "center",
          }}
        >
          Do you have an account? <Link to="/login">Login</Link>
        </span>
      </form>
      {err && <p>{err}</p>}
    </div>
  );
};

export default Register;
