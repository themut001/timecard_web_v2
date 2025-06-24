import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { LiquidCard, CardHeader, CardContent } from '@/components/ui/LiquidCard'
import { LiquidButton } from '@/components/ui/LiquidButton'
import { LiquidInput } from '@/components/ui/LiquidInput'
import { StatusBadge } from '@/components/ui/StatusBadge'

interface Employee {
  id: number
  employeeId: string
  name: string
  department: string
  position: string
  email: string
  phone: string
  joinDate: string
  status: 'active' | 'inactive'
  avatar?: string
}

const EmployeeCard: React.FC<{ employee: Employee; onEdit: () => void; onDelete: () => void }> = ({
  employee,
  onEdit,
  onDelete,
}) => {
  return (
    <LiquidCard className="hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-lg">
              {employee.name[0]}
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-slate-900 truncate">
                {employee.name}
              </h3>
              <div className="flex items-center space-x-2">
                {employee.status === 'active' ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircleIcon className="h-3 w-3 mr-1" />
                    在職中
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <XCircleIcon className="h-3 w-3 mr-1" />
                    退職
                  </span>
                )}
              </div>
            </div>
            
            <div className="space-y-1 mb-4">
              <p className="text-sm text-slate-600">
                <span className="font-medium">社員ID:</span> {employee.employeeId}
              </p>
              <p className="text-sm text-slate-600">
                <span className="font-medium">部署:</span> {employee.department}
              </p>
              <p className="text-sm text-slate-600">
                <span className="font-medium">役職:</span> {employee.position}
              </p>
              <p className="text-sm text-slate-600">
                <span className="font-medium">入社日:</span> {employee.joinDate}
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500">
                {employee.email}
              </div>
              <div className="flex space-x-2">
                <LiquidButton size="sm" variant="outline" onClick={() => {}}>
                  <EyeIcon className="h-4 w-4" />
                </LiquidButton>
                <LiquidButton size="sm" variant="outline" onClick={onEdit}>
                  <PencilIcon className="h-4 w-4" />
                </LiquidButton>
                <LiquidButton size="sm" variant="outline" onClick={onDelete}>
                  <TrashIcon className="h-4 w-4" />
                </LiquidButton>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </LiquidCard>
  )
}

