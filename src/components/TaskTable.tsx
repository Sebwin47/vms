import React, { useState, useEffect } from "react";
import axios from "axios";
import "./TaskTable.css";
import { FaFilter, FaUndo } from "react-icons/fa";
import { ProgressBar } from "react-bootstrap";

import API_BASE_URL from "./config";

const TaskTable: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [sortField, setSortField] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    status: "Pending",
  });
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const [enteredLocalities, setEnteredLocalities] = useState<string[]>([]);
  const [localityInput, setLocalityInput] = useState<string>("");
  const [enteredSkills, setEnteredSkills] = useState<string[]>([]);
  const [skillsInput, setSkillsInput] = useState<string>("");
  const [placeDetails, setPlaceDetails] = useState<any | null>(null);
  const [showPlacePopup, setShowPlacePopup] = useState<boolean>(false);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("authToken");

      const response = await axios.get(`${API_BASE_URL}/tasks`, {
        params: {
          locality: enteredLocalities.join(","),
          skills: enteredSkills.join(","),
          startDate: filters.startDate,
          endDate: filters.endDate,
          status: filters.status,
          token: token,
        },
      });

      setTasks(response.data.tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
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

  const fetchUserLocs = async () => {
    const token = localStorage.getItem("authToken");

    if (!token) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/user-locs`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setEnteredLocalities(response.data.locs);
    } catch (error) {
      console.error("Error fetching user skills:", error);
    }
  };

  const fetchDetails = async (type: "place", id: string) => {
    try {
      let endpoint = "";
      if (type === "place") {
        endpoint = `${API_BASE_URL}/place/${id}`;
      }

      const response = await axios.get(endpoint);

      if (type === "place") {
        setPlaceDetails(response.data);
        setShowPlacePopup(true);
      }
    } catch (error) {
      console.error(`Error fetching ${type} details:`, error);
    }
  };

  const resetFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      status: "",
    });
    setEnteredLocalities([]);
    setEnteredSkills([]);
    setLocalityInput("");
    setSkillsInput("");
    setSkillSuggestions([]);
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchUserSkills();
      await fetchUserLocs();
    };
    fetchData();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [enteredSkills, filters, enteredLocalities]);

  const [showFilters, setShowFilters] = useState(false);

  const handleSort = (field: string) => {
    const order = sortField === field && sortOrder === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortOrder(order);
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a[sortField] < b[sortField]) return sortOrder === "asc" ? -1 : 1;
    if (a[sortField] > b[sortField]) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const getSortArrow = (field: string) => {
    if (sortField === field) {
      return sortOrder === "asc" ? "▲" : "▼";
    }
    return "";
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    field: string
  ) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [field]: e.target.value,
    }));
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

  const handleLocalityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalityInput(e.target.value);
  };

  const handleLocalityAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && localityInput.trim() !== "") {
      const newLocality = localityInput.trim();

      if (!enteredLocalities.includes(newLocality)) {
        setEnteredLocalities([...enteredLocalities, newLocality]);
        setLocalityInput("");
      }
    }
  };

  const handleLocalityRemove = (locality: string) => {
    const updatedLocalities = enteredLocalities.filter(
      (loc) => loc !== locality
    );
    setEnteredLocalities(updatedLocalities);
  };

  const progressPercentage = (
    neededPersons: number,
    assignedPersons: number
  ) => {
    return Math.min((assignedPersons / neededPersons) * 100, 100);
  };

  const assignToTask = async (tid: string) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.post(
        `${API_BASE_URL}/assign-volunteer`,
        { tid },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        fetchTasks();
      }
    } catch (error) {
      console.error("Error assigning volunteer to task:", error);
      alert("Error assigning volunteer to task");
    }
  };

  const removeVolunteerFromTask = async (tid: string) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.post(
        `${API_BASE_URL}/remove-volunteer`,
        { tid },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        fetchTasks();
      }
    } catch (error) {
      console.error("Error removing volunteer from task:", error);
      alert("Error removing volunteer from task");
    }
  };

  return (
    <div className="p-4 d-flex flex-column align-items-center">
      <div className="mb-2">
        <div className="row gy-2">
          {/* Start Date Row */}
          <div className="col-12">
            <label className="form-label mb-0">Start Date</label>
            <input
              type="date"
              className="form-control form-control-sm"
              placeholder="Start Date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange(e, "startDate")}
            />
          </div>

          {/* End Date Row */}
          <div className="col-12">
            <label className="form-label mb-0">End Date</label>
            <input
              type="date"
              className="form-control form-control-sm"
              placeholder="End Date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange(e, "endDate")}
            />
          </div>

          {/* Buttons Row */}
          <div className="col-12 d-flex gap-2">
            <button
              type="button"
              className="btn btn-primary w-100 w-md-auto"
              onClick={fetchTasks}
            >
              Search
            </button>
            <button
              className="btn btn-secondary w-100 w-md-auto"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter /> Filter
            </button>
            <button
              className="btn btn-outline-secondary w-100 w-md-auto"
              onClick={resetFilters}
            >
              <FaUndo /> Reset Filters
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="filter-container mb-4">
          <div className="mb-3">
            <label className="form-label">Locality</label>

            {enteredLocalities.length > 0 && (
              <div className="locality-chips">
                {enteredLocalities.map((locality, index) => (
                  <div key={index} className="locality-chip">
                    {locality}
                    <span
                      className="remove-locality"
                      onClick={() => handleLocalityRemove(locality)}
                    >
                      &times;
                    </span>
                  </div>
                ))}
              </div>
            )}

            <input
              type="text"
              className="form-control"
              placeholder="Enter Locality and press Enter"
              value={localityInput}
              onChange={handleLocalityInput}
              onKeyDown={handleLocalityAdd}
            />
          </div>

          <div className="mb-3 position-relative">
            <label className="form-label">Skills</label>

            {enteredSkills.length > 0 && (
              <div className="skill-chips">
                {enteredSkills.map((skill, index) => (
                  <div key={index} className="skill-chip">
                    {skill}
                    <span
                      className="remove-skill"
                      onClick={() => handleSkillRemove(skill)}
                    >
                      &times;
                    </span>
                  </div>
                ))}
              </div>
            )}

            <input
              type="text"
              className="form-control"
              placeholder="Enter Skill and press Enter"
              value={skillsInput}
              onChange={handleSkillsInput}
              onKeyDown={handleSkillAdd}
            />

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
          </div>

          <div className="mb-3">
            <label className="form-label">Status</label>
            <select
              className="form-control"
              value={filters.status}
              onChange={(e) => handleFilterChange(e, "status")}
            >
              <option value="">Select Status</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      )}

      <div className="table-responsive">
        <table className="table table-striped table-bordered text-center">
          <thead>
            <tr>
              <th className="fw-bold" onClick={() => handleSort("name")}>
                Task Name {getSortArrow("name")}
              </th>
              <th className="fw-bold" onClick={() => handleSort("skills")}>
                Skills {getSortArrow("skills")}
              </th>
              <th className="fw-bold" onClick={() => handleSort("location")}>
                Location {getSortArrow("location")}
              </th>
              <th className="fw-bold" onClick={() => handleSort("startDate")}>
                Start Date {getSortArrow("startDate")}
              </th>
              <th className="fw-bold" onClick={() => handleSort("endDate")}>
                End Date {getSortArrow("endDate")}
              </th>
              <th
                className="fw-bold"
                onClick={() => handleSort("missingAssignments")}
              >
                Missing Assignments {getSortArrow("missingAssignments")}
              </th>
              <th className="fw-bold" onClick={() => handleSort("status")}>
                Status {getSortArrow("status")}
              </th>
              <th />
            </tr>
          </thead>
          <tbody>
            {tasks.length > 0 ? (
              sortedTasks.map((task, index) => (
                <tr key={index}>
                  <td>{task.name}</td>
                  <td>
                    {Array.isArray(task.skills)
                      ? task.skills.join(", ")
                      : task.skills}
                  </td>
                  <td onClick={() => fetchDetails("place", task.pid)}>
                    {task.location}
                  </td>
                  <td>{new Date(task.startDate).toLocaleString()}</td>
                  <td>{new Date(task.endDate).toLocaleString()}</td>
                  <td>
                    <p className="mb-0">
                      {task.assignedPersons} / {task.neededPersons}
                      {task.tolerance > 0 && (
                        <span className="text-muted small">
                          +{task.tolerance}
                        </span>
                      )}
                    </p>

                    <ProgressBar
                      now={progressPercentage(
                        task.neededPersons,
                        task.assignedPersons
                      )}
                      label={`${progressPercentage(
                        task.neededPersons,
                        task.assignedPersons
                      ).toFixed(1)}%`}
                      visuallyHidden
                      style={{ height: "1.5rem" }}
                      className="custom-progress-bar rounded-full overflow-hidden"
                    />
                  </td>
                  <td>{task.status}</td>
                  <td>
                    {task.isAssigned ? (
                      <button
                        disabled={
                          task.status === "Completed" || task.isGroupAssigned
                        }
                        className={
                          task.status === "Completed"
                            ? "btn btn-secondary"
                            : "btn btn-danger"
                        }
                        onClick={() => removeVolunteerFromTask(task.tid)}
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        disabled={
                          task.status === "Completed" ||
                          task.missingAssignments + task.tolerance <= 0
                        }
                        className={
                          task.status === "Completed"
                            ? "btn btn-secondary"
                            : "btn btn-success"
                        }
                        onClick={() => assignToTask(task.tid)}
                      >
                        Assign
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center">
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showPlacePopup && placeDetails && (
        <div className="popup-overlay fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="popup-content bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
            {/* Popup Header */}
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Place Details
            </h2>

            {/* Address Details */}
            <div className="text-sm text-gray-700 space-y-2">
              <p>
                <strong className="text-gray-900">Street Address:</strong>{" "}
                {placeDetails.streetAddress}
              </p>
              <p>
                <strong className="text-gray-900">Locality:</strong>{" "}
                {placeDetails.addressLocality}
              </p>
              <p>
                <strong className="text-gray-900">Region:</strong>{" "}
                {placeDetails.addressRegion}
              </p>
              <p>
                <strong className="text-gray-900">Postal Code:</strong>{" "}
                {placeDetails.postalCode}
              </p>
              <p>
                <strong className="text-gray-900">Country:</strong>{" "}
                {placeDetails.addressCountry}
              </p>
              <p>
                <strong className="text-gray-900">Latitude:</strong>{" "}
                {placeDetails.latitude}
              </p>
              <p>
                <strong className="text-gray-900">Longitude:</strong>{" "}
                {placeDetails.longitude}
              </p>
            </div>

            {/* Close Button */}
            <button
              className="mt-6 w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => setShowPlacePopup(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskTable;
