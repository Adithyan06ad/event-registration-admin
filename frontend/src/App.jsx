
import { useEffect, useState } from "react";
import { Link, Routes, Route, useNavigate, useParams } from "react-router-dom";
import api from "./api";

function Layout({ children }) {
  return (
    <div>
      <header className="navbar">
        <h2>Event Manager</h2>
        <nav>
          <Link to="/">Dashboard</Link>
          <Link to="/add">Add Event</Link>
        </nav>
      </header>

      <main className="container">{children}</main>
      <footer>Event Registration Admin Panel</footer>
    </div>
  );
}

function Dashboard() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  async function loadEvents() {
    try {
      const response = await api.get("/events");
      setEvents(response.data);
    } catch (error) {
      setMessage("Could not load events. Check whether the backend is running.");
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function deleteEvent(id) {
    const confirmDelete = window.confirm("Do you want to delete this event?");

    if (!confirmDelete) return;

    try {
      await api.delete(`/events/${id}`);
      setMessage("Event deleted successfully!");
      loadEvents();
    } catch (error) {
      setMessage("Unable to delete event.");
    }
  }

  const filteredEvents = events.filter((event) =>
    event.eventName.toLowerCase().includes(search.toLowerCase())
  );

  const totalRegistrations = events.reduce(
    (total, event) => total + (event.totalRegistrations || 0),
    0
  );

  return (
    <Layout>
      <div className="page-heading">
        <div>
          <h1>Dashboard</h1>
          <p>Manage your events in one place.</p>
        </div>
        <Link className="button" to="/add">+ Add Event</Link>
      </div>

      {message && <p className="message">{message}</p>}

      <div className="stats">
        <div className="stat-card">
          <p>Total Events</p>
          <h2>{events.length}</h2>
        </div>
        <div className="stat-card">
          <p>Total Registrations</p>
          <h2>{totalRegistrations}</h2>
        </div>
      </div>

      <section className="panel">
        <div className="table-heading">
          <h2>All Events</h2>
          <input
            type="text"
            placeholder="Search event name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Event Name</th>
                <th>Event Date</th>
                <th>Venue</th>
                <th>Total Registrations</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event, index) => (
                <tr key={event._id}>
                  <td>{index + 1}</td>
                  <td>{event.eventName}</td>
                  <td>
                    {event.eventDate
                      ? new Date(event.eventDate).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>{event.venue}</td>
                  <td>{event.totalRegistrations || 0}</td>
                  <td>
                    <div className="actions">
                      <button
                        className="edit-button"
                        onClick={() => navigate(`/edit/${event._id}`)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => deleteEvent(event._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredEvents.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty">
                    No events found. Click Add Event to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </Layout>
  );
}

function EventForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    eventName: "",
    description: "",
    eventDate: "",
    venue: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    if (!isEditing) return;

    async function loadEvent() {
      try {
        // Use the existing GET-all route to find this event.
        const response = await api.get("/events");
        const event = response.data.find((item) => item._id === id);

        if (!event) {
          setMessage("Event not found.");
          return;
        }

        setFormData({
          eventName: event.eventName || "",
          description: event.description || "",
          eventDate: event.eventDate
            ? event.eventDate.slice(0, 10)
            : "",
          venue: event.venue || "",
        });
      } catch (error) {
        setMessage("Could not load event details.");
      } finally {
        setLoading(false);
      }
    }

    loadEvent();
  }, [id, isEditing]);

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    try {
      if (isEditing) {
        await api.put(`/events/${id}`, formData);
        alert("Event updated successfully!");
      } else {
        await api.post("/events", formData);
        alert("Event added successfully!");
      }

      navigate("/");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Could not save the event."
      );
    }
  }

  if (loading) {
    return <Layout><p>Loading event details...</p></Layout>;
  }

  return (
    <Layout>
      <div className="form-container">
        <h1>{isEditing ? "Edit Event" : "Add New Event"}</h1>
        <p>Enter the event details below.</p>

        {message && <p className="message">{message}</p>}

        <form onSubmit={handleSubmit} className="event-form">
          <label>Event Name</label>
          <input
            name="eventName"
            type="text"
            placeholder="Enter event name"
            value={formData.eventName}
            onChange={handleChange}
            required
          />

          <label>Description</label>
          <textarea
            name="description"
            placeholder="Enter event description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
          />

          <label>Event Date</label>
          <input
            name="eventDate"
            type="date"
            value={formData.eventDate}
            onChange={handleChange}
            required
          />

          <label>Venue</label>
          <input
            name="venue"
            type="text"
            placeholder="Enter event venue"
            value={formData.venue}
            onChange={handleChange}
            required
          />

          <div className="form-actions">
            <button className="button" type="submit">
              {isEditing ? "Update Event" : "Save Event"}
            </button>
            <button
              className="cancel-button"
              type="button"
              onClick={() => navigate("/")}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/add" element={<EventForm />} />
      <Route path="/edit/:id" element={<EventForm />} />
    </Routes>
  );
}
