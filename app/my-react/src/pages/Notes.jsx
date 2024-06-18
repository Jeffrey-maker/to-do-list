import React, { useState, useEffect } from "react";
import {
  Container,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Typography,
  Button,
  Box,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { Link, useNavigate } from "react-router-dom";
import danse from "../images/danse.jpg";
import axios from "axios";

// const todolists = [
//   {
//     id: 1,
//     title: "Learn React",
//     desc: "How to create and nest components? How to add markup and styles? How to display data? How to render conditions and lists? How to respond to events and update the screen?",
//   },
//   {
//     id: 2,
//     title: "Learn React",
//     desc: "How to create and nest components? How to add markup and styles? How to display data? How to render conditions and lists?",
//   },
//   {
//     id: 3,
//     title: "Learn React",
//     desc: "How to create and nest components? How to add markup and styles? How to display data? How to render conditions and lists?",
//   },
//   {
//     id: 4,
//     title: "Learn React",
//     desc: "How to create and nest components? How to add markup and styles? How to display data? How to render conditions and lists?",
//   },
// ];

function Notes() {
  const [notes, setNotes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const getNotes = async () => {
      // console.log("Get notes");
      try {
        const response = await axios.get("http://localhost:8000/notes", {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        });
        // console.log("USEEFFECT", response.data);
        setNotes(response.data.notes);
        // console.log(notes);
      } catch (err) {
        console.error(err);
      }
    };

    getNotes();
  }, []);

  const handleNavigate = (note) => {
    console.log(note);
    navigate(`/note/${note.id}`);
  };

  return (
    <div
      style={{
        height: "100vh",
        backgroundColor: "#F5F5F5",
        background: `url(${danse}) no-repeat center center fixed`,
        backgroundSize: "cover",
      }}
    >
      <Container
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          height: "calc(100vh - 250px)",
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          My ToDos
          <Button
            variant="contained"
            href="/write"
            sx={{ marginLeft: "770px", width: "210px" }}
          >
            Create new todo
          </Button>
        </Typography>

        <List>
          {notes.map((note) => (
            <ListItem
              key={note.id}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <ListItemText
                primary={note.title}
                secondary={note.description}
                primaryTypographyProps={{ variant: "h6" }}
              />
              <Box>
                <Button
                  sx={{
                    mr: 2,
                    width: "150px",
                  }}
                  variant="outlined"
                  onClick={() => handleNavigate(note)}
                >
                  Read More
                </Button>
              </Box>
            </ListItem>
          ))}
        </List>
      </Container>
    </div>
  );
}

export default Notes;
