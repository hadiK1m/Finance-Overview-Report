// src/app/(dashboard)/categories/page.tsx
import Header from "@/components/Header"; // Impor Header
import { sampleCategories } from "@/lib/category-data"
import { columns } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

export default function CategoriesPage() {
  const data = sampleCategories;

  return (
    <>
      <Header /> {/* Tambahkan Header di sini */}
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
              <h2 className="text-2xl font-bold tracking-tight">Categories List</h2>
              <p className="text-muted-foreground">
                  Here's a list of all product categories.
              </p>
          </div>
          <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Category
          </Button>
        </div>
        <DataTable columns={columns} data={data} />
      </div>
    </>
  );
}