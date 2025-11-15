import axios from "axios";
import Swal from "sweetalert2";
import { IPAdress } from "./IPAdrees";

const api = axios.create({
  baseURL: `${IPAdress}/itelinc/resources`,
});

// Request interceptor (attach token)
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  const userid = sessionStorage.getItem("userid");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  if (userid) {
    config.headers["userid"] = userid;
  }

  // Override for specific endpoints

  // if (config.url?.includes("/auth/login")) {
  //   config.headers["X-Module"] = "Log_in";
  //   config.headers["X-Action"] = "user Login attempt";
  // }

  if (config.url?.includes("/logout")) {
    config.headers["X-Module"] = "log_out";
    config.headers["X-Action"] = "user Logout attempt";
  }

  if (config.url?.includes("/getstatscom")) {
    config.headers["X-Module"] = "Statistics Data";
    config.headers["X-Action"] = "Fetching Incubatees Statistics data ";
  }
  if (config.url?.includes("/getcombyfield")) {
    config.headers["X-Module"] = "Chart Data";
    config.headers["X-Action"] = "Fetching data by Feild of work";
  }

  if (config.url?.includes("/getcombystage")) {
    config.headers["X-Module"] = "Chart Data";
    config.headers["X-Action"] = "Fetching data by company Stage";
  }
  if (config.url?.includes("/getcollecteddocsdash")) {
    config.headers["X-Module"] = "List of Documents";
    config.headers["X-Action"] = "Fetching List of Collected Documents";
  }

  if (config.url?.includes("/getincubatessdash")) {
    config.headers["X-Module"] = "List of Incubatees";
    config.headers["X-Action"] = "Fetching List of  Incubatees";
  }

  //startup/incubatee module
  if (config.url?.includes("/changepassword")) {
    config.headers["X-Module"] = "Change Password";
    config.headers["X-Action"] = "Changing User Password";
  }
  if (config.url?.includes("/getspocs")) {
    config.headers["X-Module"] = "SPOCS";
    config.headers["X-Action"] = "Fetching Incubatee SPOCS Details";
  }

  //chat module
  if (config.url?.includes("/getfileurl")) {
    config.headers["X-Module"] = "Chat Module";
    config.headers["X-Action"] = "Fetching document preview URL";
  }
  if (config.url?.includes("/chat/close`")) {
    config.headers["X-Module"] = "Chat Module";
    config.headers["X-Action"] = "chat close attempt";
  }
  if (config.url?.includes("/getchatlist")) {
    config.headers["X-Module"] = "Chat Module";
    config.headers["X-Action"] = "Fetching chat list";
  }
  if (config.url?.includes("/initiate")) {
    config.headers["X-Module"] = "Chat Module";
    config.headers["X-Action"] = "Creating new chat";
  }
  if (config.url?.includes("/getchatdetails")) {
    config.headers["X-Module"] = "Chat Module";
    config.headers["X-Action"] = "Fetching chat details";
  }
  if (config.url?.includes("/chat/send")) {
    config.headers["X-Module"] = "Chat Module";
    config.headers["X-Action"] = "Sending message in chat";
  }

  return config;
});

// Response interceptor (handle errors globally)
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       // Unauthorized → Show SweetAlert
//       Swal.fire({
//         icon: "error",
//         title: "Session Expired",
//         text: error.response?.data?.message || "Please log in again.",
//         confirmButtonText: "OK",
//       }).then(() => {
//         sessionStorage.clear();
//         window.location.href = "/"; // Redirect only after OK clicked
//       });
//     } else if (error.response?.data?.message) {
//       // Other API errors → show message
//       Swal.fire({
//         // icon: "error",
//         // title: "Error",
//         text: error.response.data.message,
//         confirmButtonText: "OK",
//       });
//     }
//     return Promise.reject(error);
//   }
// );

export default api;
