import '../styles/globals.css';
import Header from '../components/Header';

export const metadata = {
  title: 'TodoGreen',
  description: 'Mobile-first, accessible todo app with a green reward system.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (() => {
            const savedTheme = localStorage.getItem('theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.classList.toggle('dark', savedTheme === 'dark' || (!savedTheme && prefersDark));
          })();
        ` }} />
      </head>
      <body>
        <Header />
        <main className="container py-6">{children}</main>
      </body>
    </html>
  );
}
