export default function WidgetLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="bg-transparent overflow-hidden">
                {children}
            </body>
        </html>
    );
}
