"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { headers } from "next/headers";
import { getAuthToken } from "@/app/auth/login/api";
import { toast } from "react-toastify";
import { EyeIcon, PencilIcon, TrashIcon } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL; // 🔹 change to your Django endpoint

// ✅ Zod validation schema (Training)
const trainingSchema = z.object({
  name: z.string().min(2, "Name is required"),
  price: z.coerce.number().min(0, "Price must be >= 0"),
  cost: z.coerce.number().min(0, "Cost must be >= 0"),
});

type TrainingFormData = z.infer<typeof trainingSchema>;

type Training = {
  id: number;
  name: string;
  price: number;
  cost: number;
  created_at: string;
  updated_at: string;
};

export default function TrainingsPage() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Training | null>(null);
  const [modalType, setModalType] = useState<"add" | "edit" | "view" | "delete" | null>(null);
  const [button_clicked, setButtonClicked] = useState(false);

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

  // ✅ Fetch trainings (with search + pagination)
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
      toast.error("Couldn't fetch data");
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Fetch when page or debouncedSearch changes
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
    resolver: zodResolver(trainingSchema) as any,
  });

  const handleOpen = (type: typeof modalType, training?: Training) => {
    setModalType(type);
    setSelected(training || null);
    if (training) {
      reset({
        name: training.name,
        price: training.price,
        cost: training.cost,
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
  const onSubmit = async (data: TrainingFormData) => {
    setButtonClicked(true);
    if (modalType === "add") {
      try {
        const result = await fetch(BASE_URL + "/post_training", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(data),
        });
        if (result.status == 201) toast.success("created training successfully");
        else toast.error("failed to create training");
      } catch (error) {
        toast.error("couldn't create training");
      } finally {
        setButtonClicked(false);
      }
    } else if (modalType === "edit" && selected) {
      try {
        const result = await fetch(`${BASE_URL}/update_training/${selected.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(data),
        });
        if (result.status == 200) toast.success("updated training succesfully");
      } catch (error) {
        toast.error("failed to update training");
      } finally {
        setButtonClicked(false);
      }
    }
    await fetchTrainings();
    handleClose();
  };

  // ✅ Delete
  const handleDelete = async () => {
    if (selected) {
      try {
        await fetch(`${BASE_URL}/delete_training/${selected.id}/`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });
        toast.success("training deleted");
      } catch {
        toast.error("failed to delete training");
      }
      await fetchTrainings();
      handleClose();
    }
  };

  // Pagination buttons (max 5, current centered)
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
        <h1 className="text-lg font-bold">Trainings</h1>
        <button
          onClick={() => handleOpen("add")}
          className="px-4 cursor-pointer shadow-lg py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
        >
          + Add Training
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 flex justify-between items-center gap-3">
        <input
          type="text"
          placeholder="Search trainings..."
          value={search}
          onChange={(e) => {
            setPage(1); // reset to page 1 when search changes
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
        <div className="w-[100%] justify-center items-center">
          <table className="min-w-full border border-gray-300 rounded shadow-xs">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-900">
                <th className="p-2  text-xs px-7">Name</th>
                <th className="p-2  text-xs px-7">Price</th>
                <th className="p-2  text-xs px-7">Cost</th>
                <th className="p-2  text-xs px-7">Actions</th>
              </tr>
            </thead>

            {trainings.length == 0 ? (
              <tbody>
                <tr>
                  <td colSpan={4} className="text-center text-xs py-3 px-7">
                    No items...
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {trainings?.map((t) => (
                  <tr key={t.id} className="text-center">
                    <td className=" px-7 py-3 text-xs">{t.name}</td>
                    <td className=" px-7 py-3 text-xs">{t.price}</td>
                    <td className=" px-7 py-3 text-xs">{t.cost}</td>
                    <td className=" px-7 py-3 flex justify-center gap-2">
                      <button
                        className="text-xs rounded"
                        onClick={() => handleOpen("view", t)}
                      >
                        <EyeIcon size={15} className="hover:text-indigo-600 cursor-pointer" />
                      </button>
                      <button
                        className="text-xs rounded"
                        onClick={() => handleOpen("edit", t)}
                      >
                        <PencilIcon size={15} className="hover:text-indigo-600 cursor-pointer" />
                      </button>
                      <button
                        className="text-xs rounded"
                        onClick={() => handleOpen("delete", t)}
                      >
                        <TrashIcon size={15} className="hover:text-indigo-600 cursor-pointer" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>

          {/* Pagination controls */}
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
        <div className=" shadow-2xl rounded-xl fixed inset-0 bg-black/50  bg-opacity-500 flex items-center justify-center z-50">
          <div className="bg-gray-50 p-6 rounded-lg w-1/2 relative  overflow-y-auto items-center justify-center">
            <button
              onClick={handleClose}
              className="absolute font-bold top-5 cursor-pointer hover:text-black text-xl right-2 text-gray-600"
            >
              x
            </button>

            {modalType === "view" && selected && (
              <div className="flex flex-col justify-center gap-y-4">
                <h2 className="text-lg font-bold mb-4">Training details</h2>
                <p className="text-sm"><strong>Name:</strong> {selected.name}</p>
                <p className="text-sm"><strong>Price:</strong> {selected.price}</p>
                <p className="text-sm"><strong>Cost:</strong> {selected.cost}</p>
              </div>
            )}

            {(modalType === "add" || modalType === "edit") && (
              <form onSubmit={handleSubmit(onSubmit)} className="  space-y-4 w-full p-2 justify-center items-center">
                <h2 className="text-xl font-bold mb-4">
                  {modalType === "add" ? "Add Training" : "Edit Training"}
                </h2>

                <div className="flex  items-center gap-7">
                  <div className="focus:ring-blue-500">
                    <label className="text-xs">Name</label>
                    <input
                      {...register("name")}
                      placeholder="training name"
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs">{errors.name.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("price")}
                      placeholder="price"
                      className="w-full border text-xs focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 p-2 rounded-lg"
                    />
                    {errors.price && (
                      <p className="text-red-500 text-xs">{errors.price.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs">Cost</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("cost")}
                      placeholder="cost"
                      className="w-full border text-xs p-2 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 rounded-lg"
                    />
                    {errors.cost && (
                      <p className="text-red-500 text-xs">{errors.cost.message}</p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-900 cursor-pointer"
                >
                  {button_clicked===false?(modalType === "add" ? "Add" : "Update"):"loading..."}
                </button>
              </form>
            )}

            {modalType === "delete" && selected && (
              <div className="flex flex-col">
                <h2 className="text-md font-bold mb-4">Delete Training</h2>
                <p className="text-sm">
                  Are you sure you want to delete <strong>{selected.name}</strong>?
                </p>
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1 text-xs bg-red-600 text-white rounded"
                  >
                    {button_clicked===false?"Yes, Delete":"loading..."}
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
