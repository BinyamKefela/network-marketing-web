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
  level: z.coerce.number().min(0, "Level must be >= 0"),
  is_active: z.boolean(),
  is_staff: z.boolean(),
  is_superuser: z.boolean(),
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
  level: number;
  is_active: boolean;
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

  //Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 1000);
    return () => clearTimeout(t);
  }, [search]);

  // ✅ Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const url = `${BASE_URL}/get_users?page=${page}&search=${encodeURIComponent(debouncedSearch)}`;
      const res = await fetch(url, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` },
      });
      const data = await res.json();
      if (res.status === 200) {
        setUsers(data.data || data.results || []);
        setTotalPages(data.total_pages || 1);
      } else toast.error(data.error || "Failed to load users");
    } catch {
      toast.error("Couldn't fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [page, debouncedSearch]);

  // ✅ React Hook Form
  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

  const handleOpen = (type: typeof modalType, user?: User) => {
    setModalType(type);
    setSelected(user || null);
    if (user) reset({
      email: user.email,
      first_name: user.first_name,
      middle_name: user.middle_name,
      last_name: user.last_name,
      phone_number: user.phone_number,
      address: user.address,
      wallet_balance: user.wallet_balance,
      level: user.level,
      is_active: user.is_active,
      is_staff: user.is_staff,
      is_superuser: user.is_superuser,
    });
    else reset({});
  };
  const handleClose = () => { setModalType(null); setSelected(null); reset({}); };

  // ✅ Create / Update
  const onSubmit = async (data: UserFormData) => {
    setButtonClicked(true);
    if (modalType === "add") {
      try {
        const res = await fetch(BASE_URL + "/post_user", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` },
          body: JSON.stringify(data),
        });
        if (res.status === 201) toast.success("User created successfully");
        else toast.error("Failed to create user");
      } catch {
        toast.error("Couldn't create user");
      } finally { setButtonClicked(false); }
    } else if (modalType === "edit" && selected) {
      try {
        const res = await fetch(`${BASE_URL}/update_user/${selected.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` },
          body: JSON.stringify(data),
        });
        if (res.status === 200) toast.success("User updated successfully");
        else toast.error(res.status)
      } catch {
        toast.error("Failed to update user");
      } finally { setButtonClicked(false); }
    }
    await fetchUsers();
    handleClose();
  };

  // ✅ Delete
  const handleDelete = async () => {
    if (selected) {
      try {
        await fetch(`${BASE_URL}/delete_user/${selected.id}`, { method: "DELETE" });
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <button onClick={() => handleOpen("add")} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Add User</button>
      </div>

      {/* 🔎 Search */}
      <div className="mb-4 flex justify-between items-center gap-3">
        <input type="text" placeholder="Search users..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} className="border px-3 py-2 rounded-lg w-1/3"/>
        <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="w-full justify-center items-center">
          <table className="min-w-full border border-gray-300 rounded shadow-xs">
            <thead>
              <tr className="bg-gray-100 text-center">
                <th className="p-2 px-7 text-sm">Email</th>
                <th className="p-2 px-7 text-sm">Name</th>
                <th className="p-2 px-7 text-sm">Phone</th>
                <th className="p-2 px-7 text-sm">Wallet</th>
                <th className="p-2 px-7 text-sm">Level</th>
                <th className="p-2 px-7 text-sm">Actions</th>
              </tr>
            </thead>

            {users.length === 0 ? (
              <tbody><tr><td colSpan={6} className="text-center py-3">No users...</td></tr></tbody>
            ) : (
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="text-center">
                    <td className="px-7 py-3 text-sm">{u.email}</td>
                    <td className="px-7 py-3 text-sm">{[u.first_name,u.middle_name,u.last_name].filter(Boolean).join(" ")}</td>
                    <td className="px-7 py-3 text-sm">{u.phone_number}</td>
                    <td className="px-7 py-3 text-sm">{u.wallet_balance}</td>
                    <td className="px-7 py-3 text-sm">{u.level}</td>
                    <td className="px-7 py-3 flex justify-center gap-2">
                      <button onClick={() => handleOpen("view", u)}><EyeIcon size={20}/></button>
                      <button onClick={() => handleOpen("edit", u)}><PencilIcon size={20}/></button>
                      <button onClick={() => handleOpen("delete", u)}><TrashIcon size={20}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-2 mt-4">
            <button disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
            {getPageNumbers().map(p=>(
              <button key={p} onClick={()=>setPage(p)} className={`px-3 py-1 border rounded ${p===page?"bg-blue-600 text-white":""}`}>{p}</button>
            ))}
            <button disabled={page===totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
          </div>
        </div>
      )}

      {/* ✅ Modal */}
      {modalType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-gray-50 p-6 rounded-lg w-1/2 relative h-[80%] overflow-y-auto">
            <button onClick={handleClose} className="absolute top-5 right-2 text-xl font-bold text-gray-600 hover:text-black">x</button>

            {modalType==="view" && selected && (
              <div className="flex flex-col gap-y-3">
                <h2 className="text-xl font-bold mb-4">User details</h2>
                <p><strong>Email:</strong> {selected.email}</p>
                <p><strong>Name:</strong> {[selected.first_name,selected.middle_name,selected.last_name].filter(Boolean).join(" ")}</p>
                <p><strong>Phone:</strong> {selected.phone_number}</p>
                <p><strong>Wallet:</strong> {selected.wallet_balance}</p>
                <p><strong>Level:</strong> {selected.level}</p>
                <p><strong>Active:</strong> {selected.is_active ? "Yes" : "No"}</p>
                <p><strong>Staff:</strong> {selected.is_staff ? "Yes" : "No"}</p>
                <p><strong>Superuser:</strong> {selected.is_superuser ? "Yes" : "No"}</p>
                <p><strong>Joined:</strong> {selected.date_joined}</p>
              </div>
            )}

            {(modalType==="add" || modalType==="edit") && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full p-2">
                <h2 className="text-xl font-bold mb-4">{modalType==="add" ? "Add User" : "Edit User"}</h2>

                <div><label className="text-sm">Email</label>
                  <input {...register("email")} className="w-full border p-1 rounded-lg"/>
                  {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div><label className="text-sm">First Name</label><input {...register("first_name")} className="w-full border p-1 rounded-lg"/></div>
                  <div><label className="text-sm">Middle Name</label><input {...register("middle_name")} className="w-full border p-1 rounded-lg"/></div>
                  <div><label className="text-sm">Last Name</label><input {...register("last_name")} className="w-full border p-1 rounded-lg"/></div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-sm">Phone</label><input {...register("phone_number")} className="w-full border p-1 rounded-lg"/></div>
                  <div><label className="text-sm">Address</label><input {...register("address")} className="w-full border p-1 rounded-lg"/></div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-sm">Wallet Balance</label><input type="number" step="0.01" {...register("wallet_balance")} className="w-full border p-1 rounded-lg"/></div>
                  <div><label className="text-sm">Level</label><input type="number" {...register("level")} className="w-full border p-1 rounded-lg"/></div>
                </div>

                <div className="flex gap-4 items-center">
                  <div><input type="checkbox" {...register("is_active")}/> <label className="text-sm">Active?</label></div>
                  <div><input type="checkbox" {...register("is_staff")}/> <label className="text-sm">Staff?</label></div>
                  <div><input type="checkbox" {...register("is_superuser")}/> <label className="text-sm">Superuser?</label></div>
                </div>

                <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded-lg">{button_clicked?"Loading...":modalType==="add"?"Add":"Update"}</button>
              </form>
            )}

            {modalType==="delete" && selected && (
              <div>
                <h2 className="text-xl font-bold mb-4">Delete User</h2>
                <p>Are you sure you want to delete <strong>{selected.email}</strong>?</p>
                <div className="flex gap-4 mt-4">
                  <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded">{button_clicked?"Loading...":"Yes, Delete"}</button>
                  <button onClick={handleClose} className="px-4 py-2 bg-gray-400 text-white rounded">Cancel</button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
