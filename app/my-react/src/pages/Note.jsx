import React, { useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "../context/authContext.jsx";
import { IconButton, Typography, Container } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete.js";
import EditIcon from "@mui/icons-material/Edit.js";
import danse from "../images/danse.jpg";

const Note = () => {
  const [notes, setNotes] = useState([]);
  const [note, setNote] = useState();

  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);

  const noteId = location.pathname.split("/")[2];

  useEffect(() => {
    const getNotes = async () => {
      // console.log("Get notes");
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/notes`, {
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

  const handleDelete = async () => {
    const isConfirmed = window.confirm("Are you sure to delete it?");
    if (isConfirmed) {
      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/delete/${noteId}`, noteId, {
          withCredentials: true,
        });
        navigate("/notes");
      } catch (err) {
        console.log(err);
      }
    }
  };

  const handleEdit = async () => {
    navigate(`/write?edit=${noteId}`, { state: { post: note } });
  };

  const getText = (html) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent;
  };

  useEffect(() => {
    if (notes.length > 0) {
      for (let i = 0; i < notes.length; i++) {
        if (notes[i].id == noteId) {
          setNote(notes[i]);
        }
      }
    }
  }, [notes]);

  if (!note) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {currentUser ? (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              minHeight: "100vh",
              padding: "20px",
              backgroundColor: "#F5F5F5",
              background: `url(${danse})`,
              backgroundRepeat: "no-repeat",
              backgroundAttachment: "fixed",
              backgroundSize: "cover",
              backgroundPosition: "center -200px",
            }}
          >

            <div style={{ maxWidth: "800px", width: "100%" }}>
              <h1
                style={{
                  wordWrap: "break-word",
                  wordBreak: "break-all",
                  whiteSpace: "pre-wrap",
                }}
              >
                {note.title}
              </h1>
              <p
                style={{
                  wordWrap: "break-word",
                  wordBreak: "break-all",
                  whiteSpace: "pre-wrap",
                }}
              >
                {note.description}
              </p>
              <img
                src={note.presigned_url}
                alt=""
                style={{ width: "60%", maxheight: "60%", maxWidth: "80%" }}
              />
              <div>
                <IconButton edge="end" aria-label="delete" onClick={handleEdit}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" aria-label="delete" onClick={handleDelete}>
                  <DeleteIcon />
                </IconButton>
              </div>
            </div>
          </div>
        </>
      ) : (
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
              marginTop: "20px",
            }}
          >
            <Typography variant="h4" color="secondary">
              Please Login
            </Typography>
          </Container>
        </div>)}
    </div>
  );
};

export default Note;
