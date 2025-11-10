"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getAuthToken } from "@/app/auth/login/api";
import { toast } from "react-toastify";
import { EyeIcon, PencilIcon, TrashIcon } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// ✅ Zod validation schema for User
const userSchema = z.object({
  email: z.string().email("Invalid email"),
  first_name: z.string().optional(),
  middle_name: z.string().optional(),
  last_name: z.string().optional(),
  phone_number: z.string().optional(),
  address: z.string().optional(),
  wallet_balance: z.coerce.number().min(0, "Wallet balance must be >= 0").optional(),
  //level: z.coerce.number().optional(),
  //is_active: z.boolean(),
  is_staff: z.boolean(),
  is_superuser: z.boolean(),
  password: z.string().min(6, "Password must be at least 6 characters"), // Password field
});

type UserFormData = z.infer<typeof userSchema>;

type User = {
  id: number;
  email: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  phone_number?: string;
  address?: string;
  wallet_balance: number;
  password: string; // Include password field
  level?: number;
  //is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  created_at: string;
  updated_at: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<User | null>(null);
  const [modalType, setModalType] = useState<"add" | "edit" | "view" | "delete" | null>(null);
  const [button_clicked, setButtonClicked] = useState(false);

  // Search + Pagination
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 1000);
    return () => clearTimeout(t);
  }, [search]);

  //  Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const url = `${BASE_URL}/get_users?page=${page}&search=${encodeURIComponent(debouncedSearch)}`;
      const res = await fetch(url, {
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${getAuthToken()}` 
        },
      });
      const data = await res.json();
      if (res.status === 200) {
        setUsers(data.data || data.results || []);
        setTotalPages(data.total_pages || 1);
      } else {
        toast.error(data.error || "Failed to load users");
      }
    } catch {
      toast.error("Couldn't fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchUsers(); 
  }, [page, debouncedSearch]);

  // ✅ React Hook Form
  const { 
    register, 
    handleSubmit, 
    reset, 
    formState: { errors } 
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema) as any,
  });

  const handleOpen = (type: typeof modalType, user?: User) => {
    setModalType(type);
    setSelected(user || null);
    if (user) {
      reset({
        email: user.email,
        first_name: user.first_name || "",
        middle_name: user.middle_name || "",
        last_name: user.last_name || "",
        phone_number: user.phone_number || "",
        address: user.address || "",
        wallet_balance: user.wallet_balance,
        
        //is_active: user.is_active,
        is_staff: user.is_staff,
        is_superuser: user.is_superuser,
        password: "", // Reset password field
      });
    } else {
      reset({});
    }
  };

  const handleClose = () => { 
    setModalType(null); 
    setSelected(null); 
    reset({}); 
  };

  // ✅ Create / Update
  const onSubmit = async (data: UserFormData) => {
    setButtonClicked(true);
    if (modalType === "add") {
      try {
        const res = await fetch(BASE_URL + "/sign_up", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Bearer ${getAuthToken()}` 
          },
          body: JSON.stringify(data),
        });
        if (res.status === 201) {
          toast.success("User created successfully");
        } else {
          toast.error("Failed to create user");
        }
      } catch {
        toast.error("Couldn't create user");
      } finally { 
        setButtonClicked(false); 
      }
    } else if (modalType === "edit" && selected) {
      try {
        const res = await fetch(`${BASE_URL}/update_user/${selected.id}`, {
          method: "PATCH",
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Bearer ${getAuthToken()}` 
          },
          body: JSON.stringify(data),
        });
        if (res.status === 200) {
          toast.success("User updated successfully");
        } else {
          toast.error("Failed to update user");
        }
      } catch {
        toast.error("Failed to update user");
      } finally { 
        setButtonClicked(false); 
      }
    }
    await fetchUsers();
    handleClose();
  };

  // ✅ Delete
  const handleDelete = async () => {
    if (selected) {
      try {
        await fetch(`${BASE_URL}/delete_user/${selected.id}`, { 
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });
        toast.success("User deleted");
      } catch {
        toast.error("Failed to delete user");
      }
      await fetchUsers();
      handleClose();
    }
  };

  // 🔢 Pagination buttons
  const getPageNumbers = () => {
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, page + 2);
    if (page <= 2) end = Math.min(5, totalPages);
    if (page >= totalPages - 1) start = Math.max(totalPages - 4, 1);
    return Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);
  };

  return (
    <div className="p-6 min-w-full w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg font-bold">Users</h1>
        <button 
          onClick={() => handleOpen("add")} 
          className="px-4 cursor-pointer shadow-lg py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
        >
          + Add User
        </button>
      </div>

      {/* 🔎 Search */}
      <div className="mb-4 flex justify-between items-center gap-3">
        <input 
          type="text" 
          placeholder="Search users..." 
          value={search} 
          onChange={(e) => { 
            setPage(1); 
            setSearch(e.target.value); 
          }} 
          className="border px-3 py-2 rounded-lg w-1/3 text-xs focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
        />
        <div className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="w-full min-w-full justify-center items-center">
          <table className="min-w-full border border-gray-300 rounded shadow-xs">
            <thead className="min-w-full">
              <tr className="bg-gray-100 dark:bg-gray-900">
                <th className="p-2 text-xs px-7">Email</th>
                <th className="p-2 text-xs px-7">Name</th>
                <th className="p-2 text-xs px-7">Phone</th>
                <th className="p-2 text-xs px-7">Wallet</th>
                <th className="p-2 text-xs px-7">Level</th>
                <th className="p-2 text-xs px-7" >referal code</th>
                <th className="p-2 text-xs px-7">Actions</th>
              </tr>
            </thead>

            {users.length === 0 ? (
              <tbody className="min-w-full">
                <tr>
                  <td colSpan={6} className="text-center text-xs py-3 px-7">
                    No items...
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="text-center">
                    <td className="px-7 py-3 text-xs text-gray-500">{u.email}</td>
                    <td className="px-7 py-3 text-xs text-gray-500">
                      {[u.first_name, u.middle_name, u.last_name].filter(Boolean).join(" ")}
                    </td>
                    <td className="px-7 py-3 text-xs text-gray-500">{u.phone_number}</td>
                    <td className="px-7 py-3 text-xs text-gray-500">{u.wallet_balance}</td>
                    <td className="px-7 py-3 text-xs text-gray-500">{u.level}</td>
                    <td className="px-7 py-3 text-xs text-gray-500">{u.referal_code}</td>
                    <td className="px-7 py-3 flex justify-center gap-2">
                      <button
                        className="text-xs rounded"
                        onClick={() => handleOpen("view", u)}
                      >
                        <EyeIcon size={15} className="hover:text-indigo-600 cursor-pointer" />
                      </button>
                      <button
                        className="text-xs rounded"
                        onClick={() => handleOpen("edit", u)}
                      >
                        <PencilIcon size={15} className="hover:text-indigo-600 cursor-pointer" />
                      </button>
                      <button
                        className="text-xs rounded"
                        onClick={() => handleOpen("delete", u)}
                      >
                        <TrashIcon size={15} className="hover:text-indigo-600 cursor-pointer" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-2 mt-4">
            <button
              disabled={page === 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="px-3 py-1 border rounded disabled:opacity-50 text-xs cursor-pointer"
            >
              Prev
            </button>

            {getPageNumbers().map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1 cursor-pointer border text-xs rounded ${
                  p === page ? "bg-blue-600 text-white" : ""
                }`}
              >
                {p}
              </button>
            ))}

            <button
              disabled={page === totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="px-3 py-1 border rounded disabled:opacity-50 text-xs cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ✅ Modal */}
      {modalType && (
        <div className="shadow-2xl rounded-xl fixed inset-0 bg-black/50 bg-opacity-500 flex items-center justify-center z-50">
          <div className="bg-gray-50 text-xs dark:bg-gray-700 p-6 rounded-lg w-1/2 relative overflow-y-auto items-center justify-center">
            <button
              onClick={handleClose}
              className="absolute font-bold top-5 cursor-pointer hover:text-black text-xl right-2 text-gray-600"
            >
              ×
            </button>

            {modalType === "view" && selected && (
              <div className="flex flex-col gap-4">
              <div className="flex flex-row gap-8 text-xs">
                <button className="border-t-0 border-r-0 border-l-0 border-b-gray-800 border-b-2 p-2">user details</button>
                <button className="border-t-0 border-r-0 border-l-0 border-b-gray-800 border-b-2 p-2">user commisions</button>
                <button className="border-t-0 border-r-0 border-l-0 border-b-gray-800 border-b-2 p-2">user investment</button>
              
              </div>
              <hr/>
              <div className="flex flex-col justify-center gap-y-4">
                <h2 className="text-lg font-bold mb-4">User details</h2>
                <p className="text-sm"><strong>Email:</strong> {selected.email}</p>
                <p className="text-sm"><strong>Name:</strong> {[selected.first_name, selected.middle_name, selected.last_name].filter(Boolean).join(" ")}</p>
                <p className="text-sm"><strong>Phone:</strong> {selected.phone_number}</p>
                <p className="text-sm"><strong>Address:</strong> {selected.address}</p>
                <p className="text-sm"><strong>Wallet Balance:</strong> {selected.wallet_balance}</p>
                <p className="text-sm"><strong>Level:</strong> {selected.level}</p>
                <p className="text-sm"><strong>Active:</strong> {selected.is_active ? "Yes" : "No"}</p>
                <p className="text-sm"><strong>Staff:</strong> {selected.is_staff ? "Yes" : "No"}</p>
                <p className="text-sm"><strong>Superuser:</strong> {selected.is_superuser ? "Yes" : "No"}</p>
                <p className="text-sm"><strong>Joined:</strong> {new Date(selected.date_joined).toLocaleDateString()}</p>
                <p className="text-sm"><strong>recruited by:</strong> {selected.recruited_by}</p>
              </div>
              </div>
            )}

            {(modalType === "add" || modalType === "edit") && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full p-2 justify-center items-center">
                <h2 className="text-xl font-bold mb-4">
                  {modalType === "add" ? "Add User" : "Edit User"}
                </h2>

                <div className="flex items-center gap-7">
                  <div className="w-full">
                    <label className="text-xs">Email</label>
                    <input
                      {...register("email")}
                      placeholder="Email address"
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs">First Name</label>
                    <input
                      {...register("first_name")}
                      placeholder="First name"
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs">Middle Name</label>
                    <input
                      {...register("middle_name")}
                      placeholder="Middle name"
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs">Last Name</label>
                    <input
                      {...register("last_name")}
                      placeholder="Last name"
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs">Phone Number</label>
                    <input
                      {...register("phone_number")}
                      placeholder="Phone number"
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs">Wallet Balance</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("wallet_balance")}
                      placeholder="Wallet balance"
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs">Address</label>
                  <textarea
                    {...register("address")}
                    placeholder="Address"
                    rows={3}
                    className="w-full focus:outline-2 text-xs focus:-outline-offset-2 focus:outline-indigo-600 border p-2 rounded-lg"
                  />
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-xs">password</label>
                    <input  
                    placeholder="Password"
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600" {...register("password")} />
                    
                    {errors.password && (
                      <p className="text-red-500 text-xs">{errors.password.message}</p>
                    )}
                  </div>

                <div className="flex items-center gap-4">
                  
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="cursor-pointer" {...register("is_staff")} />
                    <label className="text-xs">Staff?</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="cursor-pointer" {...register("is_superuser")} />
                    <label className="text-xs">Superuser?</label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-900 cursor-pointer"
                >
                  {button_clicked === false ? (modalType === "add" ? "Add" : "Update") : "loading..."}
                </button>
              </form>
            )}

            {modalType === "delete" && selected && (
              <div className="flex flex-col">
                <h2 className="text-md font-bold mb-4">Delete User</h2>
                <p className="text-sm">
                  Are you sure you want to delete <strong>{selected.email}</strong>?
                </p>
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1 text-xs bg-red-600 text-white rounded"
                  >
                    {button_clicked === false ? "Yes, Delete" : "loading..."}
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-3 py-1 text-xs bg-gray-400 text-white rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}