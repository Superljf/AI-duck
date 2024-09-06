import React from 'react';
import styles from './index.module.less';
import styled from './other.module.less';
import { convertPxToRem } from '@/utils/string';
import { Spin } from 'antd';

const RankItem = ({ item, index, switchRank, rankImg }) => {
  return (
    <div
      key={index}
      style={{
        backgroundColor: index % 2 === 0 ? '#faeed8' : '#fde7be',
      }}
    >
      <div className={styles.list} style={{ margin: 0 }} key={index}>
        <div className={styles.rank}>
          {item?.ranking > 3 ? (
            <span>{item?.ranking}</span>
          ) : (
            <img src={rankImg[item.ranking]} />
          )}
        </div>
        <div
          className={styles.text}
          style={{ width: convertPxToRem(150) }}
          title={item.username}
        >
          {item.username}
        </div>
        {switchRank === 0 && (
          <div
            className={styles.text}
            style={{ width: convertPxToRem(200) }}
            title={item.school}
          >
            {item?.school && item?.school?.length && (
              <>
                {item?.school?.length >= 8
                  ? `...${item.school.slice(-6)}`
                  : item.school}
              </>
            )}
          </div>
        )}
        <div className={styles.text} style={{ width: convertPxToRem(120), textOverflow: 'unset' }}>
          {item.winRate}
        </div>
        <div className={styles.text}> {item.points}</div>
      </div>
    </div>
  );
};

const MyRank = ({ myData, switchRank }) => {
  return (
    <div className={styles.myRankPosition}>
      <div className={`${styles.myBg} ${styles.list} `}>
        <img
          style={{
            width: convertPxToRem(32),
            height: convertPxToRem(32),
            position: 'absolute',
            left: 0,
            top: 0,
          }}
          src="/duck/myrank.png"
        />
        <div className={styles.rank} style={{ color: '#fff' }}>
          <span style={{ fontSize: 20, color: '#fff' }}>{myData?.ranking}</span>
        </div>
        <div
          className={styles.text}
          style={{
            color: '#fff',
            width: convertPxToRem(150),
          }}
          title={myData?.username}
        >
          {myData?.username}
        </div>
        {switchRank === 0 && (
          <div
            className={styles.text}
            style={{ color: '#fff', width: convertPxToRem(200) }}
          >
            {myData?.school && myData?.school?.length && (
              <>
                {myData?.school?.length >= 8
                  ? `...${myData.school.slice(-6)}`
                  : myData.school}
              </>
            )}
          </div>
        )}
        <div
          className={styles.text}
          style={{ color: '#fff', width: convertPxToRem(120), textOverflow: 'unset' }}
        >
          {myData?.winRate}
        </div>
        <div className={styles.text} style={{ color: '#fff' }}>
          {' '}
          {myData?.points}
        </div>
      </div>
      <div className={styles.excess}>
        您的积分超过了{myData?.excess}的玩家！
      </div>
    </div>
  );
};

