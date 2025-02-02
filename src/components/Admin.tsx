import React, { useState } from "react";
import axios from "axios";
import "./Admin.css";
import API_BASE_URL from "./config";
import { ProgressBar } from "react-bootstrap";
import TaskCreation from "./TaskCreation";

const Admin: React.FC = () => {
  const [taskFilter, setTaskFilter] = useState<string>("");
  const [results, setResults] = useState<any[]>([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState<any | null>(null);
  const [showVolunteerPopup, setShowVolunteerPopup] = useState<boolean>(false);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"create" | "find">("find");
  const [matchType, setMatchType] = useState<"exact" | "related">("exact");

  const executeQuery = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin-query`, {
        params: { taskName: taskFilter, matchType: matchType },
      });
      setResults(response.data.results);
    } catch (error) {
      console.error("Error executing query:", error);
    }
  };

  const [expandedVolunteers, setExpandedVolunteers] = useState<Set<number>>(
    new Set()
  );

  const toggleSkillDetails = (volunteerId: number) => {
    const newSet = new Set(expandedVolunteers);
    if (newSet.has(volunteerId)) {
      newSet.delete(volunteerId);
    } else {
      newSet.add(volunteerId);
    }
    setExpandedVolunteers(newSet);
  };

  const assignVolunteerToTask = async (vid: string, tid: string) => {
    try {
      await axios.post(`${API_BASE_URL}/assign-volunteer`, { vid, tid });
      executeQuery();
    } catch (error) {
      console.error("Error assigning volunteer:", error);
      alert("Error assigning volunteer");
    }
  };

  const progressPercentage = (
    neededPersons: number,
    assignedPersons: number
  ) => {
    return Math.min((assignedPersons / neededPersons) * 100, 100);
  };

  const toggleExpand = (taskId: string) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  return (
    <div className="p-4 d-flex flex-column center align-items-center">
      <div className="w-75 mb-4">
        <h1 className="text-2xl font-bold mb-4 text-center">Admin Panel</h1>

        {/* Tab Navigation */}
        <div className="nav nav-tabs mb-4 justify-content-center">
          <button
            className={`nav-link ${activeTab === "find" ? "active" : ""}`}
            onClick={() => setActiveTab("find")}
          >
            Detect matching Volunteers
          </button>
          <button
            className={`nav-link ${activeTab === "create" ? "active" : ""}`}
            onClick={() => setActiveTab("create")}
          >
            Task Creation
          </button>
        </div>

        <div className="tab-content">
          {activeTab === "create" ? (
            <div className="tab-pane fade show active">
              <TaskCreation />
            </div>
          ) : (
            <div className="tab-pane fade show active">
              <div className="mb-4 w-100">
                <label className="form-label">Task Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Filter by Task Name"
                  value={taskFilter}
                  onChange={(e) => setTaskFilter(e.target.value)}
                />
              </div>

              <div className="mb-4 d-flex align-items-center gap-3">
                <button
                  className="btn btn-primary w-100"
                  onClick={executeQuery}
                >
                  Detect matching Volunteers
                </button>

                <div className="btn-group">
                  <button
                    className={`btn ${
                      matchType === "exact" ? "btn-primary" : "btn-secondary"
                    }`}
                    onClick={() => setMatchType("exact")}
                  >
                    Exact Skills
                  </button>
                  <button
                    className={`btn ${
                      matchType === "related" ? "btn-primary" : "btn-secondary"
                    }`}
                    onClick={() => setMatchType("related")}
                  >
                    Related Skills
                  </button>
                </div>
              </div>

              <div className="mb-4 d-flex align-items-center gap-3"></div>

              <div className="w-100">
                {results.length > 0 ? (
                  results.map((result) => (
                    <div key={result.taskId} className="card mb-4 shadow-sm">
                      <div className="card-body">
                        <h3 className="card-title cursor-pointer">
                          {result.taskName}
                        </h3>
                        <p className="card-text">{result.taskDescription}</p>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          <p>
                            <strong>Start:</strong>{" "}
                            {new Date(result.taskStartDate).toLocaleString()}
                          </p>
                          <p>
                            <strong>End:</strong>{" "}
                            {new Date(result.taskEndDate).toLocaleString()}
                          </p>
                          <p>
                            <strong>Status:</strong> {result.taskStatus}
                          </p>
                          <div>
                            <strong>Assigned:</strong> {result.assignedPersons}/
                            {result.taskNeededPersons}{" "}
                            <ProgressBar
                              now={progressPercentage(
                                result.taskNeededPersons,
                                result.assignedPersons
                              )}
                              label={`${progressPercentage(
                                result.neededPersons,
                                result.assignedPersons
                              ).toFixed(1)}%`}
                              visuallyHidden
                              style={{ height: "1.5rem" }}
                              className="custom-progress-bar rounded-full overflow-hidden"
                            />
                            {result.assignedVolunteers.length > 0 && (
                              <>
                                <h6
                                  className="mt-2 cursor-pointer flex items-center hover:text-blue-600 transition"
                                  onClick={() => toggleExpand(result.taskId)}
                                  style={{ cursor: "pointer" }}
                                >
                                  <span>
                                    {expandedTask === result.taskId ? "▼" : "▶"}{" "}
                                  </span>
                                  Assigned Volunteers:
                                </h6>
                                {expandedTask === result.taskId && (
                                  <ul className="list-group">
                                    {result.assignedVolunteers.map(
                                      (volunteer: any) => (
                                        <li
                                          key={volunteer.id}
                                          className="list-group-item d-flex justify-content-between align-items-center"
                                        >
                                          <div>
                                            <p
                                              className="mb-0"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedVolunteer(volunteer);
                                                setShowVolunteerPopup(true);
                                              }}
                                              style={{ cursor: "pointer" }}
                                            >
                                              {volunteer.givenName}{" "}
                                              {volunteer.familyName}
                                            </p>
                                            <small className="text-muted">
                                              {volunteer.email}
                                            </small>
                                          </div>
                                          <span className="text-muted text-sm">
                                            Assigned
                                          </span>
                                        </li>
                                      )
                                    )}
                                  </ul>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Available Volunteers */}
                        <h4 className="mt-4">Available Volunteers:</h4>
                        <ul className="list-group">
                          {result.volunteers.map((volunteer: any) => (
                            <li
                              key={volunteer.id}
                              className="list-group-item d-flex justify-content-between align-items-center"
                            >
                              <div>
                                <p className="mb-0">
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedVolunteer(volunteer);
                                      setShowVolunteerPopup(true);
                                    }}
                                    style={{ cursor: "pointer" }}
                                  >
                                    {volunteer.givenName} {volunteer.familyName}
                                  </span>
                                  <button
                                    className={`btn btn-sm ms-2 ${volunteer.bestMatchType}`}
                                    onClick={() =>
                                      toggleSkillDetails(volunteer.id)
                                    }
                                  >
                                    {volunteer.bestMatchType}
                                  </button>
                                  {volunteer.workedWith.length > 0 && (
                                    <span
                                      className="text-muted"
                                      style={{
                                        fontSize: "0.8em",
                                        marginLeft: "8px",
                                      }}
                                    >
                                      (Worked with{" "}
                                      {volunteer.workedWith.join(", ")})
                                    </span>
                                  )}
                                  <div className="skill-chips mt-2">
                                    {volunteer.matchedSkills
                                      .filter(() =>
                                        expandedVolunteers.has(volunteer.id)
                                      )
                                      .map((skill: any, index: number) => (
                                        <div
                                          key={index}
                                          className={`skill-chip ${skill.type} `}
                                        >
                                          {skill.skill}
                                          <span className="skill-type-badge">
                                            {skill.type}
                                          </span>
                                        </div>
                                      ))}
                                  </div>
                                </p>
                                <small className="text-muted">
                                  {volunteer.email}
                                </small>
                              </div>
                              <button
                                disabled={result.taskStatus === "Completed"}
                                className={
                                  result.taskStatus === "Completed"
                                    ? "btn btn-secondary"
                                    : "btn btn-success"
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  assignVolunteerToTask(
                                    volunteer.id,
                                    result.taskId
                                  );
                                }}
                              >
                                Assign
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center">No results found</p>
                )}
              </div>

              {/* Volunteer Popup */}
              {showVolunteerPopup && selectedVolunteer && (
                <div className="popup-overlay">
                  <div className="popup-content wide-popup">
                    <h2>Volunteer Details</h2>
                    <div className="space-y-2">
                      <p>
                        <strong>Name:</strong> {selectedVolunteer.givenName}{" "}
                        {selectedVolunteer.familyName}
                      </p>
                      <p>
                        <strong>Email:</strong> {selectedVolunteer.email}
                      </p>
                      <p>
                        <strong>Phone:</strong> {selectedVolunteer.telephone}
                      </p>
                      <p>
                        <strong>Availability:</strong>{" "}
                        {selectedVolunteer.availability}
                      </p>
                      <p>
                        <strong>Locations:</strong>{" "}
                        {selectedVolunteer.locationAvailability}
                      </p>
                    </div>
                    <button
                      className="close-btn"
                      onClick={() => setShowVolunteerPopup(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
