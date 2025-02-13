import React, { useEffect, useState, useRef } from "react";
import { fetchEvents, createEvent, updateEvent, deleteEvent, joinEvent, leaveEvent } from "../api/api";
import { io } from "socket.io-client";

const Events = () => {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", date: "", category: "Conference", image: null });
  const [editingId, setEditingId] = useState(null);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const socketRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user")) || {};

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const { data } = await fetchEvents();
        setEvents(data);
      } catch (error) {
        console.error("Error loading events:", error);
      }
    };

    loadEvents();

    if (!socketRef.current) {
      socketRef.current = io("https://eventsmanagementprojback.onrender.com");

      socketRef.current.on("eventCreated", (newEvent) => {
        setEvents((prevEvents) => [...prevEvents, newEvent]);
      });

      socketRef.current.on("eventUpdated", (updatedEvent) => {
        setEvents((prevEvents) =>
          prevEvents.map((event) => (event._id === updatedEvent._id ? updatedEvent : event))
        );
      });

      socketRef.current.on("eventDeleted", (deletedId) => {
        setEvents((prevEvents) => prevEvents.filter((event) => event._id !== deletedId));
      });

      socketRef.current.on("attendeeUpdated", (updatedEvent) => {
        setEvents((prevEvents) =>
          prevEvents.map((event) => (event._id === updatedEvent._id ? updatedEvent : event))
        );
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setForm((prevForm) => ({ ...prevForm, image: files[0] }));
    } else {
      setForm((prevForm) => ({ ...prevForm, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user.id === "guest") {
      alert("Guest users cannot create events. Please log in.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("date", form.date);
      formData.append("category", form.category);
      if (form.image) {
        formData.append("image", form.image);
      }

      if (editingId) {
        await updateEvent(editingId, formData);
      } else {
        await createEvent(formData);
      }

      setForm({ title: "", description: "", date: "", category: "Conference", image: null });
      setEditingId(null);
    } catch (error) {
      console.error("Error saving event:", error);
    }
  };

  const handleEdit = (event) => {
    setForm({
      title: event.title,
      description: event.description,
      date: event.date.split("T")[0],
      category: event.category || "Conference",
    });
    setEditingId(event._id);
  };

  const handleDelete = async (id) => {
    if (user.id === "guest") {
      alert("Guest users cannot delete events. Please log in.");
      return;
    }
    try {
      await deleteEvent(id);
      setEvents((prevEvents) => prevEvents.filter((event) => event._id !== id));
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const handleJoin = async (id) => {
    try {
      const { data } = await joinEvent(id);
      setEvents((prevEvents) =>
        prevEvents.map((event) => (event._id === id ? data : event))
      );
    } catch (error) {
      console.error("Error joining event:", error);
    }
  };

  const handleLeave = async (id) => {
    try {
      const { data } = await leaveEvent(id);
      setEvents((prevEvents) =>
        prevEvents.map((event) => (event._id === id ? data : event))
      );
    } catch (error) {
      console.error("Error leaving event:", error);
    }
  };

  return (
    <div>
      <h2>Events</h2>

      {/* Filters */}
      <div>
        <select onChange={(e) => setFilterCategory(e.target.value)} value={filterCategory}>
          <option value="">All Categories</option>
          <option value="Conference">Conference</option>
          <option value="Workshop">Workshop</option>
          <option value="Meetup">Meetup</option>
        </select>

        <input type="date" onChange={(e) => setFilterDate(e.target.value)} value={filterDate} />
      </div>

      {/* Event Form - Hidden for Guest Users */}
      {user.id !== "guest" && (
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <input type="text" name="title" placeholder="Title" value={form.title} onChange={handleChange} required />
          <input type="text" name="description" placeholder="Description" value={form.description} onChange={handleChange} required />
          <input type="date" name="date" value={form.date} onChange={handleChange} required />

          <select name="category" value={form.category} onChange={handleChange} required>
            <option value="Conference">Conference</option>
            <option value="Workshop">Workshop</option>
            <option value="Meetup">Meetup</option>
          </select>

          <input type="file" accept="image/*" name="image" onChange={handleChange} />

          <button type="submit">{editingId ? "Update Event" : "Create Event"}</button>
        </form>
      )}

      {/* Display Events in Table Format */}
      <table border="1" cellPadding="8" cellSpacing="0" style={{ width: "100%", marginTop: "20px", textAlign: "left" }}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Date</th>
            <th>Category</th>
            <th>Image</th>
            <th>Created By</th>
            <th>Attendees</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event._id}>
              <td>{event.title}</td>
              <td>{event.description}</td>
              <td>{new Date(event.date).toDateString()}</td>
              <td>{event.category}</td>
              <td>{event.imageUrl && <img src={event.imageUrl} alt="Event" width="80" />}</td>
              <td>{event.createdBy?.name || "Unknown"}</td>
              <td>
                {event.attendees?.length ? (
                  <>
                    {event.attendees.length} Attending
                    <ul>
                      {event.attendees.map((attendee) =>
                        attendee?.name ? <li key={attendee._id}>{attendee.name}</li> : null
                      )}
                    </ul>
                  </>
                ) : (
                  "No attendees yet"
                )}
              </td>
              <td>
                {user.id !== "guest" && event.createdBy?._id === user.id && (
                  <>
                    <button onClick={() => handleEdit(event)}>Edit</button>
                    <button onClick={() => handleDelete(event._id)}>Delete</button>
                  </>
                )}
                <button onClick={() => handleJoin(event._id)}>Join</button>
                <button onClick={() => handleLeave(event._id)}>Leave</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Events;
