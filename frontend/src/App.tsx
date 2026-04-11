import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import {
  Clock,
  Plus,
  Trash2,
  User as UserIcon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Share2,
  Check,
  X,
  Layers,
} from "lucide-react";
import axios from "axios";
import "./App.css";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(
  /\/$/,
  "",
);

// Bypass ngrok browser warning
axios.defaults.headers.common["ngrok-skip-browser-warning"] = "true";

interface User {
  id: string;
  username: string;
  defaultTimezone: string;
}

interface Event {
  id: string;
  userId: string;
  title: string;
  description: string;
  startTime: string; // ISO string in UTC
  endTime: string; // ISO string in UTC
  originalTimezone: string;
}

interface ScheduleRequest {
  id: string;
  requesterId: string;
  targetUserId: string;
  requestedDate: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  targetUsername?: string; // Hydrated for display
  requesterUsername?: string; // Hydrated for display
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    startTime: "09:00",
    endTime: "10:00",
  });

  // Sharing states
  const [view, setView] = useState<"PERSONAL" | "REQUESTS" | "SHARED">(
    "PERSONAL",
  );
  const [receivedRequests, setReceivedRequests] = useState<ScheduleRequest[]>(
    [],
  );
  const [sharedSchedules, setSharedSchedules] = useState<ScheduleRequest[]>([]);
  const [targetUsername, setTargetUsername] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  const [sharedEvents, setSharedEvents] = useState<Event[]>([]);
  const [isMerging, setIsMerging] = useState(false);

  const timezone =
    user?.defaultTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  const formatTime = (isoString: string, tz: string) => {
    try {
      return formatInTimeZone(parseISO(isoString), tz, "HH:mm");
    } catch (e) {
      return "00:00";
    }
  };

  useEffect(() => {
    if (user) {
      fetchEvents();
      fetchRequests();
      fetchSharedSchedules();
    }
  }, [user, selectedDate]);

  const fetchEvents = async () => {
    if (!user) return;
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const response = await axios.get(
        `${API_BASE_URL}/schedules/user/${user.id}/date/${dateStr}`,
      );
      setEvents(response.data);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchRequests = async () => {
    if (!user) return;
    try {
      const response = await axios.get(
        `${API_BASE_URL}/sharing/requests/received/${user.id}`,
      );
      const requests = response.data;

      // Hydrate usernames
      const hydrated = await Promise.all(
        requests.map(async (req: any) => {
          const userRes = await axios.get(
            `${API_BASE_URL}/users/${req.requesterId}`,
          );
          return { ...req, requesterUsername: userRes.data.username };
        }),
      );

      setReceivedRequests(hydrated);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const fetchSharedSchedules = async () => {
    if (!user) return;
    try {
      const response = await axios.get(
        `${API_BASE_URL}/sharing/shared/${user.id}`,
      );
      const shared = response.data;

      // Hydrate usernames
      const hydrated = await Promise.all(
        shared.map(async (req: any) => {
          const userRes = await axios.get(
            `${API_BASE_URL}/users/${req.targetUserId}`,
          );
          return { ...req, targetUsername: userRes.data.username };
        }),
      );

      setSharedSchedules(hydrated);
    } catch (error) {
      console.error("Error fetching shared schedules:", error);
    }
  };

  const fetchSharedEvents = async (targetUserId: string, date: string) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/schedules/user/${targetUserId}/date/${date}`,
      );
      setSharedEvents(response.data);
      setView("SHARED");
    } catch (error) {
      console.error("Error fetching shared events:", error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;

    try {
      let response;
      try {
        response = await axios.get(
          `${API_BASE_URL}/users/username/${username}`,
        );
      } catch (err: any) {
        if (err.response?.status === 404) {
          response = await axios.post(`${API_BASE_URL}/users`, {
            username,
            defaultTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          });
        } else {
          throw err;
        }
      }
      setUser(response.data);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const startDateTime = fromZonedTime(
        `${dateStr}T${newEvent.startTime}:00`,
        timezone,
      );
      const endDateTime = fromZonedTime(
        `${dateStr}T${newEvent.endTime}:00`,
        timezone,
      );

      await axios.post(`${API_BASE_URL}/schedules`, {
        userId: user.id,
        title: newEvent.title,
        description: newEvent.description,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        originalTimezone: timezone,
      });

      setNewEvent({
        title: "",
        description: "",
        startTime: "09:00",
        endTime: "10:00",
      });
      setIsAddingEvent(false);
      fetchEvents();
    } catch (error) {
      console.error("Error adding event:", error);
    }
  };

  const handleRequestSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !targetUsername) return;

    try {
      const userRes = await axios.get(
        `${API_BASE_URL}/users/username/${targetUsername}`,
      );
      const targetUser = userRes.data;

      await axios.post(`${API_BASE_URL}/sharing/request`, {
        requesterId: user.id,
        targetUserId: targetUser.id,
        requestedDate: format(selectedDate, "yyyy-MM-dd"),
      });

      setTargetUsername("");
      setIsRequesting(false);
      alert("Request sent successfully!");
    } catch (error: any) {
      if (error.response?.status === 404) {
        alert("User not found!");
      } else {
        console.error("Error requesting schedule:", error);
      }
    }
  };

  const acceptRequest = async (requestId: string) => {
    try {
      await axios.patch(`${API_BASE_URL}/sharing/request/${requestId}/accept`);
      fetchRequests();
    } catch (error: any) {
      if (error.response?.status === 400) {
        alert(
          "You cannot accept this request because you do not have a schedule for this date yet.",
        );
      } else {
        console.error("Error accepting request:", error);
      }
    }
  };

  const declineRequest = async (requestId: string) => {
    try {
      await axios.patch(`${API_BASE_URL}/sharing/request/${requestId}/decline`);
      fetchRequests();
    } catch (error) {
      console.error("Error declining request:", error);
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/schedules/${id}`);
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  if (!user) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>Global Schedule Handler</h1>
          <p>Sign in to manage your daily schedule</p>
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <UserIcon size={20} />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <button type="submit">Sign In / Register</button>
          </form>
        </div>
      </div>
    );
  }

  const renderPersonalSchedule = () => (
    <>
      <div className="schedule-header">
        <h3>Your Schedule</h3>
        <button onClick={() => setIsAddingEvent(true)} className="btn-primary">
          <Plus size={18} /> Add Event
        </button>
      </div>

      <div className="event-list">
        {events.length === 0 ? (
          <div className="empty-state">No events scheduled for this day.</div>
        ) : (
          events
            .sort((a, b) => a.startTime.localeCompare(b.startTime))
            .map((event) => (
              <div key={event.id} className="event-card">
                <div className="event-time">
                  <Clock size={16} />
                  <span>{formatTime(event.startTime, timezone)}</span>
                  <span className="end-time">
                    {formatTime(event.endTime, timezone)}
                  </span>
                </div>
                <div className="event-info">
                  <h4>{event.title}</h4>
                  {event.description && <p>{event.description}</p>}
                </div>
                <button
                  onClick={() => deleteEvent(event.id)}
                  className="btn-delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
        )}
      </div>
    </>
  );

  const renderRequests = () => (
    <div className="requests-container">
      <h3>Incoming Requests</h3>
      {receivedRequests.length === 0 ? (
        <div className="empty-state">No pending requests.</div>
      ) : (
        <div className="request-list">
          {receivedRequests.map((req) => (
            <div key={req.id} className="request-card">
              <div className="request-info">
                <strong>{req.requesterUsername}</strong> wants to view your
                schedule for
                <span className="date-badge">{req.requestedDate}</span>
              </div>
              <div className="request-actions">
                <button
                  onClick={() => acceptRequest(req.id)}
                  className="btn-accept"
                >
                  <Check size={18} /> Accept
                </button>
                <button
                  onClick={() => declineRequest(req.id)}
                  className="btn-decline"
                >
                  <X size={18} /> Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h3 style={{ marginTop: "3rem" }}>Shared with You</h3>
      {sharedSchedules.length === 0 ? (
        <div className="empty-state">No shared schedules available.</div>
      ) : (
        <div className="shared-list">
          {sharedSchedules.map((req) => (
            <div key={req.id} className="shared-card">
              <div className="shared-info">
                <strong>{req.targetUsername}'s</strong> schedule for
                <span className="date-badge">{req.requestedDate}</span>
              </div>
              <button
                onClick={() =>
                  fetchSharedEvents(req.targetUserId, req.requestedDate)
                }
                className="btn-view"
              >
                View Schedule
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSharedEvents = () => {
    const combinedEvents = isMerging
      ? [
          ...events.map((e) => ({ ...e, type: "personal" })),
          ...sharedEvents.map((e) => ({ ...e, type: "shared" })),
        ].sort((a, b) => a.startTime.localeCompare(b.startTime))
      : sharedEvents.sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Algorithm to group overlapping events
    const groups: any[][] = [];
    combinedEvents.forEach((event) => {
      let added = false;
      for (let group of groups) {
        // If event overlaps with ANY event in the group, it belongs to this group
        const overlaps = group.some(
          (groupEvent) =>
            event.startTime < groupEvent.endTime &&
            groupEvent.startTime < event.endTime,
        );
        if (overlaps) {
          group.push(event);
          added = true;
          break;
        }
      }
      if (!added) {
        groups.push([event]);
      }
    });

    return (
      <div className="shared-view-container">
        <div className="shared-header">
          <button
            onClick={() => {
              setView("REQUESTS");
              setIsMerging(false);
            }}
            className="btn-secondary"
          >
            <ChevronLeft size={18} /> Back to Requests
          </button>
          <div className="shared-actions">
            <button
              onClick={() => setIsMerging(!isMerging)}
              className={`btn-merge ${isMerging ? "active" : ""}`}
            >
              <Layers size={18} />{" "}
              {isMerging ? "Separate View" : "Compare / Merge"}
            </button>
          </div>
        </div>

        <h3>{isMerging ? "Merged Timeline" : "Shared Schedule"}</h3>

        <div className="event-list">
          {groups.length === 0 ? (
            <div className="empty-state">No events in this schedule.</div>
          ) : (
            groups.map((group, gIdx) => {
              const isConflict = group.length > 1;
              if (isConflict) {
                return (
                  <div key={`group-${gIdx}`} className="conflict-box">
                    <div className="conflict-header">
                      <X size={16} color="var(--error)" />
                      <span>Schedule Conflict Detected</span>
                    </div>
                    {group.map((event, idx) => (
                      <div
                        key={event.id + idx}
                        className={`event-card mini ${event.type === "shared" ? "shared-type" : ""}`}
                      >
                        <div className="event-time">
                          <span>{formatTime(event.startTime, timezone)}</span>
                        </div>
                        <div className="event-info">
                          <div className="type-badge">
                            {event.type === "personal" ? "Mine" : "Shared"}
                          </div>
                          <h4>{event.title}</h4>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }

              const event = group[0];
              return (
                <div
                  key={event.id}
                  className={`event-card ${event.type === "shared" ? "shared-type" : ""}`}
                >
                  <div className="event-time">
                    <Clock size={16} />
                    <span>{formatTime(event.startTime, timezone)}</span>
                    <div className="original-time-hint">
                      {formatTime(event.startTime, event.originalTimezone)}{" "}
                      {event.originalTimezone}
                    </div>
                  </div>
                  <div className="event-info">
                    <div className="type-badge">
                      {event.type === "personal" ? "Mine" : "Shared"}
                    </div>
                    <h4>{event.title}</h4>
                    {event.description && <p>{event.description}</p>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      <header>
        <div
          className="logo"
          onClick={() => setView("PERSONAL")}
          style={{ cursor: "pointer" }}
        >
          Global Schedule Handler
        </div>
        <div className="nav-links">
          <button
            onClick={() => setView("PERSONAL")}
            className={view === "PERSONAL" ? "active" : ""}
          >
            My Schedule
          </button>
          <button
            onClick={() => setView("REQUESTS")}
            className={view === "REQUESTS" || view === "SHARED" ? "active" : ""}
          >
            Requests & Shared
          </button>
        </div>
        <div className="user-nav">
          <span>
            {user.username} ({timezone})
          </span>
          <button onClick={() => setUser(null)} className="btn-icon">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main>
        {view === "PERSONAL" && (
          <div className="calendar-controls">
            <button
              onClick={() =>
                setSelectedDate(
                  new Date(selectedDate.setDate(selectedDate.getDate() - 1)),
                )
              }
            >
              <ChevronLeft size={20} />
            </button>
            <div className="date-display">
              <h2>{format(selectedDate, "EEEE, MMMM do, yyyy")}</h2>
              <button
                onClick={() => setIsRequesting(true)}
                className="btn-share"
              >
                <Share2 size={16} /> Request Schedule from Someone
              </button>
            </div>
            <button
              onClick={() =>
                setSelectedDate(
                  new Date(selectedDate.setDate(selectedDate.getDate() + 1)),
                )
              }
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {isRequesting && (
          <div className="modal">
            <div className="modal-content">
              <h4>Request Schedule</h4>
              <p>
                Request access to view a user's schedule for{" "}
                {format(selectedDate, "yyyy-MM-dd")}
              </p>
              <form onSubmit={handleRequestSchedule}>
                <input
                  placeholder="Target Username"
                  value={targetUsername}
                  onChange={(e) => setTargetUsername(e.target.value)}
                  required
                />
                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setIsRequesting(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Send Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isAddingEvent && (
          <div className="modal">
            <div className="modal-content">
              <h4>Add New Event</h4>
              <form onSubmit={handleAddEvent}>
                <input
                  placeholder="Title"
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, title: e.target.value })
                  }
                  required
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newEvent.description}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, description: e.target.value })
                  }
                />
                <div className="time-inputs">
                  <div>
                    <label>Start Time</label>
                    <input
                      type="time"
                      value={newEvent.startTime}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, startTime: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label>End Time</label>
                    <input
                      type="time"
                      value={newEvent.endTime}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, endTime: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setIsAddingEvent(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Save Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {view === "PERSONAL" && renderPersonalSchedule()}
        {view === "REQUESTS" && renderRequests()}
        {view === "SHARED" && renderSharedEvents()}
      </main>
    </div>
  );
}

export default App;
