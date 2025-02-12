import React, { useEffect, useState, useRef } from "react";
import { fetchEvents, createEvent, updateEvent, deleteEvent } from "../api/api";
import { io } from "socket.io-client";

const Events = () => {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", date: "" });
  const [editingId, setEditingId] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const { data } = await fetchEvents();
        setEvents(data);
      } catch (error) {
        console.error("Error loading events:", error);
      }
    };

    loadEvents(); // Fetch events initially

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
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { data } = await updateEvent(editingId, form);
        setEvents((prevEvents) =>
          prevEvents.map((event) => (event._id === editingId ? data : event))
        );
      } else {
        const { data } = await createEvent(form);
        setEvents((prevEvents) => [...prevEvents, data]);
      }
      setForm({ title: "", description: "", date: "" });
      setEditingId(null);
    } catch (error) {
      console.error("Error saving event:", error);
    }
  };

  const handleEdit = (event) => {
    setForm({ title: event.title, description: event.description, date: event.date.split("T")[0] });
    setEditingId(event._id);
  };

  const handleDelete = async (id) => {
    try {
      await deleteEvent(id);
      setEvents((prevEvents) => prevEvents.filter((event) => event._id !== id));
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  return (
    <div>
      <h2>Events</h2>

      {/* Event Form */}
      <form onSubmit={handleSubmit}>
        <input type="text" name="title" placeholder="Title" value={form.title} onChange={handleChange} required />
        <input type="text" name="description" placeholder="Description" value={form.description} onChange={handleChange} required />
        <input type="date" name="date" value={form.date} onChange={handleChange} required />
        <button type="submit">{editingId ? "Update Event" : "Create Event"}</button>
      </form>

      {/* Display Events in Table Format */}
      <table border="1" cellPadding="8" cellSpacing="0" style={{ width: "100%", marginTop: "20px", textAlign: "left" }}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Date</th>
            <th>Created By</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event._id}>
              <td>{event.title}</td>
              <td>{event.description}</td>
              <td>{new Date(event.date).toDateString()}</td>
              <td>{event.createdBy?.name || "Unknown"}</td>
              <td>
                {event.createdBy && event.createdBy._id === JSON.parse(localStorage.getItem("user"))?.id && (
                  <>
                    <button onClick={() => handleEdit(event)}>Edit</button>
                    <button onClick={() => handleDelete(event._id)}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Events;
