"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getAuthToken } from "@/app/auth/login/api";
import { toast } from "react-toastify";
import { EyeIcon, PencilIcon, TrashIcon } from "lucide-react";
import { error } from "console";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// ✅ Zod schema
const packageSchema = z.object({
  name: z.string().min(2, "Name is required"),
  package_type: z.string().min(1, "Package type is required"),
  price: z.coerce.number().min(0, "Price must be >= 0"),
  cost: z.coerce.number().min(0,"cost mut be >=0"),
});

type PackageFormData = z.infer<typeof packageSchema>;

type Package = {
  id: number;
  name: string;
  package_type: string;
  price: number;
  cost: number;
  created_at: string;
  updated_at: string;
};

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Package | null>(null);
  const [modalType, setModalType] = useState<"add" | "edit" | "view" | "delete" | null>(null);
  const [button_clicked, setButtonClicked] = useState(false);

  //  Search + Pagination
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  //a state variable for holding products to add for a package
  const[products,setProducts] = useState([])
  const[trainings,setTrainings] = useState([])
  const [package_type,setPackageType] = useState("")

  //  Debounce search (1s)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 1000);
    return () => clearTimeout(t);
  }, [search]);

  //  Fetch packages
  const fetchPackages = async () => {
    setLoading(true);
    try {
      const url = `${BASE_URL}/get_packages?page=${page}&search=${encodeURIComponent(
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
        setPackages(data.data || data.results || []);
        setTotalPages(data.total_pages || 1);
      } else {
        toast.error(data.error || "Failed to load packages");
      }
    } catch {
      toast.error("Couldn't fetch packages");
    } finally {
      setLoading(false);
    }
  };

  // a method to fetch products
  const fetchProducts = async ()=>{
    setLoading(true)
    try {
      const url = `${BASE_URL}/get_products`

      const result = await fetch(url,{
        method:"GET",
        headers:{
          "Content-Type":"application/json",
          Authorization:`Bearer ${getAuthToken()}`
        }
      });
      const data:any = await result.json()
      if(result.status===200){
      setProducts(data?.data||[])
      }
      
    } catch (error) {
      
    }
    finally{
      setLoading(false)
    }
  };

  const handleProductClick = (id: any) => {
  setProducts((prev: any) => {
    const exists = prev.some((p:any) => p.id === id.id);
    if (exists) {
      return prev.filter((p:any) => p.id !== id); // remove
    } else {
      return [...prev, id ]; 
    }
  });
};

const handleTrainingClick = (id: any) => {
  setTrainings((prev: any) => {
    const exists = prev.some((p:any) => p.id === id.id);
    if (exists) {
      return prev.filter((p:any) => p.id !== id); // remove
    } else {
      return [...prev, id ]; 
    }
  });
};

const fetchTrainings = async ()=>{
    setLoading(true)
    try {
      const url = `${BASE_URL}/get_trainings`
      const result = await fetch(url,{
        method:"GET",
        headers:{
          "Content-Type":"application/json",
          Authorization:`Bearer ${getAuthToken()}`
        }
      });
      const data:any = await result.json()
      if(result.status===200){
      setTrainings(data?.data||[])
      }
    } catch (error) {
      
    }
    finally{
      setLoading(false)
    }
  };


  // a method to create product_packages
  const post_product_package = async ({product_ids,package_id}:{product_ids:number[],package_id:number})=>{
    try {
      const url = `${BASE_URL}/add_products_to_package`

      const result = await fetch(url,{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "Authorization":`Bearer ${getAuthToken}`,
        },
        body:JSON.stringify({"product":product_ids,"package":package_id})
      }); 
    } catch (error) {
      
    }
    finally{
    }
  }

  useEffect(() => {
    fetchProducts();
    fetchPackages();
    fetchTrainings();
    
  }, [page, debouncedSearch]);

  //  Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PackageFormData>({
    resolver: zodResolver(packageSchema),
  });

  const handleOpen = (type: typeof modalType, pkg?: Package) => {
    setModalType(type);
    setSelected(pkg || null);
    if (pkg) {
      reset({
        name: pkg.name,
        package_type: pkg.package_type,
        price: pkg.price,
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
  const onSubmit = async (data: PackageFormData) => {
    setButtonClicked(true);
    if (modalType === "add") {
      try {
        let result = await fetch(BASE_URL + "/post_package", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(data),
        });
        if (result.status == 201) toast.success("Created package successfully");
        else toast.error("Failed to create package");
      } catch {
        toast.error("Couldn't create package");
      } finally {
        setButtonClicked(false);
      }
    } else if (modalType === "edit" && selected) {
      try {
        let result = await fetch(`${BASE_URL}/update_package/${selected.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(data),
        });
        if (result.status == 200) toast.success("Updated package successfully");
      } catch {
        toast.error("Failed to update package");
      } finally {
        setButtonClicked(false);
      }
    }
    await fetchPackages();
    handleClose();
  };



  //  Delete
  const handleDelete = async () => {
    if (selected) {
      await fetch(`${BASE_URL}/delete_package/${selected.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      await fetchPackages();
      handleClose();
    }
  };

  //  Pagination buttons (5 max, centered)
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
        <h1 className="text-lg font-bold">Packages</h1>
        <button
          onClick={() => handleOpen("add")}
          className="px-4 cursor-pointer shadow-lg py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
        >
          + Add Package
        </button>
      </div>

      {/*  Search */}
      <div className="mb-4 flex justify-between items-center gap-3">
        <input
          type="text"
          placeholder="Search packages..."
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
        <div className="w-full justify-center items-center">
          <table className="min-w-full border border-gray-300 rounded shadow-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-xs px-7">name</th>
                <th className="p-2 text-xs px-7">type</th>
                <th className="p-2 text-xs px-7">price</th>
                <th className="p-2 text-xs px-7">cost</th>
                <th className="p-2 text-xs px-7">actions</th>
              </tr>
            </thead>

            {packages.length == 0 ? (
              <tbody>
                <tr>
                  <td colSpan={4} className="text-center text-xs py-3 px-7">
                    No items...
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {packages?.map((pkg) => (
                  <tr key={pkg.id} className="text-center">
                    <td className="px-7 py-3 text-xs text-gray-500">{pkg.name}</td>
                    <td className="px-7 py-3 text-xs text-gray-500">{pkg.package_type}</td>
                    <td className="px-7 py-3 text-xs text-gray-500">{pkg.price}</td>
                    <td className="px-7 py-3 text-xs text-gray-500">{pkg?.cost}</td>
                    <td className="px-7 py-3 flex justify-center gap-2">
                      <button className="text-xs rounded" onClick={() => handleOpen("view", pkg)}>
                        <EyeIcon size={15} className="hover:text-indigo-600 cursor-pointer" />
                      </button>
                      <button className="text-xs rounded" onClick={() => handleOpen("edit", pkg)}>
                        <PencilIcon size={15} className="hover:text-indigo-600 cursor-pointer" />
                      </button>
                      <button className="text-xs rounded" onClick={() => handleOpen("delete", pkg)}>
                        <TrashIcon size={15} className="hover:text-indigo-600 cursor-pointer" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>

          {/*  Pagination */}
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
        <div className="shadow-2xl rounded-xl fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-gray-50 p-6 rounded-lg w-1/2 relative overflow-y-auto items-center justify-center">
            <button
              onClick={handleClose}
              className="absolute font-bold top-5 cursor-pointer hover:text-black text-xl right-2 text-gray-600"
            >
              x
            </button>

            {modalType === "view" && selected && (
              <div className="flex flex-col gap-y-4">
                <h2 className="text-lg font-bold mb-4">Package details</h2>
                <p className="text-sm">
                  <strong>Name:</strong> {selected.name}
                </p>
                <p className="text-sm">
                  <strong>Type:</strong> {selected.package_type}
                </p>
                <p className="text-sm">
                  <strong>Price:</strong> {selected.price}
                </p>
              </div>
            )}

            {(modalType === "add" || modalType === "edit") && (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4 w-full p-2 justify-center items-center"
              >
                <h2 className="text-xl font-bold mb-4">
                  {modalType === "add" ? "Add Package" : "Edit Package"}
                </h2>

                <div className="flex gap-7">
                <div className="w-full">
                  <label className="text-xs">Name</label>
                  <input
                    {...register("name")}
                    placeholder="package name"
                    className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs">{errors.name.message}</p>
                  )}
                </div>

                <div className="w-full">
                  <label htmlFor="package_type" className="text-xs">
                    Type
                  </label>
                  <select
                    id="package_type"
                    {...register("package_type")}
                    className="w-full text-xs border p-2 rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select type
                    </option>
                    <option value="product">Product</option>
                    <option value="service">Service</option>
                  </select>
                  {errors.package_type && (
                    <p className="text-red-500 text-xs">{errors.package_type.message}</p>
                  )}
                </div>
                </div>

                <div className="flex gap-7">
                  <div className="w-full"><label className="text-xs">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("price")}
                    placeholder="price"
                    className="w-full border text-xs p-2 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 rounded-lg"
                  />
                  {errors.price && (
                    <p className="text-red-500 text-xs">{errors.price.message}</p>
                  )}</div>

                  <div className="w-full">
                    <label className="text-xs" >cost</label>
                    <input {...register("cost")} step="0.01"
                    placeholder="cost"
                    className="w-full border text-xs p-2 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 rounded-lg"
                    />
                    {errors.cost && (
                    <p className="text-red-500 text-xs">{errors.cost.message}</p>
                  )}
                  </div>
                </div>
                <label className="text-xs">Select Products</label>
                <div className=" gap-7 grid-cols-3 grid ">
                  {products?.map((_:any,index)=>(
                    <div key={index} className="flex gap-2">
                      <input type="checkbox" name="product" value={_.id} onClick={()=>handleProductClick({id:_.id,name:_.name})} />
                      <label className="text-xs">{_.name}</label>
                    </div>
                  ))}
                </div>

                <label className="text-xs">Select trainings</label>
                <div className=" gap-7 grid-cols-3 grid ">
                  {trainings?.map((_:any,index)=>(
                    <div key={index} className="flex gap-2">
                      <input type="checkbox" name="training" value={_.id} onClick={()=>handleTrainingClick({id:_.id,name:_.name})} />
                      <label className="text-xs">{_.name}</label>
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-900 cursor-pointer"
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
              <div className="flex flex-col">
                <h2 className="text-md font-bold mb-4">Delete Package</h2>
                <p className="text-sm">
                  Are you sure you want to delete <strong>{selected.name}</strong>?
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
