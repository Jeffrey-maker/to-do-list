import * as React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Route,
  Outlet,
} from "react-router-dom";
import Register from "./pages/register.jsx";
import Login from "./pages/Login.jsx";
import MfaSetup from "./pages/MFA_Setup.jsx";
import MfaVerify from "./pages/MFA_Verify.jsx";

import Note from "./pages/Note.jsx";
import Notes from "./pages/Notes.jsx";

import Write from "./pages/Write.jsx";
import ConfirmUser from "./pages/Confirm_User.jsx";
import Home from "./pages/Home";
import Navbar from "./components/Navbar";

const Layout = () => {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/write",
        element: <Write />,
      },
      {
        path: "/notes",
        element: <Notes />,
      },
      {
        path: "/note/:id",
        element: <Note />,
      },
      {
        path: "/register",
        element: <Register />,
      },
      {
        path: "/login",
        element: <Login />,
      },
    ],
  },
  {
    path: "/mfa-setup",
    element: <MfaSetup />,
  },
  {
    path: "/mfa-verify",
    element: <MfaVerify />,
  },
  {
    path: "/confirm-user",
    element: <ConfirmUser />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
