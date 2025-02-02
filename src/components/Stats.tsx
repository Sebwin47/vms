import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import "./Stats.css";
import API_BASE_URL from "./config";
import {
  Tabs,
  Tab,
  Container,
  Row,
  Col,
  Button,
  ProgressBar,
} from "react-bootstrap";

const Statistics: React.FC = () => {
  const [userHours, setUserHours] = useState<number>(0);
  const [personalGoal, setPersonalGoal] = useState<number>(30); // Default goal
  const [isEditingGoal, setIsEditingGoal] = useState(false); // Edit mode state
  const [groupLeaderboard, setGroupLeaderboard] = useState<any[]>([]);
  const [volunteerLeaderboard, setVolunteerLeaderboard] = useState<any[]>([]);
  const [streakLeaderboard, setStreakLeaderboard] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState<boolean>(true);
  const [loadingVolunteers, setLoadingVolunteers] = useState<boolean>(true);
  const [popupMessage, setPopupMessage] = useState(""); // To store popup message
  const [showPopup, setShowPopup] = useState(false); // To toggle the popup visibility

  const [userData, setUserData] = useState({
    givenName: "",
    familyName: "",
    email: "",
    gender: "",
    telephone: "",
    availability: "",
    locationAvailability: "",
    streak: "",
  });

  const [showUpperTabs, setShowUpperTabs] = useState<boolean>(true); // State to control upper tabs visibility

  const fetchGroupLeaderboard = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/leaderboard/groups`);
      setGroupLeaderboard(response.data.leaderboard);
    } catch (error) {
      console.error("Error fetching group leaderboard:", error);
    } finally {
      setLoadingGroups(false);
    }
  };

  const fetchVolunteerLeaderboard = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/leaderboard/volunteers`
      );
      setVolunteerLeaderboard(response.data.leaderboard);
    } catch (error) {
      console.error("Error fetching volunteer leaderboard:", error);
    } finally {
      setLoadingVolunteers(false);
    }
  };

  const fetchStreakLeaderboard = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/leaderboard/streaks`);
      setStreakLeaderboard(response.data.leaderboard);
    } catch (error) {
      console.error("Error fetching volunteer leaderboard:", error);
    } finally {
      setLoadingVolunteers(false);
    }
  };

  const fetchProfile = async () => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await axios.get(`${API_BASE_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUserData(response.data.user);
    } catch (err) {
      console.error("Error loading profile");
    }
  };

  const fetchAwards = async () => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await axios.get(`${API_BASE_URL}/awards`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUserHours(response.data.totalHours);
    } catch (err) {
      console.error("Error loading profile");
    }
  };

  const fetchGoal = async () => {
    const token = localStorage.getItem("authToken");

    try {
      const response = await axios.get(`${API_BASE_URL}/goal`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setPersonalGoal(response.data.goal);
    } catch (error) {
      console.error("Error fetching goal:", error);
    }
  };

  const saveGoal = async () => {
    const token = localStorage.getItem("authToken");
    try {
      await axios.put(
        `${API_BASE_URL}/goal`,
        { goal: personalGoal },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setIsEditingGoal(false);
    } catch (error) {
      console.error("Error saving goal:", error);
    }
  };

  useEffect(() => {
    fetchGroupLeaderboard();
    fetchVolunteerLeaderboard();
    fetchStreakLeaderboard();
    fetchProfile();
    fetchAwards();
    fetchGoal();
  }, []);

  const progressPercentage = Math.min(
    (userHours / personalGoal) * 100,
    100 // Cap at 100%
  );

  return (
    <Container className="p-6 d-flex justify-content-center">
      <div className="w-100">
        <h1 className="text-3xl font-bold mb-4 text-center">Statistics</h1>
        <section>
          <div className="flex flex-col items-center justify-center gap-4 p-6">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-2xl font-bold mb-2">🔥 Current Streak 🔥</h2>
              <h1 className="text-4xl font-bold mb-2">
                {userData.streak}{" "}
                {Number(userData.streak) === 1 ? "Week" : "Weeks"}
              </h1>
              <p className="text-lg text-gray-600">Keep your streak alive!</p>
            </motion.div>
          </div>
        </section>
        {showUpperTabs ? (
          <Tabs
            defaultActiveKey=""
            id="statistics-tabs"
            className="text-center justify-content-center mb-2"
            onSelect={(key) => {
              if (key === "leaderboards") {
                setShowUpperTabs(false); // Hide upper tabs if "Leaderboards" is selected
              }
            }}
          >
            <Tab eventKey="leaderboards" title="Leaderboards" />
            <Tab eventKey="personalGoals" title="Personal Goals">
              <section className="text-center">
                <div className="mb-4 mt-3 flex items-center justify-center space-x-4">
                  <label className="fw-bold h2">Goal: 🚀</label>
                  {isEditingGoal ? (
                    <>
                      <p>
                        <input
                          id="goal"
                          type="number"
                          className="form-input w-20 text-center border border-gray-300 rounded-lg shadow-sm p-2 mb-0"
                          style={{ maxWidth: "5rem" }}
                          value={personalGoal}
                          onChange={(e) =>
                            setPersonalGoal(Math.max(0, Number(e.target.value)))
                          }
                          min="0"
                        />
                      </p>
                      <p>
                        <Button
                          variant="secondary"
                          className="text-blue-500"
                          onClick={saveGoal}
                        >
                          Save
                        </Button>
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="h2">{personalGoal} hours</p>
                      <Button
                        variant="secondary"
                        className="text-blue-500"
                        onClick={() => setIsEditingGoal(true)}
                      >
                        Edit
                      </Button>
                    </>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-3/4 mx-auto">
                  <ProgressBar
                    now={progressPercentage}
                    label={`${progressPercentage.toFixed(1)}%`}
                    visuallyHidden
                    style={{ height: "1.5rem" }}
                    className="custom-progress-bar rounded-full overflow-hidden"
                  />
                </div>

                <p className="mt-2 text-sm">
                  {userHours.toFixed(1)}/{personalGoal.toFixed(1)} hours
                </p>
              </section>
            </Tab>
            <Tab eventKey="awards" title="Awards">
              <section className="mb-8 text-center">
                <div className="badge-container">
                  {[
                    {
                      milestone: 10,
                      label: "Novice Helper",
                      className: "badge-1",
                      color: "linear-gradient(90deg, #4fd1c5, #2c7a7b)",
                    },
                    {
                      milestone: 50,
                      label: "Skilled Volunteer",
                      color:
                        "linear-gradient(90deg,hsl(224, 100.00%, 71.00%), rgb(90, 106, 213))",
                    },
                    {
                      milestone: 100,
                      label: "Dedicated Advocate",
                      color: "linear-gradient(90deg, #805ad5, #6b46c1)",
                    },
                    {
                      milestone: 500,
                      label: "Passionate Leader",
                      color: "linear-gradient(90deg, #f9a825, #e65100)",
                    },
                    {
                      milestone: 1000,
                      label: "Volunteer Hero",
                      color: "linear-gradient(90deg, #d32f2f, #c2185b)",
                    },
                  ].map(({ milestone, label, color }) => (
                    <div
                      key={milestone}
                      className={`badge ${
                        userHours >= milestone ? "unlocked" : "locked"
                      }`}
                      style={{
                        background: userHours >= milestone ? color : "#e2e8f0",
                      }}
                      onClick={() => {
                        setPopupMessage(
                          `You earn this badge for completing ${milestone} hours!`
                        );
                        setShowPopup(true);
                      }}
                    >
                      <span className="badge-text">
                        {userHours >= milestone
                          ? label
                          : `Locked (${milestone}h)`}
                      </span>
                    </div>
                  ))}

                  {showPopup && (
                    <div className="popup-overlay stats">
                      <div className="popup-content stats">
                        <p>{popupMessage}</p>
                        <button onClick={() => setShowPopup(false)}>
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </Tab>
          </Tabs>
        ) : (
          <div>
            {/* Back to Upper Tabs Button */}
            <div className="d-flex justify-content-center">
              <Button
                variant="link"
                className="mb-2 text-blue-500 text-center"
                onClick={() => setShowUpperTabs(true)}
                style={{ marginLeft: "-30%" }} // Slightly align the button to the left
              >
                ← Leaderboards
              </Button>
            </div>

            <Tabs
              defaultActiveKey="groups"
              id="leaderboards-tabs"
              className="text-center justify-content-center mb-2"
            >
              <Tab eventKey="groups" title="Top Groups">
                {loadingGroups ? (
                  <p>Loading group leaderboard...</p>
                ) : groupLeaderboard.length > 0 ? (
                  <Row className="justify-content-center">
                    <Col md={10} className="d-flex justify-content-center">
                      <table className="table-auto w-75 border-collapse border border-gray-200">
                        <thead>
                          <tr>
                            <th className="border border-gray-300 px-4 py-2 text-center">
                              Rank
                            </th>
                            <th className="border border-gray-300 px-4 py-2">
                              Group Name
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-center">
                              Tasks Completed
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupLeaderboard.map((group, index) => (
                            <tr key={index} className="hover:bg-gray-100">
                              <td className="border border-gray-300 px-4 py-2 text-center">
                                {index + 1}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {group.groupName}
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-center">
                                {group.taskCount}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Col>
                  </Row>
                ) : (
                  <p>No group data available</p>
                )}
              </Tab>
              <Tab eventKey="volunteers" title="Top Volunteers">
                {loadingVolunteers ? (
                  <p>Loading volunteer leaderboard...</p>
                ) : volunteerLeaderboard.length > 0 ? (
                  <Row className="justify-content-center">
                    <Col md={10} className="d-flex justify-content-center">
                      <table className="table-auto w-75 border-collapse border border-gray-200">
                        <thead>
                          <tr>
                            <th className="border border-gray-300 px-4 py-2 text-center">
                              Rank
                            </th>
                            <th className="border border-gray-300 px-4 py-2">
                              Volunteer Name
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-center">
                              Total Hours
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {volunteerLeaderboard.map((volunteer, index) => (
                            <tr key={index} className="hover:bg-gray-100">
                              <td className="border border-gray-300 px-4 py-2 text-center">
                                {index + 1}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {volunteer.volunteerName}
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-center">
                                {volunteer.totalHours.toFixed(1)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Col>
                  </Row>
                ) : (
                  <p>No volunteer data available</p>
                )}
              </Tab>
              <Tab eventKey="streaks" title="Top Streaks">
                {loadingVolunteers ? (
                  <p>Loading streak leaderboard...</p>
                ) : streakLeaderboard.length > 0 ? (
                  <Row className="justify-content-center">
                    <Col md={10} className="d-flex justify-content-center">
                      <table className="table-auto w-75 border-collapse border border-gray-200">
                        <thead>
                          <tr>
                            <th className="border border-gray-300 px-4 py-2 text-center">
                              Rank
                            </th>
                            <th className="border border-gray-300 px-4 py-2">
                              Volunteer Name
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-center">
                              Streak
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {streakLeaderboard.map((volunteer, index) => (
                            <tr key={index} className="hover:bg-gray-100">
                              <td className="border border-gray-300 px-4 py-2 text-center">
                                {index + 1}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {volunteer.volunteerName}
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-center">
                                {volunteer.streak}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Col>
                  </Row>
                ) : (
                  <p>No streak data available</p>
                )}
              </Tab>
            </Tabs>
          </div>
        )}
      </div>
    </Container>
  );
};

export default Statistics;
