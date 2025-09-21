import axios from "axios";
import { useEffect, useState } from "react";

interface IUser {
    _id: string;
    username: string;
    role: "admin" | "user";
    createdAt?: string;
    updatedAt?: string;
}

export default function UserManagement() {
    const [users, setUsers] = useState<IUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<"user" | "admin">("user");

    const api = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem("token");

    const fetchUsers = async () => {
        try {
            const res = await axios.get<IUser[]>(`${api}/api/users`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(res.data);
        } catch (err) {
            console.error(err);
            alert("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const createUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(
                `${api}/api/users`,
                { username, password, role },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("User created");
            setUsername("");
            setPassword("");
            setRole("user");
            fetchUsers();
        } catch (err) {
            console.error(err);
            alert("Failed to create user");
        }
    };

    const deleteUser = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            try {
                await axios.delete(`${api}/api/users/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                alert("User deleted");
                fetchUsers();
            } catch (err) {
                console.error(err);
                alert("Failed to delete user");
            }
        }
    };

    if (loading) return <div>Loading users...</div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow mt-6">
            <h2 className="text-xl font-semibold mb-4">User Management</h2>
            <div className="mb-6">
                <form onSubmit={createUser} className="space-y-4">
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Username"
                        className="w-full p-3 border rounded"
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full p-3 border rounded"
                    />
                    <select
                        value={role}
                        onChange={(e) =>
                            setRole(e.target.value as "user" | "admin")
                        }
                        className="w-full p-3 border rounded"
                    >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-3 rounded"
                    >
                        Create User
                    </button>
                </form>
            </div>

            <table className="min-w-full bg-white">
                <thead>
                    <tr>
                        <th className="py-2">Username</th>
                        <th className="py-2">Role</th>
                        <th className="py-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.username}>
                            <td className="border px-4 py-2">{user.username}</td>
                            <td className="border px-4 py-2">{user.role}</td>
                            <td className="border px-4 py-2 text-center">
                                <button
                                    onClick={() => deleteUser(String(user._id))}
                                    className="bg-red-600 text-white px-3 py-1 rounded"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
