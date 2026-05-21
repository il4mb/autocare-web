'use client';
import { Box, Typography } from "@mui/material";
import { useSetTitle } from "@/components/DashboardLayout";

export default function Page() {

    useSetTitle("Brand Dictionary");

    return (
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Typography variant="h5">Brand Dictionary</Typography>
            <Typography sx={{ mt: 2 }}>Manage vehicle brands here.</Typography>
        </Box>
    );
}