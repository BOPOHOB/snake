import { StrictMode } from 'react';
import { hydrateRoot, createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import 'antd/dist/reset.css';
import { AppProviders } from './appProviders';
import { routes } from './router/routes';
import './style/main.less';

const router = createBrowserRouter(routes);

const app = (
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>
);

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element #root not found');
}

/** Placeholder comment in index.html is not SSR markup — hydrate only real HTML/text. */
function hasSsrMarkup(element: HTMLElement): boolean {
  return [...element.childNodes].some(
    (node) =>
      node.nodeType === Node.ELEMENT_NODE ||
      (node.nodeType === Node.TEXT_NODE && node.textContent?.trim() !== ''),
  );
}

if (hasSsrMarkup(root)) {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}
