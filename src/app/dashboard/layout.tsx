import DashboardLayout from '@/components/DashboardLayout';
import { ReactNode } from 'react';

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    return (
        <DashboardLayout>
            {children}
        </DashboardLayout>
    );
}