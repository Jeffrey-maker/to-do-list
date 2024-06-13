import React, { useContext } from "react";
import { Box, Button, Typography } from "@mui/material";
import { AuthContext } from "../context/authContext.jsx";
import backgroundImage from "../images/background.jpg";

const Home = () => {
  const { currentUser } = useContext(AuthContext);

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {currentUser ? (
        <Button variant="contained" color="primary" href="/notes">
          View my todolist
        </Button>
      ) : (
        <Typography variant="h6" color="secondary">
          Please Login
        </Typography>
      )}
    </Box>
  );
};

export default Home;
