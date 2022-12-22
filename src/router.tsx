import React from 'react';
import { Routes, Route } from 'react-router-dom';

import { Game } from 'pages/game.jsx';
import { Page404 } from 'pages/404.jsx';
import isMobile from 'is-mobile';

export const Router = () => {
  if (isMobile()) {
    return (
      <div style={{display: 'flex', justifyContent: 'center'}}>
        <h2>This game implemented only for desktop. I'm not friendly to mobile devices as a devices for gaming.</h2>
        <svg style={{ width: '80vw', height: '80vh' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.88 122.88">
          <path d="M49.05,24.38H73.83A8.21,8.21,0,0,1,82,32.58V90.3a8.21,8.21,0,0,1-8.19,8.2H49.05a8.21,8.21,0,0,1-8.19-8.2V32.58c0-4.71,3.61-7.95,8.19-8.2Zm15,66.47a3.36,3.36,0,1,1-5.26,0,3.38,3.38,0,0,1,5.26,0ZM79.66,87V34.68H43.21V87Z"/>
          <path fill="#d92d27" d="M61.44,0A61.31,61.31,0,1,1,38,4.66,61.29,61.29,0,0,1,61.44,0Zm40.24,32.93L32.93,101.68A49.44,49.44,0,0,0,80.31,107a49.26,49.26,0,0,0,30.44-45.58h0a49.12,49.12,0,0,0-9.08-28.51ZM24,93.5,93.5,24A49.32,49.32,0,0,0,24,93.5Z"/>
        </svg>
      </div>
    );
  }
  return (
    <Routes>
      <Route index element={<Game />} />
      <Route path="*" element={<Page404 />} />
    </Routes>
  );
};
