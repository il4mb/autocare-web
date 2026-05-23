"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import { Car, Wrench, Users, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState({ brands: 0, codes: 0, users: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Kita gunakan limit=1 hanya untuk mengambil metadata.total dari masing-masing endpoint
                const [brandRes, codeRes, userRes] = await Promise.all([
                    fetch('/api/dictionary/brands?limit=1'),
                    fetch('/api/dictionary/diagnostic-codes?limit=1'),
                    fetch('/api/users?limit=1')
                ]);

                const brandData = await brandRes.json();
                const codeData = await codeRes.json();
                const userData = await userRes.json();

                setStats({
                    brands: brandData.metadata?.total || 0,
                    codes: codeData.metadata?.total || 0,
                    users: userData.metadata?.total || 0,
                });
            } catch (error) {
                console.error("Gagal mengambil statistik dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const StatCard = ({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) => (
        <Card sx={{ height: '100%', borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                <Box sx={{
                    backgroundColor: `${color}15`,
                    color: color,
                    p: 2,
                    borderRadius: 2,
                    display: 'flex',
                    mr: 3
                }}>
                    {icon}
                </Box>
                <Box>
                    <Typography variant="body2" sx={{
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        color: "text.secondary",
                    }}>
                        {title}
                    </Typography>
                    <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 'bold' }}>
                        {loading ? <CircularProgress size={24} sx={{ mt: 1 }} /> : value}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <Box component="main" sx={{ flexGrow: 1, p: 3, ml: '240px' }}>

                {/* Header Section */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        Dashboard Admin
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                        Selamat datang di AutoCare Admin. Berikut adalah ringkasan data sistem saat ini.
                    </Typography>
                </Box>

                {/* Statistics Cards */}
                <Grid container spacing={3} sx={{ mb: 5 }}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <StatCard
                            title="Total Brand"
                            value={stats.brands}
                            icon={<Car size={32} />}
                            color="#1976d2" // Primary blue
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <StatCard
                            title="Kode Diagnostik"
                            value={stats.codes}
                            icon={<Wrench size={32} />}
                            color="#ed6c02" // Warning orange
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <StatCard
                            title="Total User"
                            value={stats.users}
                            icon={<Users size={32} />}
                            color="#2e7d32" // Success green
                        />
                    </Grid>
                </Grid>

                <Divider sx={{ mb: 4 }} />

                {/* Quick Actions / Shortcuts */}
                <Box>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                        Jalan Pintas
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Button
                                variant="outlined"
                                size="large"
                                fullWidth
                                endIcon={<ArrowRight size={18} />}
                                onClick={() => router.push('/dashboard/dictionary/brand')}
                                sx={{ py: 2, justifyContent: 'space-between' }}>
                                Kelola Brand Mobil
                            </Button>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Button
                                variant="outlined"
                                size="large"
                                fullWidth
                                endIcon={<ArrowRight size={18} />}
                                onClick={() => router.push('/dashboard/dictionary/diagnostic-code')}
                                sx={{ py: 2, justifyContent: 'space-between' }}>
                                Kelola Kode DTC
                            </Button>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Button
                                variant="outlined"
                                size="large"
                                fullWidth
                                endIcon={<ArrowRight size={18} />}
                                onClick={() => router.push('/dashboard/users')}
                                sx={{ py: 2, justifyContent: 'space-between' }}>
                                Manajemen User
                            </Button>
                        </Grid>
                    </Grid>
                </Box>

            </Box>
        </Box>
    );
}