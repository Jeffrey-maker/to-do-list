import React, { useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "../context/authContext.jsx";
import postimg from "../images/post.jpg";
import { IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import danse from "../images/danse.jpg";

const Note = () => {
  const [notes, setNotes] = useState([]);
  const [note, setNote] = useState();

  const location = useLocation();
  const navigate = useNavigate();

  const noteId = location.pathname.split("/")[2];

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

  const handleDelete = async () => {
    try {
      await axios.post(`http://localhost:8000/delete/${noteId}`, noteId, {
        withCredentials: true,
      });
      navigate("/notes");
    } catch (err) {
      console.log(err);
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
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "20px",
        height: "100vh",
        backgroundColor: "#F5F5F5",
        background: `url(${danse}) no-repeat center center fixed`,
        backgroundSize: "cover",
      }}
    >
      <div style={{ maxWidth: "800px", width: "100%" }}>
        <h1>{note.title}</h1>
        <p>{note.description}</p>
        <img src={postimg} alt="" style={{ width: "800px", height: "400px" }} />
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
  );
};

export default Note;
