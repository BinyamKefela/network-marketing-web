'use client'
import UserModal from '@/components/my components/modals/user-modal'
import { Delete, DeleteIcon, EditIcon, Eye, Trash, ViewIcon } from 'lucide-react'
import React, { useEffect, useState, useRef } from 'react'
import { useCreateUser, useDeleteUser, useUpdateUser, useUsers } from '@/app/api/user'
import type { UserInput } from '@/schemas/user-schema'
import UserForm from '@/components/forms/user-form'

function DataTable() {
  const [data, setData] = useState<any[]>([])
  const [error, setError] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [total_pages, setTotal_Pages] = useState<number>(0)
  const [page, setPage] = useState<number>(1)
  const [page_size] = useState<number>(5)
  const [text, setText] = useState<string>("")
  const [total_items, setTotal_Items] = useState<number>(0)

  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  // 👇 one fetch function for both search + pagination
  const fetchData = async (searchText: string, currentPage: number) => {
    setLoading(true)
    try {
      const res = await fetch(
        `https://alphapms.sunriseworld.org/api/get_users?search=${searchText}&page=${currentPage}&page_size=${page_size}`,
        {
          headers: {
            Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU2MjIwNDcwLCJpYXQiOjE3NTYxMzQwNzAsImp0aSI6ImZlYjBmYzE4YTU1NTQ2YzA4Y2NhNGQxZjA0YjY5ZGZlIiwidXNlcl9pZCI6MX0.cJkHxvez_N2ZomwIjLVvybDHRgAY8nKxiezGJ5USBwE"
          }
        }
      )
      const json = await res.json()
      setData(json.data || [])
      setTotal_Pages(json.total_pages || 0)
      setTotal_Items(json.count || 0) // backend should return this
    } catch (err: any) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  // 🔍 debounce search
  const handleSearch = (value: string) => {
    setText(value)
    setPage(1)
  }

  // ⏳ debounce effect for search + pagination
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      fetchData(text, page)
    }, 1000) // wait 1s after typing
  }, [text, page])

  // 📄 handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > total_pages) return
    setPage(newPage)
    fetchData(text, newPage)
  }

  // 🔄 initial fetch
  useEffect(() => {
    fetchData("", 1)
  }, [])

  if (error) return <div>Error: {error.message}</div>

  // 📊 calculate item range
  const startItem = (page - 1) * page_size + 1
  const endItem = Math.min(page * page_size, total_items)

  return (
    <div className='m-4 ml-30'>
      {/* Header: Title only */}
      <h1 className="text-lg font-bold mb-4">Users</h1>

      {/* Search + Button on same row */}
      <div className="flex justify-between items-center gap-4">
        <input
          type='text'
          placeholder='Search...'
          className='border p-2 rounded-md w-full max-w-sm'
          value={text}
          onChange={e => handleSearch(e.target.value)}
        />

        
        <UserModal IsOpen={false} children={UserForm} title='User registration' />
      </div>

      

      {/* Table container with horizontal scroll */}
      <div className="mt-3 border rounded-lg shadow-sm bg-white overflow-x-auto">
        <table className="min-w-full max-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr className='hover:bg-gray-200'>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">ID</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Name</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Email</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Address</th>
              <th></th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr
                key={item.id}
                className={idx % 2 === 0 ? "bg-white hover:bg-gray-200" : "bg-gray-50 hover:bg-gray-200"}
              >
                <td className="px-3 py-2 border-b text-sm">{item.id}</td>
                <td className="px-3 py-2 border-b text-sm">{item.name}</td>
                <td className="px-3 py-2 border-b text-sm">{item.email}</td>
                <td className="px-3 py-2 border-b text-sm">{item.address}</td>
                <td className="px-3 py-2 border-b text-sm"><button><EditIcon/></button></td>
                <td className="px-3 py-2 border-b text-sm"><button><Eye/></button></td>
                <td className="px-2 py-1 border-b text-sm "><button><Trash/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* footer: info + pagination */}
      <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-2">
        <div className="text-sm text-gray-600">
          Showing {startItem}-{endItem} of {total_items} users
        </div>

        <div className='flex gap-2 flex-wrap'>
          <button
            disabled={page === 1}
            onClick={() => handlePageChange(page - 1)}
            className={`border p-1 text-sm rounded-md 
              hover:text-white hover:bg-gray-800 ${page === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Previous
          </button>

          {Array.from({ length: total_pages }).map((_, idx) => {
            const pageNum = idx + 1
            if (pageNum >= page - 2 && pageNum <= page + 2) {
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`border p-2 text-sm rounded-md 
                    hover:text-white hover:bg-gray-800 ${page === pageNum ? 'bg-gray-800 text-white' : ''}`}
                >
                  {pageNum}
                </button>
              )
            }
            return null
          })}

          <button
            disabled={page === total_pages}
            onClick={() => handlePageChange(page + 1)}
            className={`border p-1 text-sm rounded-md 
              hover:text-white hover:bg-gray-800 ${page === total_pages ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Next
          </button>
          
        </div>
      </div>
    </div>
  )
}

export default DataTable
