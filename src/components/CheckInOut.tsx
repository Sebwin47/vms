import React, { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from "./config";
import "./CheckInOut.css";

interface Task {
  tid: number;
  name: string;
  status: string;
  isAssigned: boolean;
}

const CheckInOut: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [manualMode, setManualMode] = useState(false);
  const [manualStartTime, setManualStartTime] = useState("");
  const [manualEndTime, setManualEndTime] = useState("");

  useEffect(() => {
    const fetchAssignedTasks = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await axios.get(`${API_BASE_URL}/tasks`, {
          params: { token },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const assignedTasks = response.data.tasks.filter(
          (task: Task) => task.isAssigned
        );
        setTasks(assignedTasks);
      } catch (err) {
        console.error("Error fetching tasks:", err);
        setError("Failed to load assigned tasks");
      }
    };

    fetchAssignedTasks();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        setElapsedTime(now.getTime() - startTime.getTime());
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, startTime]);

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleStartStop = async () => {
    if (!isTimerRunning) {
      setStartTime(new Date());
      setIsTimerRunning(true);
      setError("");
    } else {
      try {
        const endTime = new Date();
        const duration = elapsedTime / 3600000; // Convert ms to hours

        await axios.post(
          `${API_BASE_URL}/log-work`,
          {
            taskId: selectedTaskId,
            startTime: startTime?.toISOString(),
            endTime: endTime.toISOString(),
            duration: duration,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          }
        );

        setIsTimerRunning(false);
        setElapsedTime(0);
        setMessage(
          `Time logged successfully: ${formatTime(elapsedTime)} for task "${
            tasks.find((t) => t.tid === selectedTaskId)?.name
          }"`
        );
        setTimeout(() => setMessage(""), 5000);
      } catch (err) {
        console.error("Error logging work:", err);
        setError("Failed to log work time");
      }
    }
  };
  const handleManualSubmit = async () => {
    if (!selectedTaskId) {
      setError("Please select a task first");
      return;
    }

    if (!manualStartTime || !manualEndTime) {
      setError("Both start and end times are required");
      return;
    }

    const start = new Date(manualStartTime);
    const end = new Date(manualEndTime);

    if (start >= end) {
      setError("End time must be after start time");
      return;
    }

    const duration = (end.getTime() - start.getTime()) / 3600000; // hours

    try {
      await axios.post(
        `${API_BASE_URL}/log-work`,
        {
          taskId: selectedTaskId,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          duration: duration,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      setMessage(
        `Manual time logged successfully (${duration.toFixed(
          2
        )} hours) for task "${
          tasks.find((t) => t.tid === selectedTaskId)?.name
        }"`
      );
      setTimeout(() => setMessage(""), 5000);
      setManualStartTime("");
      setManualEndTime("");

      setError("");
    } catch (err) {
      console.error("Error logging manual time:", err);
      setError("Failed to log manual time");
    }
  };

  return (
    <div className="checkinout-container">
      <h2>Task Time Tracking</h2>

      {/* Error/Success messages */}
      {error && (
        <div className="checkinout-alert checkinout-alert-danger">{error}</div>
      )}
      {message && (
        <div className="checkinout-alert checkinout-alert-success">
          {message}
        </div>
      )}

      {/* Task selection */}
      <div className="form-group">
        <label>Select Task</label>
        <select
          className="form-control"
          value={selectedTaskId || ""}
          onChange={(e) => setSelectedTaskId(Number(e.target.value))}
          disabled={isTimerRunning}
        >
          <option value="">Choose a task...</option>
          {tasks.map((task) => (
            <option
              key={task.tid}
              value={task.tid}
              disabled={task.status === "Completed"}
            >
              {task.name} ({task.status})
            </option>
          ))}
        </select>
      </div>

      {/* Mode toggle */}
      <div className="checkinout-mode-toggle">
        <button
          className={`checkinout-mode-btn ${
            !manualMode ? "checkinout-mode-active" : ""
          }`}
          onClick={() => setManualMode(false)}
        >
          Timer Mode
        </button>
        <button
          className={`checkinout-mode-btn ${
            manualMode ? "checkinout-mode-active" : ""
          }`}
          onClick={() => setManualMode(true)}
        >
          Manual Entry
        </button>
      </div>

      {!manualMode ? (
        /* Timer Mode */
        <>
          <div className="checkinout-time-display">
            <h3>{formatTime(elapsedTime)}</h3>
          </div>

          <button
            className={`checkinout-btn ${
              isTimerRunning
                ? "checkinout-btn-danger"
                : "checkinout-btn-primary"
            }`}
            onClick={handleStartStop}
            disabled={
              !selectedTaskId ||
              tasks.find((t) => t.tid === selectedTaskId)?.status ===
                "Completed"
            }
          >
            {isTimerRunning ? "Stop Tracking" : "Start Tracking"}
          </button>
        </>
      ) : (
        /* Manual Entry Mode */
        <div className="checkinout-manual-form">
          <>
            <div className="form-group">
              <label>Start Time</label>
              <input
                type="datetime-local"
                className="form-control"
                value={manualStartTime}
                onChange={(e) => setManualStartTime(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>End Time</label>
              <input
                type="datetime-local"
                className="form-control"
                value={manualEndTime}
                onChange={(e) => setManualEndTime(e.target.value)}
              />
            </div>
            <div className="checkinout-manual-btns">
              <button
                className="checkinout-btn checkinout-btn-primary"
                disabled={
                  !selectedTaskId ||
                  tasks.find((t) => t.tid === selectedTaskId)?.status ===
                    "Completed"
                }
                onClick={handleManualSubmit}
              >
                Submit Time
              </button>
            </div>
          </>
        </div>
      )}
    </div>
  );
};

export default CheckInOut;
