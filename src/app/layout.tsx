'use server';
import 'reflect-metadata';
import '@/connection';
import Theme from '@/theme/Theme';
import { ReactNode } from 'react';

interface LayoutProps {
    children: ReactNode;
}

export default async function Layout({ children }: LayoutProps) {
    return (
        <html lang="id">
            <body>
                <Theme>
                    {children}
                </Theme>
            </body>
        </html>
    );
}