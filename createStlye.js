import React from 'react';
// 用于写弹出层样式
const createStyle = (styles, scoped) => {
  return (
    <style scoped={scoped ? 'scoped' : null} dangerouslySetInnerHTML={{ __html: styles }} />
  );
};

export default createStyle;
