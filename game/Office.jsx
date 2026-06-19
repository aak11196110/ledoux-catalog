import React from 'react';

export default function Office() {
  return (
    <div style={{ padding: '20px', background: '#1a1a1a', color: '#fff', minHeight: '100vh' }}>
      <h1>🏢 Ledoux 虛擬辦公室</h1>
      <p>老闆，點擊下方人員即可進行交辦事項：</p>
      
      {/* 這是您要的遊戲畫面區，之後我們會放像素圖 */}
      <div style={{ 
        width: '100%', 
        height: '400px', 
        border: '4px solid #444', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#000' 
      }}>
        <p>（這裡將呈現像素辦公室角色畫面）</p>
      </div>

      {/* 這是連動 AI 的大腦視窗，請把 Dify 的公開網頁連結貼在這裡 */}
      <iframe 
        src="https://cloud.dify.ai/你的應用程式公開連結" 
        width="100%" 
        height="400px" 
        style={{ marginTop: '20px', borderRadius: '8px' }}
      />
    </div>
  );
}
