'use client';
import { Box, styled, Typography } from "@mui/material";
import { memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
    {
        label: "Dictionary",
        href: "/dashboard/dictionary",
        children: [
            {
                label: "Brand",
                href: "/dashboard/dictionary/brand"
            },
            {
                label: "Diagnostic Code",
                href: "/dashboard/dictionary/diagnostic-code"
            }
        ]
    },
    {
        label: "Users",
        href: "/dashboard/users"
    },
    {
        label: "Settings",
        href: "/dashboard/settings"
    },
    {
        label: "Profile",
        href: "/dashboard/profile"
    }
]

interface DashboardMenuProps {
    open: boolean;
}
export default function DashboardMenu({ open }: DashboardMenuProps) {
    return (
        <StyledContainer open={open}>
            <Box sx={{
                height: '100%',
                minWidth: 'max-content', // Ensure the container can shrink but not grow beyond its content
                padding: 2,
            }}>
                <Box>
                    <Typography variant="h6" sx={{ p: 2, fontWeight: 'bold' }}>
                        AutoCare Admin
                    </Typography>
                </Box>
                {LINKS.map((link) => (
                    <LinkMenu key={link.href} {...link} />
                ))}
            </Box>
        </StyledContainer>
    );
}


type LinkMenuProps = {
    label: string;
    href: string;
    children?: LinkMenuProps[];
}
const LinkMenu = memo(({ label, href, children }: LinkMenuProps) => {

    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Box>
            <StyledLink href={href} sx={{ backgroundColor: isActive ? 'primary.main' : 'transparent' }}>
                {label}
            </StyledLink>
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