'use client';

import {
    Container, Box, TableContainer, TextField, Typography, Paper, Table,
    TableHead, TableBody, TableRow, TableCell, TableFooter, TablePagination,
    Button, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
    Skeleton, Chip, IconButton, Tooltip, InputAdornment, FormControl, InputLabel,
    Select, MenuItem, Grid
} from '@mui/material';
import { useSetTitle } from '@/components/DashboardLayout'; // Sesuaikan path ini
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { enqueueSnackbar } from 'notistack';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

const initialFormState = {
    name: '',
    email: '',
    password: '', // Akan dikosongkan saat mode edit jika tidak ingin diubah
    role: 'user',
};

export default function UserManagementPage() {
    useSetTitle('User Management');

    // State
    const [users, setUsers] = useState<User[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Form State
    const [formOpen, setFormOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState(initialFormState);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);

    // Delete State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Fetch Users
    const loadUsers = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: (page + 1).toString(),
                limit: rowsPerPage.toString(),
                ...(searchTerm && { search: searchTerm }),
            });
            const response = await fetch(`/api/users?${params}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to load users');
            }
            const data = await response.json();
            setUsers(data.data || []);
            setTotalCount(data.metadata?.total || 0);
        } catch (error) {
            enqueueSnackbar(error instanceof Error ? error.message : 'Gagal memuat data user!', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, searchTerm]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    // Handlers
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setPage(0);
    };

    const handleOpenCreate = () => {
        setFormData(initialFormState);
        setIsEditing(false);
        setEditingUserId(null);
        setFormOpen(true);
    };

    const handleOpenEdit = (user: User) => {
        setFormData({
            name: user.name,
            email: user.email,
            password: '', // Kosongkan password saat edit. Backend tidak akan update jika kosong
            role: user.role,
        });
        setEditingUserId(user.id);
        setIsEditing(true);
        setFormOpen(true);
    };

    const handleCloseForm = () => {
        setFormOpen(false);
        setFormData(initialFormState);
    };

    // Submit Form (Create / Edit)
    const handleSubmit = async () => {
        if (!formData.name.trim() || !formData.email.trim()) {
            enqueueSnackbar('Nama dan Email wajib diisi!', { variant: 'warning' });
            return;
        }

        if (!isEditing && formData.password.length < 6) {
            enqueueSnackbar('Password minimal 6 karakter!', { variant: 'warning' });
            return;
        }

        setSubmitting(true);
        try {
            const payload: any = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                role: formData.role,
            };

            // Sertakan id jika sedang edit
            if (isEditing && editingUserId) payload.id = editingUserId;
            // Sertakan password hanya jika diisi (untuk edit opsional, untuk create wajib)
            if (formData.password) payload.password = formData.password;

            const response = await fetch('/api/users', {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.errors) console.error("Zod Validation Errors:", errorData.errors);
                throw new Error(errorData.error || `Gagal ${isEditing ? 'memperbarui' : 'menambahkan'} user`);
            }

            enqueueSnackbar(`User berhasil ${isEditing ? 'diperbarui' : 'ditambahkan'}!`, { variant: 'success' });
            handleCloseForm();
            loadUsers();
        } catch (error) {
            enqueueSnackbar(error instanceof Error ? error.message : 'Terjadi kesalahan!', { variant: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    // Delete Handlers
    const confirmDelete = (user: User) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        setDeleting(true);
        try {
            const response = await fetch(`/api/users`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userToDelete.id }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Gagal menghapus user');
                throw new Error('Gagal menghapus user');
            }

            enqueueSnackbar('User berhasil dihapus!', { variant: 'success' });
            setDeleteDialogOpen(false);
            setUserToDelete(null);
            loadUsers();
        } catch (error) {
            enqueueSnackbar(error instanceof Error ? error.message : 'Terjadi kesalahan!', { variant: 'error' });
        } finally {
            setDeleting(false);
        }
    };

    // Pagination
    const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const skeletonRows = useMemo(() => Array.from({ length: rowsPerPage }).map((_, idx) => (
        <TableRow key={`skeleton-${idx}`}>
            <TableCell><Skeleton variant="text" width={30} /></TableCell>
            <TableCell><Skeleton variant="text" width={150} /></TableCell>
            <TableCell><Skeleton variant="text" width={200} /></TableCell>
            <TableCell><Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} /></TableCell>
            <TableCell><Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} /></TableCell>
        </TableRow>
    )), [rowsPerPage]);

    return (
        <Container component="main" sx={{ flexGrow: 1, py: 3 }} maxWidth="lg">
            {/* Header */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', gap: 2, mb: 3 }}>
                <TextField
                    label="Cari Nama / Email" variant="outlined" size="small"
                    value={searchTerm} onChange={handleSearchChange}
                    sx={{ maxWidth: { xs: '100%', sm: 300 } }}
                    slotProps={{
                        input: {
                            startAdornment: <InputAdornment position="start"><Search size={18} color="gray" /></InputAdornment>,
                            endAdornment: searchTerm && (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setSearchTerm('')} edge="end"><X size={16} /></IconButton>
                                </InputAdornment>
                            ),
                        },
                    }}
                />
                <Button variant="contained" startIcon={<Plus size={18} />} onClick={handleOpenCreate} sx={{ whiteSpace: 'nowrap' }}>
                    Tambah User
                </Button>
            </Box>

            {/* Table */}
            <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Table sx={{ minWidth: 600 }} aria-label="user table">
                    <TableHead>
                        <TableRow>
                            <TableCell width="10%">No.</TableCell>
                            <TableCell width="30%">Nama Lengkap</TableCell>
                            <TableCell width="30%">Email</TableCell>
                            <TableCell width="15%">Role</TableCell>
                            <TableCell width="15%">Aksi</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? skeletonRows : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                    <Typography variant="body1" color="text.secondary">Tidak ada data user.</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user, index) => (
                                <TableRow key={user.id} hover>
                                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                                    <TableCell><Typography variant="subtitle2">{user.name}</Typography></TableCell>
                                    <TableCell><Typography variant="body2" color="text.secondary">{user.email}</Typography></TableCell>
                                    <TableCell>
                                        <Chip label={user.role.toUpperCase()} size="small" color={user.role === 'admin' ? 'secondary' : 'primary'} variant="outlined" />
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Tooltip title="Edit User">
                                                <IconButton size="small" color="warning" onClick={() => handleOpenEdit(user)}>
                                                    <Edit2 size={16} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Hapus User">
                                                <IconButton size="small" color="error" onClick={() => confirmDelete(user)}>
                                                    <Trash2 size={16} />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                    {!loading && totalCount > 0 && (
                        <TableFooter>
                            <TableRow>
                                <TablePagination
                                    rowsPerPageOptions={[5, 10, 25, 50]} colSpan={5} count={totalCount}
                                    rowsPerPage={rowsPerPage} page={page}
                                    onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage}
                                    labelRowsPerPage="Baris per halaman" labelDisplayedRows={({ from, to, count }) => `${from}-${to} dari ${count}`}
                                />
                            </TableRow>
                        </TableFooter>
                    )}
                </Table>
            </TableContainer>

            {/* Create/Edit Form Dialog */}
            <Dialog open={formOpen} onClose={handleCloseForm} fullWidth maxWidth="sm">
                <DialogTitle>{isEditing ? 'Edit User' : 'Tambah User Baru'}</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="Nama Lengkap" fullWidth required
                                value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                disabled={submitting}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="Email" type="email" fullWidth required
                                value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={submitting}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel>Role Akses</InputLabel>
                                <Select
                                    value={formData.role} label="Role Akses"
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    disabled={submitting}>
                                    <MenuItem value="user">User Biasa</MenuItem>
                                    <MenuItem value="admin">Administrator</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label={isEditing ? "Password (Opsional)" : "Password"}
                                type="password" fullWidth required={!isEditing}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                disabled={submitting}
                            />
                            <Typography variant="caption" color="text.secondary">
                                {isEditing ? "Isi hanya jika ingin mengubah password." : "Password untuk login user."}
                            </Typography>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleCloseForm} disabled={submitting}>Batal</Button>
                    <Button onClick={handleSubmit} variant="contained" disabled={submitting} startIcon={submitting && <CircularProgress size={16} />}>
                        {submitting ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Konfirmasi Hapus</DialogTitle>
                <DialogContent>
                    <Typography>
                        Yakin ingin menghapus user <strong>{userToDelete?.name}</strong>?<br />
                        Tindakan ini tidak dapat dibatalkan.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>Batal</Button>
                    <Button onClick={handleDeleteUser} color="error" variant="contained" disabled={deleting}>
                        {deleting ? <CircularProgress size={20} /> : 'Hapus'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}