import GlobalModal from '@/components/GlobalModal';
import React, { ReactNode } from 'react';
import styles from './course.module.less';

interface ModalsProps {
  isOpen?: boolean;
  modalType?: string;
  content?: ReactNode;
  closeModal?: () => void;
}

const Modals: React.FC<ModalsProps> = ({ isOpen = false, closeModal, modalType = "", content = "" }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* 课程提示Modal */}
      {modalType === 'textTip' &&
        <GlobalModal isOpen={isOpen}>
          <div className={styles[`modal_${modalType}`]}>
            <div
              className={styles.close}
              onClick={closeModal}
            ></div>
            {content}
          </div>
        </GlobalModal>}
    </>

  );
};

export default Modals;
