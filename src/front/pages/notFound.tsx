import { Link } from 'react-router-dom';

export const NotFound = () => {
  return (
    <main style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1>404</h1>
      <p>Страница не найдена.</p>
      <Link to="/">На главную</Link>
    </main>
  );
};
