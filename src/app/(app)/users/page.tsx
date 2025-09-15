'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * DataTables를 "클라이언트에서만" 동적 로드하는 래퍼 컴포넌트
 * - 서버에서는 절대 평가/임포트되지 않도록 ssr:false
 * - 내부에서 core/responsive/buttons/html5/jszip 모두 로드 및 use() 등록
 */
const DTWrapper = dynamic(
  async () => {
    const [{ default: DataTable }, core, responsive, buttonsDT] = await Promise.all([
      import('datatables.net-react'),
      import('datatables.net-dt'),
      import('datatables.net-responsive-dt'),
      import('datatables.net-buttons-dt'),
    ])

    // HTML5 Export 플러그인 + JSZip (excelHtml5에 필요)
    await import('datatables.net-buttons/js/buttons.html5.js')
    const { default: JSZip } = await import('jszip')
    ;(window as any).JSZip = JSZip

    // 플러그인 등록
    DataTable.use(core.default)
    DataTable.use(responsive.default)
    DataTable.use(buttonsDT.default)

    // 동적으로 로드한 DataTable을 바로 리액트 컴포넌트로 반환
    return (props: any) => <DataTable {...props} />
  },
  { ssr: false }
)

type User = {
  idx: number
  id: string
  name: string
  age?: number | null
  gender_text?: string | null
  org?: { name?: string | null }
  manager?: { name?: string | null }
  future_mission_round?: {
    week_number?: number
    mission?: { start_date?: string; status_text?: string; completion_percent?: number }
  } | null
  current_mission_round?: {
    week_number?: number
    mission?: { start_date?: string; status_text?: string; completion_percent?: number }
  } | null
  last_mission_round?: {
    week_number?: number
    mission?: { start_date?: string; status_text?: string; completion_percent?: number }
  } | null
  created_at?: string
  is_on?: '1' | '2' | '0' | '' | null
}

type IsOnFilter = 'all' | 'on' | 'off'

