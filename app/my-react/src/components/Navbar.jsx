import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  function handleClickLogin() {
    navigate("/login");
  }

  function handleClickRegister() {
    navigate("/register");
  }

  return (
    <AppBar position="static" sx={{ backgroundColor: "#AEB8E6" }}>
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Typography sx={{ color: "white" }} variant="h4" component="div">
          To Do List
        </Typography>
        <Box>
          <Typography
            variant="h6"
            component="span"
            sx={{ color: "white", marginRight: 2 }}
          >
            Hello, user
          </Typography>
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
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
