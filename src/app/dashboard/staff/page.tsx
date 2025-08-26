import { DataTable } from "@/components/tables/payments/data-table";
import { columns, Payment } from "../../../components/tables/payments/column";


async function getData(): Promise<Payment[]> {
  // Fetch data from your API here.
  return [
    {
      id: "728ed52f",
      amount: 100,
      status: "pending",
      email: "m@example.com",
    },
    // ...
  ]
}


export default async function StaffPage() {
    const data = await getData()
    return (
        <div className="justify-center justify-items-center ml-50">
            <h1 className="mb-10">Staff</h1>
            <DataTable columns={columns} data={data} />
        </div>
    );
}