import {
  MDBBtn,
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardBody,
  MDBInput,
} from "mdb-react-ui-kit";

import API_BASE_URL from "./config";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.setItem("authToken", result.token);
        alert("Login successful!");
        navigate("/tasks");
      } else {
        alert(`Login failed: ${result.message}`);
      }
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  return (
    <form className="login">
      <MDBContainer fluid>
        <MDBRow className="d-flex h-100">
          <MDBCol col="12">
            <MDBCard
              className="bg-dark text-white my-5 mx-auto"
              style={{ borderRadius: "1rem", maxWidth: "400px" }}
            >
              <MDBCardBody
                className="p-5 d-flex flex-column align-items-center mx-auto w-100"
                onSubmit={handleLogin}
              >
                <h2 className="fw-bold mb-2 text-uppercase">Login</h2>
                <p className="text-white-50 mb-4">
                  Please enter your login and password!
                </p>

                <MDBInput
                  wrapperClass="mb-4 mx-5 w-100"
                  labelClass="text-white"
                  label="Email address"
                  id="formControlLg"
                  type="email"
                  size="lg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ color: "white" }}
                />
                <MDBInput
                  wrapperClass="mb-4 mx-5 w-100"
                  labelClass="text-white"
                  label="Password"
                  id="formControlLg"
                  type="password"
                  size="lg"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ color: "white" }}
                />

                <MDBBtn
                  outline
                  className="mx-2 px-5 general"
                  color="white"
                  size="lg"
                  onClick={handleLogin}
                  type="submit"
                >
                  Login
                </MDBBtn>

                <div>
                  <p className="mt-2">
                    Don't have an account?{" "}
                    <a
                      onClick={() => navigate("/signup")}
                      className="text-white-50 fw-bold"
                      style={{ cursor: "pointer" }}
                    >
                      Sign Up
                    </a>
                  </p>
                </div>
              </MDBCardBody>
            </MDBCard>
          </MDBCol>
        </MDBRow>
      </MDBContainer>
    </form>
  );
}

export default Login;
