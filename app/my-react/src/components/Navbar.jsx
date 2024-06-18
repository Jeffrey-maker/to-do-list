import React, { useContext } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/authContext.jsx";
import sign from "../images/sidebar.jpg";
import { Link } from "react-router-dom";
import { TextField, IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

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
    <AppBar
      variant="permanent"
      sx={{
        backgroundColor: "#e8e9f1",
        zIndex: 1,
        height: "60px",
        boxShadow: "none",
      }}
    >
      <Toolbar
        sx={{
          justifyContent: "space-between",
        }}
      >
        <Typography sx={{ color: "Black" }} variant="h5" component="div">
          <Link to="/">
            <img
              src={sign}
              alt=""
              style={{ width: "40px", marginRight: "20px" }}
            />
          </Link>
          To Do List
        </Typography>
        <form>
          <TextField
            id="search-bar"
            className="text"
            onInput={(e) => {
              setSearchQuery(e.target.value);
            }}
            placeholder="Search Todos"
            sx={{ width: "500px" }}
            size="small"
          />
          <IconButton type="submit" aria-label="search">
            <SearchIcon style={{ fill: "blue", marginLeft: "10px" }} />
          </IconButton>
        </form>
        <Box>
          {currentUser ? (
            <>
              <Typography
                variant="h6"
                component="span"
                sx={{ color: "black", marginRight: 2 }}
              >
                Hello, {currentUser}
              </Typography>

              <Button
                sx={{ color: "black" }}
                color="inherit"
                onClick={handleClickLogout}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                sx={{ color: "black" }}
                color="inherit"
                onClick={handleClickLogin}
              >
                Login
              </Button>

              <Button
                sx={{ color: "black" }}
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
