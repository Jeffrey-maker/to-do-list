import React, { useContext } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/authContext.jsx";

const Navbar = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  function handleClickLogin() {
    navigate("/login");
  }

  function handleClickRegister() {
    navigate("/register");
  }

  function handleClickLogout() {
    logout();
    navigate("/");
  }

  return (
    <AppBar position="static" sx={{ backgroundColor: "#AEB8E6" }}>
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Typography sx={{ color: "white" }} variant="h4" component="div">
          To Do List
        </Typography>
        <Box>
          {currentUser ? (
            <>
              <Typography
                variant="h6"
                component="span"
                sx={{ color: "white", marginRight: 2 }}
              >
                Hello, {currentUser}
              </Typography>

              <Button
                sx={{ color: "white" }}
                color="inherit"
                onClick={handleClickLogout}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                sx={{ color: "white" }}
                color="inherit"
                onClick={handleClickLogin}
              >
                Login
              </Button>

              <Button
                sx={{ color: "white" }}
                color="inherit"
                onClick={handleClickRegister}
              >
                Register
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
