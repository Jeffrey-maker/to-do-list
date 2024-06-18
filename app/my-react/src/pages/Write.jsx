import React, { useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import danse from "../images/danse.jpg";

const Write = () => {
  const state = useLocation().state;
  const [value, setValue] = useState(state?.title || "");
  const [title, setTitle] = useState(state?.desc || "");
  const [file, setFile] = useState(null);
  const [cat, setCat] = useState(state?.cat || "");

  const navigate = useNavigate();
  const postId = location.pathname.split("/")[2];

  const upload = async () => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axios.post("http://localhost:8800/api/upload", formData, {
      withCredentials: true,
    });
    return res.data;
  };

  const handleClick = async (e) => {
    e.preventDefault();
    const imgUrl = await upload();

    try {
      state
        ? await axios.put(
            `http://localhost:8000/write`,
            {
              title,
              desc: value,
              cat,
              img: file ? imgUrl : "",
              postId,
            },
            {
              withCredentials: true,
            }
          )
        : await axios.post(
            `http://localhost:8000/write`,
            {
              title,
              desc: value,
              cat,
              img: file ? imgUrl : "",
            },
            {
              withCredentials: true,
            }
          );
      navigate("/");
    } catch (err) {
      console.log(err);
    }
  };

  const getText = (html) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent;
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        height: "100vh",
        background: `url(${danse}) no-repeat center center fixed`,
        backgroundSize: "cover",
      }}
    >
      <div
        style={{
          marginTop: "80px",
          display: "flex",

          padding: "40px",
          width: "1200px",
          gap: "20px",

          //   marginTop: "100px",
          //   backgroundColor: "white",
          //   display: "flex",
          //   justifyContent: "center",
          //   paddingLeft: "200px",
          //   paddingRight: "200px",
          //   gap: "50px",
        }}
      >
        <div
          style={{
            flex: 5,
            display: "flex",
            flexDirection: "column",

            gap: "20px",
          }}
        >
          <input
            type="text"
            value={getText(title)}
            placeholder="Title"
            style={{ padding: "10px", border: "1px solid lightgray" }}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div
            style={{
              height: "300px",
              overflow: "scroll",
              border: "1px solid lightgray",
            }}
          >
            <ReactQuill
              className="editor"
              theme="snow"
              value={value}
              onChange={setValue}
              style={{ height: "100%", border: "none" }}
            />
          </div>
        </div>
        <div
          style={{
            border: "1px solid lightgray",
            paddingLeft: "15px",
            paddingRight: "15px",
            flex: 2,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "40px",
            fontSize: "12px",
            color: "#555",
            height: "367px",
          }}
        >
          <h1 style={{ fontSize: "40px" }}>Publish</h1>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              fontSize: "15px",
            }}
          >
            <span>
              <b>Status:</b> Draft
            </span>
            <span>
              <b>Visibility: </b> Public
            </span>
          </div>
          <input
            style={{ display: "none" }}
            type="file"
            id="file"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <label
            style={{
              textDecoration: "underline",
              cursor: "pointer",
              fontSize: "20px",
            }}
            htmlFor="file"
          >
            Upload Image
          </label>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "20px",
            }}
          >
            <button
              style={{
                cursor: "pointer",
                color: "teal",
                backgroundColor: "white",
                border: "1px solid teal",
                padding: "3px 5px",
                width: "120px",
                fontSize: "16px",
              }}
            >
              Save as a draft
            </button>
            <button
              onClick={handleClick}
              style={{
                cursor: "pointer",
                color: "white",
                backgroundColor: "teal",
                border: "1px solid teal",
                padding: "3px 5px",
                width: "80px",
                fontSize: "16px",
              }}
            >
              Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Write;
