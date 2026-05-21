"use client"

import React from "react"
import { useRouter } from "next/navigation"
import Container from "@mui/material/Container"
import Box from "@mui/material/Box"
import TextField from "@mui/material/TextField"
import Button from "@mui/material/Button"
import Typography from "@mui/material/Typography"

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = React.useState("")
    const [password, setPassword] = React.useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // TODO: wire real auth. For now redirect to dashboard
        router.push("/dashboard")
    }

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h4" component="h1" align="center">AutoCare Admin</Typography>

                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <Button type="submit" variant="contained">Sign in</Button>
                </Box>
            </Box>
        </Container>
    )
}
