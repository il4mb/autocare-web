'use client';
import { Box, Typography } from "@mui/material";
import { useSetTitle } from "@/components/DashboardLayout";

export default function Page() {
    useSetTitle("Diagnostic Code Dictionary");
    return (
        <main>
            <h1>Page Title</h1>
        </main>
    );
}