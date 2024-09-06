

import React from 'react';
import styles from './index.module.less';

const Loading = () => {
  return (
    <div className={styles.loader}>
      <div className={styles.ld2}>
        <div>
        </div>
        <div>
        </div>
        <div>
        </div>
        <div>
        </div>
        <div>
        </div>
        <div>
        </div>
        <div>
        </div>
      </div>
      <div style={{
        marginTop: 10,
        color: '#fff',
        fontSize: 14,
        display: 'flex',
        alignItems: 'center'
      }}>
        {/* <div className={styles.dot}>...</div> */}
      </div>

    </div>
  );
};

export default React.memo(Loading);