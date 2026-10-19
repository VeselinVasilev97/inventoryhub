import { Outlet } from 'react-router';

/** Shared shell for every page. Child routes render inside <Outlet />. */
export function RootLayout() {
  return (
    <main>
      <Outlet />
    </main>
  );
}
