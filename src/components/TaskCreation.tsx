import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Admin.css";
import API_BASE_URL from "./config";

interface TaskCategory {
  id: number;
  name: string;
}

const TaskCreation: React.FC = () => {
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const [enteredSkills, setEnteredSkills] = useState<string[]>([]);
  const [skillsInput, setSkillsInput] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    status: "Pending",
    priority: "Medium",
    remarks: "",
    neededPersons: 1,
    categoryId: "",
  });
  const [locationData, setLocationData] = useState({
    streetAddress: "",
    postalCode: "",
    addressLocality: "",
    addressRegion: "",
    addressCountry: "",
    latitude: "",
    longitude: "",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/task-categories`);
        setCategories(response.data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.categoryId) {
      setError("Please select a category");
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/tasks`, {
        ...formData,
        skills: enteredSkills,
        location: locationData,
        neededPersons: Number(formData.neededPersons),
        categoryId: Number(formData.categoryId),
      });

      setLocationData({
        streetAddress: "",
        postalCode: "",
        addressLocality: "",
        addressRegion: "",
        addressCountry: "",
        latitude: "",
        longitude: "",
      });

      setFormData({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        status: "Pending",
        priority: "Medium",
        remarks: "",
        neededPersons: 1,
        categoryId: "",
      });
      setEnteredSkills([]); // Skills zurücksetzen
      setError("");
    } catch (err) {
      console.error("Error creating task:", err);
      setError("Failed to create task");
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

  return (
    <div className="task-creation mt-4 p-4 border rounded">
      <div className="">
        <h2>Create New Task</h2>
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Task Name</label>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              className="form-control"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
            />
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  required
                />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-4">
              <div className="form-group">
                <label>Status</label>
                <select
                  className="form-control"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  <option>Pending</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                </select>
              </div>
            </div>
            <div className="col-md-4">
              <div className="form-group">
                <label>Priority</label>
                <select
                  className="form-control"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
            </div>
            <div className="col-md-4">
              <div className="form-group">
                <label>People Needed</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  value={formData.neededPersons}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      neededPersons: Number(e.target.value),
                    })
                  }
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Remarks</label>
            <textarea
              className="form-control"
              value={formData.remarks}
              onChange={(e) =>
                setFormData({ ...formData, remarks: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              className="form-control"
              value={formData.categoryId}
              onChange={(e) =>
                setFormData({ ...formData, categoryId: e.target.value })
              }
              required
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group position-relative">
            <label>Required Skills</label>

            {enteredSkills.length > 0 && (
              <div className="skill-chips mt-2">
                {enteredSkills.map((skill, index) => (
                  <span key={index} className="skill-chip">
                    {skill}
                    <span
                      className="remove-skill"
                      onClick={() => handleSkillRemove(skill)}
                    >
                      &times;
                    </span>
                  </span>
                ))}
              </div>
            )}

            <input
              type="text"
              className="form-control"
              placeholder="Add required skills"
              value={skillsInput}
              onChange={handleSkillsInput}
              onKeyDown={handleSkillAdd}
            />

            {skillSuggestions.length > 0 && (
              <div className="suggestion-list">
                {skillSuggestions.map((skill, index) => (
                  <div
                    key={index}
                    className="suggestion-item"
                    onClick={() => handleSkillSelect(skill)}
                  >
                    {skill}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Location Details</label>
            <div className="row">
              <div className="col-md-6">
                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Street Address"
                  value={locationData.streetAddress}
                  onChange={(e) =>
                    setLocationData({
                      ...locationData,
                      streetAddress: e.target.value,
                    })
                  }
                  required
                />
                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Postal Code"
                  value={locationData.postalCode}
                  onChange={(e) =>
                    setLocationData({
                      ...locationData,
                      postalCode: e.target.value,
                    })
                  }
                  required
                />
                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="City"
                  value={locationData.addressLocality}
                  onChange={(e) =>
                    setLocationData({
                      ...locationData,
                      addressLocality: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="col-md-6">
                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Region"
                  value={locationData.addressRegion}
                  onChange={(e) =>
                    setLocationData({
                      ...locationData,
                      addressRegion: e.target.value,
                    })
                  }
                />
                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Country"
                  value={locationData.addressCountry}
                  onChange={(e) =>
                    setLocationData({
                      ...locationData,
                      addressCountry: e.target.value,
                    })
                  }
                  required
                />
                <div className="row">
                  <div className="col">
                    <input
                      type="number"
                      step="any"
                      className="form-control"
                      placeholder="Latitude"
                      value={locationData.latitude}
                      onChange={(e) =>
                        setLocationData({
                          ...locationData,
                          latitude: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="col">
                    <input
                      type="number"
                      step="any"
                      className="form-control"
                      placeholder="Longitude"
                      value={locationData.longitude}
                      onChange={(e) =>
                        setLocationData({
                          ...locationData,
                          longitude: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-center mt-4">
            <button type="button" className="btn btn-secondary mx-2">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary mx-2">
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskCreation;
