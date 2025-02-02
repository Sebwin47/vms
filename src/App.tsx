import TaskTable from "./components/TaskTable";
import Login from "./components/Login";
import Profile from "./components/Profile";
import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { Navbar, Nav, Dropdown, Container } from "react-bootstrap";
import { FaUserCircle } from "react-icons/fa";
import SignUp from "./components/Signup";
import Admin from "./components/Admin";

import { jwtDecode } from "jwt-decode";
import Statistics from "./components/Stats";
import CheckInOut from "./components/CheckInOut";

function isTokenValid() {
  const token = localStorage.getItem("authToken");
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    const now = Date.now() / 1000;
    return decoded.exp > now;
  } catch (error) {
    return false;
  }
}

function PrivateRoute({ children }) {
  const isAuthenticated = isTokenValid();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
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
            <PrivateRoute>
              <PageLayout content={<Statistics />} />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <PageLayout content={<Admin />} />
            </PrivateRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <PageLayout content={<Profile />} />
            </PrivateRoute>
          }
        />

        <Route
          path="/checkinout"
          element={
            <PrivateRoute>
              <PageLayout content={<CheckInOut />} />
            </PrivateRoute>
          }
        />

        {/* Fallback: Leite auf die Login-Seite um */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

function PageLayout({ content }) {
  const navigate = useNavigate();

  return (
    <div className="App d-flex flex-column min-vh-100">
      {/* Kopfzeile */}
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

      {/* Hauptinhalt */}
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
        <Dropdown.Item onClick={() => navigate("/profile")}>
          Manage Profile
        </Dropdown.Item>
        <Dropdown.Item onClick={() => navigate("/stats")}>
          Statistics
        </Dropdown.Item>
        <Dropdown.Item onClick={() => navigate("/checkinout")}>
          CheckInOut
        </Dropdown.Item>
        <Dropdown.Divider />
        <Dropdown.Item onClick={() => navigate("/admin")}>
          Admin Panel
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => {
            localStorage.removeItem("authToken"); // Clear the token
            navigate("/login"); // Redirect to login page
          }}
        >
          Logout
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default App;
