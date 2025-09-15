'use client'

import DT from 'datatables.net-dt'
import DataTable from 'datatables.net-react'
import Responsive from 'datatables.net-responsive-dt'
import { useMemo } from 'react'

DataTable.use(DT)
DataTable.use(Responsive)

type Person = {
  name: string
  position: string
  office: string
  age: number
  start: string
  salary: string
}

export default function Page() {
  const data: Person[] = useMemo(
    () => [
      {
        name: 'Tiger Nixon',
        position: 'System Architect',
        office: 'Edinburgh',
        age: 61,
        start: '2011-04-25',
        salary: '$320,800',
      },
      {
        name: 'Garrett Winters',
        position: 'Accountant',
        office: 'Tokyo',
        age: 63,
        start: '2011-07-25',
        salary: '$170,750',
      },
      {
        name: 'Ashton Cox',
        position: 'Junior Technical Author',
        office: 'San Francisco',
        age: 66,
        start: '2009-01-12',
        salary: '$86,000',
      },
      { name: 'Airi Satou', position: 'Accountant', office: 'Tokyo', age: 33, start: '2008-11-28', salary: '$162,700' },
      {
        name: 'Brielle Williamson',
        position: 'Integration Specialist',
        office: 'New York',
        age: 61,
        start: '2012-12-02',
        salary: '$372,000',
      },
    ],
    []
  )

  const columns = useMemo(
    () => [
      { title: 'Name', data: 'name' },
      { title: 'Position', data: 'position' },
      { title: 'Office', data: 'office' },
      { title: 'Age', data: 'age' },
      { title: 'Start date', data: 'start' },
      { title: 'Salary', data: 'salary' },
    ],
    []
  )

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-4 text-2xl font-bold">Employees</h1>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
          <DataTable
            className="display !no-wrap w-full text-sm"
            data={data}
            columns={columns}
            options={{
              responsive: true,
              pageLength: 5,
              layout: {
                topStart: 'pageLength',
                topEnd: 'search',
                bottomStart: 'info',
                bottomEnd: 'paging',
              },
              createdRow: (row) => {
                row.classList.add('hover:bg-gray-50')
              },
              headerCallback: (thead) => {
                thead.querySelectorAll('th').forEach((th) => {
                  th.classList.add('bg-gray-50', 'text-gray-700', 'font-semibold')
                })
              },
            }}
          >
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.data}>{col.title}</th>
                ))}
              </tr>
            </thead>
          </DataTable>
        </div>
      </div>
    </main>
  )
}
