'use client'

import { useState } from 'react'
import { Plus, MoreHorizontal, Pencil, Trash2, Folder } from 'lucide-react'
import { useWatchlistStore, ALL_GROUP_ID } from '@/store/stockStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export function WatchlistGroupManager() {
  const { groups, activeGroupId, setActiveGroup, createGroup, updateGroup, deleteGroup, stocks } =
    useWatchlistStore()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [groupName, setGroupName] = useState('')

  const handleCreate = () => {
    if (groupName.trim()) {
      createGroup(groupName.trim())
      setGroupName('')
      setIsCreateDialogOpen(false)
    }
  }

  const handleEdit = () => {
    if (editingGroupId && groupName.trim()) {
      updateGroup(editingGroupId, groupName.trim())
      setGroupName('')
      setEditingGroupId(null)
      setIsEditDialogOpen(false)
    }
  }

  const handleDelete = () => {
    if (editingGroupId) {
      deleteGroup(editingGroupId)
      setEditingGroupId(null)
      setIsDeleteDialogOpen(false)
    }
  }

  const openEditDialog = (groupId: string, currentName: string) => {
    setEditingGroupId(groupId)
    setGroupName(currentName)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (groupId: string) => {
    setEditingGroupId(groupId)
    setIsDeleteDialogOpen(true)
  }

  const getGroupStockCount = (groupId: string) => {
    if (groupId === ALL_GROUP_ID) {
      return stocks.length
    }
    const group = groups.find((g) => g.id === groupId)
    return group ? group.stockCodes.length : 0
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 rounded-md bg-muted p-1">
        <button
          onClick={() => setActiveGroup(ALL_GROUP_ID)}
          className={cn(
            'flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors',
            activeGroupId === ALL_GROUP_ID
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Folder className="h-3.5 w-3.5" />
          全部
          <span className="text-xs text-muted-foreground">
            ({getGroupStockCount(ALL_GROUP_ID)})
          </span>
        </button>

        {groups.map((group) => (
          <div key={group.id} className="flex items-center">
            <button
              onClick={() => setActiveGroup(group.id)}
              className={cn(
                'flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors',
                activeGroupId === group.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Folder className="h-3.5 w-3.5" />
              {group.name}
              <span className="text-xs text-muted-foreground">
                ({getGroupStockCount(group.id)})
              </span>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-0.5 rounded-sm p-1 text-muted-foreground transition-colors hover:bg-muted-foreground/10 hover:text-foreground">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEditDialog(group.id, group.name)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  重命名
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => openDeleteDialog(group.id)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsCreateDialogOpen(true)}
        className="gap-1"
      >
        <Plus className="h-4 w-4" />
        新建分组
      </Button>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建分组</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="请输入分组名称"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreate()
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setGroupName('')
                setIsCreateDialogOpen(false)
              }}
            >
              取消
            </Button>
            <Button onClick={handleCreate}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名分组</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="请输入分组名称"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleEdit()
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setGroupName('')
                setEditingGroupId(null)
                setIsEditDialogOpen(false)
              }}
            >
              取消
            </Button>
            <Button onClick={handleEdit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除分组</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              确定要删除此分组吗？分组中的股票将保留在「全部」列表中。
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingGroupId(null)
                setIsDeleteDialogOpen(false)
              }}
            >
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
