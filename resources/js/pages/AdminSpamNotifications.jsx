import { useEffect, useState } from "react";
import Echo from "laravel-echo";
import Pusher from "pusher-js";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify"; // Import toastify
import "react-toastify/dist/ReactToastify.css"; // Import the CSS for the toasts

window.Pusher = Pusher;
const AdminSpamNotifications = () => {
    const userId = localStorage.getItem("userId");
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                await axios
                    .get("/api/notifications/" + userId)
                    .then((response) => {
                        setNotifications(response.data);
                    });
            } catch (error) {
                console.error(error);
            }
        };

        const echo = new Echo({
            broadcaster: "pusher",
            key: "a7576b0155146db70649",
            cluster: "ap1",
            encrypted: true,
        });


        echo.channel(`user.${userId}`).listen(".user-notification", (event) => {
            fetchNotifications();
        });

        fetchNotifications();
        return () => {
            echo.disconnect();
        };
    }, []);

    const handleSendNotification = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("/api/send-notification", {
                userId,
            });
            toast.success("Notification sent!");
        } catch (error) {
            console.error("Error sending notification:", error);
            toast.error(`Error notification: An error occurred`);
        }
    };

    return (
        <div>
            <ToastContainer />
            <h2>Notifications</h2>
            <ul>
                {notifications.map((notification, index) => (
                    <li key={index}>
                        <p>{notification.message}</p>
                    </li>
                ))}
            </ul>

            <form onSubmit={handleSendNotification}>
                <button type="submit">Send Notification</button>
            </form>
        </div>
    );
};

export default AdminSpamNotifications;
