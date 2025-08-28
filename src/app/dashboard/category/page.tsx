"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getAuthToken } from "@/app/auth/login/api";
import { toast } from "react-toastify";
import { DeleteIcon, EditIcon, EyeIcon, PencilIcon, Trash2Icon, ViewIcon } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// ✅ Zod schema for Category
const categorySchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

type Category = {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Category | null>(null);
  const [modalType, setModalType] = useState<
    "add" | "edit" | "view" | "delete" | null
  >(null);

  // ✅ Fetch all categories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(BASE_URL + "/get_categories", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      const data = await res.json();
      if (res.status === 200) {
        setCategories(data.results || data.data || []);
      } else {
        toast.error(data.error || "Failed to load categories");
      }
    } catch (error) {
      toast.error("Couldn't fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ✅ React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  const handleOpen = (type: typeof modalType, category?: Category) => {
    setModalType(type);
    setSelected(category || null);
    if (category) {
      reset({
        name: category.name,
        description: category.description,
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
  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (modalType === "add") {
        await fetch(BASE_URL + "/post_category", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(data),
        });
        toast.success("Category added");
      } else if (modalType === "edit" && selected) {
        await fetch(`${BASE_URL}/update_category/${selected.id}/`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(data),
        });
        toast.success("Category updated");
      }
      await fetchCategories();
      handleClose();
    } catch (error) {
      toast.error("Error saving category");
    }
  };

  // ✅ Delete
  const handleDelete = async () => {
    if (selected) {
      try {
        await fetch(`${BASE_URL}/delete_category/${selected.id}/`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });
        toast.success("Category deleted");
        await fetchCategories();
        handleClose();
      } catch (error) {
        toast.error("Error deleting category");
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg font-bold">Categories</h1>
        <button
          onClick={() => handleOpen("add")}
          className="px-4 shadow-lg py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          + Add Category
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="w-full justify-center items-center rounded-lg">
          <table className="w-full border border-gray-300 rounded-lg shadow-xs p-20">
            <thead className="w-full">
              <tr className="bg-gray-200 w-full">
                <th className="p-2  text-sm px-7">Name</th>
                <th className="p-2  text-sm px-7">Description</th>
                <th className="p-2  text-sm px-7">Actions</th>
              </tr>
            </thead>
            {categories.length === 0 ? (
              <tbody className="w-full">
                <tr>
                  <td colSpan={3} className="text-center p-4">
                    No categories found
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="p-80">
                {categories.map((c) => (
                  <tr key={c.id} className="text-center">
                    <td className=" px-7 py-3 text-sm">{c.name}</td>
                    <td className=" px-7 py-3 text-sm">{c.description}</td>
                    <td className=" px-7 py-3 flex justify-center gap-2">
                      <button
                        className="  text-xs  rounded"
                        onClick={() => handleOpen("view", c)}
                      >
                        <EyeIcon/>
                      </button>
                      <button
                        className="  text-xs  rounded"
                        onClick={() => handleOpen("edit", c)}
                      >
                        <PencilIcon/>
                      </button>
                      <button
                        className="  text-xs  rounded"
                        onClick={() => handleOpen("delete", c)}
                      >
                        <Trash2Icon/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
      )}

      {/* ✅ Modal */}
      {modalType && (
        <div className="shadow-2xl rounded-lg fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-50 p-6 rounded-lg w-1/2 relative h-[60%] overflow-y-auto items-center justify-center">
            <button
              onClick={handleClose}
              className="absolute font-bold top-5 hover:text-black text-xl right-2 text-gray-600"
            >
              x
            </button>

            {modalType === "view" && selected && (
              <div>
                <h2 className="text-xl font-bold mb-4">View Category</h2>
                <p>
                  <strong>Name:</strong> {selected.name}
                </p>
                <p>
                  <strong>Description:</strong> {selected.description}
                </p>
                <p>
                  <strong>Created At:</strong>{" "}
                  {new Date(selected.created_at).toLocaleString()}
                </p>
                <p>
                  <strong>Updated At:</strong>{" "}
                  {new Date(selected.updated_at).toLocaleString()}
                </p>
              </div>
            )}

            {(modalType === "add" || modalType === "edit") && (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4 w-full p-2 justify-center items-center"
              >
                <h2 className="text-xl font-bold mb-4">
                  {modalType === "add" ? "Add Category" : "Edit Category"}
                </h2>

                <div className="w-[60%]">
                  <label className="text-sm">Name</label>
                  <input
                    {...register("name")}
                    className="w-full border p-1 rounded-lg"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm">Description</label>
                  <textarea
                    {...register("description")}
                    className="w-full border p-1 rounded-lg"
                  />
                </div>

                <button
                  type="submit"
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg"
                >
                  {modalType === "add" ? "Add" : "Update"}
                </button>
              </form>
            )}

            {modalType === "delete" && selected && (
              <div>
                <h2 className="text-xl font-bold mb-4">Delete Category</h2>
                <p>
                  Are you sure you want to delete{" "}
                  <strong>{selected.name}</strong>?
                </p>
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded"
                  >
                    Yes, Delete
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
