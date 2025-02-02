import {
  MDBBtn,
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardBody,
  MDBInput,
} from "mdb-react-ui-kit";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "./config";

function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    givenName: "",
    familyName: "",
    email: "",
    gender: "",
    telephone: "",
    password: "",
  });

  const genderOptions = [
    { text: "Select Gender", value: "" },
    { text: "Male", value: "Male" },
    { text: "Female", value: "Female" },
    { text: "Other", value: "Other" },
    { text: "Prefer not to say", value: "Non" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleGenderChange = (selectedGender) => {
    setFormData({ ...formData, gender: selectedGender });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        alert("Sign-Up Successful! Redirecting to login...");
        navigate("/login");
      } else {
        alert(`Sign-Up Failed: ${result.message}`);
      }
    } catch (error) {
      console.error("Error during sign-up:", error);
      alert("An error occurred during sign-up. Please try again.");
    }
  };

  return (
    <div className="signup">
      <MDBContainer fluid>
        <MDBRow className="d-flex justify-content-center align-items-center h-100">
          <MDBCol col="12">
            <MDBCard
              className="bg-dark text-white my-5 mx-auto"
              style={{ borderRadius: "1rem", maxWidth: "600px" }}
            >
              <MDBCardBody className="p-5 d-flex flex-column align-items-center mx-auto w-100">
                <h2 className="fw-bold mb-4 text-uppercase">Sign Up</h2>
                <p className="text-white-50 mb-4">Create your account!</p>

                <form onSubmit={handleSubmit} style={{ width: "100%" }}>
                  <MDBRow className="mb-4">
                    <MDBCol md="6">
                      <MDBInput
                        label="First Name"
                        name="givenName"
                        type="text"
                        size="lg"
                        value={formData.givenName}
                        onChange={handleChange}
                        labelClass="text-white"
                        style={{ color: "white" }}
                        required
                      />
                    </MDBCol>
                    <MDBCol md="6">
                      <MDBInput
                        label="Last Name"
                        name="familyName"
                        type="text"
                        size="lg"
                        value={formData.familyName}
                        onChange={handleChange}
                        labelClass="text-white"
                        style={{ color: "white" }}
                        required
                      />
                    </MDBCol>
                  </MDBRow>

                  <MDBRow className="mb-4">
                    <MDBCol md="6">
                      <MDBInput
                        label="Email Address"
                        name="email"
                        type="email"
                        size="lg"
                        value={formData.email}
                        onChange={handleChange}
                        labelClass="text-white"
                        style={{ color: "white" }}
                        required
                      />
                    </MDBCol>
                    <MDBCol md="6">
                      <select
                        className="form-select form-select-lg"
                        value={formData.gender}
                        onChange={(e) => handleGenderChange(e.target.value)}
                        style={{ backgroundColor: "#333", color: "white" }}
                        required
                      >
                        {genderOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.text}
                          </option>
                        ))}
                      </select>
                    </MDBCol>
                  </MDBRow>

                  <MDBRow className="mb-4">
                    <MDBCol md="6">
                      <MDBInput
                        label="Phone Number"
                        name="telephone"
                        type="tel"
                        size="lg"
                        value={formData.telephone}
                        onChange={handleChange}
                        labelClass="text-white"
                        style={{ color: "white" }}
                      />
                    </MDBCol>
                    <MDBCol md="6">
                      <MDBInput
                        label="Password"
                        name="password"
                        type="password"
                        size="lg"
                        value={formData.password}
                        onChange={handleChange}
                        labelClass="text-white"
                        style={{ color: "white" }}
                        required
                      />
                    </MDBCol>
                  </MDBRow>

                  <div className="d-flex justify-content-center">
                    <MDBBtn
                      outline
                      className="px-5 general"
                      color="white"
                      size="lg"
                      type="submit"
                    >
                      Sign Up
                    </MDBBtn>
                  </div>
                </form>

                <div>
                  <p className="mt-2">
                    Already have an account?{" "}
                    <a
                      className="text-white-50 fw-bold"
                      onClick={() => navigate("/login")}
                      style={{ cursor: "pointer" }}
                    >
                      Login
                    </a>
                  </p>
                </div>
              </MDBCardBody>
            </MDBCard>
          </MDBCol>
        </MDBRow>
      </MDBContainer>
    </div>
  );
}

export default SignUp;
