


import React, { useEffect, useState } from 'react';
import styles from './index.module.less';
import GlobalModal from '@/components/GlobalModal';
import styled from './other.module.less';
import emitter from "@/components/eventEmitter.js";



const TipModal = () => {
  const [reloadOpen, setReloadOpen] = useState(false);
  const [tipText, setTipText] = useState('忙碌');
  const handleOpen = (text = "忙碌") => {
    setTipText(text);
    setReloadOpen(true);
  };
  useEffect(() => {
    emitter.on('tipOpen', handleOpen);
    return () => {
      emitter.off('tipOpen', handleOpen);
    };
  }, []);

  return (
    <GlobalModal isOpen={reloadOpen}>
      <div className={styled.phyTipImg} style={{
        padding: '0px 32px',
        paddingTop: 30
      }}>
        <div className={styled.text1}>系统有点{tipText}呢，刷新一下页面试试吧～</div>
        <img className={styled.reload_btn} onClick={() => {
          window.location.reload();
        }}
          src="/duck/reload_btn.png" />
      </div>
    </GlobalModal>

  );
};

export default TipModal;