const RankList = ({
  rankList,
  phyRank,
  switchRank,
  rankBgImg,
  handleBack,
  newHand,
  source,
  AIModel,
  setSwitchRank,
  rankLoading,
  isFromEventResult = false,
}) => {
  const rankImg = ['', '/duck/no_1.png', '/duck/no_2.png', '/duck/no_3.png'];
  const isPhyAI = source && AIModel;

  const getData = isPhyAI && switchRank === 0 ? phyRank?.list : rankList;
  const myData = getData?.filter((item) => item.isSelf === true)?.[0];
  const haveMyRank = getData?.some((item) => item.isSelf === true);
  const textName = newHand
    ? '/duck/xiaobai_text.png'
    : AIModel
      ? '/duck/ai_text.png'
      : '/duck/pk_text.png';
  return (
    <div
      className={styles.rank_bg}
      style={{
        backgroundImage: `url(${rankBgImg})`,
        height: isPhyAI ? convertPxToRem(599) : convertPxToRem(534),
      }}
    >
      <div className={styles.textName}>
        <img src={textName} />
      </div>
      <div onClick={handleBack} className={styles['backImg']}>
        <img src={'/duck/close_rank.png'} />
      </div>
      {/* 物理所需要进行切换 */}
      <>
        {isPhyAI ? (
          <>
            <div className={styles.rankContainer}>
              <div>
                <div
                  style={{
                    display: 'flex',
                    gap: 5,
                    alignItems: 'center',
                    marginBottom: convertPxToRem(12),
                  }}
                >
                  <div
                    onClick={() => {
                      switchRank === 0 ? '' : setSwitchRank(0);
                    }}
                    className={`${styles[switchRank === 0 ? 'newHandOut' : 'newHandSwitch']
                      } `}
                  >
                    当前活动榜
                  </div>
                  {!isFromEventResult && (
                    <div
                      onClick={() => {
                        switchRank === 1 ? '' : setSwitchRank(1);
                      }}
                      className={`${styles[
                        switchRank === 1 ? 'newHandOut' : 'newHandSwitch'
                      ]
                        } `}
                    >
                      总排行榜
                    </div>
                  )}
                </div>
                {isPhyAI && switchRank === 0 && phyRank?.eventTime && (
                  <div className={styled.time_text}>
                    活动时段： {phyRank?.eventTime}
                  </div>
                )}
                <div className={styles.list_bg}>
                  {switchRank === 0 ? (
                    <>
                      <div className={styles.rankWidth}>排名</div>
                      <div
                        style={{ width: convertPxToRem(150) }}
                        className={styles.rankWidth}
                      >
                        姓名
                      </div>
                      <div
                        className={styles.rankWidth}
                        style={{ width: convertPxToRem(200) }}
                      >
                        学校
                      </div>
                      <div
                        className={styles.rankWidth}
                        style={{ paddingRight: 4, width: convertPxToRem(120) }}
                      >
                        胜率
                      </div>
                      <div className={styles.rankWidth}>积分</div>
                    </>
                  ) : (
                    <>
                      <div className={styles.rankWidth}>排名</div>
                      <div className={styles.rankWidth} style={{ width: convertPxToRem(150) }}>玩家</div>
                      <div className={styles.rankWidth} style={{ width: convertPxToRem(120) }}>胜率</div>
                      <div className={styles.rankWidth} >积分</div>
                    </>
                  )}
                </div>
              </div>
              <div className={styles.rankList_bg}>
                <Spin spinning={rankLoading}>
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                    }}
                  >
                    {getData?.slice(0, 10)?.map((item, index) => (
                      <RankItem
                        key={index}
                        item={item}
                        index={index}
                        switchRank={switchRank}
                        rankImg={rankImg}
                      />
                    ))}
                  </div>
                </Spin>

                {/* 我的排名 */}
                <>
                  {getData?.length > 0 && haveMyRank && (
                    <MyRank myData={myData} switchRank={switchRank} />
                  )}
                </>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.rankContainer}>
            <div>
              <div className={styles.list_bg}>
                <div className={styles.rankWidth}>排名</div>
                <div
                  className={styles.rankWidth}
                  style={{
                    width: convertPxToRem(150),
                  }}
                >
                  玩家
                </div>
                <div
                  className={styles.rankWidth}
                  style={{
                    width: convertPxToRem(120),
                  }}
                >
                  胜率
                </div>
                <div className={styles.rankWidth}>积分</div>
              </div>
            </div>
            <div className={styles.rankList_bg}>
              <Spin spinning={rankLoading}>
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
                >
                  {getData?.slice(0, 10)?.map((item, index) => (
                    <RankItem
                      key={index}
                      item={item}
                      index={index}
                      rankImg={rankImg}
                    />
                  ))}
                </div>
              </Spin>

              {/* 我的排名 */}
              <>
                {getData?.length > 0 && haveMyRank && (
                  <MyRank myData={myData} />
                )}
              </>
            </div>
          </div>
        )}
      </>
    </div>
  );
};

export default RankList;
