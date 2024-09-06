import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './other.module.less';
import { Layout } from '@/components/layout';
import GlobalModal from '@/components/GlobalModal';
import RankListRender from './RankList';
import { getDuckGameRanking } from '@/services/common';
import { getEventRanking } from '@/services/User';
import { useHistory } from 'react-router';



const EventResult = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const status = queryParams.get('status');
  console.log("🚀 ~ file: eventResult.tsx:17 ~ EventResult ~ status:", status);
  const time = queryParams.get('time');
  const source = queryParams.get('source');
  const history = useHistory();

  const [showRank, setShowRank] = useState(false);
  const [rankLoading, setRankLoading] = useState(false);
  const [rankList, setRankList] = useState();


  const handleRankList = async () => {
    try {
      setShowRank(true);
      setRankLoading(true);
      // 来源物理所AI鸭模式
      const [res] = await Promise.all([
        getEventRanking({ role: 'userHistory', link: source }),
      ]);
      setRankList(res);
    } catch (error) {
      // 错误处理
    } finally {
      setRankLoading(false);
    }
  };

  const rankBgImg = '/duck/phy_AI_rank_bg.png';





  return (
    <div className={styles.main}>
      <div className={styles.tabBar}>AI鸭</div>
      <div className={styles.content}>
        <div className={styles.content_div}>
          <div className={styles.result}>
            {status === '-3' ? (
              <>
                <img src="/duck/event_over.png" className={styles.text}></img>
                <img src="/duck/event_see.png" onClick={handleRankList} className={styles.btn} ></img>
                <img src="/duck/event_play.png" className={styles.btn}
                  onClick={() => {
                    history.push('/cn/AIGame');
                  }}
                  style={{ marginTop: 16 }}></img>
              </>
            ) : (
              <>
                {status !== '-1' &&
                  <div style={{ textAlign: "center" }}>
                    <img src="/duck/event_game_over.png" className={styles.text}></img>
                    <img src="/duck/event_see.png" onClick={handleRankList} style={{ marginBottom: 50 }} className={styles.btn}></img>
                  </div>
                }
                <div className={styles.time_out}>
                  <div className={styles.timeBg}>
                    <div className={styles.timeTitle}>新一轮比赛开始时间为：</div>
                    <div className={styles.time}>{time}</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <GlobalModal isOpen={showRank} >
        <RankListRender
          rankList={rankList}
          phyRank={rankList}
          switchRank={0}
          rankBgImg={rankBgImg}
          handleBack={() => {
            setShowRank(false);
          }}
          source={source}
          AIModel={true}
          rankLoading={rankLoading}
          isFromEventResult={true}
        />
      </GlobalModal >
    </div>
  );
};

export default EventResult;
