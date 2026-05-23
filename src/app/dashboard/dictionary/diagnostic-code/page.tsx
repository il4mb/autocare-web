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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    LinearProgress,
} from '@mui/material';
import { useSetTitle } from '@/components/DashboardLayout';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { enqueueSnackbar } from 'notistack';

interface Brand {
    id: string;
    name: string;
}

interface DiagnosticCode {
    id: string;
    code: string;
    category: string;
    brand?: Brand | null;
    description?: string;
    symptoms?: string;
    causes?: string;
    solutions?: string;
}

const initialFormState = {
    code: '',
    brandId: '',
    description: '',
    symptoms: '',
    causes: '',
    solutions: '',
};

export default function DiagnosticCodeDictionaryPage() {
    useSetTitle('Diagnostic Codes');

    // Data State
    const [codes, setCodes] = useState<DiagnosticCode[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Table State
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Form State
    const [formOpen, setFormOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState(initialFormState);

    // Delete State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [codeToDelete, setCodeToDelete] = useState<DiagnosticCode | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Load Brands for Dropdown
    const loadBrands = useCallback(async () => {
        try {
            // Fetch with a high limit to get all brands for the select dropdown
            const response = await fetch('/api/dictionary/brands?limit=1000');
            if (response.ok) {
                const data = await response.json();
                setBrands(data.data || []);
            }
        } catch (error) {
            console.error('Failed to load brands', error);
        }
    }, []);

    // Fetch Diagnostic Codes
    const loadCodes = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: (page + 1).toString(),
                limit: rowsPerPage.toString(),
                ...(searchTerm && { search: searchTerm }),
            });
            // Adjust this endpoint if your path is different
            const response = await fetch(`/api/dictionary/diagnostic-codes?${params}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to load diagnostic codes');
            }
            const data = await response.json();
            setCodes(data.data || []);
            setTotalCount(data.metadata?.total || 0);
        } catch (error) {
            console.error('Error loading codes:', error);
            enqueueSnackbar(error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat data!', {
                variant: 'error',
            });
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, searchTerm]);

    useEffect(() => {
        loadBrands();
        loadCodes();
    }, [loadBrands, loadCodes]);

    // Search
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setPage(0);
    };

    // Dialog Handlers
    const handleOpenCreate = () => {
        setFormData(initialFormState);
        setIsEditing(false);
        setFormOpen(true);
    };

    const handleOpenEdit = (code: DiagnosticCode) => {
        // Helper to safely join arrays back into multiline strings
        const arrayToText = (data: any) => {
            if (Array.isArray(data)) return data.join('\n');
            return data || '';
        };

        setFormData({
            code: code.code,
            brandId: code.brand?.id || '',
            description: code.description || '',
            symptoms: arrayToText(code.symptoms),
            causes: arrayToText(code.causes),
            solutions: arrayToText(code.solutions),
        });
        setIsEditing(true);
        setFormOpen(true);
    };

    const handleCloseForm = () => {
        setFormOpen(false);
        setFormData(initialFormState);
    };

    // Submit Create/Edit
    const handleSubmit = async () => {
        if (!formData.code.trim()) {
            enqueueSnackbar('Kode DTC tidak boleh kosong!', { variant: 'error' });
            return;
        }

        setSubmitting(true);
        try {
            // Helper function to turn multi-line text into an array of strings
            const textToArray = (text: string) => {
                if (!text.trim()) return [];
                return text.split('\n').map(item => item.trim()).filter(item => item.length > 0);
            };

            const payload = {
                code: formData.code.trim(),
                // Send explicit null instead of undefined so Zod doesn't complain
                brandId: formData.brandId === '' ? null : formData.brandId,
                description: formData.description,
                symptoms: textToArray(formData.symptoms),
                causes: textToArray(formData.causes),
                solutions: textToArray(formData.solutions),
            };

            const response = await fetch('/api/dictionary/diagnostic-codes', {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();

                // Optional: If you want to log Zod errors nicely in the console to debug future issues
                if (errorData.errors) console.error("Zod Validation Errors:", errorData.errors);

                throw new Error(errorData.error || `Gagal ${isEditing ? 'memperbarui' : 'menambahkan'} kode`);
            }

            enqueueSnackbar(`Kode berhasil ${isEditing ? 'diperbarui' : 'ditambahkan'}!`, { variant: 'success' });
            handleCloseForm();
            loadCodes();
        } catch (error) {
            enqueueSnackbar(error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan data!', {
                variant: 'error',
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Delete Handlers
    const confirmDelete = (code: DiagnosticCode) => {
        setCodeToDelete(code);
        setDeleteDialogOpen(true);
    };

    const handleDeleteCode = async () => {
        if (!codeToDelete) return;
        setDeleting(true);
        try {
            // Note: Your backend expects ID in searchParams for DELETE
            const response = await fetch(`/api/dictionary/diagnostic-codes?id=${codeToDelete.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Gagal menghapus kode');
            }

            enqueueSnackbar('Kode berhasil dihapus!', { variant: 'success' });
            setDeleteDialogOpen(false);
            setCodeToDelete(null);
            loadCodes();
        } catch (error) {
            enqueueSnackbar(error instanceof Error ? error.message : 'Terjadi kesalahan saat menghapus kode!', {
                variant: 'error',
            });
        } finally {
            setDeleting(false);
        }
    };

    // Pagination Handlers
    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const skeletonRows = useMemo(
        () =>
            Array.from({ length: rowsPerPage }).map((_, idx) => (
                <TableRow key={`skeleton-${idx}`}>
                    <TableCell><Skeleton variant="text" width={60} /></TableCell>
                    <TableCell><Skeleton variant="text" width={100} /></TableCell>
                    <TableCell><Skeleton variant="text" width={200} /></TableCell>
                    <TableCell><Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} /></TableCell>
                </TableRow>
            )),
        [rowsPerPage]
    );

    return (
        <Container component="main" sx={{ flexGrow: 1, py: 3 }} maxWidth="lg">
            {/* Header Area */}
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
                    label="Cari Kode (ex: P0101)"
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

                <Button variant="contained" startIcon={<Plus size={18} />} onClick={handleOpenCreate} sx={{ whiteSpace: 'nowrap' }}>
                    Tambah Kode
                </Button>
            </Box>

            {/* Data Table */}
            <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Table sx={{ minWidth: 700 }} aria-label="diagnostic codes table">
                    <TableHead>
                        <TableRow>
                            <TableCell width="15%">Kode DTC</TableCell>
                            <TableCell width="20%">Brand</TableCell>
                            <TableCell width="50%">Deskripsi Singkat</TableCell>
                            <TableCell width="15%">Aksi</TableCell>
                        </TableRow>
                        {loading && (
                            <TableRow>
                                <TableCell colSpan={4} sx={{
                                    py: 0, maxHeight: 0,
                                    position: 'relative'
                                }}>
                                    <Box sx={{
                                        height: 3, backgroundColor: 'red',
                                        position: 'absolute', left: 0, right: 0, top: 0,
                                        background: 'linear-gradient(90deg, transparent, #1976d2, transparent)',
                                    }}>
                                        <LinearProgress color="primary" sx={{ height: '100%' }} />
                                    </Box>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableHead>
                    <TableBody>
                        {codes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                                    <Typography variant="body1" color="text.secondary">
                                        Tidak ada data kode diagnostik.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (codes.map((code) => (
                            <TableRow key={code.id} hover>
                                <TableCell>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                        {code.code}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    {code.brand ? (
                                        <Chip label={code.brand.name} size="small" color="primary" variant="outlined" />
                                    ) : (
                                        <Chip label="Generic" size="small" color="default" />
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 400 }}>
                                        {code.description || '-'}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Tooltip title="Edit Kode">
                                            <IconButton size="small" color="warning" onClick={() => handleOpenEdit(code)}>
                                                <Edit2 size={16} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Hapus Kode">
                                            <IconButton size="small" color="error" onClick={() => confirmDelete(code)}>
                                                <Trash2 size={16} />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        )))}
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

            {/* Create/Edit Form Dialog */}
            <Dialog open={formOpen} onClose={handleCloseForm} fullWidth maxWidth="md">
                <DialogTitle>{isEditing ? 'Edit Kode Diagnostik' : 'Tambah Kode Diagnostik'}</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={3} sx={{ mt: 0 }}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Kode DTC (ex: P0300)"
                                fullWidth
                                required
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                disabled={submitting || isEditing} // Code acts as identifier in backend PUT, so cannot edit
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel id="brand-select-label">Brand Kategori</InputLabel>
                                <Select
                                    labelId="brand-select-label"
                                    value={formData.brandId}
                                    label="Brand Kategori"
                                    onChange={(e) => setFormData({ ...formData, brandId: e.target.value as string })}
                                    disabled={submitting}>
                                    <MenuItem value="">
                                        <em>Generic (Semua Brand)</em>
                                    </MenuItem>
                                    {brands.map((b) => (
                                        <MenuItem key={b.id} value={b.id}>
                                            {b.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="Deskripsi"
                                fullWidth
                                multiline
                                rows={2}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                disabled={submitting}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="Gejala (Symptoms)"
                                fullWidth
                                multiline
                                rows={3}
                                value={formData.symptoms}
                                onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                                disabled={submitting}
                                placeholder="Tekan Enter untuk memisahkan setiap gejala"
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="Penyebab (Causes)"
                                fullWidth
                                multiline
                                rows={3}
                                value={formData.causes}
                                onChange={(e) => setFormData({ ...formData, causes: e.target.value })}
                                disabled={submitting}
                                placeholder="Kemungkinan penyebab masalah"
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="Solusi (Solutions)"
                                fullWidth
                                multiline
                                rows={3}
                                value={formData.solutions}
                                onChange={(e) => setFormData({ ...formData, solutions: e.target.value })}
                                disabled={submitting}
                                placeholder="Langkah-langkah perbaikan"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleCloseForm} disabled={submitting}>
                        Batal
                    </Button>
                    <Button onClick={handleSubmit} variant="contained" disabled={submitting} startIcon={submitting && <CircularProgress size={16} />}>
                        {submitting ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Konfirmasi Hapus</DialogTitle>
                <DialogContent>
                    <Typography>
                        Apakah Anda yakin ingin menghapus kode diagnostik <strong>{codeToDelete?.code}</strong>?
                        <br />
                        Tindakan ini tidak dapat dibatalkan.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
                        Batal
                    </Button>
                    <Button onClick={handleDeleteCode} color="error" variant="contained" disabled={deleting}>
                        {deleting ? <CircularProgress size={20} /> : 'Hapus'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}