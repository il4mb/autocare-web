"use client";
import { Box, Button, Container, TextField, Typography } from "@mui/material";
import { useParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useState } from "react";

export default function Page() {

    const { token } = useParams<{ token: string }>();
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            const response = await fetch("/api/auth/reset-password", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token, newPassword: password }),
            });
            const data = await response.json();
            if (data.success) {
                enqueueSnackbar("Password reset successful! You can now log in with your new password.", { variant: "success" });
                setPassword("");
            }
        } catch (error) {
            console.error("Error resetting password:", error);
            enqueueSnackbar("An error occurred while resetting your password. Please try again.", { variant: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 4 }}>
            <Box component="main" sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Reset Password
                </Typography>
                <Typography variant="body1">
                    Enter your new password below.
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", mt: 2, justifyContent: "flex-end" }}>
                    <TextField
                        label="New Password"
                        type="password"
                        fullWidth
                        margin="normal"
                        value={password}
                        disabled={isSubmitting}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button variant="contained" color="primary" sx={{ mt: 2, maxWidth: "150px", alignSelf: "flex-end" }} onClick={handleSubmit} disabled={isSubmitting}>
                        Reset Password
                    </Button>
                </Box>
            </Box>
        </Container>
    );
}