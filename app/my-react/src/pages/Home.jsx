import React, { useContext } from "react";
import { Box, Button, Typography } from "@mui/material";
import { AuthContext } from "../context/authContext.jsx";
import danse from "../images/danse.jpg";

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
        backgroundColor: "#F5F5F5",

        backgroundImage: `url(${danse})`,
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        backgroundSize: "cover",
        backgroundPosition: "center -200px",
        minHeight: "100vh",
      }}
    >
      {currentUser ? (
        <Button variant="contained" color="primary" href="/notes">
          View my todolist
        </Button>
      ) : (
        <Typography variant="h4" color="secondary">
          Please Login
        </Typography>
      )}
    </Box>
  );
};

export default Home;
