import TaskTable from "./components/TaskTable";
import Login from "./components/Login";
import Profile from "./components/Profile";
import "./App.css";
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { Navbar, Nav, Dropdown, Container } from "react-bootstrap";
import { FaUserCircle } from "react-icons/fa";
import SignUp from "./components/Signup";
import Admin from "./components/Admin";

import { jwtDecode } from "jwt-decode";
import Statistics from "./components/Stats";
import CheckInOut from "./components/CheckInOut";
import GraphExplorer from "./components/GraphExplorer";

function getAuthInfo() {
  const token = localStorage.getItem("authToken");
  if (!token) return { isValid: false, role: null };

  try {
    const decoded: any = jwtDecode(token);
    const now = Date.now() / 1000;
    return {
      isValid: decoded.exp > now,
      role: decoded.role,
      email: decoded.email,
    };
  } catch (error) {
    return { isValid: false, role: null };
  }
}

function PrivateRoute({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: string;
}) {
  const { isValid, role } = getAuthInfo();

  if (!isValid) {
    return <Navigate to="/login" />;
  }

  if (requiredRole == "volunteer" && role !== "volunteer") {
    return <Navigate to="/admin" />;
  }

  if (requiredRole == "coordinator" && role !== "coordinator") {
    return <Navigate to="/tasks" />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/signup" element={<SignUp />} />

        <Route
          path="/tasks"
          element={
            <PrivateRoute>
              <PageLayout content={<TaskTable />} />
            </PrivateRoute>
          }
        />

        <Route
          path="/stats"
          element={
            <PrivateRoute requiredRole="volunteer">
              <PageLayout content={<Statistics />} />
            </PrivateRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <PrivateRoute requiredRole="volunteer">
              <PageLayout content={<Profile />} />
            </PrivateRoute>
          }
        />

        <Route
          path="/checkinout"
          element={
            <PrivateRoute requiredRole="volunteer">
              <PageLayout content={<CheckInOut />} />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <PrivateRoute requiredRole="coordinator">
              <PageLayout content={<Admin />} />
            </PrivateRoute>
          }
        />

        <Route
          path="/explore"
          element={
            <PrivateRoute requiredRole="volunteer">
              <PageLayout content={<GraphExplorer />} />
            </PrivateRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

function PageLayout({ content }: { content: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <div className="App d-flex flex-column min-vh-100">
      {/* Header */}
      <header className="bg-dark py-1">
        <Navbar expand="lg" className="bg-dark general text-white">
          <Container>
            <Navbar.Brand
              className="text-white"
              onClick={() => navigate("/tasks")}
              style={{ cursor: "pointer" }}
            >
              Task Management System
            </Navbar.Brand>
            <Nav className="ms-auto">
              <ProfileDropdown />
            </Nav>
          </Container>
        </Navbar>
      </header>

      {/* Main */}
      <main className="container mt-4 flex-grow-1">{content}</main>

      {/* Footer */}
      <footer className="text-center bg-light py-2">
        <p>&copy; {new Date().getFullYear()} Task Management System</p>
      </footer>
    </div>
  );
}

function ProfileDropdown() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("authToken");
  const [userRole, setUserRole] = useState("volunteer");

  useEffect(() => {
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setUserRole(decoded.role);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, [token]);

  return (
    <Dropdown align="end">
      <Dropdown.Toggle
        id="profile-dropdown"
        className="bg-transparent border-0 p-0"
        style={{ borderRadius: "50%", width: "40px", height: "40px" }}
      >
        <FaUserCircle size={32} color="white" />
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {userRole === "volunteer" && (
          <>
            <Dropdown.Item onClick={() => navigate("/profile")}>
              Manage Profile
            </Dropdown.Item>
            <Dropdown.Item onClick={() => navigate("/stats")}>
              Statistics
            </Dropdown.Item>
            <Dropdown.Item onClick={() => navigate("/checkinout")}>
              Check In/Out
            </Dropdown.Item>
            <Dropdown.Item onClick={() => navigate("/explore")}>
              Graph Explorer
            </Dropdown.Item>
          </>
        )}

        {userRole === "coordinator" ? (
          location.pathname === "/admin" ? (
            <Dropdown.Item onClick={() => navigate("/tasks")}>
              User Panel
            </Dropdown.Item>
          ) : (
            <Dropdown.Item onClick={() => navigate("/admin")}>
              Admin Panel
            </Dropdown.Item>
          )
        ) : (
          <Dropdown.Divider className="thick-divider" />
        )}

        <Dropdown.Item
          onClick={() => {
            localStorage.removeItem("authToken");
            navigate("/login");
          }}
        >
          Logout
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default App;
