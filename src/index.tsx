
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'antd/dist/antd.less';

import { Router } from 'router';

import 'theme/index.less';

const root = ReactDOM.createRoot(
  document.getElementById('app') as HTMLDivElement
);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Router />
    </BrowserRouter>
  </React.StrictMode>
);
