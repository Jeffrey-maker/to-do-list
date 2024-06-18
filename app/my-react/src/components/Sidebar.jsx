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
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          top: "60px", // 调整以匹配 Navbar 的高度
          height: "calc(100% - 60px)", // 确保 Drawer 填满剩余高度
          backgroundColor: "#F5F5F5",
          borderRight: "10px solid #e8e9f1",
          position: "fixed", // 确保 Drawer 固定
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
  );
};

export default Sidebar;
