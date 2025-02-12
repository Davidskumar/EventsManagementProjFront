import React, { useEffect, useState, useRef } from "react";
import { fetchEvents, createEvent, updateEvent, deleteEvent } from "../api/api";
import { io } from "socket.io-client";

const Events = () => {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", date: "" });
  const [editingId, setEditingId] = useState(null);
  const socketRef = useRef(null); // Store socket instance

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
      socketRef.current = io("https://eventsmanagementprojback.onrender.com"); // ✅ Use live backend URL

      // Listen for event creations
      socketRef.current.on("eventCreated", (newEvent) => {
        setEvents((prevEvents) => [...prevEvents, newEvent]);
      });

      // Listen for event updates
      socketRef.current.on("eventUpdated", (updatedEvent) => {
        setEvents((prevEvents) =>
          prevEvents.map((event) => (event._id === updatedEvent._id ? updatedEvent : event))
        );
      });

      // Listen for event deletions
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

  // Handle form input changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Create or Update Event
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { data } = await updateEvent(editingId, form);
        setEvents((prevEvents) =>
          prevEvents.map((event) => (event._id === editingId ? data : event)) // 🔥 Update event in state
        );
      } else {
        const { data } = await createEvent(form);
        setEvents((prevEvents) => [...prevEvents, data]); // 🔥 Add new event to state
      }
      setForm({ title: "", description: "", date: "" });
      setEditingId(null);
    } catch (error) {
      console.error("Error saving event:", error);
    }
  };

  // Handle Edit
  const handleEdit = (event) => {
    setForm({ title: event.title, description: event.description, date: event.date.split("T")[0] });
    setEditingId(event._id);
  };

  // Handle Delete
  const handleDelete = async (id) => {
    try {
      await deleteEvent(id);
      setEvents((prevEvents) => prevEvents.filter((event) => event._id !== id)); // 🔥 Remove event from UI immediately
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

      {/* Display Events */}
      <ul>
        {events.map((event) => (
          <li key={event._id}>
            <h3>{event.title}</h3>
            <p>{event.description}</p>
            <p><b>Date:</b> {new Date(event.date).toDateString()}</p>
            <p><b>Created By:</b> {event.createdBy?.name}</p>
            {event.createdBy && event.createdBy._id === JSON.parse(localStorage.getItem("user"))?.id && (
              <>
                <button onClick={() => handleEdit(event)}>Edit</button>
                <button onClick={() => handleDelete(event._id)}>Delete</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Events;
