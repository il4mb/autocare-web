import { verifyResetToken } from '@/utils/authUtils';
import { Box, Typography } from '@mui/material';
import { ReactNode } from 'react';

interface LayoutProps {
    children: ReactNode;
    params: Promise<{ token: string }>;
}

export default async function Layout({ children, params }: LayoutProps) {
    const { token } = await params;
    const isValidToken = await verifyResetToken(token);

    if (!isValidToken) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <Typography variant="h4" gutterBottom>
                    Invalid or Expired Token
                </Typography>
                <Typography variant="body1">
                    The password reset link is invalid or has expired. Please try again.
                </Typography>
            </Box>
        );
    }
    return children;
}