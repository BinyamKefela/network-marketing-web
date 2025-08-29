"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getAuthToken } from "@/app/auth/login/api";
import { toast } from "react-toastify";
import { EyeIcon, PencilIcon, TrashIcon } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL; // 🔹 your Django endpoint

// ✅ Zod validation schema
const trainingSchema = z.object({
  name: z.string().min(2, "Name is required"),
});

type TrainingFormData = z.infer<typeof trainingSchema>;

type Training = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

export default function TrainingsPage() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Training | null>(null);
  const [modalType, setModalType] = useState<"add" | "edit" | "view" | "delete" | null>(null);
  const [buttonClicked, setButtonClicked] = useState(false);

  // 🔎 Search + Pagination
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ⏱️ Debounce search (1s after typing stops)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 1000);
    return () => clearTimeout(t);
  }, [search]);

  // ✅ Fetch trainings
  const fetchTrainings = async () => {
    setLoading(true);
    try {
      const url = `${BASE_URL}/get_trainings?page=${page}&search=${encodeURIComponent(
        debouncedSearch
      )}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      const data = await res.json();
      if (res.status === 200) {
        setTrainings(data.data || data.results || []);
        setTotalPages(data.total_pages || 1);
      } else {
        toast.error(data.error || "Failed to load trainings");
      }
    } catch {
      toast.error("Couldn't fetch trainings");
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Refetch when page or debouncedSearch changes
  useEffect(() => {
    fetchTrainings();
  }, [page, debouncedSearch]);

  // ✅ React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TrainingFormData>({
    resolver: zodResolver(trainingSchema),
  });

  const handleOpen = (type: typeof modalType, training?: Training) => {
    setModalType(type);
    setSelected(training || null);
    if (training) {
      reset({ name: training.name });
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
  const onSubmit = async (data: TrainingFormData) => {
    setButtonClicked(true);
    try {
      if (modalType === "add") {
        let result = await fetch(BASE_URL + "/post_training", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(data),
        });
        if (result.status === 201) toast.success("Created training successfully");
        else toast.error("Failed to create training");
      } else if (modalType === "edit" && selected) {
        let result = await fetch(`${BASE_URL}/update_training/${selected.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(data),
        });
        if (result.status === 200) toast.success("Updated training successfully");
        else toast.error("Failed to update training");
      }
      await fetchTrainings();
      handleClose();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setButtonClicked(false);
    }
  };

  // ✅ Delete
  const handleDelete = async () => {
    if (selected) {
      try {
        let result = await fetch(`${BASE_URL}/delete_training/${selected.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });
        if (result.status === 204) toast.success("Deleted training successfully");
        else toast.error("Failed to delete training");
      } catch {
        toast.error("Error deleting training");
      }
      await fetchTrainings();
      handleClose();
    }
  };

  // 🔢 Pagination (5 buttons centered)
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
        <h1 className="text-2xl font-bold">Trainings</h1>
        <button
          onClick={() => handleOpen("add")}
          className="px-4 shadow-lg py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          + Add Training
        </button>
      </div>

      {/* 🔎 Search */}
      <div className="mb-4 flex justify-between items-center gap-3">
        <input
          type="text"
          placeholder="Search trainings..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="border px-3 py-2 rounded-lg w-1/3"
        />
        <div className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="w-full">
          <table className="min-w-full border border-gray-300 rounded shadow-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-sm px-7">Name</th>
                <th className="p-2 text-sm px-7">Created At</th>
                <th className="p-2 text-sm px-7">Updated At</th>
                <th className="p-2 text-sm px-7">Actions</th>
              </tr>
            </thead>
            <tbody>
              {trainings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-3 px-7">
                    No trainings...
                  </td>
                </tr>
              ) : (
                trainings.map((t) => (
                  <tr key={t.id} className="text-center">
                    <td className="px-7 py-3 text-sm">{t.name}</td>
                    <td className="px-7 py-3 text-sm">
                      {new Date(t.created_at).toLocaleString()}
                    </td>
                    <td className="px-7 py-3 text-sm">
                      {new Date(t.updated_at).toLocaleString()}
                    </td>
                    <td className="px-7 py-3 flex justify-center gap-2">
                      <button onClick={() => handleOpen("view", t)}>
                        <EyeIcon size={20} />
                      </button>
                      <button onClick={() => handleOpen("edit", t)}>
                        <PencilIcon size={20} />
                      </button>
                      <button onClick={() => handleOpen("delete", t)}>
                        <TrashIcon size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* 🔢 Pagination controls */}
          <div className="flex justify-center items-center gap-2 mt-4">
            <button
              disabled={page === 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            {getPageNumbers().map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1 border rounded ${
                  p === page ? "bg-blue-600 text-white" : ""
                }`}
              >
                {p}
              </button>
            ))}
            <button
              disabled={page === totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ✅ Modal */}
      {modalType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-gray-50 p-6 rounded-lg w-1/2 relative">
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 text-xl font-bold text-gray-600"
            >
              x
            </button>

            {modalType === "view" && selected && (
              <div className="flex flex-col gap-y-3">
                <h2 className="text-xl font-bold mb-4">Training details</h2>
                <p><strong>Name:</strong> {selected.name}</p>
                <p><strong>Created At:</strong> {new Date(selected.created_at).toLocaleString()}</p>
                <p><strong>Updated At:</strong> {new Date(selected.updated_at).toLocaleString()}</p>
              </div>
            )}

            {(modalType === "add" || modalType === "edit") && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <h2 className="text-xl font-bold mb-4">
                  {modalType === "add" ? "Add Training" : "Edit Training"}
                </h2>
                <div>
                  <label className="text-sm">Name</label>
                  <input
                    {...register("name")}
                    className="w-full border p-2 rounded-lg"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm">{errors.name.message}</p>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg"
                >
                  {buttonClicked
                    ? "loading..."
                    : modalType === "add"
                    ? "Add"
                    : "Update"}
                </button>
              </form>
            )}

            {modalType === "delete" && selected && (
              <div>
                <h2 className="text-xl font-bold mb-4">Delete Training</h2>
                <p>
                  Are you sure you want to delete{" "}
                  <strong>{selected.name}</strong>?
                </p>
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded"
                  >
                    {buttonClicked ? "loading..." : "Yes, Delete"}
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 bg-gray-400 text-white rounded"
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
