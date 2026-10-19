import { isRouteErrorResponse, useRouteError } from 'react-router';

/** Rendered by the router when a route throws while rendering or loading. */
export function RouteErrorPage() {
  const error = useRouteError();

  const message = isRouteErrorResponse(error)
    ? `${String(error.status)} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Unknown error';

  return (
    <main>
      <h1>Something went wrong</h1>
      <p>{message}</p>
    </main>
  );
}
