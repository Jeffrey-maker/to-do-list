import axios from "axios";
import { Children, createContext, useEffect, useState } from "react";
import React from "react";

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const login = async (inputs) => {
    // const res = await axios.post(
    //   "http://localhost:8800/api/auth/login",
    //   inputs,
    //   {
    //     withCredentials: true,
    //   }
    // );
    setCurrentUser(inputs);
  };
  const logout = async (inputs) => {
    // await axios.post(
    //   "http://localhost:8800/api/auth/logout",
    //   {},
    //   {
    //     withCredentials: true,
    //   }
    // );
    setCurrentUser(null);
  };

  useEffect(() => {
    localStorage.setItem("user", JSON.stringify(currentUser));
    console.log("Change user to:", currentUser);
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
