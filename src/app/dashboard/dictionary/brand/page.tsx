'use client';

import {
    Container,
    Box,
    TableContainer,
    TextField,
    Typography,
    Paper,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TableFooter,
    TablePagination,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Skeleton,
    Chip,
    IconButton,
    Tooltip,
    InputAdornment,
} from '@mui/material';
import { useSetTitle } from '@/components/DashboardLayout';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { enqueueSnackbar } from 'notistack';

interface Brand {
    id: string; // Changed to string to match backend UUID
    name: string;
    diagnosticsCount?: number;
}

export default function BrandDictionaryPage() {
    useSetTitle('Brand Dictionary');

    // State
    const [brands, setBrands] = useState<Brand[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Create dialog
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newBrandName, setNewBrandName] = useState('');

    // Edit dialog
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const [brandToEdit, setBrandToEdit] = useState<Brand | null>(null);
    const [editBrandName, setEditBrandName] = useState('');

    // Delete confirmation
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Fetch brands with search & pagination
    const loadBrands = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: (page + 1).toString(),
                limit: rowsPerPage.toString(),
                ...(searchTerm && { search: searchTerm }),
            });
            const response = await fetch(`/api/dictionary/brands?${params}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to load brands');
            }
            const data = await response.json();
            setBrands(data.data || []);
            setTotalCount(data.metadata?.total || 0);
        } catch (error) {
            console.error('Error loading brands:', error);
            enqueueSnackbar(error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat data brand!', {
                variant: 'error',
            });
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, searchTerm]);

    useEffect(() => {
        loadBrands();
    }, [loadBrands]);

    // Debounced search
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setPage(0); // reset to first page on new search
    };

    // Create brand
    const handleAddBrand = async () => {
        if (!newBrandName.trim()) {
            enqueueSnackbar('Nama brand tidak boleh kosong!', { variant: 'error' });
            return;
        }
        setCreating(true);
        try {
            const response = await fetch('/api/dictionary/brands', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newBrandName.trim() }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Gagal menambahkan brand');
            }
            enqueueSnackbar('Brand berhasil ditambahkan!', { variant: 'success' });
            setOpenCreateDialog(false);
            setNewBrandName('');
            loadBrands(); // refresh list
        } catch (error) {
            enqueueSnackbar(error instanceof Error ? error.message : 'Terjadi kesalahan saat menambahkan brand!', {
                variant: 'error',
            });
        } finally {
            setCreating(false);
        }
    };

    const toggleCreateDialog = () => {
        setOpenCreateDialog((prev) => !prev);
        setNewBrandName('');
    };

    // Edit brand
    const handleEditClick = (brand: Brand) => {
        setBrandToEdit(brand);
        setEditBrandName(brand.name);
        setEditDialogOpen(true);
    };

    const handleUpdateBrand = async () => {
        if (!editBrandName.trim() || !brandToEdit) {
            enqueueSnackbar('Nama brand tidak boleh kosong!', { variant: 'error' });
            return;
        }
        setEditing(true);
        try {
            const response = await fetch('/api/dictionary/brands', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: brandToEdit.id, name: editBrandName.trim() }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Gagal memperbarui brand');
            }
            enqueueSnackbar('Brand berhasil diperbarui!', { variant: 'success' });
            setEditDialogOpen(false);
            setBrandToEdit(null);
            loadBrands();
        } catch (error) {
            enqueueSnackbar(error instanceof Error ? error.message : 'Terjadi kesalahan saat memperbarui brand!', {
                variant: 'error',
            });
        } finally {
            setEditing(false);
        }
    };

    // Delete brand
    const confirmDelete = (brand: Brand) => {
        setBrandToDelete(brand);
        setDeleteDialogOpen(true);
    };

    const handleDeleteBrand = async () => {
        if (!brandToDelete) return;
        setDeleting(true);
        try {
            // Sent as POST body matching backend logic instead of URL param
            const response = await fetch(`/api/dictionary/brands`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: brandToDelete.id }), 
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Gagal menghapus brand');
            }
            enqueueSnackbar('Brand berhasil dihapus!', { variant: 'success' });
            setDeleteDialogOpen(false);
            setBrandToDelete(null);
            loadBrands();
        } catch (error) {
            enqueueSnackbar(error instanceof Error ? error.message : 'Terjadi kesalahan saat menghapus brand!', {
                variant: 'error',
            });
        } finally {
            setDeleting(false);
        }
    };

    // Pagination
    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Loading skeleton rows
    const skeletonRows = useMemo(
        () =>
            Array.from({ length: rowsPerPage }).map((_, idx) => (
                <TableRow key={`skeleton-${idx}`}>
                    <TableCell>
                        <Skeleton variant="text" width={30} />
                    </TableCell>
                    <TableCell>
                        <Skeleton variant="text" width={150} />
                    </TableCell>
                    <TableCell>
                        <Skeleton variant="text" width={80} />
                    </TableCell>
                    <TableCell>
                        <Skeleton variant="rectangular" width={100} height={32} sx={{ borderRadius: 1 }} />
                    </TableCell>
                </TableRow>
            )),
        [rowsPerPage]
    );

    return (
        <Container component="main" sx={{ flexGrow: 1, py: 3 }} maxWidth="lg">
            {/* Header with search and add button */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'stretch', sm: 'center' },
                    justifyContent: 'space-between',
                    gap: 2,
                    mb: 3,
                }}>
                <TextField
                    label="Cari Brand"
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    sx={{ maxWidth: { xs: '100%', sm: 300 } }}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search size={18} color="gray" />
                                </InputAdornment>
                            ),
                            endAdornment: searchTerm && (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setSearchTerm('')} edge="end">
                                        <X size={16} />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        },
                    }}
                />

                <Button variant="contained" startIcon={<Plus size={18} />} onClick={toggleCreateDialog} sx={{ whiteSpace: 'nowrap' }}>
                    Tambah Brand
                </Button>
            </Box>

            {/* Table */}
            <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Table sx={{ minWidth: 500 }} aria-label="brand table">
                    <TableHead>
                        <TableRow>
                            <TableCell width="10%">No.</TableCell>
                            <TableCell width="40%">Nama Brand</TableCell>
                            <TableCell width="25%">Total Kode Diagnostik</TableCell>
                            <TableCell width="25%">Aksi</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            skeletonRows
                        ) : brands.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                                    <Typography variant="body1" color="text.secondary">
                                        Tidak ada data brand.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            brands.map((brand, index) => (
                                <TableRow key={brand.id} hover>
                                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {brand.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={brand.diagnosticsCount ?? 0} size="small" color="primary" variant="outlined" />
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Tooltip title="Edit Brand">
                                                <IconButton size="small" color="warning" onClick={() => handleEditClick(brand)}>
                                                    <Edit2 size={16} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Hapus Brand">
                                                <IconButton size="small" color="error" onClick={() => confirmDelete(brand)}>
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
                                    rowsPerPageOptions={[5, 10, 25, 50]}
                                    colSpan={4}
                                    count={totalCount}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={handleChangePage}
                                    onRowsPerPageChange={handleChangeRowsPerPage}
                                    labelRowsPerPage="Baris per halaman"
                                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} dari ${count}`}
                                />
                            </TableRow>
                        </TableFooter>
                    )}
                </Table>
            </TableContainer>

            {/* Create Brand Dialog */}
            <Dialog open={openCreateDialog} onClose={toggleCreateDialog} fullWidth maxWidth="sm">
                <DialogTitle>Tambah Brand Baru</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Nama Brand"
                        fullWidth
                        variant="outlined"
                        value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                        disabled={creating}
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={toggleCreateDialog} disabled={creating}>
                        Batal
                    </Button>
                    <Button onClick={handleAddBrand} variant="contained" disabled={creating} startIcon={creating && <CircularProgress size={16} />}>
                        {creating ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Brand Dialog */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Edit Brand</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Nama Brand"
                        fullWidth
                        variant="outlined"
                        value={editBrandName}
                        onChange={(e) => setEditBrandName(e.target.value)}
                        disabled={editing}
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)} disabled={editing}>
                        Batal
                    </Button>
                    <Button onClick={handleUpdateBrand} color="warning" variant="contained" disabled={editing} startIcon={editing && <CircularProgress size={16} />}>
                        {editing ? 'Menyimpan...' : 'Update'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Konfirmasi Hapus</DialogTitle>
                <DialogContent>
                    <Typography>
                        Apakah Anda yakin ingin menghapus brand <strong>{brandToDelete?.name}</strong>?
                        <br />
                        Tindakan ini tidak dapat dibatalkan.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
                        Batal
                    </Button>
                    <Button onClick={handleDeleteBrand} color="error" variant="contained" disabled={deleting}>
                        {deleting ? <CircularProgress size={20} /> : 'Hapus'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}