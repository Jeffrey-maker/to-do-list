import React, { useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "../context/authContext.jsx";
import postimg from "../images/post.jpg";
import { IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

const Single = () => {
  const [post, setPost] = useState({});

  const location = useLocation();
  const navigate = useNavigate();

  const postId = location.pathname.split("/")[2];

  const { currentUser } = useContext(AuthContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8800/api/posts/${postId}`,
          {
            withCredentials: true,
          }
        );
        setPost(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchData();
  }, [postId]);

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:8800/api/posts/${postId}`, {
        withCredentials: true,
      });
      navigate("/");
    } catch (err) {
      console.log(err);
    }
  };

  const handleEdit = async () => {
    navigate(`/write?edit=${postId}`, { state: { post } });
  };

  const getText = (html) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent;
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <div style={{ maxWidth: "800px", width: "100%" }}>
        <h1>Learn React</h1>
        <p>
          How to create and nest components? How to add markup and styles? How
          to display data? How to render conditions and lists? How to respond to
          events and update the screen?
        </p>
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

export default Single;
