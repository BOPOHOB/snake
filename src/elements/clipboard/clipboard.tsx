import React from 'react';
import { Button, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';

import cn from './clipboard.module.less';

const Clipboard: React.FC<{ content: string, children: React.ReactNode }> = React.memo(({ content, children }) => {
  const onCopyToClipboard = () => {
    navigator.clipboard.writeText(content);
    message.open({
      type: 'success',
      content: children,
    });
  };
  const contentArray = content.split('\n');
  return (
    <div className={cn.wrap}>
      {contentArray.map((v, id) => <React.Fragment key={id}>{v}{id !== contentArray.length - 1 && <br />}</React.Fragment>)}
      <Button icon={<CopyOutlined />} onClick={onCopyToClipboard}></Button>
    </div>
  );
});

export { Clipboard };
