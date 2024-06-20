import React, { useContext } from "react";
import { Box, Button, Typography, Container } from "@mui/material";
import { AuthContext } from "../context/authContext.jsx";
import { useNavigate } from "react-router-dom";
import danse from "../images/danse.jpg";

const Home = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleViewTodos = () => {
    navigate("/notes");
  };

  return (
    <div
      style={{
        backgroundImage: `url(${danse})`,
        backgroundColor: "#F5F5F5",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        backgroundSize: "cover",
        backgroundPosition: "center -200px",
        minHeight: "100vh",
      }}
    >
      <Container
        sx={{
          paddingTop: "20px",
          paddingBottom: "20px",
          color: "none",
          background: "rgba(255, 255, 255, 0.0)",
          marginTop: "20px",
        }}
      >
        {currentUser ? (
          <>
            <Typography variant="h4" component="h1" gutterBottom>
              Hello, {currentUser}! Welcome back to your To-Do List App.
            </Typography>

            <Typography variant="h6" component="h2" gutterBottom>
              Overview:
            </Typography>

            <Box
              sx={{
                display: "flex",
                gap: "20px",
                marginBottom: "20px",
                background: "rgba(255, 255, 255, 0.0)",
              }}
            >
              <Box sx={{ border: "1px solid #ddd", padding: "20px", flex: 1 }}>
                <Typography variant="h6">Total Tasks</Typography>
                <Typography variant="h4">10</Typography>
              </Box>
              <Box sx={{ border: "1px solid #ddd", padding: "20px", flex: 1 }}>
                <Typography variant="h6">Completed Tasks</Typography>
                <Typography variant="h4">5</Typography>
              </Box>
              <Box sx={{ border: "1px solid #ddd", padding: "20px", flex: 1 }}>
                <Typography variant="h6">Pending Tasks</Typography>
                <Typography variant="h4">5</Typography>
              </Box>
            </Box>

            <Button
              variant="contained"
              onClick={handleViewTodos}
              sx={{ marginTop: "20px" }}
            >
              View My Todo List
            </Button>

            <Box
              sx={{
                marginTop: "40px",
                background: "rgba(255, 255, 255, 0.0)",
                borderRadius: "10px",
              }}
            >
              <Typography
                variant="h6"
                component="h3"
                gutterBottom
                sx={{ marginBottom: "20px" }}
              >
                Quick Actions
              </Typography>
              <Button
                variant="outlined"
                sx={{ marginRight: "10px" }}
                onClick={() => navigate("/write")}
              >
                Create New Task
              </Button>
              <Button
                variant="outlined"
                sx={{ marginRight: "10px" }}
                onClick={() => navigate("/notes")}
              >
                View All Tasks
              </Button>
              <Button variant="outlined" onClick={() => navigate("/notes")}>
                View Completed Tasks
              </Button>
            </Box>
          </>
        ) : (
          <Typography variant="h4" color="secondary">
            Please Login
          </Typography>
        )}
      </Container>
    </div>
  );
};

export default Home;