const EmployeeTable: React.FC<{ 
  employees: Employee[]
  onEdit: (employee: Employee) => void
  onDelete: (employee: Employee) => void
}> = ({ employees, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-4 font-semibold text-slate-900">社員</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-900">部署・役職</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-900">連絡先</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-900">入社日</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-900">状態</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-900">操作</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee, index) => (
            <motion.tr
              key={employee.id}
              className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <td className="py-3 px-4">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {employee.name[0]}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{employee.name}</div>
                    <div className="text-sm text-slate-500">{employee.employeeId}</div>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="text-slate-900 font-medium">{employee.department}</div>
                <div className="text-sm text-slate-500">{employee.position}</div>
              </td>
              <td className="py-3 px-4">
                <div className="text-slate-900">{employee.email}</div>
                <div className="text-sm text-slate-500">{employee.phone}</div>
              </td>
              <td className="py-3 px-4 text-slate-700">{employee.joinDate}</td>
              <td className="py-3 px-4">
                {employee.status === 'active' ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    在職中
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    退職
                  </span>
                )}
              </td>
              <td className="py-3 px-4">
                <div className="flex space-x-2">
                  <LiquidButton size="sm" variant="outline" onClick={() => onEdit(employee)}>
                    <PencilIcon className="h-4 w-4" />
                  </LiquidButton>
                  <LiquidButton size="sm" variant="outline" onClick={() => onDelete(employee)}>
                    <TrashIcon className="h-4 w-4" />
                  </LiquidButton>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export const AdminEmployees: React.FC = () => {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')

  // Mock data
  const mockEmployees: Employee[] = [
    {
      id: 1,
      employeeId: 'EMP001',
      name: '田中太郎',
      department: '開発部',
      position: 'エンジニア',
      email: 'tanaka@company.com',
      phone: '090-1234-5678',
      joinDate: '2022-04-01',
      status: 'active',
    },
    {
      id: 2,
      employeeId: 'EMP002',
      name: '佐藤花子',
      department: '営業部',
      position: 'マネージャー',
      email: 'sato@company.com',
      phone: '090-2345-6789',
      joinDate: '2021-03-15',
      status: 'active',
    },
    {
      id: 3,
      employeeId: 'EMP003',
      name: '鈴木次郎',
      department: '総務部',
      position: 'アシスタント',
      email: 'suzuki@company.com',
      phone: '090-3456-7890',
      joinDate: '2023-01-10',
      status: 'inactive',
    },
  ]

  const departments = ['all', '開発部', '営業部', '総務部', '人事部']

  const filteredEmployees = mockEmployees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = departmentFilter === 'all' || employee.department === departmentFilter
    return matchesSearch && matchesDepartment
  })

  const handleEdit = (employee: Employee) => {
    console.log('Edit employee:', employee)
  }

  const handleDelete = (employee: Employee) => {
    console.log('Delete employee:', employee)
  }

  const stats = {
    total: mockEmployees.length,
    active: mockEmployees.filter(e => e.status === 'active').length,
    inactive: mockEmployees.filter(e => e.status === 'inactive').length,
    newThisMonth: 2,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">社員管理</h1>
          <p className="text-slate-600 mt-1">社員情報の閲覧・編集・管理</p>
        </div>
        <LiquidButton variant="primary">
          <PlusIcon className="h-5 w-5 mr-2" />
          社員追加
        </LiquidButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <LiquidCard>
          <CardContent className="text-center py-6">
            <div className="text-3xl font-bold text-blue-600 mb-2">{stats.total}</div>
            <div className="text-sm font-medium text-slate-900">総社員数</div>
          </CardContent>
        </LiquidCard>
        
        <LiquidCard>
          <CardContent className="text-center py-6">
            <div className="text-3xl font-bold text-green-600 mb-2">{stats.active}</div>
            <div className="text-sm font-medium text-slate-900">在職中</div>
          </CardContent>
        </LiquidCard>
        
        <LiquidCard>
          <CardContent className="text-center py-6">
            <div className="text-3xl font-bold text-red-600 mb-2">{stats.inactive}</div>
            <div className="text-sm font-medium text-slate-900">退職済み</div>
          </CardContent>
        </LiquidCard>
        
        <LiquidCard>
          <CardContent className="text-center py-6">
            <div className="text-3xl font-bold text-purple-600 mb-2">{stats.newThisMonth}</div>
            <div className="text-sm font-medium text-slate-900">今月入社</div>
          </CardContent>
        </LiquidCard>
      </div>

      {/* Search and Filters */}
      <LiquidCard>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <LiquidInput
                  placeholder="社員名または社員IDで検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-40">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="liquid-input"
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>
                    {dept === 'all' ? 'すべての部署' : dept}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex space-x-2">
              <LiquidButton
                variant={viewMode === 'table' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                表形式
              </LiquidButton>
              <LiquidButton
                variant={viewMode === 'grid' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                カード形式
              </LiquidButton>
            </div>
          </div>
        </CardContent>
      </LiquidCard>

      {/* Employee List */}
      <LiquidCard>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">
              社員一覧 ({filteredEmployees.length}件)
            </h3>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'table' ? (
            <EmployeeTable
              employees={filteredEmployees}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEmployees.map((employee) => (
                <motion.div
                  key={employee.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <EmployeeCard
                    employee={employee}
                    onEdit={() => handleEdit(employee)}
                    onDelete={() => handleDelete(employee)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </LiquidCard>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <UserGroupIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">社員が見つかりません</h3>
          <p className="text-slate-500 mb-6">検索条件を変更してください。</p>
        </div>
      )}
    </div>
  )
}