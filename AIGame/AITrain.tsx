import React, { useEffect, useState } from 'react';
import styles from './index.module.less';
import { convertPxToRem } from '@/utils/string';
import GlobalModal from '@/components/GlobalModal';
import { Checkbox, Popup, Toast } from 'antd-mobile';
import styled from './other.module.less';
import {
  getDuckPKLog,
  getTrainCount,
  getTrainResult,
  setFoodsStrategy,
  trainDuck,
} from '@/services/common';
import { Input, Progress, Spin, message } from 'antd';
import { isNumberString } from '@/utils/list';
import { generateSmoothPath, showConfetti } from '@/utils/common';
import Modals from './AICourse/modals';

interface RecordItem {
  id: string;
  playTime: string;
  outcomeStatus: boolean;
  opp: string;
  points: number;
}

interface AITrainProps {
  setTrainModelFun: () => void;
  handleConPK: () => void;
  unlock: boolean;
}

const AITrain: React.FC<AITrainProps> = ({ setTrainModelFun, handleConPK, unlock }) => {
  const [recordList, setRecordList] = useState([]);
  // console.log('展示数组', recordList);
  const [allData, setAllData] = useState([]);

  const [seeResult, setSeeResult] = useState(false);
  const [seeLoading, setSeeLoading] = useState(false);
  const [resultRes, setResultRes] = useState({});
  const [clickStatus, setStatus] = useState(0);
  const [train, setTrain] = useState(false);
  const [isSuccess, setSuccess] = useState(false);
  const [percent, setPercent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [seeInfo, setSeeInfo] = useState();
  const [pathCoordinatesLine, setLinePath] = useState([0, 0]);
  const [clickIndex, setClickIndex] = useState<number | null>(null);
  const [trainCount, setTrainCount] = useState(5);
  const [duckShow, setDuckShow] = useState(false);
  const [foodsCelue, setFoodsCelue] = useState([]);
  const [isFirst, setIsFirst] = useState(true);
  // 已选取的总条数
  const [initAllData, setInitAllData] = useState([]);
  const [filterLoading, setFilterLoading] = useState(false);

  const [modalsOpen, setModalsOpen] = useState<boolean>(false);
  const [modalsType, setModalsType] = useState<string>('');
  const [modalContent, setModalsContent] = useState<ReactNode>(null);

  const preloadImages = [
    '/duck/train_duck.png',
    '/duck/training_text.png',
    '/duck/suc_site.png',
    '/duck/suc_duck.png',
    '/duck/suc_color.png',
  ];

  // 图片预加载
  useEffect(() => {
    setTimeout(() => {
      preloadImages.forEach((src, index) => {
        const img = new Image();
        img.src = src;
      });
    }, 1000); // 延迟 1000 毫秒（1 秒）加载图片
  }, []);

  useEffect(() => {
    getDuckPKLogFunc();
    return () => { };
  }, []);

  const getDuckPKLogFunc = async () => {
    try {
      setLoading(true);
      const [res, _] = await Promise.all([
        getDuckPKLog({ mode: 'ALL', pageSize: 99999 }),
        getCount(),
      ]);
      const newList = res?.list.map((item) => ({
        ...item,
        check: item.outcomeStatus,
      }));
      setRecordList([...newList]);
      setAllData([...newList]);
      setInitAllData([...newList]);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  const getCount = () => {
    return new Promise((resolve, reject) => {
      getTrainCount()
        .then((countRes) => {
          setTrainCount(countRes?.count);
          resolve(countRes?.count);
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  const updateCheckStatus = (data: [], id: string, checked: boolean) => {
    return data.map((item) =>
      item.id === id ? { ...item, check: checked } : item,
    );
  };

  const handleCheckboxChange = (id: string, checked: boolean) => {
    setRecordList((prevRecords) => updateCheckStatus(prevRecords, id, checked));
    setInitAllData((data) => updateCheckStatus(data, id, checked));
    setAllData((data) => updateCheckStatus(data, id, checked));
  };

  const handleSeeResult = async (item, index) => {
    try {
      setSeeLoading(true);
      setSeeResult(true);
      const res = await setFoodsStrategy({
        id: item?.id,
        action: 'history',
        multi: 0.8,
      });
      const sortedRes = res?.foods?.sort((a, b) => a.index - b.index);
      setIsFirst(false);
      setFoodsCelue([...sortedRes]);
      setResultRes(res);
      setSeeInfo(item);
      const filterList = recordList?.filter((fi) => fi.id === item.id);
      setStatus(filterList?.[0]?.check ? 1 : 2);
      setClickIndex(index);
      setLinePath([[0, 0], ...res?.foods?.map((item) => item.position)]);
    } catch (error) {
    } finally {
      setSeeLoading(false);
    }
  };

  const handleTrain = async () => {
    const checkedIds = initAllData
      .filter((item) => item.check)
      .map((item) => item.id);
    // console.log("传入数组", checkedIds.length);

    if (checkedIds.length === 0) {
      return Toast.show({
        content: '至少勾选一条数据哦',
      });
    }

    const totalTime = 5000;
    const maxTime = 9000;
    const interval = 100;
    let currentTime = 0;
    let fail = false;
    let timerTrain: any;
    let pending = false;
    let timer: any;

    const updateProgress = () => {
      let newPercent = Math.min((currentTime / totalTime) * 100, 100);
      currentTime += interval;

      if (pending && newPercent > 97) {
        setPercent(98);
      } else {
        setPercent(newPercent);
      }

      if (newPercent > 70 && fail) {
        Toast.show({
          icon: 'fail',
          content: '训练失败',
        });
        clearTimers();
        setTrain(false);
      }

      // 成功
      if (currentTime >= totalTime && !fail && !pending) {
        setSuccess(true);
        getCount();
        setTimeout(showConfetti, 100);
        setTimeout(() => setDuckShow(true), 200);
        clearInterval(timer);
      }
    };

    const clearTimers = () => {
      clearInterval(timer);
      clearInterval(timerTrain);
    };

    const handleModelTrainingStatus = async (id) => {
      try {
        const res = await getTrainResult(id);
        if (res?.trainResult) {
          fail = false;
          pending = false;
          clearInterval(timerTrain);
        } else if (res?.trainResult === false) {
          // 超过5s 等返回
          fail = true;
          clearTimers();
        } else if (res?.trainResult === '' && currentTime >= maxTime) {
          // 超过最大时间 9s 直接失败
          fail = true;
          clearInterval(timerTrain);
        } else {
          pending = true;
        }
      } catch (error) {
        fail = true;
        clearTimers();
      }
    };
    try {
      const resDuck = await trainDuck({ gameIdList: checkedIds });
      if (resDuck?.status === -1) {
        setModalsType("textTip");
        setModalsContent(
          <div>
            <div>
              两次 AI 训练的时间间隔不得小于1分钟，请稍后重试
            </div>
          </div>);
        setModalsOpen(true);
        return;
      }
      setTrain(true);
      timer = setInterval(updateProgress, interval);
      handleModelTrainingStatus(resDuck?.recordId); // 立即执行一次
      timerTrain = setInterval(() => {
        handleModelTrainingStatus(resDuck?.recordId);
      }, 1000);
    } catch (error) {
      fail = true;
      Toast.show({
        icon: 'fail',
        content: '训练失败',
      });
      setTrain(false);
      clearInterval(timer);
    }
  };

  const conicColors = { '0%': '#FF8B00', '50%': '#FEBD25', '100%': '#FEEF48' };

  const handleNext = () => {
    if (clickIndex + 1 === recordList?.length) {
      return Toast.show({
        content: '已经是最后一个咯',
      });
    }
    const newIndex = clickIndex + 1;
    setClickIndex(newIndex);
    const items = recordList[newIndex];
    handleSeeResult(items, newIndex);
  };

  const handlePre = () => {
    if (clickIndex === 0) {
      return Toast.show({
        content: '往前没有咯',
      });
    }
    const newIndex = clickIndex - 1;
    setClickIndex(newIndex);
    const items = recordList[newIndex];
    handleSeeResult(items, newIndex);
  };

  const handleYesOrNo = (val: number) => {
    setStatus(val);
    // 更新 recordList
    if (clickIndex >= 0 && clickIndex < recordList.length) {
      const newRecordList = [...recordList];
      newRecordList[clickIndex] = {
        ...newRecordList[clickIndex],
        check: val === 1,
      };
      setRecordList(newRecordList);
    }

    // 更新 initAllData
    const getId = recordList[clickIndex]?.id;
    if (getId) {
      const updatedList = initAllData.map((item) => ({
        ...item,
        check: item.id === getId ? val === 1 : item.check,
      }));
      setInitAllData(updatedList);
    }
  };

  const totalNum = initAllData?.filter((item) => item.check)?.length;
  const unTrain = trainCount === 0;
  const scaleNum = '0.85';
  const scaleDuck = '0.6';

  const [visible, setVisible] = useState(false);
  const [selectIndex, setSelectIndex] = useState(0);
  const [custom, setCustom] = useState(false);
  const [points, setPoints] = useState({ pre: '', next: '' });
  const [fliterParams, setFliterParams] = useState({
    gameResult: '',
    mode: 'ALL',
    pointsLeast: '',
    pointsMost: '',
  });
  // console.log("🚀筛选条件", fliterParams);

  const [filterItems, setFilter] = useState([
    {
      showText: '是否选取',
      text: '全部',
      value: 'all',
      isClick: false,
      visible: true,
    },
    {
      showText: '比赛结果',
      text: '全部',
      value: '',
      isClick: false,
      visible: true,
    },
    {
      showText: '对手',
      text: '全部',
      value: 'ALL',
      isClick: false,
      visible: true,
    },
    {
      showText: '对手积分',
      text: '全部',
      value: '',
      isClick: false,
      visible: false,
    },
  ]);
  const showPopup = (index) => {
    setVisible(true);
    setSelectIndex(index);
  };

  const hidePopup = () => {
    setVisible(false);
  };

  const handleFilterIsAll = (list, val) => {
    // console.log("当前需过滤的数组", list);
    let filteredList = list;
    if (val !== 'all') {
      filteredList =
        val === 'yes'
          ? list.filter((item) => item.check)
          : list.filter((item) => !item.check);
    } else {
      filteredList = list;
    }
    setRecordList([...filteredList]);
  };

  const isSelectItems = [
    {
      text: '全部',
      value: 'all',
    },
    {
      text: '已选取',
      value: 'yes',
    },
    {
      text: '未选取',
      value: 'no',
    },
  ];

  const winStatusList = [
    {
      text: '全部',
      value: '',
    },
    {
      text: '胜利',
      value: 1,
    },
    {
      text: '失败',
      value: 0,
    },
  ];

  const oppList = [
    {
      text: '全部',
      value: 'ALL',
    },
    {
      text: '鸭小白',
      value: '',
    },
    {
      text: 'AI鸭',
      value: 'AI',
    },
    {
      text: '其他玩家的AI鸭',
      value: 'PK',
    },
  ];
  const pointsList = [
    {
      text: '全部',
      value: '',
    },
    {
      text: '>20分',
      value: 20,
    },
    {
      text: '>50分',
      value: 50,
    },
    {
      text: '>100分',
      value: 100,
    },
    {
      text: '>200分',
      value: 200,
    },
    {
      text: '自定义',
      value: 'auto',
    },
  ];

  const getDuckPKLogFliter = (params) => {
    return new Promise(async (resolve, reject) => {
      try {
        setFilterLoading(true);
        const res = await getDuckPKLog({ ...params });
        resolve(res);
      } catch (error) {
        reject(error);
      } finally {
        setFilterLoading(false);
      }
    });
  };

  const updateFilterAndParams = async (selectedItem, paramsKey = '') => {
    filterItems[selectIndex].text = selectedItem.text;
    filterItems[selectIndex].value = selectedItem.value;
    filterItems[selectIndex].isClick = selectedItem.text === '全部' ? false : true;;
    fliterParams[paramsKey] = selectedItem.value;
    // 选择对手
    if (selectIndex === 2) {
      fliterParams['pointsMost'] = '';
      fliterParams['pointsLeast'] = '';
      filterItems[selectIndex + 1].value = '';
      filterItems[selectIndex + 1].text = '全部';
      filterItems[selectIndex + 1].isClick = false;
      setPoints({
        pre: '',
        next: ''
      });
      if (selectedItem.value === 'PK') {
        filterItems[selectIndex + 1].visible = true;
      } else {
        filterItems[selectIndex + 1].visible = false;
      }
    }
    setFliterParams(fliterParams);
    setFilter(filterItems);
    // 选择积分
    if (selectIndex === 3) {
      fliterParams['pointsMost'] = '';
      // 自定义的话
      if (selectedItem.value === 'auto') {
        fliterParams[paramsKey] = '';
        setPoints({
          pre: '',
          next: ''
        });
        setCustom(true);
        return;
      } else {
        setCustom(false);
        setVisible(false);
      }
    } else {
      setVisible(false);
    }
    updateListWithCheckStatus();
  };

  const updateListWithCheckStatus = async () => {
    const res = await getDuckPKLogFliter(fliterParams);
    const updatedList = res?.list.map((item) => {
      const newItem = { ...item };
      const correspondingItem = initAllData.find(
        (newItem) => newItem.id === item.id,
      );
      if (correspondingItem && correspondingItem.check === true) {
        newItem.check = true;
      }
      return newItem;
    });
    // 基于当前的筛选项 筛选已选取或者未选取
    setAllData([...updatedList]);
    handleFilterIsAll(updatedList, filterItems[0].value);
  };

  // 全部选取过滤
  const handleIsAllData = (selectedItem) => {
    filterItems[selectIndex].text = selectedItem.text;
    filterItems[selectIndex].value = selectedItem.value;
    filterItems[selectIndex].isClick = selectedItem.text === '全部' ? false : true;;
    setFilter(filterItems);
    // 初始的时候 总数据initAllData  后面筛选项为allData
    handleFilterIsAll(allData, selectedItem.value);
    // console.log("第一个筛选项", allData);

    setVisible(false);
  };

  const handlePointChange = (e, pointType) => {
    const input = e.target.value;
    if (/^\d*$/.test(input)) {
      setPoints((prevPoints) => ({
        ...prevPoints,
        [pointType]: Number(input),
      }));
    } else {
      Toast.show({
        content: '只能输入数字哦',
      });
    }
  };

  // 确定
  const handlePointsOk = async () => {
    filterItems[selectIndex].value = 'auto';
    filterItems[selectIndex].isClick = true;
    if (points.pre && !points.next) {
      filterItems[selectIndex].text = `>${points.pre}分`;
    }
    if (!points.pre && points.next) {
      filterItems[selectIndex].text = `<${points.next}分`;
    }
    if (points.pre && points.next) {
      filterItems[selectIndex].text = `${points.pre}分-${points.next}分`;
    }
    if (!points.pre && !points.next) {
      filterItems[selectIndex].text = '全部';
      filterItems[selectIndex].value = '';
      filterItems[selectIndex].isClick = false;
      setCustom(false);
    }
    fliterParams['pointsLeast'] = points.pre || '';
    fliterParams['pointsMost'] = points.next || '';
    setFliterParams(fliterParams);
    setFilter(filterItems);
    setVisible(false);
    updateListWithCheckStatus();
  };

  const PopupRender = (
    <div className={styled.poppup}>
      <Popup
        position="top"
        visible={visible}
        onClose={hidePopup}
        className="selectPop"
        closeOnMaskClick={true}
      >
        {/* 全部选取 */}
        {selectIndex === 0 && (
          <div className={styled.pop_flex}>
            <img className={styled.img1} src="/duck/isxunaqu.png" />
            <div className={styled.pop_div}>
              {isSelectItems.map((item, index) => {
                return (
                  <div
                    onClick={() => {
                      handleIsAllData(item);
                    }}
                    className={
                      styled[
                      item.value === filterItems[selectIndex].value
                        ? 'haveSelect'
                        : 'unSelect'
                      ]
                    }
                    key={index}
                  >
                    {item.text}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* 比赛结果 */}
        {selectIndex === 1 && (
          <div className={styled.pop_flex}>
            <img className={styled.img1} src="/duck/train_result_text.png" />
            <div className={styled.pop_div}>
              {winStatusList.map((item, index) => {
                return (
                  <div
                    onClick={() => {
                      updateFilterAndParams(item, 'gameResult');
                    }}
                    className={
                      styled[
                      item.value === filterItems[selectIndex].value
                        ? 'haveSelect'
                        : 'unSelect'
                      ]
                    }
                    key={index}
                  >
                    {item.text}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 对手选取 */}
        {selectIndex === 2 && (
          <div className={styled.pop_flex}>
            <img className={styled.img2} src="/duck/opp_text.png" />
            <div className={styled.pop_div}>
              {oppList.map((item, index) => {
                return (
                  <div
                    onClick={() => {
                      updateFilterAndParams(item, 'mode');
                    }}
                    className={
                      styled[
                      item.value === filterItems[selectIndex].value
                        ? 'haveSelect'
                        : 'unSelect'
                      ]
                    }
                    key={index}
                  >
                    {item.text}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* 对手积分 */}
        {selectIndex === 3 && (
          <div className={styled.pop_flex}>
            <img className={styled.img1} src="/duck/oppPoint_text.png" />
            <div className={styled.pop_div}>
              {pointsList.map((item, index) => {
                return (
                  <div
                    onClick={() => {
                      updateFilterAndParams(item, 'pointsLeast');
                    }}
                    className={
                      styled[
                      item.value === filterItems[selectIndex].value
                        ? 'haveSelect'
                        : 'unSelect'
                      ]
                    }
                    key={index}
                  >
                    {item.text}
                  </div>
                );
              })}
            </div>
            {custom && (
              <div className={styled.cuntom_div}>
                <div className={styled.cuntom_text}>自定义</div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Input
                      defaultValue={fliterParams.pointsLeast}
                      onChange={(e) => handlePointChange(e, 'pre')}
                      className={styled.pointInput}
                      placeholder="最低积分"
                    />
                    <div className={styled.rowLine}></div>
                    <Input
                      defaultValue={fliterParams.pointsMost}
                      onChange={(e) => handlePointChange(e, 'next')}
                      className={styled.pointInput}
                      placeholder="最高积分"
                    />
                  </div>
                  <img
                    onClick={handlePointsOk}
                    className={styled.point_ok}
                    src="/duck/point_ok.png"
                  ></img>
                </div>
              </div>
            )}
          </div>
        )}
      </Popup>
    </div>
  );

  const [descModal, setDescModal] = useState(false);

  return (
    <>
      <GlobalModal
        isOpen={descModal}
        closeModal={() => {
          setDescModal(false);
        }}
      >
        <div className={styled.desc_bg}>
          <div
            className={styled.close}
            onClick={() => {
              setDescModal(false);
            }}
          ></div>
          <div>
            <div className={styled.text}>
              1、通过选取比赛数据对你的AI鸭进行训练，使其更加强大;
            </div>
            <div className={styled.text}>
              2、每次训练，系统会默认先为你选取胜利的比赛数据；
            </div>
          </div>
        </div>
      </GlobalModal>
      <GlobalModal bgOpacity={0.8} isOpen={train}>
        {!isSuccess ? (
          <div className={styled.training}>
            <div className="animate__animated animate__animated">
              <div className={styled.flex_text}>
                <img
                  src="/duck/training_text.png"
                  className={styled.trainingText}
                ></img>
                <div className={styled.dot}>...</div>
              </div>
            </div>

            <img
              src="/duck/train_duck.png"
              className={styled.trainingDuck}
            ></img>
            <div className={styled.progress}>
              <Progress
                strokeColor={conicColors}
                showInfo={false}
                status={'active'}
                percent={percent}
                strokeWidth={12}
              />
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                paddingBottom: 120,
              }}
            >
              <div className="animate__animated animate__bounceInDown">
                <div className={styled.suc_bg}>
                  <div
                    className={`animate__animated animate__bounceIn ${styled.site}`}
                  >
                    {duckShow && (
                      <div className="animate__animated animate__flip">
                        <img
                          src="/duck/suc_duck.png"
                          className={styled.sucDuck}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {duckShow && (
                <div>
                  <div className={styled.train_btns}>
                    <div
                      onClick={() => {
                        setTrainModelFun();
                      }}
                      className={styled.backBtn}
                    >
                      返回首页
                    </div>
                    <img
                      className={styled.withPK}
                      onClick={() => {
                        setTrainModelFun();
                        handleConPK();
                      }}
                      src="/duck/withPK.png"
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </GlobalModal>
      {seeResult ? (
        <>
          {/* 查看结果 */}
          <div className={styled.trainResult_container}>
            <div className={styled.head}>
              <img
                style={{
                  left: convertPxToRem(10),
                }}
                src="/duck/record_back.png"
                onClick={() => {
                  setSeeResult(false);
                }}
              />
              <div
                onClick={handleTrain}
                style={{
                  pointerEvents: unTrain || loading ? 'none' : 'auto',
                }}
                className={styled[unTrain ? 'unTrain' : 'trainBtn']}
              >
                去训练({totalNum})
              </div>
              查看结果
            </div>

            <div className={styled.trainContent}>
              <div className={styled.content_bg}>
                <Spin spinning={seeLoading}>
                  <div onClick={handlePre} className={styled.arrow_pre}>
                    <img src="/duck/train_pre.png" />
                  </div>
                  <div onClick={handleNext} className={styled.arrow_next}>
                    <img src="/duck/train_next.png" />
                  </div>

                  <div>
                    <div className={styled.headTop}>
                      <img
                        src={
                          seeInfo?.outcomeStatus
                            ? '/duck/win_status.png'
                            : '/duck/lose_status.png'
                        }
                      />
                      <div className={styled.topText}>
                        <div
                          style={{ display: 'flex', gap: 24, marginBottom: 4 }}
                        >
                          <div>对手：{seeInfo?.opp}</div>
                          <div>积分：{seeInfo?.points}</div>
                        </div>
                        <div>时间：{seeInfo?.playTime}</div>
                      </div>
                    </div>
                    <div className={styled.contentMid}>
                      <div className={styled.celue}>
                        <div className={styled.celueText}>我的策略</div>
                        <div className={styled.lineContainer}>
                          <div className={styled.gameTrain}>
                            {foodsCelue?.map((food, index) => (
                              <div
                                key={index}
                                className={`${styles.food}`}
                                style={{
                                  left: food?.position[0] - 10,
                                  top: food?.position[1] - 10,
                                }}
                              >
                                <div
                                  className={styles.eat1Circle}
                                  style={{
                                    scale: scaleNum,
                                  }}
                                >
                                  {food?.index}
                                </div>
                              </div>
                            ))}

                            {/* 连线食物 */}
                            <svg
                              className={styles['duck-trail2']}
                              style={{
                                zIndex: 1,
                                width: '100%',
                                height: '100%',
                              }}
                            >
                              {pathCoordinatesLine.map((coords, index) => (
                                <g key={index}>
                                  {index > 0 && (
                                    <marker
                                      id={`arrowheadLine-${index}`}
                                      markerWidth="10"
                                      markerHeight="7"
                                      refX="20"
                                      refY="3.5"
                                      orient="auto"
                                      fill="#E67187"
                                    >
                                      <polygon points="0 0, 10 3.5, 0 7" />
                                    </marker>
                                  )}
                                  {index > 0 && (
                                    <path
                                      id="duck-path"
                                      className={styles['path-transition']}
                                      d={`M${pathCoordinatesLine[index - 1][0]
                                        },${pathCoordinatesLine[index - 1][1]} L${coords[0]
                                        },${coords[1]}`}
                                      fill="none"
                                      stroke="#E67187"
                                      strokeWidth="1"
                                      markerEnd={`url(#arrowheadLine-${index})`}
                                    />
                                  )}
                                </g>
                              ))}
                            </svg>

                            {/* 机器鸭 */}
                            {!isFirst && (
                              <>
                                <div
                                  className={`${styles.duck1}`}
                                  style={{
                                    left: -7,
                                    top: -12,
                                    scale: scaleDuck,
                                  }}
                                >
                                  <img id="duck1Img" src={'/duck/my.png'} />
                                </div>
                                <div
                                  className={`${styles.duckPK}`}
                                  style={{
                                    right: -10,
                                    bottom: -8,
                                    scale: scaleDuck,
                                  }}
                                >
                                  <div
                                    className={
                                      styles[
                                      !isNumberString(
                                        resultRes?.userInfo?.opp?.username,
                                      ) &&
                                        resultRes?.userInfo?.opp?.username
                                          ?.length > 3
                                        ? 'name_bg'
                                        : 'name_bg_short'
                                      ]
                                    }
                                  >
                                    {resultRes?.userInfo?.opp?.username}
                                  </div>
                                  <img src={'/duck/pk_duck.png'} />
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* -------------------------------------------------------- */}
                      <div className={styled.celue}>
                        <div className={styled.celueText}>比赛结果</div>
                        <div className={styled.lineContainer}>
                          <div className={styled.gameTrain}>
                            <>
                              {/* todo 食物和后端返回的点都是px 没有自适应  要自适应的话 就一起自适应 */}
                              {resultRes?.foods?.map((food, index) => (
                                <div
                                  key={index}
                                  className={`${styles.food}`}
                                  style={{
                                    left: food?.position[0] - 10,
                                    top: food?.position[1] - 10,
                                  }}
                                >
                                  {food?.selfEat ? (
                                    <div
                                      style={{
                                        scale: scaleNum,
                                      }}
                                      className={styles.eat1Circle}
                                    >
                                      {food?.duckEatIndex}
                                    </div>
                                  ) : (
                                    <div
                                      style={{
                                        scale: scaleNum,
                                      }}
                                      className={styles.eat2Circle}
                                    >
                                      {food?.duckEatIndex}
                                    </div>
                                  )}
                                </div>
                              ))}
                              {/* 我的鸭------------- */}

                              <svg
                                style={{
                                  width: '100%',
                                  height: '100%',
                                }}
                                className={styles['duck-trail']}
                              >
                                <path
                                  d={generateSmoothPath(
                                    resultRes?.self?.trajectory,
                                    20,
                                    resultRes?.foods,
                                  )}
                                  fill="none"
                                  stroke="#E67187"
                                  strokeWidth="2"
                                  strokeLinejoin="round" // 设置转折处为圆滑
                                  strokeLinecap="round" // 设置线段末端为圆形，使线段更柔和
                                />
                              </svg>
                              {!isFirst && (
                                <>
                                  <div>
                                    <div className={styles.startDotRed}>
                                      <img
                                        style={{
                                          scale: '0.8',
                                          left: `${resultRes?.self
                                            ?.trajectory[0]?.[0] - 16
                                            }px`,
                                          top: `${resultRes?.self
                                            ?.trajectory[0]?.[1] - 30
                                            }px`,
                                        }}
                                        src="/duck/start_red.png"
                                      />
                                    </div>

                                    <div className={styles.startDotBlue}>
                                      <img
                                        src="/duck/start_blue.png"
                                        style={{
                                          left: 187,
                                          top: 176,
                                          scale: '0.8',
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div
                                    className={`${styles.duck1}`}
                                    style={{
                                      left: `${resultRes?.self?.trajectory[
                                        resultRes?.self?.trajectory?.length -
                                        1
                                      ]?.[0] - 20
                                        }px`,

                                      top: `${resultRes?.self?.trajectory[
                                        resultRes?.self?.trajectory?.length -
                                        1
                                      ]?.[1] - 45
                                        }px`,
                                      scale: scaleDuck,
                                    }}
                                  >
                                    <img id="duck1Img" src={'/duck/my.png'} />
                                  </div>
                                  {/* 机器鸭 */}
                                  <div
                                    className={`${styles.duckPK}`}
                                    style={{
                                      left: `${resultRes?.opp?.trajectory[
                                        resultRes?.opp?.trajectory?.length - 1
                                      ]?.[0] - 30
                                        }px`,
                                      top: `${resultRes?.opp?.trajectory[
                                        resultRes?.opp?.trajectory?.length - 1
                                      ]?.[1] - 50
                                        }px`,
                                      scale: scaleDuck,
                                    }}
                                  >
                                    <div
                                      className={
                                        styles[
                                        !isNumberString(
                                          resultRes?.userInfo?.opp?.username,
                                        ) &&
                                          resultRes?.userInfo?.opp?.username
                                            ?.length > 3
                                          ? 'name_bg'
                                          : 'name_bg_short'
                                        ]
                                      }
                                    >
                                      {resultRes?.userInfo?.opp?.username}
                                    </div>
                                    <img src={'/duck/pk_duck.png'} />
                                  </div>
                                </>
                              )}

                              <svg
                                preserveAspectRatio="xMidYMid meet"
                                className={styles['duck-trail2']}
                              >
                                <path
                                  d={generateSmoothPath(
                                    resultRes?.opp?.trajectory,
                                    20,
                                    resultRes?.foods,
                                  )}
                                  fill="none"
                                  stroke="#FEFBCE"
                                  strokeWidth="2"
                                  strokeDashoffset="0" // 定义虚线的起始偏移量
                                  strokeLinejoin="round" // 设置转折处为圆滑
                                  strokeLinecap="round" // 设置线条末端为圆形，使线条更柔和
                                />
                              </svg>
                            </>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Spin>
              </div>
            </div>

            <div className={styled.footer}>
              <img
                style={{
                  marginLeft: convertPxToRem(20),
                }}
                src="/duck/useTrain_text.png"
              />
              <div className={styled.outCheck}>
                <div
                  onClick={() => {
                    handleYesOrNo(1);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <div className={styled.checkFooter}>
                    {clickStatus === 1 && <img src="/duck/yes.png" />}
                  </div>
                  <div className={styled.textCheck}>是</div>
                </div>

                <div
                  onClick={() => {
                    handleYesOrNo(2);
                  }}
                  style={{
                    marginLeft: convertPxToRem(10),
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <div className={styled.checkFooter}>
                    {clickStatus === 2 && <img src="/duck/no.png" />}
                  </div>
                  <div className={styled.textCheck}>否</div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        // 数组列表
        <div className={styled.trainList}>
          {PopupRender}
          <div className={styles.record_bg}>
            <img
              style={{
                left: convertPxToRem(10),
              }}
              src="/duck/record_back.png"
              onClick={() => {
                setTrainModelFun();
              }}
              className={styles.backImg}
            />
            <div className={styles.record_text}>
              <img src="/duck/train_text.png" />
            </div>
            <div className={styled.line}></div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <div className={styled.selectNum}>
                <img src="/duck/xuanqu_text.png" />
                <span>{totalNum}</span> <img src="/duck/tiaoshuju_text.png" />
              </div>
              <img
                className={styled.desc_text}
                onClick={() => {
                  setDescModal(true);
                }}
                src="/duck/desc_text_train.png"
              />
            </div>

            <div className={styled.selects}>
              {filterItems.map((item, index) => {
                return (
                  <div
                    style={{
                      visibility: item.visible ? 'unset' : 'hidden',
                    }}
                    onClick={() => {
                      showPopup(index);
                    }}
                    key={index}
                    className={
                      styled[item.isClick ? 'clickSelectItem' : 'selectItem']
                    }
                  >
                    <div className={styled.text_select}>
                      {item.isClick ? item.text : item.showText}
                    </div>
                    <div
                      className={
                        styled[item?.isClick ? 'selectDownClick' : 'selectDown']
                      }
                    ></div>
                  </div>
                );
              })}
            </div>
            <div className={styles.record_head} style={{ padding: 0 }}>
              <div className={styles.head}>选取</div>
              <div
                className={styles.head}
                style={{ paddingLeft: convertPxToRem(18) }}
              >
                时间
              </div>
              <div
                className={styles.head}
                style={{ width: '30%', paddingLeft: convertPxToRem(34) }}
              >
                结果
              </div>
              <div
                className={styles.head}
                style={{ paddingLeft: convertPxToRem(16) }}
              >
                对手
              </div>
              <div
                className={styles.head}
                style={{ paddingLeft: convertPxToRem(10) }}
              >
                积分
              </div>
              <div className={styles.head} style={{ paddingRight: 5 }}>
                操作
              </div>
            </div>
            <div
              style={{
                height: '100%',
                overflowY: 'auto',
                paddingBottom: convertPxToRem(210),
              }}
            >
              <Spin spinning={loading || filterLoading}>
                {/* {console.log('最终数据', recordList)} */}
                <div style={{ minHeight: '50vh' }}>
                  {recordList?.map((item, index) => {
                    return (
                      <div
                        key={item.id}
                        className={styles.content}
                        style={{ padding: 0 }}
                      >
                        <div className={styles.text}>
                          <Checkbox
                            value={item.id}
                            checked={item.check}
                            onChange={(checked) =>
                              handleCheckboxChange(item.id, checked)
                            }
                            icon={(checked) =>
                              checked ? (
                                <div className={styled.check}>
                                  <img src="/duck/checkY.png" />
                                </div>
                              ) : (
                                <div className={styled.check}></div>
                              )
                            }
                          />
                        </div>
                        <div className={styles.text}>{item.playTime}</div>
                        <div
                          className={styles.text}
                          style={{ width: '30%', paddingLeft: 10 }}
                        >
                          {item.outcomeStatus ? (
                            <img
                              className={styles.win_lose_img}
                              src="/duck/re_win.png"
                            />
                          ) : (
                            <img
                              className={styles.win_lose_img}
                              src="/duck/re_lose.png"
                            />
                          )}
                        </div>
                        <div className={styles.text}>{item.opp}</div>
                        <div className={styles.text}>{item.points}</div>
                        <div
                          className={styles.see}
                          onClick={() => handleSeeResult(item, index)}
                          style={{ marginRight: convertPxToRem(10) }}
                        >
                          查看
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Spin>
            </div>
          </div>
          <Modals isOpen={modalsOpen} closeModal={() => {
            setModalsOpen(false);
          }} modalType={modalsType} content={modalContent} />
          {!train && !loading && (
            <div
              style={{
                pointerEvents: unTrain ? 'none' : 'auto',
                visibility: visible ? 'hidden' : 'unset',
              }}
              onClick={handleTrain}
              className={styled.goTrain}
            >
              <img
                src={
                  trainCount === 0 ? '/duck/unTrain.png' : '/duck/goTrain.png'
                }
              />
              <div className={styled.goTrainText}>
                今日剩余训练次数：
                <span
                  style={{
                    color: '#61E02A',
                  }}
                >
                  {trainCount}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default AITrain;
