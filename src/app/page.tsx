"use client";

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Box, TextField, Button, Typography, Paper, IconButton, InputAdornment, Alert, CircularProgress, } from "@mui/material";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {

    const router = useRouter();
    const [data, setData] = useState({
        email: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const updateData = useCallback((field: string, value: string) => {
        setData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Basic email validation
        if (!data.email.includes("@") || !data.email.includes(".")) {
            setError("Please enter a valid email address.");
            return;
        }

        if (data.password.length < 4) {
            setError("Password must be at least 4 characters.");
            return;
        }

        setLoading(true);

        // Simulate API call
        try {
            const response = await fetch("/api/auth", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });
            const result = await response.json();

            if (response.ok && result.success) {
                router.push("/dashboard");
            } else {
                setError(result.error || "Login failed. Please try again.");
            }
        } catch (err) {
            setError("Login failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                background: "linear-gradient(135deg, #1e2a3a 0%, #112a66 100%)",
                py: 4,
            }}>
            <Container maxWidth="sm">
                <Paper
                    elevation={6}
                    sx={{
                        p: { xs: 3, sm: 5 },
                        borderRadius: 4,
                        backdropFilter: "blur(4px)",
                        background: "linear-gradient(135deg, #405b7e 0%, #112a66 100%)",
                    }}>
                    <Box sx={{ textAlign: "center", mb: 4 }}>
                        <Box
                            sx={{
                                width: 64,
                                height: 64,
                                mx: "auto",
                                mb: 2,
                                backgroundColor: "#1976d2",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 32,
                                color: "white",
                            }}>
                            🚗
                        </Box>
                        <Typography variant="h5" component="h1" gutterBottom>
                            AutoCare Admin Panel
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Sign in to access the dashboard
                        </Typography>
                    </Box>

                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <TextField
                            fullWidth
                            label="Email Address"
                            type="email"
                            value={data.email}
                            onChange={(e) => updateData("email", e.target.value)}
                            required
                            margin="normal"
                            autoFocus
                            disabled={loading}
                        />

                        <TextField
                            fullWidth
                            label="Password"
                            type={showPassword ? "text" : "password"}
                            value={data.password}
                            onChange={(e) => updateData("password", e.target.value)}
                            required
                            margin="normal"
                            disabled={loading}
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                sx={{
                                                    mr: -.75,
                                                    border: 'none',
                                                    "&:hover": {
                                                        border: 'none',
                                                        backgroundColor: 'transparent',
                                                    }
                                                }}
                                                edge="end"
                                                disabled={loading}>
                                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }
                            }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{ mt: 3, mb: 2, py: 1.2, borderRadius: 2 }}>
                            {loading ? <CircularProgress size={24} /> : "Sign In"}
                        </Button>

                        <Box sx={{ textAlign: "center", mt: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                Forgot password?{" "}
                                <Button variant="text" size="small" sx={{ textTransform: "none" }}>
                                    Reset here
                                </Button>
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}