import { useEffect, useState } from 'react';
import { AlertCircle, Calendar, Edit3, Plus, Search, Trash2, User, X } from 'lucide-react';
import {
  createTask,
  deleteTask,
  fetchTasks,
  fetchUsers,
  searchTasks,
  updateTask
} from '../services/api.js';

const PRIORITY_LABELS = {
  1: 'Low',
  2: 'Medium',
  3: 'High'
};

const STATUS_LABELS = {
  0: 'Pending',
  1: 'In Progress',
  2: 'Completed'
};

export function Tasks({ session }) {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [size] = useState(6);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(null); // 'create' | 'edit' | null
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    assignedto: '',
    priority: 1,
    deadline: '',
    status: 0
  });

  // Load users and tasks on mount/session change
  useEffect(() => {
    if (!session) return;
    loadUsers();
    loadTasks(1);
  }, [session]);

  const loadUsers = async () => {
    try {
      const allUsers = await fetchUsers(session);
      setUsers(allUsers || []);
    } catch (err) {
      console.error('Failed to load users:', err.message);
    }
  };

  const loadTasks = async (targetPage) => {
    if (!session) return;
    setLoading(true);
    setError('');
    setIsSearching(false);
    try {
      const response = await fetchTasks(session, targetPage, size);
      if (response.code === 200) {
        setTasks(response.tasks || []);
        setPage(response.page || 1);
        setTotalPages(response.totalpages || 1);
        setTotalRecords(response.totalrecords || 0);
      } else {
        throw new Error(response.message || 'Failed to fetch tasks');
      }
    } catch (err) {
      setError(err.message);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchKeyword.trim()) {
      loadTasks(1);
      return;
    }
    setLoading(true);
    setError('');
    setIsSearching(true);
    try {
      const response = await searchTasks(session, searchKeyword);
      if (response.code === 200) {
        setTasks(response.tasks || []);
        setPage(1);
        setTotalPages(1);
        setTotalRecords(response.tasks?.length || 0);
      } else {
        throw new Error(response.message || 'Search failed');
      }
    } catch (err) {
      setError(err.message);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchKeyword('');
    loadTasks(1);
  };

  const openCreateModal = () => {
    setForm({
      title: '',
      description: '',
      assignedto: users.length > 0 ? String(users[0].id) : '',
      priority: 1,
      deadline: new Date().toISOString().split('T')[0],
      status: 0
    });
    setEditingTaskId(null);
    setShowModal('create');
    setError('');
    setMessage('');
  };

  const openEditModal = (task) => {
    setForm({
      title: task.title || '',
      description: task.description || '',
      assignedto: task.assignedto !== undefined ? String(task.assignedto) : '',
      priority: task.priority || 1,
      deadline: task.deadline || '',
      status: task.status !== undefined ? task.status : 0
    });
    setEditingTaskId(task._id);
    setShowModal('edit');
    setError('');
    setMessage('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({
      ...current,
      [name]: name === 'priority' || name === 'status' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!form.description.trim()) {
      setError('Description is required');
      return;
    }
    if (!form.assignedto) {
      setError('Assignee is required');
      return;
    }
    if (!form.deadline) {
      setError('Deadline is required');
      return;
    }

    try {
      const payload = {
        ...form,
        assignedto: Number(form.assignedto)
      };

      if (showModal === 'create') {
        const response = await createTask(session, payload);
        if (response.code === 200) {
          setMessage('Task created successfully');
          setShowModal(null);
          loadTasks(1);
        } else {
          throw new Error(response.message || 'Failed to create task');
        }
      } else if (showModal === 'edit') {
        const response = await updateTask(session, editingTaskId, payload);
        if (response.code === 200) {
          setMessage('Task updated successfully');
          setShowModal(null);
          loadTasks(page);
        } else {
          throw new Error(response.message || 'Failed to update task');
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (task) => {
    const confirmed = window.confirm(`Are you sure you want to delete task "${task.title}"?`);
    if (!confirmed) return;

    setError('');
    setMessage('');
    try {
      const response = await deleteTask(session, task._id);
      if (response.code === 200) {
        setMessage('Task deleted successfully');
        loadTasks(page);
      } else {
        throw new Error(response.message || 'Failed to delete task');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const getUserName = (userId) => {
    const user = users.find((u) => Number(u.id) === Number(userId));
    return user ? user.fullName : `User #${userId}`;
  };

  const getPriorityBadgeClass = (priority) => {
    if (priority === 3) return 'status-high';
    if (priority === 2) return 'status-medium';
    return 'status-low';
  };

  const getStatusBadgeClass = (status) => {
    if (status === 2) return 'status-completed';
    if (status === 1) return 'status-inprogress';
    return 'status-pending';
  };

  return (
    <div className="content">
      <section className="page-title split-title">
        <div>
          <h1>Task Management</h1>
          <p>Home / Tasks</p>
        </div>
        <button className="primary-action" type="button" onClick={openCreateModal}>
          <Plus size={16} />
          <span>Add New Task</span>
        </button>
      </section>

      {error && (
        <div className="auth-message alert-danger">
          <AlertCircle size={16} style={{ marginRight: '8px' }} />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="auth-message alert-success">
          <span>{message}</span>
        </div>
      )}

      <section className="panel" style={{ marginTop: '20px' }}>
        <div className="section-heading">
          <h2>Task Board</h2>
          <span>MongoDB Backend</span>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="report-filters" style={{ margin: '15px 0' }}>
          <label className="input-field" style={{ gridColumn: 'span 4' }}>
            <span>Search Tasks</span>
            <div className="input-shell" style={{ border: '1px solid #ccd3df' }}>
              <Search size={16} color="#9ca3af" />
              <input
                type="text"
                placeholder="Search by title, description or deadline..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                style={{ border: 'none', height: '100%', outline: 'none', width: '100%' }}
              />
            </div>
          </label>
          <div style={{ display: 'flex', gap: '8px', alignSelf: 'end' }}>
            <button className="primary-action" type="submit" style={{ height: '38px' }}>
              Search
            </button>
            {(searchKeyword || isSearching) && (
              <button
                className="ghost-inline"
                type="button"
                onClick={handleClearSearch}
                style={{ height: '38px' }}
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {/* Task List Table */}
        <div className="table-wrap">
          {loading ? (
            <div className="empty-state">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="empty-state">No tasks found.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Description</th>
                  <th>Assigned To</th>
                  <th>Priority</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task._id}>
                    <td style={{ fontWeight: '700', color: '#0f294a' }}>{task.title}</td>
                    <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {task.description}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={13} color="#6b7280" />
                        <span>{getUserName(task.assignedto)}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`task-badge ${getPriorityBadgeClass(task.priority)}`}>
                        {PRIORITY_LABELS[task.priority]}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={13} color="#6b7280" />
                        <span>{task.deadline}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`task-badge ${getStatusBadgeClass(task.status)}`}>
                        {STATUS_LABELS[task.status]}
                      </span>
                    </td>
                    <td>
                      <div className="actions" style={{ justifyContent: 'flex-end' }}>
                        <button type="button" title="Edit" onClick={() => openEditModal(task)}>
                          <Edit3 size={14} />
                        </button>
                        <button type="button" title="Delete" onClick={() => handleDelete(task)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {!isSearching && totalPages > 1 && (
          <div className="filter-summary" style={{ marginTop: '15px' }}>
            <span>
              Showing Page {page} of {totalPages} ({totalRecords} total records)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="ghost-inline"
                disabled={page <= 1 || loading}
                onClick={() => loadTasks(page - 1)}
              >
                Previous
              </button>
              <button
                className="ghost-inline"
                disabled={page >= totalPages || loading}
                onClick={() => loadTasks(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Task Creation / Editing Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content auth-card" style={{ width: 'min(100%, 550px)', padding: '24px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#0954c7' }}>
                {showModal === 'create' ? 'Create Task' : 'Edit Task'}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
              <label className="input-field">
                <span>Task Title *</span>
                <input
                  type="text"
                  name="title"
                  placeholder="Enter task title"
                  value={form.title}
                  onChange={handleInputChange}
                  required
                />
              </label>

              <label className="input-field">
                <span>Description *</span>
                <textarea
                  name="description"
                  placeholder="Describe the task instructions..."
                  value={form.description}
                  onChange={handleInputChange}
                  required
                  style={{ minHeight: '80px' }}
                />
              </label>

              <div className="date-fields">
                <label className="input-field">
                  <span>Assigned To *</span>
                  <select name="assignedto" value={form.assignedto} onChange={handleInputChange} required>
                    <option value="" disabled>Select Assignee</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName} ({user.role})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="input-field">
                  <span>Deadline *</span>
                  <input
                    type="date"
                    name="deadline"
                    value={form.deadline}
                    onChange={handleInputChange}
                    required
                  />
                </label>
              </div>

              <div className="date-fields">
                <label className="input-field">
                  <span>Priority *</span>
                  <select name="priority" value={form.priority} onChange={handleInputChange} required>
                    <option value={1}>Low</option>
                    <option value={2}>Medium</option>
                    <option value={3}>High</option>
                  </select>
                </label>

                <label className="input-field">
                  <span>Status *</span>
                  <select name="status" value={form.status} onChange={handleInputChange} required>
                    <option value={0}>Pending</option>
                    <option value={1}>In Progress</option>
                    <option value={2}>Completed</option>
                  </select>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  className="ghost-inline"
                  type="button"
                  onClick={() => setShowModal(null)}
                  style={{ minHeight: '38px' }}
                >
                  Cancel
                </button>
                <button className="primary-action" type="submit" style={{ minHeight: '38px' }}>
                  {showModal === 'create' ? 'Create Task' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
