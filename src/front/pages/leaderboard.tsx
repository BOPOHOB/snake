import { Link, useLoaderData } from 'react-router-dom';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ResultDump } from '../types/result';

const columns: ColumnsType<ResultDump> = [
  {
    title: '#',
    key: 'rank',
    width: 56,
    render: (_v, _r, index) => index + 1,
  },
  {
    title: 'Игрок',
    dataIndex: 'user_name',
    key: 'user_name',
    render: (name: string, record) =>
      name ? <Link to={`/result/${record.id}`}>{name}</Link> : '—',
  },
  {
    title: 'Счёт',
    dataIndex: 'score',
    key: 'score',
    sorter: (a, b) => a.score - b.score,
    defaultSortOrder: 'descend',
  },
  {
    title: 'Уровень',
    dataIndex: 'level',
    key: 'level',
    width: 100,
  },
  {
    title: 'Лабиринт',
    dataIndex: 'labyrinth',
    key: 'labyrinth',
    width: 110,
  },
  {
    title: 'Попытки',
    dataIndex: 'retryCounter',
    key: 'retryCounter',
    width: 100,
  },
  {
    title: 'Исход',
    key: 'isWin',
    width: 90,
    render: (_v, record) => (record.isWin ? 'Победа' : 'Game over'),
  },
];

export const Leaderboard = () => {
  const { results } = useLoaderData() as { results: ResultDump[] };
  return (
    <main style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <h1>Таблица лидеров</h1>
      <Table<ResultDump>
        rowKey="id"
        columns={columns}
        dataSource={results}
        pagination={{ pageSize: 50, showSizeChanger: false }}
        size="small"
      />
    </main>
  );
};