export default function UsersPage() {
  const router = useRouter()

  const [isOn, setIsOn] = useState<IsOnFilter>('all')
  const [orgIdx, setOrgIdx] = useState<string | null>(null)
  const tableRef = useRef<any>(null)

  const columns = useMemo(
    () => [
      { title: 'IDX', data: 'idx' },
      { title: 'ID', data: 'id' },
      { title: 'Name', data: 'name' },
      { title: 'Age', data: 'age' },
      { title: 'Gender', data: 'gender_text' },
      { title: 'Org', data: 'org.name' },
      { title: 'Manager', data: 'manager.name' },
      { title: '시작일', data: 'future_mission_round' },
      { title: '주차', data: 'future_mission_round' },
      { title: '상태', data: 'future_mission_round' },
      { title: '완료율', data: 'future_mission_round' },
      { title: 'Created', data: 'created_at' },
      { title: '활성', data: 'is_on' },
    ],
    []
  )

  const orderByForIndex = (colIdx: number): string | undefined => {
    switch (colIdx) {
      case 0:
        return 'idx'
      case 1:
        return 'id'
      case 2:
        return 'name'
      case 3:
        return 'age'
      case 4:
        return 'gender_text'
      case 5:
        return 'org.name'
      case 6:
        return 'manager.name'
      case 11:
        return 'created_at'
      case 12:
        return 'is_on'
      default:
        return undefined
    }
  }

  const options: any = useMemo(
    () => ({
      processing: true,
      serverSide: true,
      responsive: true,
      pageLength: 50,
      lengthMenu: [50, 75, 100],
      dom: 'Blfrtip',
      buttons: [{ extend: 'excelHtml5', text: '데이터 다운로드', title: 'users', className: 'dt-btn dt-btn-outline' }],
      order: [[0, 'asc']],
      layout: {
        topStart: 'pageLength',
        topEnd: 'search',
        bottomStart: 'info',
        bottomEnd: 'paging',
      },
      ajax: {
        url: '/api/users/list',
        data: (d: any) => {
          const colIndex = d?.order?.[0]?.column ?? 0
          const dir = d?.order?.[0]?.dir ?? 'asc'
          d.order_by = orderByForIndex(colIndex)
          d.sort = dir
          d.keyword = d.search?.value ?? ''
          d.page_block = d.length
          d.page = Math.floor(d.start / d.length) + 1

          if (orgIdx) d.org_idx = orgIdx
          if (isOn === 'on') d.is_on = '1'
          if (isOn === 'off') d.is_on = '2'
        },
        dataSrc: (response: any) => {
          const total = response?.data?.total_count ?? 0
          const searched = response?.data?.searched_count ?? total
          ;(response as any).recordsTotal = total
          ;(response as any).recordsFiltered = searched
          return response?.data?.users ?? []
        },
      },
      columns,
      columnDefs: [
        { targets: [0, 1, 2, 3, 4, 5, 6, 11, 12], className: 'text-center' },
        { targets: 3, render: (data: any) => (data ? String(data) : '-') },
        { targets: 6, render: (data: any) => (data ? String(data) : '-') },
        {
          targets: 7,
          orderable: false,
          className: 'text-center',
          render: (_: any, __: any, row: User) =>
            row.future_mission_round?.mission?.start_date ??
            row.current_mission_round?.mission?.start_date ??
            row.last_mission_round?.mission?.start_date ??
            '-',
        },
        {
          targets: 8,
          orderable: false,
          className: 'text-center',
          render: (_: any, __: any, row: User) => {
            const wk =
              row.future_mission_round?.week_number ??
              row.current_mission_round?.week_number ??
              row.last_mission_round?.week_number
            return wk ? `${wk}주차` : '-'
          },
        },
        {
          targets: 9,
          orderable: false,
          className: 'text-center',
          render: (_: any, __: any, row: User) =>
            row.future_mission_round?.mission?.status_text ??
            row.current_mission_round?.mission?.status_text ??
            row.last_mission_round?.mission?.status_text ??
            '-',
        },
        {
          targets: 10,
          orderable: false,
          className: 'text-center',
          render: (_: any, __: any, row: User) => {
            const pct =
              row.future_mission_round?.mission?.completion_percent ??
              row.current_mission_round?.mission?.completion_percent ??
              row.last_mission_round?.mission?.completion_percent
            return typeof pct === 'number' ? `${pct}%` : '-'
          },
        },
        {
          targets: 12,
          className: 'text-center',
          render: (data: any, _t: any, row: User) => {
            const on = String(data) === '1'
            const icon = on
              ? `<i class="mr-2 fa fa-2x fa-toggle-on user-is-on text-indigo-600 on" data-user-idx="${row.idx}" style="cursor:pointer"><span class="sr-only">on</span></i>`
              : `<i class="mr-2 fa fa-2x fa-toggle-off user-is-on text-gray-400 off" data-user-idx="${row.idx}" style="cursor:pointer"><span class="sr-only">off</span></i>`
            return `<div class="flex justify-center">${icon}</div>`
          },
        },
      ],
      rowCallback: function (this: any, row: HTMLElement, data: User) {
        row.querySelectorAll('td').forEach((td) => {
          ;(td as HTMLElement).style.cursor = 'pointer'
          td.addEventListener('click', (e) => {
            if (!(e.target as HTMLElement).closest('.user-is-on')) {
              window.dispatchEvent(new CustomEvent('row:navigate', { detail: { idx: data.idx } }))
            }
          })
        })
      },
      drawCallback: function (this: any) {
        const api = this.api()
        document.querySelectorAll<HTMLElement>('.user-is-on').forEach((el) => {
          if (el.dataset.bound === '1') return
          el.dataset.bound = '1'
          el.addEventListener('click', async (ev) => {
            ev.stopPropagation()
            const idx = el.dataset.userIdx
            const turnOn = el.classList.contains('off')
            alert(`(데모) 사용자 ${idx} ${turnOn ? '활성화' : '비활성화'}`)
            api.ajax.reload(null, false)
          })
        })
      },
      initComplete: function (this: any) {
        const api = this.api()
        tableRef.current = api
        api.on('page', function () {
          const wrap = (api.table().container() as HTMLElement) ?? document.body
          const top = wrap.getBoundingClientRect().top + window.scrollY
          window.scrollTo({ top, behavior: 'smooth' })
        })
      },
    }),
    [isOn, orgIdx]
  )

  // 행 클릭 -> 라우팅
  const routerHandler = (e: any) => {
    const idx = e?.detail?.idx
    if (idx) router.push(`/admin/users/${idx}`)
  }
  useEffect(() => {
    window.addEventListener('row:navigate', routerHandler as any)
    return () => window.removeEventListener('row:navigate', routerHandler as any)
  }, [])

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">이용자 목록</h1>
          <p className="text-sm text-gray-600">서버사이드 처리 / Excel 다운로드 / 외부 필터</p>
        </header>

        {/* 외부 필터 */}
        <section className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
          <select
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            value={orgIdx ?? ''}
            onChange={(e) => setOrgIdx(e.target.value || null)}
          >
            <option value="">기관 전체</option>
            <option value="101">기관 101</option>
            <option value="102">기관 102</option>
            <option value="103">기관 103</option>
          </select>

          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-600">상태:</span>
            <label className="inline-flex items-center gap-1">
              <input
                type="radio"
                name="filter_is_on"
                className="accent-indigo-600"
                checked={isOn === 'all'}
                onChange={() => setIsOn('all')}
              />
              모두
            </label>
            <label className="inline-flex items-center gap-1">
              <input
                type="radio"
                name="filter_is_on"
                className="accent-indigo-600"
                checked={isOn === 'on'}
                onChange={() => setIsOn('on')}
              />
              활성
            </label>
            <label className="inline-flex items-center gap-1">
              <input
                type="radio"
                name="filter_is_on"
                className="accent-indigo-600"
                checked={isOn === 'off'}
                onChange={() => setIsOn('off')}
              />
              비활성
            </label>

            <button
              type="button"
              onClick={() => tableRef.current?.ajax.reload()}
              className="ml-2 inline-flex h-9 items-center rounded-lg border border-gray-200 px-3 text-sm hover:bg-gray-50"
            >
              적용
            </button>
          </div>
        </section>

        {/* DataTable */}
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
          <DTWrapper className="display !no-wrap w-full text-sm" options={options}>
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.title}>{c.title}</th>
                ))}
              </tr>
            </thead>
          </DTWrapper>
        </section>
      </div>
    </main>
  )
}
