import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import "./App.css";
import Navbar from "./Components/Navbar";
import DocumentTable from "./Components/DocumentTable";
import StartupDashboard from "./Components/StartupDashboard/StartupDashboard";
import LoginForm from "./Components/Login/LoginForm";
import ProtectedRoute from "./Components/ProtectedRoute";
import { DataProvider } from "./Components/Datafetching/DataProvider";
import DocumentManagementPage from "./Components/DocumentUpload/DocumentManagementPage";
import UserManagementPage from "./Components/UsersAdd/UserManagementPage";
import UserAssociation from "./Components/UserAssociation/UserAssociation";
import { InactivityHandler } from "./Components/Datafetching/InactivityHandler";
import ChatHistory from "./Components/ChatApp/ChatHistory";
import ChatApp from "./Components/ChatApp/ChatApp";

function App() {
  return (
    <BrowserRouter>
      <DataProvider>
        <InactivityHandler>
          <Routes>
            <Route path="/" element={<LoginForm />} />
            <Route
              path="/Incubation/Dashboard"
              element={
                <ProtectedRoute allowedRoles={[1, 3, 7]}>
                  <Navbar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/startup/Dashboard"
              element={
                <ProtectedRoute allowedRoles={[1, 3, 4, 7]}>
                  <StartupDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/Incubation/Dashboard/AddDocuments"
              element={
                <ProtectedRoute>
                  <DocumentManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/Incubation/Dashboard/Usermanagement"
              element={
                <ProtectedRoute>
                  <UserManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/Incubation/Dashboard/Userassociation"
              element={
                <ProtectedRoute>
                  <UserAssociation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/Incubation/Dashboard/Chats"
              element={
                <ProtectedRoute>
                  <ChatApp />
                </ProtectedRoute>
              }
            />
            <Route
              path="/Incubation/Dashboard/ChatHistory"
              element={
                <ProtectedRoute>
                  <ChatHistory />
                </ProtectedRoute>
              }
            />
          </Routes>
        </InactivityHandler>
      </DataProvider>
    </BrowserRouter>
  );
}

export default App;
