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
        const response = await axios.get("http://3.133.94.246:8000/notes", {
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
        backgroundImage: `url(${danse})`,
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
                primaryTypographyProps={{
                  variant: "h6",
                  sx: {
                    wordWrap: "break-word",
                    wordBreak: "break-all",
                    whiteSpace: "pre-wrap",
                  },
                }}
                secondaryTypographyProps={{
                  sx: {
                    wordWrap: "break-word",
                    wordBreak: "break-all",
                    whiteSpace: "pre-wrap",
                  },
                }}
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
