'use client';

import {
    Container,
    Box,
    TextField,
    Typography,
    Paper,
    Button,
    CircularProgress,
    Grid,
    Divider,
    Chip
} from '@mui/material';
import { useSetTitle } from '@/components/DashboardLayout';
import { Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { enqueueSnackbar } from 'notistack';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    useSetTitle('Profil Saya');
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: ''
    });

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const response = await fetch('/api/auth/me');
                if (!response.ok) throw new Error("Gagal memuat profil");

                const json = await response.json();
                setFormData({
                    name: json.data.name,
                    email: json.data.email,
                    role: json.data.role,
                    password: '' // Kosong secara default (demi keamanan)
                });
            } catch (error) {
                console.error("Error loading profile:", error);
                router.push('/'); // Redirect ke login jika token invalid
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const payload = {
                name: formData.name,
                email: formData.email,
                ...(formData.password && { password: formData.password })
            };

            const response = await fetch('/api/auth/me', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Gagal memperbarui profil');
            }

            enqueueSnackbar('Profil berhasil diperbarui!', { variant: 'success' });
            // Kosongkan field password setelah update sukses
            setFormData(prev => ({ ...prev, password: '' }));
        } catch (error) {
            enqueueSnackbar(error instanceof Error ? error.message : 'Terjadi kesalahan!', { variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container component="main" sx={{ flexGrow: 1, py: 3 }} maxWidth="md">
            <Paper sx={{ p: 4, borderRadius: 2 }}>
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                            Pengaturan Profil
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Perbarui informasi pribadi dan keamanan akun Anda di sini.
                        </Typography>
                    </Box>
                    <Chip
                        label={formData.role.toUpperCase()}
                        color={formData.role === 'admin' ? 'secondary' : 'primary'}
                        variant="outlined"
                    />
                </Box>

                <Divider sx={{ mb: 4 }} />

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Nama Lengkap"
                                fullWidth
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                disabled={saving}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Email"
                                type="email"
                                fullWidth
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={saving}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="Password Baru (Opsional)"
                                type="password"
                                fullWidth
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                disabled={saving}
                                helperText="Kosongkan jika Anda tidak ingin mengganti password."
                            />
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={saving}
                            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save size={18} />}>
                            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </Button>
                    </Box>
                </form>
            </Paper>
        </Container>
    );
}