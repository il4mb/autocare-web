"use client"

import React from "react"
import SideNav from "../../components/SideNav"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"

export default function DashboardPage() {
    return (
        <Box sx={{ display: 'flex' }}>
            {/* <SideNav /> */}
            <Box component="main" sx={{ flexGrow: 1, p: 3, ml: '240px' }}>
                <Typography variant="h5">Dashboard</Typography>
                <Typography sx={{ mt: 2 }}>Welcome to AutoCare Admin dashboard.</Typography>
            </Box>
        </Box>
    )
}
