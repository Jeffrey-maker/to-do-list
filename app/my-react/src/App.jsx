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

// import Write from "./pages/Write";
// import Home from "./pages/Home";
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
      // {
      //   path: "/",
      //   element: <Home />,
      // },
      // {
      //   path: "/write",
      //   element: <Write />,
      // },
      {
        path: "/register",
        element: <Register />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/mfa-setup",
        element: <MfaSetup/>,
      },
      {
        path: "/mfa-verify",
        element: <MfaVerify />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
