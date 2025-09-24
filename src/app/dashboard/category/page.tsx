"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getAuthToken } from "@/app/auth/login/api";
import { toast } from "react-toastify";
import { EyeIcon, PencilIcon, TrashIcon } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL; // ✅ change to your Django endpoint

// ✅ Zod schema for validation
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
  const [button_clicked, setButtonClicked] = useState(false);

  //  Search + Pagination
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize,setPageSize] = useState(5);

  //  Debounce search (1s after typing stops)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 1000);
    return () => clearTimeout(t);
  }, [search]);

  //  Fetch categories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const url = `${BASE_URL}/get_categories?page=${page}&page_size=${pageSize}&ordering=-id&search=${encodeURIComponent(
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
        setCategories(data.data || data.results || []);
        setTotalPages(data.total_pages || 1);
      } else {
        toast.error(data.error || "Failed to load categories");
      }
    } catch {
      toast.error("Couldn't fetch data");
    } finally {
      setLoading(false);
    }
  };

  //  Fetch when page or debouncedSearch changes
  useEffect(() => {
    fetchCategories();
  }, [page, debouncedSearch, pageSize]);

  //  React Hook Form
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

  //  Create / Update
  const onSubmit = async (data: CategoryFormData) => {
    setButtonClicked(true);
    if (modalType === "add") {
      try {
        const result = await fetch(BASE_URL + "/post_category", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(data),
        });
        if (result.status == 201) toast.success("Created category successfully");
        else toast.error("Failed to create category");
      } catch {
        toast.error("Couldn't create category");
      } finally {
        setButtonClicked(false);
      }
    } else if (modalType === "edit" && selected) {
      try {
        const result = await fetch(`${BASE_URL}/update_category/${selected.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(data),
        });
        if (result.status == 200) toast.success("Updated category successfully");
        else toast.error("Failed to update category");
      } catch {
        toast.error("Couldn't update category");
      } finally {
        setButtonClicked(false);
      }
    }
    await fetchCategories();
    handleClose();
  };

  //  Delete
  const handleDelete = async () => {
    if (selected) {
      try {
        const result = await fetch(`${BASE_URL}/delete_category/${selected.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });
        if (result.status === 204) toast.success("Category deleted");
        else toast.error("Failed to delete category");
      } catch {
        toast.error("Couldn't delete category");
      }
      await fetchCategories();
      handleClose();
    }
  };

  //  Pagination buttons (max 5, current centered)
  const getPageNumbers = () => {
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, page + 2);

    if (page <= 2) end = Math.min(5, totalPages);
    if (page >= totalPages - 1) start = Math.max(totalPages - 4, 1);

    return Array.from(
      { length: Math.max(0, end - start + 1) },
      (_, i) => start + i
    );
  };

  const handlePageSizeChange = async (size:number)=>{
     setPageSize(size);
    
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg font-bold">Categories</h1>
        <button
          onClick={() => handleOpen("add")}
          className="px-4 text-xs cursor-pointer  shadow-lg py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add Category
        </button>
      </div>

      {/*  Search */}
      <div className="mb-4 flex justify-between items-center gap-3">
        <div>
        <input
          type="text"
          placeholder="Search categories..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="border text-xs px-3 py-2 rounded-lg"
        />
        <select className="ml-4 border text-xs px-3 py-2 rounded-lg" value={pageSize} onChange={(e)=>{
          handlePageSizeChange(Number(e.target.value));
        }}>
          <option className="dark:bg-gray-700" value={5}>5</option>
          <option className="dark:bg-gray-700" value={10}>10</option>
          <option className="dark:bg-gray-700" value={20}>20</option>
          <option className="dark:bg-gray-700" value={50}>50</option>
          <option className="dark:bg-gray-700" value={99999}>all</option>
        </select>
        
        </div>
        <div className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="w-full justify-center items-center">
          <table className="min-w-full border border-gray-300 rounded shadow-xs">
            <thead>
              <tr className="bg-gray-100  dark:bg-gray-900">
                <th className="p-2 text-xs px-7">#</th>
                <th className="p-2 text-xs px-7">name</th>
                <th className="p-2 text-xs px-7">description</th>
                <th className="p-2 text-xs px-7">created At</th>
                <th className="p-2 text-xs px-7">actions</th>
              </tr>
            </thead>

            {categories.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={4} className="text-center py-3 px-7">
                    No items...
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {categories.map((c,index) => (
                  <tr key={c.id} className="text-center">
                    <td className="px-7 py-3 text-xs text-gray-500">{index+1}</td>
                    <td className="px-7 py-3 text-xs text-gray-500">{c.name}</td>
                    <td className="px-7 py-3 text-xs text-gray-500">{c.description || "-"}</td>
                    <td className="px-7 py-3 text-xs text-gray-500">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-7 py-3 flex justify-center gap-2">
                      <button onClick={() => handleOpen("view", c)}>
                        <EyeIcon size={15} className="hover:text-indigo-500 cursor-pointer" />
                      </button>
                      <button onClick={() => handleOpen("edit", c)}>
                        <PencilIcon size={15} className="hover:text-indigo-500 cursor-pointer"  />
                      </button>
                      <button onClick={() => handleOpen("delete", c)}>
                        <TrashIcon size={15} className="hover:text-indigo-500 cursor-pointer" />
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
              className="px-3 text-xs py-1 border cursor-pointer rounded disabled:opacity-50"
            >
              Prev
            </button>

            {getPageNumbers().map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1 text-xs cursor-pointer border rounded ${
                  p === page ? "bg-blue-600 text-white" : ""
                }`}
              >
                {p}
              </button>
            ))}

            <button
              disabled={page === totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="px-3 text-xs py-1 cursor-pointer border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/*  Modal */}
      {modalType && (
        <div className="shadow-2xl rounded-xl fixed inset-0  bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-50 dark:bg-gray-800  p-6 rounded-lg w-1/2 relative  overflow-y-auto">
            <button
              onClick={handleClose}
              className="absolute font-bold top-5 hover:text-black text-xl cursor-pointer right-2 text-gray-600"
            >
              x
            </button>

            {modalType === "view" && selected && (
              <div className="flex flex-col gap-y-3">
                <h2 className="text-lg font-bold mb-4">Category details</h2>
                <p className="text-sm"><strong>Name:</strong> {selected.name}</p>
                <p className="text-sm"><strong>Description:</strong> {selected.description || "-"}</p>
                <p className="text-sm"><strong>Created At:</strong> {new Date(selected.created_at).toLocaleString()}</p>
                <p className="text-sm"><strong>Updated At:</strong> {new Date(selected.updated_at).toLocaleString()}</p>
              </div>
            )}

            {(modalType === "add" || modalType === "edit") && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full p-2">
                <h2 className="text-lg font-bold mb-4">
                  {modalType === "add" ? "Add Category" : "Edit Category"}
                </h2>

                <div className="flex flex-col">
                  <label className="text-xs">Name</label>
                  <input
                    {...register("name")}
                    className="text-xs border p-2 rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600" placeholder="category name"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs">Description</label>
                  <textarea
                    {...register("description")}
                    className="w-full border text-xs p-2 rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    placeholder="description..."
                    cols={10}
                    rows={8}
                  />
                </div>

                <button
                  type="submit"
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-900"
                  disabled={button_clicked}
                >
                  {button_clicked === false
                    ? modalType === "add"
                      ? "Add"
                      : "Update"
                    : "loading..."}
                </button>
              </form>
            )}

            {modalType === "delete" && selected && (
              <div>
                <h2 className="text-md text-xs font-bold mb-4">Delete Category</h2>
                <p>
                  Are you sure you want to delete{" "}
                  <strong>{selected.name}</strong>?
                </p>
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white cursor-pointer text-xs rounded"
                  >
                    {button_clicked === false ? "Yes, Delete" : "loading..."}
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 text-xs bg-gray-400 cursor-pointer text-white rounded"
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
