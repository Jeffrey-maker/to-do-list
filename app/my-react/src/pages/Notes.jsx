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

const todolists = [
  {
    id: 1,
    title: "Learn React",
    desc: "How to create and nest components? How to add markup and styles? How to display data? How to render conditions and lists? How to respond to events and update the screen?",
  },
  {
    id: 2,
    title: "Learn React",
    desc: "How to create and nest components? How to add markup and styles? How to display data? How to render conditions and lists?",
  },
  {
    id: 3,
    title: "Learn React",
    desc: "How to create and nest components? How to add markup and styles? How to display data? How to render conditions and lists?",
  },
  {
    id: 4,
    title: "Learn React",
    desc: "How to create and nest components? How to add markup and styles? How to display data? How to render conditions and lists?",
  },
];

function Notes() {
  const [notes, setNotes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setNotes(todolists);
  }, []);

  const handleNavigate = (noteId) => {
    navigate(`/note/${noteId}`);
  };

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Notes
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
              secondary={note.desc}
              primaryTypographyProps={{ variant: "h6" }}
            />
            <Box>
              <Button
                sx={{
                  mr: 2,
                  width: "150px",
                  backgroundcolor: "white",
                  border: "1px solid teal",
                  color: "teal",
                }}
                variant="outlined"
                onClick={() => handleNavigate(note.id)}
              >
                Read More
              </Button>
            </Box>
          </ListItem>
        ))}
      </List>
    </Container>
  );
}

export default Notes;
