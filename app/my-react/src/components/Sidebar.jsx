import * as React from "react";
import { Link } from "react-router-dom";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import HomeIcon from "@mui/icons-material/Home";
import WorkIcon from "@mui/icons-material/Work";
import NoteIcon from "@mui/icons-material/Note";
import flower from "../images/flower.jpg";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";

const drawerWidth = 240;

const Sidebar = () => {
  return (
    <div
      style={{ borderRight: "10px solid #e8e9f1", backgroundColor: "#F5F5F5" }}
    >
      <div style={{ borderRadius: "30%" }}>
        <Drawer
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            zIndex: 900,
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              boxShadow: "none",
              top: "65px",
              backgroundColor: "#F5F5F5",
              borderColor: "#F5F5F5",
            },
          }}
          variant="permanent"
          anchor="left"
        >
          <List>
            <ListItem button component={Link} to="/">
              <ListItemIcon>
                <HomeIcon />
              </ListItemIcon>
              <ListItemText primary="Home" />
            </ListItem>

            <ListItem button component={Link} to="/notes">
              <ListItemIcon>
                <NoteIcon />
              </ListItemIcon>
              <ListItemText primary="ToDoList" />
            </ListItem>
            <ListItem button component={Link} to="/notes">
              <ListItemIcon>
                <NotificationsNoneIcon />
              </ListItemIcon>
              <ListItemText primary="Inbox" />
            </ListItem>

            <img
              src={flower}
              style={{ width: "180px", position: "fixed", bottom: 0, left: 0 }}
            ></img>
          </List>
        </Drawer>
      </div>
    </div>
  );
};

export default Sidebar;
