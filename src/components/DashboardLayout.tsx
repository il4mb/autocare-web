'use client';
import { Box, IconButton, Typography } from "@mui/material";
import DashboardMenu from "./DashboardMenu";
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {

    const [open, setOpen] = useState(true);
    const [title, setTitle] = useState("Dashboard");

    const ignoreFallbackRef = useRef(false);
    const pathname = usePathname();

    const handleSetTitle = (newTitle: string) => {
        setTitle(newTitle);
        ignoreFallbackRef.current = true;
    }


    useEffect(() => {
        let delay = setTimeout(() => {
            if (ignoreFallbackRef.current) {
                ignoreFallbackRef.current = false;
                return;
            }
            setTitle("Dashboard");
        }, 100);
        return () => {
            clearTimeout(delay);
        };
    }, [pathname]);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'row', height: '100vh', overflow: 'hidden' }}>
            <DashboardMenu open={open} />
            <Box component={"main"} sx={{ flex: 1, p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                    <IconButton onClick={() => setOpen(!open)}>
                        {open ? <ChevronLeft /> : <ChevronRight />}
                    </IconButton>
                    <Typography variant="h4">
                        {title || "Dashboard"}
                    </Typography>
                </Box>
                <Context.Provider value={handleSetTitle}>
                    {children}
                </Context.Provider>
            </Box>
        </Box>
    );
}



const Context = createContext<(title: string) => void>(() => { });
export const useSetTitle = (title: string) => {
    const setTitle = useContext(Context);
    useEffect(() => {
        setTitle(title);
    }, [title]);
}   