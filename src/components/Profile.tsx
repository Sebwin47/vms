import { useState, useEffect } from "react";
import axios from "axios";
import { Form, Button, Container } from "react-bootstrap";
import API_BASE_URL from "./config";

interface AvailabilitySlot {
  start: string;
  end: string;
}

interface ProfileData {
  givenName: string;
  familyName: string;
  email: string;
  gender: string;
  telephone: string;
  availability: AvailabilitySlot[];
  locationAvailability: string[];
  streak: number;
}

function Profile() {
  const [formData, setFormData] = useState<ProfileData>({
    givenName: "",
    familyName: "",
    email: "",
    gender: "",
    telephone: "",
    availability: [],
    locationAvailability: [],
    streak: 0,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newLocation, setNewLocation] = useState("");
  const [enteredSkills, setEnteredSkills] = useState<string[]>([]);
  const [skillsInput, setSkillsInput] = useState("");
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);

  const fetchProfile = async () => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await axios.get(`${API_BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const profileData = {
        ...response.data.user,
        availability: response.data.user.availability || "[]",
        locationAvailability: response.data.user.locationAvailability || "[]",
      };

      setFormData(profileData);
    } catch (err) {
      setError(
        "Error loading profile: " + (err.response?.data?.message || err.message)
      );
    }
  };

  const fetchUserSkills = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/user-skills`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEnteredSkills(response.data.skills);
    } catch (error) {
      console.error("Error fetching user skills:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchProfile();
      await fetchUserSkills();
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvailabilityChange = (
    index: number,
    field: "start" | "end",
    value: string
  ) => {
    const updatedAvailability = [...formData.availability];
    updatedAvailability[index] = {
      ...updatedAvailability[index],
      [field]: value,
    };
    setFormData((prev) => ({ ...prev, availability: updatedAvailability }));
  };

  const addAvailabilitySlot = () => {
    setFormData((prev) => ({
      ...prev,
      availability: [...prev.availability, { start: "", end: "" }],
    }));
  };

  const removeAvailabilitySlot = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      availability: prev.availability.filter((_, i) => i !== index),
    }));
  };

  const handleLocationAdd = () => {
    if (newLocation.trim()) {
      setFormData((prev) => ({
        ...prev,
        locationAvailability: [
          ...prev.locationAvailability,
          newLocation.trim(),
        ],
      }));
      setNewLocation("");
    }
  };

  const handleLocationRemove = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      locationAvailability: prev.locationAvailability.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("authToken");
      const dataToSend = {
        ...formData,
        skills: enteredSkills,
        availability: formData.availability,
        locationAvailability: formData.locationAvailability,
      };

      await axios.put(`${API_BASE_URL}/profile`, dataToSend, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      alert(
        "Error saving profile: " + (err.response?.data?.message || err.message)
      );
    }
  };

  const handleSkillsInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSkillsInput(query);

    if (query.length > 1) {
      try {
        const response = await axios.get(`${API_BASE_URL}/skills`, {
          params: { query },
        });
        setSkillSuggestions(response.data.skills);
      } catch (error) {
        console.error("Error fetching skills:", error);
        setSkillSuggestions([]);
      }
    } else {
      setSkillSuggestions([]);
    }
  };

  const handleSkillAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && skillsInput.trim() !== "") {
      e.preventDefault();
      const newSkill = skillsInput.trim();
      if (!enteredSkills.includes(newSkill)) {
        setEnteredSkills([...enteredSkills, newSkill]);
        setSkillsInput("");
      }
    }
  };

  const handleSkillAddButton = () => {
    if (skillsInput.trim() !== "") {
      const newSkill = skillsInput.trim();
      if (!enteredSkills.includes(newSkill)) {
        setEnteredSkills([...enteredSkills, newSkill]);
        setSkillsInput("");
      }
    }
  };

  const handleSkillSelect = (skill: string) => {
    if (!enteredSkills.includes(skill)) {
      setEnteredSkills([...enteredSkills, skill]);
    }
    setSkillsInput("");
    setSkillSuggestions([]);
  };

  const handleSkillRemove = (skill: string) => {
    setEnteredSkills(enteredSkills.filter((s) => s !== skill));
  };

  if (error) return <div>Error: {error}</div>;

  return (
    <Container>
      <h1 className="mb-4 text-center">Profile</h1>

      <Form className="profile-form">
        <Form.Group className="mb-3">
          <Form.Label>First Name</Form.Label>
          <Form.Control
            type="text"
            name="givenName"
            value={formData.givenName}
            onChange={handleChange}
            placeholder="Enter your first name"
            disabled={!isEditing}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Last Name</Form.Label>
          <Form.Control
            type="text"
            name="familyName"
            value={formData.familyName}
            onChange={handleChange}
            placeholder="Enter your last name"
            disabled={!isEditing}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            disabled={!isEditing}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Gender</Form.Label>
          <Form.Control
            as="select"
            className="form-select form-select-lg"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            disabled={!isEditing}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Non">Prefer not to say</option>
          </Form.Control>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Phone</Form.Label>
          <Form.Control
            type="text"
            name="telephone"
            value={formData.telephone}
            onChange={handleChange}
            placeholder="Enter your phone number"
            disabled={!isEditing}
          />
        </Form.Group>

        <Form.Group className="mb-4">
          <Form.Label>Availability</Form.Label>
          {formData.availability.map((slot, index) => (
            <div key={index} className="profile-availability-slot mb-2">
              <div className="row g-2">
                <div className="col-md-5">
                  <Form.Control
                    type="datetime-local"
                    value={slot.start}
                    onChange={(e) =>
                      handleAvailabilityChange(index, "start", e.target.value)
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div className="col-md-5">
                  <Form.Control
                    type="datetime-local"
                    value={slot.end}
                    onChange={(e) =>
                      handleAvailabilityChange(index, "end", e.target.value)
                    }
                    disabled={!isEditing}
                  />
                </div>
                {isEditing && (
                  <div className="col-md-2">
                    <Button
                      variant="danger"
                      onClick={() => removeAvailabilitySlot(index)}
                      className="w-100"
                    >
                      x
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isEditing && (
            <Button variant="outline-primary" onClick={addAvailabilitySlot}>
              Add Time Slot
            </Button>
          )}
        </Form.Group>

        <Form.Group className="mb-4 position-relative">
          <Form.Label>Skills</Form.Label>
          <div className="skill-chips">
            {enteredSkills.map((skill, index) => (
              <div key={index} className="skill-chip">
                {skill}
                {isEditing && (
                  <span
                    className="remove-skill"
                    onClick={() => handleSkillRemove(skill)}
                  >
                    &times;
                  </span>
                )}
              </div>
            ))}
          </div>
          {isEditing && (
            <div className="d-flex gap-2 mt-2">
              <Form.Control
                type="text"
                value={skillsInput}
                onChange={handleSkillsInput}
                onKeyDown={handleSkillAdd}
                placeholder="Add new skill"
              />
              <Button variant="primary" onClick={handleSkillAddButton}>
                Add
              </Button>
            </div>
          )}
          {skillSuggestions.length > 0 && (
            <ul className="suggestion-list">
              {skillSuggestions.map((skill, index) => (
                <li
                  key={index}
                  onClick={() => handleSkillSelect(skill)}
                  className="suggestion-item"
                >
                  {skill}
                </li>
              ))}
            </ul>
          )}
        </Form.Group>

        <Form.Group className="mb-4">
          <Form.Label>Location Availability</Form.Label>
          <div className="locality-chips">
            {formData.locationAvailability.map((locality, index) => (
              <div key={index} className="locality-chip">
                {locality}
                {isEditing && (
                  <span
                    className="remove-locality"
                    onClick={() => handleLocationRemove(index)}
                  >
                    &times;
                  </span>
                )}
              </div>
            ))}
          </div>
          {isEditing && (
            <div className="d-flex gap-2 mt-2">
              <Form.Control
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Add new location"
              />
              <Button variant="primary" onClick={handleLocationAdd}>
                Add
              </Button>
            </div>
          )}
        </Form.Group>

        <div className="text-center">
          {isEditing ? (
            <Button variant="primary" onClick={handleSave}>
              Save Changes
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </div>
      </Form>
    </Container>
  );
}

export default Profile;
