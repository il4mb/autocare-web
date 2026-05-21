'use client';
import Link from "next/link";
import { Box, Button, styled, Typography } from "@mui/material";
import { memo, useState } from "react";
import { usePathname } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useRouter } from "next/navigation";

const StyledContainer = styled(Box, { shouldForwardProp: (prop) => prop !== 'open' })<{ open: boolean }>(({ theme, open }) => ({
    width: open ? 240 : 0,
    transition: 'width 0.3s',
    overflow: 'hidden',
    backgroundColor: theme.palette.background.paper,
    color: 'white',
    height: '100vh',
    elevation: 4
}));
const StyledLink = styled(Link)({
    display: 'block',
    padding: '8px 16px',
    color: 'inherit',
    textDecoration: 'none',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    borderRadius: 12,
});


const LINKS = [
    {
        label: "Home",
        href: "/dashboard"
    },
    // {
    //     label: "Dictionary",
    //     // href: "/dashboard/dictionary",
    //     children: [
    {
        label: "Brand",
        href: "/dashboard/dictionary/brand"
    },
    {
        label: "Diagnostic Code",
        href: "/dashboard/dictionary/diagnostic-code"
    },
        // ]
    // },
    {
        label: "Users",
        href: "/dashboard/users"
    },
    // {
    //     label: "Settings",
    //     href: "/dashboard/settings"
    // },
    {
        label: "Profile",
        href: "/dashboard/profile"
    }
]

interface DashboardMenuProps {
    open: boolean;
}
export default function DashboardMenu({ open }: DashboardMenuProps) {

    const router = useRouter();
    const [logouting, setLogouting] = useState(false);

    const handleLogout = async () => {
        setLogouting(true);
        try {
            await fetch("/api/auth", {
                method: "DELETE",
                headers: { 'Content-Type': 'application/json' },
            });
        } catch (error) {
            console.error("Logout Error:", error);
            enqueueSnackbar('Gagal logout. Anda akan diarahkan ke halaman login.', { variant: 'error' });
        } finally {
            setLogouting(false);
            router.push("/");
        }
    }
    return (
        <StyledContainer open={open}>
            <Box sx={{
                height: '100%',
                minWidth: 'max-content', // Ensure the container can shrink but not grow beyond its content
                padding: 2,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
            }}>
                <Box>
                    <Typography variant="h6" sx={{ p: 2, fontWeight: 'bold' }}>
                        AutoCare Admin
                    </Typography>
                </Box>

                <Box sx={{ flexGrow: 1 }}>
                    {LINKS.map((link) => (
                        <LinkMenu key={link.href} {...link} />
                    ))}
                </Box>
                <Button variant="contained" color="error" fullWidth sx={{ mt: 2 }} onClick={handleLogout} disabled={logouting}>
                    Logout
                </Button>
            </Box>
        </StyledContainer>
    );
}


type LinkMenuProps = {
    label: string;
    href?: string;
    children?: LinkMenuProps[];
}
const LinkMenu = memo(({ label, href, children }: LinkMenuProps) => {

    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Box>
            {href ? (
                <StyledLink href={href} sx={{ backgroundColor: isActive ? 'primary.main' : 'transparent' }}>
                    {label}
                </StyledLink>
            ) : (
                <Typography sx={{ px: 2, py: 1, fontWeight: 'medium', }}>
                    {label}
                </Typography>
            )}
            {children && (
                <Box sx={{ pl: 2 }}>
                    {children.map((child) => (
                        <LinkMenu key={child.href} {...child} />
                    ))}
                </Box>
            )}
        </Box>
    )
})