import React, { ReactNode, useEffect, useRef, useState } from 'react';
import styles from './index.module.less';
import styled from './other.module.less';
import { Layout } from '@/components/layout';
import { useLoginSet } from '@/models/useLoginState';
import { useRecoilValue } from 'recoil';
import { commonDataMobile } from '@/models/commonState';
import GlobalModal from '@/components/GlobalModal';
import GlobalModalPack from '@/components/GlobalModal/packModal';
import { Input, Toast } from 'antd-mobile';
import { Spin, message } from 'antd';
import Filter from 'bad-words';
import {
  getDuckGameInfo,
  getDuckGameRanking,
  getDuckInitialValue,
  isFirstVisitAI,
  setDuckGameUserInfo,
  setFoodsStrategy,
  showRule,
  getDuckPKOpp,
  getDuckPKLog,
  setDuckGameEvent,
  getFoodsStrategy,
} from '@/services/common';
import { convertPxToRem } from '@/utils/string';
import { useLocation } from 'react-router-dom';
import 'animate.css/animate.min.css';
import { getEventRanking } from '@/services/User';
import { useHistory } from 'react-router';
import RankListRender from './RankList';
import TipModal from './tipModal';
import emitter from '@/components/eventEmitter.js';
import AITrain from './AITrain';
import { isNumberString } from '@/utils/list';
import { showConfetti } from '@/utils/common';
import Modals from './AICourse/modals';
import Loading from './Loading';

let num = 0;
let duckNum = 1;
let duckNum2 = 1;
let animationTimerSelf: any;
let animationTimerOpp: any;

const AIGame = () => {
  const history = useHistory();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  // 现场活动指针
  const source = searchParams.get('source');
  // AI课程指针
  const [isAICourse, setIsAICourse] = useState(false);
  const initModel = searchParams.get('model');
  const { signIn } = useLoginSet();
  const commonData = useRecoilValue(commonDataMobile);
  const { loginState } = commonData;
  const [createModal, setCreateModal] = useState(false);

  const duck1X = -15;
  const duck1Y = -40;

  const duck2X = 334;
  const duck2Y = 318;

  const [foods, setFoods] = useState([]);
  const [duckPosition1, setDuckPosition1] = useState({
    x: duck1X,
    y: duck1Y,
  });
  const [duckPosition2, setDuckPosition2] = useState({
    x: duck2X,
    y: duck2Y,
  });

  const [eatingFood, setEatingFood] = useState(false);
  const [duckPath, setDuckPath] = useState([]);
  const [duckPath2, setDuckPath2] = useState([]);

  // 策略Index  传给后台
  const [strategyList, setStrategyList] = useState([]);

  const [duckInit, setDuckInit] = useState({});

  const [result, setResult] = useState({});
  const [foodsInit, setFoodsInit] = useState([]);

  const [isOpenTip, setTipOpen] = useState(false);

  const [gameOver, setGameOver] = useState(false);
  const [duck1Over, setDuck1Over] = useState(false);
  const [duck2Over, setDuck2Over] = useState(false);
  const [resultShow, setResultShow] = useState(false);

  const [newHand, setNewHand] = useState();
  const [AIModel, setAIModel] = useState();
  const [lockTip, setlockTip] = useState(false);

  //  连线逻辑
  const [pathCoordinatesLine, setLinePath] = useState([[0, 0]]);

  const [rankList, setRankList] = useState();

  const [showRank, setShowRank] = useState(false);

  const [loading, setLoading] = useState(false);
  const [gameInfo, setGameInfo] = useState(null);
  const [infoLoading, setInfoLoading] = useState(true);
  const [userName, setName] = useState('');
  const [school, setSchool] = useState('');

  const [haveChangeInput, setHaveChangeInput] = useState('');
  const [nameTip, setNameTip] = useState(null);
  // 鸭子正在移动
  const [moving, setMove] = useState(false);
  // 排行榜
  const [isHomeEnterRank, setIsHomeEnterRank] = useState(false);
  const [ruleModal, setRuleModal] = useState(undefined);
  const [userInfoModal, setUserInfoModal] = useState(false);
  const [changeInfoModal, setChangeModal] = useState(false);
  const [AIUpdate, setAIUpdate] = useState(false);
  const [update, setUpdate] = useState(false);

  const [havePlays, setHavePlay] = useState(0);

  // 显示AI更新成功
  const [isShowAIUpdateText, setIsShowAIUpdate] = useState(false);
  const [containerHeight, setHeight] = useState(0);

  const [isFirstVisitAIShow, setIsFirstVisitAI] = useState(false);
  const [modalResultText, setModalResultText] = useState('');

  // PK模式----------------------------------------------
  const [pkModel, setPKModel] = useState();
  const [isEnterPk, setEnterPk] = useState(false);
  const [matchSuccess, setMatchSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [Pking, setPkIng] = useState(false);
  const [clickIndex, setClickIndex] = useState(0);

  // 模式切换弹窗
  const [changeModel, setChangeModelHandle] = useState(false);
  // 切换成功提示
  // PK模式被锁住
  const [pkClickModal, setPKClickModal] = useState(false);
  const [infoLoadingStatus, setInfoLoadingStatus] = useState(false);
  const [duckPKOpp, setDuckPKOpp] = useState({});

  const [pkRecord, setPkRecord] = useState(false);
  const [recordList, setRecordList] = useState([]);
  // 正在游戏
  const [isPking, setIsPking] = useState(false);
  // 查看结果
  const [seeResult, setSeeResult] = useState(false);
  const [seeLoading, setSeeLoading] = useState(false);
  const [resultRes, setResultRes] = useState({});
  const [pkInfo, setPkInfo] = useState({});

  // 物理所逻辑处理-----------------------------------------
  const [phyInfo, setPhyInfo] = useState({});
  const [countdownPhy, setCountdownPhy] = useState(0);
  const [phyTipOpen, setPhyTipOpen] = useState(false);
  const [phyRank, setPhyRank] = useState([]);
  const [switchRank, setSwitchRank] = useState(0);

  const [rankLoading, setRankLoading] = useState(false);
  // 判断游戏是否结束  结束的时候才能重新调用策略
  const [isOverGame, setIsOverGame] = useState(true);

  const [trainModel, setTrainModel] = useState(initModel === 'train');

  const [isClickTrain, setIsClickTrain] = useState(false);

  // -------------------------AI课程
  const [modalsOpen, setModalsOpen] = useState<boolean>(false);
  const [modalsType, setModalsType] = useState<string>('');
  const [modalContent, setModalsContent] = useState<ReactNode>(null);

  const isOpen =
    phyTipOpen ||
    changeModel ||
    showRank ||
    isFirstVisitAIShow ||
    lockTip ||
    pkClickModal ||
    createModal ||
    AIUpdate ||
    ruleModal ||
    resultShow ||
    seeResult;

  useEffect(() => {
    const touchs = (event) => {
      var e = event || window.event;
      e.preventDefault();
      e.stopPropagation();
    };
    // 弹窗存在禁止ios滚动
    if (isOpen) {
      window.addEventListener('touchmove', touchs, { passive: false });
    } else {
      window.removeEventListener('touchmove', touchs);
    }

    // 对战记录打开 移除滚动
    if (pkRecord) {
      window.removeEventListener('touchmove', touchs);
    }
    return () => {
      window.removeEventListener('touchmove', touchs);
    };
  }, [isOpen, pkRecord]);

  // 屏幕旋转的时候  重新刷新
  const handleOrientationChange = () => {
    window.location.reload();
  };

  useEffect(() => {
    window.addEventListener('orientationchange', handleOrientationChange);
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  const getDuckGameInfoHandle = (
    needLoading = false,
    isNewHand = true,
    isPKModel = false,
  ) => {
    return new Promise(async (resolve, reject) => {
      try {
        setInfoLoadingStatus(true);
        if (loginState) setInfoLoading(needLoading);
        const res = await getDuckGameInfo({
          mode: isNewHand ? '' : isPKModel ? 'PK' : 'AI',
          source: source,
          eventLink: source,
        });
        // 如果有这个参数则是课程活动
        setIsAICourse(Boolean(res?.eventClassId));
        if (!res?.username) {
          setCreateModal(true);
        }
        setName(res?.username);
        if (!res?.unlockAI || !isNewHand) {
          const havePlays = res?.gamesPlayed % 10 || 0;
          setHavePlay(havePlays);
        }
        // 物理所 AI 模式下，且没有 eventId，则不进行更新
        if (!(source && AIModel && !res?.eventId)) {
          setGameInfo(res);
        }
        resolve(res); // 解决 Promise 并将结果传递出去
      } catch (error) {
        reject(error); // 如果出现错误，拒绝 Promise 并传递错误信息
      } finally {
        setInfoLoading(false);
        setInfoLoadingStatus(false);
      }
    });
  };

  useEffect(() => {
    let timer: any;
    if (countdownPhy > 1) {
      timer = setTimeout(() => {
        setCountdownPhy(countdownPhy - 1);
      }, 1000);
    } else if (countdownPhy === 1) {
      setTimeout(() => {
        setPhyTipOpen(false);
        history.push('/cn/AIGame');
        window.location.reload();
      }, 1200);
    }
    return () => clearTimeout(timer); // 清除定时器
  }, [countdownPhy]);

  const setDuckGameEventHandle = async () => {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await setDuckGameEvent({
          eventLink: source,
        });
        // 正常进来跑定时器
        if (res?.status === 1 && source) {
          // setPhyTipOpen(true);
          getEventHaveStart(res?.eventInfo?.gmtEndTime);
        }
        // 游戏结束或者活动不存在  跳走普通页面
        if (res?.status === -4) {
          setPhyTipOpen(true);
          setCountdownPhy(3);
        }
        if (res?.status === -3 || res?.status === -1 || res?.status === -2) {
          history.push({
            pathname: '/cn/AIContest/eventResult',
            search: `?status=${res?.status}&time=${res?.eventInfo?.startTime}&source=${source}`,
          });
        }
        setPhyInfo(res);
        resolve(res); // 返回异步操作的结果
      } catch (error) {
        reject(error); // 如果出现错误，返回错误信息
      }
    });
  };
  const [isGameInProgress, setIsGameInProgress] = useState(false);
  const [isStartClick, setIsStartClick] = useState(false);

  let isEventOverId: any;
  const getEventHaveStart = (endTime) => {
    const eventTime = new Date(endTime).getTime();
    isEventOverId = setInterval(() => {
      const currentTime = new Date().getTime();
      // 当前时间大于结束时间 转到下一场  不在食物的时候和游戏结束的时候 才进行提示

      if (currentTime >= eventTime && localStorage.phyFlagGaming === '0') {
        setDuckGameEventHandle();
        clearInterval(isEventOverId); // 清除定时器
      } else {
        console.log('游戏还未结束');
      }
    }, 3000); // 每3秒触发一次
  };

  useEffect(() => {
    if (eatingFood || resultShow || isGameInProgress) {
      localStorage.phyFlagGaming = 1;
    } else {
      localStorage.phyFlagGaming = 0;
    }
  }, [eatingFood, resultShow, isGameInProgress]);

  // 物理所逻辑处理-----------------------------------------

  // 获取记录  初始化调用  结束调用
  const getDuckPKLogFunc = async () => {
    const res = await getDuckPKLog({
      mode: 'PK',
      pageSize: 99999,
    });
    setRecordList(res?.list);
  };

  // 清除PK数据
  const clearPkStatus = () => {
    setPKModel(false);
    setEnterPk(false);
    setMatchSuccess(false);
    setPkIng(false);
    setClickIndex(0);
    setCountdown(3);
  };

  // 查看结果
  const handleSeeResult = async (id) => {
    try {
      setSeeLoading(true);
      setSeeResult(true);
      const res = await setFoodsStrategy({
        id: id,
        action: 'history',
      });
      setResultRes(res);
    } catch (error) {
    } finally {
      setSeeLoading(false);
    }
  };

  // 对战结果
  const RenderReuslt = () => {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div className={styles.result_bg}>
          <div style={{ height: '45%' }}>
            <>
              <Spin spinning={seeLoading}>
                <div
                  className={styles.game_container}
                  style={{ width: 320, height: 320 }}
                  ref={parentRef}
                >
                  {!seeLoading && (
                    <>
                      <div>
                        <div className={styles.startDotRed}>
                          <img src="/duck/start_red.png" />
                        </div>

                        <div className={styles.startDotBlue}>
                          <img
                            src="/duck/start_blue.png"
                            style={{
                              left: 302,
                              top: 286,
                            }}
                          />
                        </div>
                      </div>
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
                          <div className={styles.eat1Circle}>{food?.index}</div>
                        </div>
                      ))}
                      {/* 我的鸭------------- */}
                      <div
                        className={`${styles.duck1}`}
                        style={{
                          left: `${resultRes?.self?.trajectory[
                            resultRes?.self?.trajectory?.length - 1
                          ]?.[0] - 20
                            }px`,

                          top: `${resultRes?.self?.trajectory[
                            resultRes?.self?.trajectory?.length - 1
                          ]?.[1] - 45
                            }px`,
                        }}
                      >
                        <img id="duck1Img" src={'/duck/my.png'} />
                      </div>

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
                          )}
                          fill="none"
                          stroke="#E67187"
                          strokeWidth="2"
                          strokeLinejoin="round" // 设置转折处为圆滑
                          strokeLinecap="round" // 设置线段末端为圆形，使线段更柔和
                        />
                      </svg>

                      {/* 机器鸭 */}
                      <div
                        className={`${styles.duckPK} ${eatingFood ? styles.eating : styles.duckPos
                          }`}
                        style={{
                          left: `${resultRes?.opp?.trajectory[
                            resultRes?.opp?.trajectory?.length - 1
                          ]?.[0] - 30
                            }px`,
                          top: `${resultRes?.opp?.trajectory[
                            resultRes?.opp?.trajectory?.length - 1
                          ]?.[1] - 50
                            }px`,
                        }}
                      >
                        <div
                          className={
                            styles[
                            !isNumberString(
                              resultRes?.userInfo?.opp?.username,
                            ) &&
                              resultRes?.userInfo?.opp?.username?.length > 3
                              ? 'name_bg'
                              : 'name_bg_short'
                            ]
                          }
                        >
                          {resultRes?.userInfo?.opp?.username}
                        </div>
                        <img src={'/duck/pk_duck.png'} />
                      </div>

                      <svg
                        preserveAspectRatio="xMidYMid meet"
                        className={styles['duck-trail2']}
                      >
                        <path
                          d={generateSmoothPath(resultRes?.opp?.trajectory, 20)}
                          fill="none"
                          stroke="#FEFBCE"
                          strokeWidth="2"
                          strokeDashoffset="0" // 定义虚线的起始偏移量
                          strokeLinejoin="round" // 设置转折处为圆滑
                          strokeLinecap="round" // 设置线条末端为圆形，使线条更柔和
                        />
                      </svg>
                    </>
                  )}
                </div>
              </Spin>
            </>
          </div>
        </div>
        <img
          className={styles.result_close}
          src="/duck/resule_close.png"
          onClick={() => {
            setSeeResult(false);
          }}
        />
      </div>
    );
  };

  useEffect(() => {
    if (isEnterPk) {
      getDuckPKOppInfo();
    }
    return () => { };
  }, [isEnterPk]);

  // 获取对手信息
  const getDuckPKOppInfo = () => {
    setTimeout(async () => {
      const res = await getDuckPKOpp();
      setDuckPKOpp(res);
      setMatchSuccess(true);
    }, 3000);
  };

  useEffect(async () => {
    let timer: any;
    if (matchSuccess && countdown > 1) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (matchSuccess && countdown === 1) {
      const res = await getDuckInit(duckPKOpp?.matchUser?.userId);
      // 倒计时结束，进入游戏
      setTimeout(() => {
        setPkIng(true);
        setIsPking(true);
      });
      setTimeout(() => {
        simulateClicks(res);
      }, 1500);
    }

    return () => clearTimeout(timer); // 清除定时器
  }, [matchSuccess, countdown]);

  // 模拟点击效果
  // 添加过渡动画
  const animatePath = () => {
    const path = document.getElementById('duck-path');
    if (!path) return;

    path.classList.remove(styles['path-transition']);
    setTimeout(() => {
      path.classList.add(styles['path-transition']);
    }, 50); // 50 毫秒后添加类名以触发动画
  };

  const simulateClicks = (res) => {
    const selfDots = res?.PKFoodsPos?.self;
    const [x, y] = selfDots[clickIndex];
    handleFoodClickMock(clickIndex, x, y, res);
  };
  useEffect(() => {
    if (Pking && clickIndex > 0 && clickIndex < 7) {
      setTimeout(() => {
        const selfDots = duckInit?.PKFoodsPos?.self;
        const [x, y] = selfDots[clickIndex];
        handleFoodClickMock(clickIndex, x, y, duckInit);
      }, 700);
      animatePath();
      // 画完
    }
    if (clickIndex === 7) {
      setTimeout(() => {
        startPKGame();
      }, 100);
    }
  }, [clickIndex]);

  // 继续AI对战
  const rePKHandle = () => {
    getDuckPKOppInfo();
    setMatchSuccess(false);
    setPkIng(false);
    setClickIndex(0);
    setCountdown(3);
    setResultShow(false);
    reStart();
  };

  // 开始pk
  const startPKGame = async () => {
    try {
      localStorage.playing === 1;
      // 设置游戏进行中状态为 true
      setIsGameInProgress(true);
      setMove(true);
      const res = await setFoodsStrategy({
        id: duckInit?.id,
        strategy: duckInit?.PKStrategy?.self,
        oppStrategy: duckInit?.PKStrategy?.opp,
        mode: AIModel ? 'AI' : pkModel ? 'PK' : '',
      });
      const isUpdate = res?.gameStatus?.gamesPlayed % 10 === 0;
      // 赢了的时候才进行
      if (res?.self?.foodCounts > res?.opp?.foodCounts) {
        setUpdate(isUpdate);
        getRandomSentence(true);
      } else {
        setUpdate(false);
        getRandomSentence(false);
      }
      setResult(res);
      setEatingFood(true);
      setLinePath([[0, 0]]); // 清空鼠标连接线
      setGameOver(false);
      setDuck2Over(false);
      setDuck1Over(false);
      moveDuck(res);
    } catch (error) {
      reStart();
    } finally {
      // 无论是否成功执行，都要重置游戏进行中状态
      setIsGameInProgress(false);
    }
  };

  // 模拟点击
  const handleFoodClickMock = (index, x, y, res) => {
    const updatedPathCoordinates = [...pathCoordinatesLine];

    const updatedFoods = [...res?.foods];

    const foodIndex = updatedFoods.findIndex(
      (food) => food?.[0] === x && food?.[1] === y,
    );

    if (foodIndex !== -1) {
      updatedFoods[foodIndex].clicked = true;
      updatedFoods[foodIndex].times = index + 1;
      updatedPathCoordinates.push([x, y]);
      setLinePath(updatedPathCoordinates);
      setClickIndex(clickIndex + 1);
      setFoods(updatedFoods);
    }
  };

  const [rulexy, setRulexy] = useState({
    x: 0,
    y: 0,
  });

  const preloadImages = [
    '/duck/game_water.png',
    '/duck/success.png',
    '/duck/successAI.png',
    '/duck/win.png',
    '/duck/lose.png',
    '/duck/rank_bg.png',
    '/duck/phy_tip_bg.png',
    '/duck/reload_btn.png',
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
    // 定义一个函数，用于处理视口高度变化的逻辑
    function handleViewportResize() {
      const viewportHeight = window.innerHeight;
      const browserWidth = window.innerWidth;
      setHeight(viewportHeight);
    }

    // 页面加载完成后首次执行一次处理函数
    handleViewportResize();

    // 添加 resize 事件监听器，以便在视口大小变化时触发处理函数
    window.addEventListener('resize', handleViewportResize);
  }, []);

  const ruleRef = useRef(null);
  useEffect(() => {
    if (ruleRef.current && rulexy?.x === 0) {
      const { x, y } = ruleRef.current.getBoundingClientRect();
      setRulexy({
        x: Math.round(x),
        y: Math.round(y),
      });
    }
  }, [ruleRef, rulexy, newHand, AIModel]);

  useEffect(async () => {
    // 获取游戏用户信息
    if (loginState) {
      try {
        // 位置切换的时候调用状态查询
        if (source) {
          const res = await setDuckGameEventHandle();
          // 活动不存在的时候不进行调用info
          if (res?.status !== -4) {
            getDuckGameInfoHandle(true);
          }
        } else {
          getDuckGameInfoHandle(true);
        }
      } catch (error) {
      } finally {
      }
    } else {
      setInfoLoading(false);
    }
  }, [loginState]);

  useEffect(async () => {
    // 在初次进入游戏调用排行榜
    // 游戏模式切换调用排行榜

    if (newHand) {
      const res = await showRule();
      if (res?.status) {
        setRuleModal(true);
      }
    }
    if (AIModel) {
      const res = await isFirstVisitAI();
      if (res?.status) {
        setIsFirstVisitAI(true);
        setTimeout(() => {
          setIsFirstVisitAI(false);
        }, 4000);
      }
    }
  }, [AIModel, newHand, pkModel]);

  const handleRankList = async () => {
    try {
      setRankLoading(true);
      // 来源物理所AI鸭模式
      if (source && AIModel) {
        const [res, phy] = await Promise.all([
          getDuckGameRanking({
            mode: newHand ? '' : AIModel ? 'AI' : 'PK',
          }),
          getEventRanking({
            link: source,
            role: 'user',
          }),
        ]);
        setPhyRank(phy?.list);
        setRankList(res);
      } else {
        // 如果是AI课程的话
        if (isAICourse) {
          const [res] = await Promise.all([
            getEventRanking({
              mode: newHand ? '' : AIModel ? 'AI' : 'PK',
              id: gameInfo?.eventId,
              role: 'user',
            }),
          ]);
          setRankList(res?.list);
        } else {
          const [res] = await Promise.all([
            getDuckGameRanking({
              mode: newHand ? '' : AIModel ? 'AI' : 'PK',
              id: gameInfo?.eventId,
            }),
          ]);
          setRankList(res);
        }
      }
    } catch (error) {
      // 错误处理
    } finally {
      setRankLoading(false);
    }
  };

  const handleConPK = () => {
    handlePkClick();
    reStart(false);
    setEnterPk(true);
    setAIUpdate(false);
  };

  // 创建用户
  const createName = async (isChange = false) => {
    // 去除用户名首尾空格
    const trimmedUserName = userName.trim();

    if (!trimmedUserName) {
      setNameTip('请输入姓名！');
      return;
    }
    if (!school) {
      setNameTip('请输入学校名称！');
      return;
    }
    const filter = new Filter();
    // 检测文本中是否含有敏感词汇
    if (filter.isProfane(trimmedUserName)) {
      setNameTip('违规昵称！');
      return;
    }
    try {
      const res = await setDuckGameUserInfo({
        username: trimmedUserName,
        school: school,
        source: source,
      });
      if (!res?.status) {
        if (res?.type === 1) {
          setNameTip('名字重复，换一个试试！');
        }
        if (res?.type === 2) {
          setNameTip('该玩家昵称已被使用！');
        }
        return;
      }
      message.success({
        content: isChange ? '昵称修改成功！' : '账号创建成功！',
        style: { marginTop: '25vh' },
        duration: 1,
      });
      setCreateModal(false);
      getDuckGameInfoHandle(false, true, false);
      setUserInfoModal(false);
      setChangeModal(false);
      setHaveChangeInput(null);
    } catch (error) {
      setNameTip('创建账号时出错，请稍后重试！');
    }
  };

  const [lastIndex, setLastIndex] = useState(-1); // 记录上一次使用的索引

  function getRandomSentence(win: boolean) {
    const sentences = win
      ? pkModel
        ? ['哈哈！赢了！没有给师傅您丢人呀！', '又赢了！我学的还是很扎实的！']
        : [
          '我会慢慢学习你的玩法，然后打败你，以彼之道还施彼身。',
          '你好聪明！但是我会学得跟你一样聪明的！',
        ]
      : pkModel
        ? ['没关系！只是运气不好！', '没关系！只是运气不好！']
        : ['哈哈！我很厉害吧！', '哈哈！我很厉害吧！'];

    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * 2); // 生成随机索引
    } while (randomIndex === lastIndex); // 如果随机索引与上一次的索引相同，则重新生成

    setLastIndex(randomIndex); // 更新上一次的索引
    setModalResultText(sentences[randomIndex]);
    return sentences[randomIndex];
  }

  const loseImg = newHand ? '/duck/lose_newHand.png' : '/duck/lose.png';
  const winImg = newHand ? '/duck/win_newHand.png' : '/duck/win.png';
  const rankBgImg =
    source && AIModel ? '/duck/phy_AI_rank_bg.png' : '/duck/rank_bg.png';

  // 返回按钮
  const handleBack = () => {
    setShowRank(false);
    // 首页进入返回
    if (isHomeEnterRank) {
      setIsHomeEnterRank(false);
      backHome();
    } else {
      // 回到首页检查局数
      getDuckGameInfoHandle(false, newHand, pkModel);
    }
    setSwitchRank(0);
  };

  const replaceUrl = (name, value) => {
    const currentParams = new URLSearchParams(location.search);
    if (value) {
      currentParams.set(name, value);
    } else {
      currentParams.delete(name);
    }
    const newUrl = `${location.pathname}?${currentParams.toString()}`;
    history.replace(newUrl);
  };
  // 鸭小白点击
  const handleNewHandModleClick = () => {
    if (!gameInfo?.unlockBeginner) {
      setModalsType('textTip');
      setModalsContent(
        <div>
          <div>“鸭小白”比赛未开始，</div>
          <div>待老师进行解锁</div>
        </div>,
      );
      setModalsOpen(true);
      return;
    }
    getDuckGameInfoHandle(false, true, false);
    reStart();
    setNewHand(true);
    setAIModel(false);
    setPKModel(false);
  };

  const changeModelList = [
    {
      model: newHand,
      img: newHand ? '/duck/xiaobai_click.png' : '/duck/xiaobai_change.png',
      onclick: () => {
        handleNewHandModleClick();
        Toast.show({
          content: ` 已切换至“鸭小白
                            ”`,
          duration: 1500,
        });
        clearPkStatus();
      },
      lock: true,
    },
    {
      model: AIModel,
      img: AIModel ? '/duck/ai_click.png' : '/duck/ai_change.png',
      onclick: () => {
        if (gameInfo?.unlockAI) {
          Toast.show({
            content: ` 已切换至“AI鸭
                            ”`,
            duration: 1500,
          });
          clearPkStatus();
        }
        handleAIModelClick();
      },
      lock: gameInfo?.unlockAI,
    },
    {
      model: pkModel,
      img: pkModel ? '/duck/pk_click.png' : '/duck/pk_change.png',
      onclick: () => {
        handlePkClick();
        if (gameInfo?.unlockPK) {
          reStart(false);
          clearPkStatus();
          setPKModel(true);
          Toast.show({
            content: ` 已切换至“AI对战
                        ”`,
            duration: 1500,
          });
        }
      },
      lock: gameInfo?.unlockPK,
    },
    {
      model: trainModel,
      img: trainModel ? '/duck/train_click.png' : '/duck/train_change.png',
      onclick: () => {
        handleTrainClick();
        if (gameInfo?.unlockTraining) {
          setTrainModel(true);
        }
      },
      lock: gameInfo?.unlockTraining,
    },
  ];

  // 弹窗大集合
  const ModalRender = (
    <>
      <GlobalModal isOpen={phyTipOpen}>
        <div className={styled.phyTipImg}>
          {phyInfo?.status === -1 && (
            <>
              <div className={styled.text1}>本轮活动已结束,新一轮开始时间</div>
              <div className={styled.text2}>
                <span
                  style={{
                    color: '#75d045',
                  }}
                >
                  {phyInfo?.eventInfo?.startTime}&nbsp;
                </span>
              </div>
            </>
          )}
          {phyInfo?.status === -2 && (
            <>
              <div className={styled.text1}>活动未开始,新一轮开始时间</div>
              <div className={styled.text2}>
                <span
                  style={{
                    color: '#75d045',
                  }}
                >
                  {phyInfo?.eventInfo?.startTime}&nbsp;
                </span>
              </div>
            </>
          )}
          {phyInfo?.status === -3 && (
            <>
              <div className={styled.text1} style={{ marginBottom: 12 }}>
                活动已结束
              </div>
              <div
                className={styled.text2}
                style={{
                  color: '#8a806f',
                  fontSize: convertPxToRem(14),
                  fontWeight: 'normal',
                }}
              >
                <span
                  style={{
                    color: '#fc0813',
                  }}
                >
                  {countdownPhy}
                </span>
                秒后跳转至游戏
              </div>
            </>
          )}
          {phyInfo?.status === -4 && (
            <>
              <div className={styled.text1} style={{ marginBottom: 12 }}>
                活动不存在！
              </div>
              <div
                className={styled.text2}
                style={{
                  color: '#8a806f',
                  fontSize: convertPxToRem(14),
                  fontWeight: 'normal',
                }}
              >
                <span
                  style={{
                    color: '#fc0813',
                  }}
                >
                  {countdownPhy}
                </span>
                秒后跳转至游戏
              </div>
            </>
          )}
        </div>
      </GlobalModal>
      {/* 模式切换 */}
      <GlobalModal isOpen={changeModel}>
        <div className={styles.changeModelImg}>
          <div
            className={styles.close}
            onClick={() => {
              setChangeModelHandle(false);
            }}
          ></div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
            }}
          >
            {changeModelList?.slice(0, source ? 2 : 4)?.map((item, index) => {
              return (
                <div
                  className={styles[item.model ? 'modelBorder' : '']}
                  style={{
                    pointerEvents: item.model ? 'none' : 'unset',
                    position: 'relative',
                  }}
                  key={index}
                >
                  {!item.lock && (
                    <img src="/duck/key_pk.png" className={styles.key_pk} />
                  )}
                  <img
                    onClick={() => {
                      if (item.lock) {
                        setChangeModelHandle(false);
                      }
                      item.onclick();
                    }}
                    src={item.img}
                    style={{
                      width: convertPxToRem(242),
                      height: convertPxToRem(52),
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </GlobalModal>
      {/* 排行榜 */}
      <GlobalModal isOpen={showRank}>
        <RankListRender
          rankList={rankList}
          phyRank={phyRank}
          switchRank={switchRank}
          rankBgImg={rankBgImg}
          handleBack={handleBack}
          newHand={newHand}
          source={source}
          AIModel={AIModel}
          setSwitchRank={(val) => {
            setSwitchRank(val);
          }}
          rankLoading={rankLoading}
        />
      </GlobalModal>
      {/* 头像信息 */}
      {/* <GlobalModal isOpen={userInfoModal}>
        <div className={styles.info_bg}>
          <div
            className={styles.close}
            onClick={() => {
              setUserInfoModal(false);
            }}
          ></div>
          <img className={styles.img1} src="/duck/photo.png"></img>
          <div
            className={styles.name}
            onClick={() => {
              setChangeModal(true);
            }}
          >
            {gameInfo?.username} <img src="/duck/edit_btn.png" />
          </div>
        </div>
      </GlobalModal> */}
      {/* 修改昵称 */}
      {/* <GlobalModal isOpen={changeInfoModal} noBg={true}>
        <div className={styles.change_bg}>
          <div
            className={styles.close}
            onClick={() => {
              setChangeModal(false);
              setHaveChangeInput(null);
            }}
          ></div>
          <div className={styles.modalText}>玩家昵称：</div>
          <div className={styles.input} style={{ marginTop: 10 }}>
            <Input
              onChange={(val) => {
                setName(val);
                setNameTip(null);
                setHaveChangeInput(val);
              }}
              defaultValue={gameInfo?.username}
              maxLength={12}
              placeholder="请输入玩家昵称"
              className={styles.input}
              style={{
                border: '1px solid #FCBE5B',
                borderRadius: 4,
                background: '#fff',
              }}
            />
          </div>
          {nameTip && <div className={styles.nameTip}>{nameTip}</div>}
          {!haveChangeInput ? (
            <div className={styles.saveGray} />
          ) : (
            <div
              onClick={() => {
                createName(true);
              }}
              className={styles.createBtn}
            />
          )}
        </div>
      </GlobalModal> */}

      <GlobalModal
        closeModal={() => {
          setIsFirstVisitAI(false);
        }}
        isOpen={isFirstVisitAIShow}
      >
        <div className={styles.isFirstVisitAI}></div>
      </GlobalModal>
      <GlobalModal isOpen={lockTip}>
        <div className={styles.tipImg} style={{ padding: 0 }}>
          <div
            className={styles.close}
            onClick={() => {
              setlockTip(false);
            }}
          ></div>
          <div
            className={styles.btnText}
            style={{
              fontSize: 18,
              marginTop: 40,
              textAlign: 'center',
              fontWeight: 'normal',
              lineHeight: '28px',
            }}
          >
            <div>
              您已战胜“鸭小白”
              <span style={{ color: '#fc4649' }}>
                {gameInfo?.gamesPlayed || 0}
              </span>
              次，
            </div>
            <div style={{ marginTop: 3 }}>
              再赢
              <span
                style={{ color: '#fc4649', fontSize: 20, fontWeight: 'bold' }}
              >
                {10 - gameInfo?.gamesPlayed || 0}
              </span>
              次就可以解锁“AI鸭”了~
            </div>
          </div>
          <div
            className={styles.tipBtn}
            style={{ marginTop: 30 }}
            onClick={() => {
              setlockTip(false);
              setPKClickModal(false);
              setChangeModelHandle(false);
              handleNewHandModleClick();
            }}
          ></div>
        </div>
      </GlobalModal>
      {/* 提示 */}
      <GlobalModal isOpen={pkClickModal}>
        <div className={styles.tipImg} style={{ padding: 0 }}>
          <div
            className={styles.close}
            onClick={() => {
              setPKClickModal(false);
            }}
          ></div>
          <>
            {isClickTrain ? (
              <>
                <div className={styles.lockPk_text}>请先解锁“AI对战”～</div>
              </>
            ) : (
              <>
                {' '}
                {!gameInfo?.unlockAI ? (
                  <div className={styles.lockPk_text}>请先解锁“AI鸭”～</div>
                ) : (
                  <>
                    <div
                      className={styles.btnText}
                      style={{
                        fontSize: 18,
                        marginTop: 65,
                        textAlign: 'center',
                        fontWeight: 'normal',
                        lineHeight: '28px',
                        marginRight: convertPxToRem(13),
                      }}
                    >
                      <div>
                        您已战胜“AI鸭”
                        <span style={{ color: '#fc4649' }}>
                          {gameInfo?.AIGamesPlayed - 10}
                        </span>
                        次，再赢
                        <span
                          style={{
                            color: '#fc4649',
                            fontSize: 20,
                            fontWeight: 'bold',
                          }}
                        >
                          {20 - gameInfo?.AIGamesPlayed || 0}
                        </span>
                        次
                      </div>
                      <div style={{ marginTop: 3 }}>
                        就可以解锁“AI对战”~
                      </div>
                    </div>
                    <div
                      className={styles.clickToAI}
                      style={{ marginTop: 24 }}
                      onClick={() => {
                        setPKClickModal(false);
                        setChangeModelHandle(false);
                        handleAIModelClick();
                      }}
                    ></div>
                  </>
                )}
              </>
            )}
          </>
        </div>
      </GlobalModal>
      {/* 创建用户弹窗弹窗 */}
      <GlobalModal isOpen={createModal}>
        <div className={styles.create_bg}>
          {/* <div className={styles.modalText}>
            首次登录的用户，需先设置玩家昵称
          </div> */}
          <div
            className={styles.text}
            style={{
              width: convertPxToRem(220),
              marginTop: 35,
            }}
          >
            姓名：
          </div>
          <div className={styles.input} style={{ marginTop: 6 }}>
            <Input
              onChange={(val) => {
                setName(val);
                setNameTip(null);
              }}
              maxLength={12}
              placeholder="请输入姓名"
              style={{
                width: convertPxToRem(220),
                height: convertPxToRem(36),
                border: '1px solid #FCBE5B',
                borderRadius: 4,
                background: '#fff',
              }}
            />
          </div>
          <div
            className={styles.text}
            style={{
              width: convertPxToRem(220),
              marginTop: 12,
            }}
          >
            学校：
          </div>
          <div className={styles.input} style={{ marginTop: 6 }}>
            <Input
              onChange={(val) => {
                setSchool(val);
                setNameTip(null);
              }}
              maxLength={24}
              placeholder="请输入学校名称"
              style={{
                width: convertPxToRem(220),
                height: convertPxToRem(36),
                border: '1px solid #FCBE5B',
                borderRadius: 4,
                background: '#fff',
              }}
            />
          </div>
          {/* {nameTip && <div className={styles.nameTip}>{nameTip}</div>} */}
          <div
            onClick={() => {
              createName(false);
            }}
            className={
              styles[userName && school ? 'createBtn' : 'createBtnGray']
            }
          />
        </div>
      </GlobalModal>

      {/* 规则 */}
      <GlobalModalPack
        position={{ x: rulexy.x, y: rulexy.y }}
        isOpen={ruleModal}
        closeModal={() => {
          setRuleModal(false);
        }}
      >
        <div className={styles.rule_bg}>
          <div
            className={styles.close}
            onClick={() => {
              setRuleModal(false);
            }}
          ></div>
          <div>
            <div className={styles.text}>
              1、点击水池里的食物，制定夺食顺序，然后点击“开始游戏”，鸭子就会按照顺序开始吃食物。
            </div>
            <div className={styles.text}>2、双击选中的食物就可以取消选择。</div>
            <div className={styles.text}>
              3、打赢鸭小白10次就可以跟 AI 鸭进行比赛。
            </div>
          </div>
        </div>
      </GlobalModalPack>

      {/* AI更新成功 */}
      <GlobalModal isOpen={AIUpdate}>
        {/* 第二次更新的时候替换为对战 */}
        {/* 解锁AI对战  并且不是物理所*/}
        {/* 并且解锁了PK */}
        {Math.floor(gameInfo?.gamesPlayed / 10) === 2 &&
          !source &&
          gameInfo?.unlockPK ? (
          <>
            <div className={styles.successPKImg}>
              <div className={styles.lockAI}>
                <img src="/duck/suc_PK.png" />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                {/* 继续和AI鸭玩 */}
                <div
                  className={styles.withAI}
                  onClick={() => {
                    setAIUpdate(false);
                    reStart();
                  }}
                />
                {/* 参加AI对战 */}
                <div className={styles.enterPK} onClick={handleConPK} />
              </div>
            </div>
          </>
        ) : (
          <div className={styles.successAIImg}>
            <div className={styles.lockAI}>
              <img src="/duck/successAI.png" />
              <div className={styles.text}>
                第{Math.floor(gameInfo?.gamesPlayed / 10)}次
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {/* 查看结果 */}
              <div
                className={styles.backNewHand}
                onClick={() => {
                  setAIUpdate(false);
                }}
              />
              {/* 继续挑战 */}
              <div
                className={styles.enterAI}
                onClick={() => {
                  handleAIModelClick();
                  setAIUpdate(false);
                }}
              />
            </div>
          </div>
        )}
      </GlobalModal>

      {/* 成功失败Modal */}
      {/* 比赛结果 */}
      <GlobalModal bgOpacity={0.8} isOpen={resultShow}>
        {result?.self?.foodCounts > result?.opp?.foodCounts ? (
          <div>
            <>
              {/* 游戏胜利----------------- */}
              {/* 第一次解锁 并且已解锁了AI鸭 */}
              {result?.gameStatus?.isFirstTime && gameInfo?.unlockAI ? (
                <div className={styles.successImg}>
                  <div className={styles.lockAI}>
                    <img src="/duck/success.png" />
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div
                      className={styles.backNewHand}
                      onClick={() => {
                        setResultShow(false);
                      }}
                    />
                    <div
                      className={styles.enterAI}
                      onClick={() => {
                        handleAIModelClick();
                        setNewHand(false);
                        setResultShow(false);
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div
                    className={styles.winImg}
                    style={{ backgroundImage: `url(${winImg})` }}
                  >
                    <div
                      className={styles.resultText2}
                      style={{ color: '#FFF0B0' }}
                    >
                      获取食物{result?.self?.foodCounts}个, 积分
                      <span style={{ color: '#4FC81F' }}>
                        +{result?.self?.points}
                      </span>
                    </div>
                    <div className={styles.resultTipTextWin}>
                      {newHand
                        ? gameInfo?.unlockAI
                          ? '你好聪明呀！你可以跟我哥哥 AI 鸭比赛。他学习可快了！'
                          : '你好聪明呀！再玩一局吧？赢我10局就可以跟我哥哥 AI 鸭比赛了。'
                        : modalResultText}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 12,
                      justifyContent: 'center',
                      marginTop: 30,
                    }}
                  >
                    <div
                      className={styles.knowBtn}
                      onClick={() => {
                        setResultShow(false);
                      }}
                    />
                    {pkModel ? (
                      <div
                        className={styles.contiPK}
                        onClick={() => {
                          rePKHandle();
                        }}
                      ></div>
                    ) : (
                      <div
                        className={styles.resultReplayBtn}
                        onClick={() => {
                          setResultShow(false);
                          reStart();
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
            </>
          </div>
        ) : (
          <div>
            <div
              className={styles.loseImg}
              style={{ backgroundImage: `url(${loseImg})` }}
            >
              <div className={styles.resultText2} style={{ color: '#AFD2D2' }}>
                获取食物{result?.self?.foodCounts}个，积分
                <span style={{ color: '#FEC625' }}>{result?.self?.points}</span>
              </div>
              <div className={styles.resultTipTextLose}>
                {newHand
                  ? gameInfo?.unlockAI
                    ? '我的运气太好了！'
                    : '没关系！再玩一局吧？赢我10局就可以跟我哥哥 AI 鸭比赛了。'
                  : modalResultText}
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'center',
                marginTop: 30,
              }}
            >
              <div
                className={styles.knowBtn}
                onClick={() => {
                  setResultShow(false);
                }}
              />
              {pkModel ? (
                <div
                  className={styles.contiPK}
                  onClick={() => {
                    rePKHandle();
                  }}
                ></div>
              ) : (
                <div
                  className={styles.resultReplayBtn}
                  onClick={() => {
                    setResultShow(false);
                    reStart();
                  }}
                />
              )}
            </div>
          </div>
        )}
      </GlobalModal>
    </>
  );

  // AI鸭点击
  const handleAIModelClick = () => {
    if (!gameInfo?.unlockAI) {
      if (gameInfo?.AILockReason === 1) {
        setModalsType('textTip');
        setModalsContent(
          <div>
            <div>“AI鸭”比赛未开始，</div>
            <div>待老师进行解锁</div>
          </div>,
        );
        setModalsOpen(true);
      } else if (gameInfo?.AILockReason === 2) {
        setlockTip(true);
      }
      return;
    }
    getDuckGameInfoHandle(false, false, false);
    reStart();
    setAIModel(true);
    setNewHand(false);
    setPKModel(false);
  };

  // pk点击
  const handlePkClick = () => {
    if (!gameInfo?.unlockPK) {
      if (gameInfo?.PKLockReason === 1) {
        setModalsType('textTip');
        setModalsContent(
          <div>
            <div>“AI对战”比赛未开始，</div>
            <div>待老师进行解锁</div>
          </div>,
        );
        setModalsOpen(true);
      } else {
        setIsClickTrain(false);
        setPKClickModal(true);
      }
      return;
    }
    getDuckGameInfoHandle(false, false, true);
    setPKModel(true);
    setAIModel(false);
    setNewHand(false);
  };

  // AI训练
  const handleTrainClick = () => {
    if (!gameInfo?.unlockTraining) {
      if (gameInfo?.trainingLockReason === 1) {
        setModalsType('textTip');
        setModalsContent(
          <div>
            <div>“AI训练”比赛未开始，</div>
            <div>待老师进行解锁</div>
          </div>,
        );
        setModalsOpen(true);
      } else {
        setIsClickTrain(true);
        setPKClickModal(true);
      }
      return;
    }
    clearPkStatus();
    reStart(false);
    replaceUrl('model', 'train');
    setPKModel(false);
    setAIModel(false);
    setNewHand(false);
    setTrainModel(true);
  };

  // 返回首页事件
  const backHome = () => {
    setNewHand(false);
    setAIModel(false);
    setPKModel(false);
    setGameOver(false);
    reStart(false);
    clearPkStatus();
    if (!gameInfo?.unlockAI) {
      getDuckGameInfoHandle(false, newHand, pkModel);
    }
  };

  // 游戏结束----------------------------------
  useEffect(() => {
    const handleGameEnd = async () => {
      setIsOverGame(true);
      setGameOver(true);
      setEatingFood(false);
      // 游戏结束调用排行榜
      setMove(false);
      setIsPking(false);
      if (AIModel) {
        // AI鸭模式下 逢1o烟花
        if (update) {
          showConfetti();
          setAIUpdate(true);
          setIsShowAIUpdate(true);
        } else {
          setResultShow(true);
        }
      } else if (newHand) {
        // 鸭小白模式下 第一次更新烟花 并且AI鸭解锁
        if (result?.gameStatus?.isFirstTime && gameInfo?.unlockPK) {
          showConfetti();
        }
        setResultShow(true);
      } else {
        // pk模式都出结果
        setResultShow(true);
      }
      // 获取游戏用户局数
      const res = await getDuckGameInfoHandle(false, newHand, pkModel);
      // 结束后更新我方积分
      if (pkModel) {
        setPkInfo({
          ...pkInfo,
          self: {
            PKPoints: res.points,
            PKWinrate: res?.winRate,
          },
        });
      }
    };

    if (duck1Over && duck2Over) {
      handleGameEnd();
    }
  }, [duck1Over, duck2Over]);

  // 获取父元素的位置信息

  const parentRef = useRef(null); // 使用 useRef 创建父元素的引用

  useEffect(() => {
    // getDuckInit();
    return () => {
      num = null;
      duckNum = null;
      duckNum2 = null;
      animationTimerSelf = null;
      animationTimerOpp = null;
      clearInterval(animationTimerSelf);
      clearInterval(animationTimerOpp);
    };
  }, []);

  const getDuckInit = (id = '') => {
    return new Promise(async (resolve, reject) => {
      try {
        setLoading(true);
        const data = await getDuckInitialValue({
          oppUserId: id,
        });
        setIsShowAIUpdate(false);
        setDuckInit(data);
        setPkInfo(data?.userInfo);
        setDuckPosition1({
          x: data?.duckStart?.self?.[0] + duck1X,
          y: data?.duckStart?.self?.[1] + duck1Y,
        });
        setDuckPosition2({ x: duck2X, y: duck2Y });
        const newFoods = JSON.parse(JSON.stringify(data?.foods));
        setFoods(newFoods);
        const newFoodInit = JSON.parse(JSON.stringify(data?.foods));
        setFoodsInit(newFoodInit);
        setLinePath([[data?.duckStart?.self?.[0], data?.duckStart?.self?.[1]]]);
        resolve(data); // 解决 Promise 并将数据传递出去
      } catch (error) {
        reject(error); // 如果出现错误，拒绝 Promise 并传递错误信息
      } finally {
        setLoading(false);
      }
    });
  };

  const handleStrategyList = (res) => {
    const isUpdate = res?.gameStatus?.gamesPlayed % 10 === 0;
    // 赢了的时候才进行
    if (res?.self?.foodCounts > res?.opp?.foodCounts) {
      setUpdate(isUpdate);
      getRandomSentence(true);
    } else {
      setUpdate(false);
      getRandomSentence(false);
    }
    setResult(res);
    setEatingFood(true);
    setLinePath([]); // 清空鼠标连接线
    setGameOver(false);
    setDuck2Over(false);
    setDuck1Over(false);
    setIsGameInProgress(false);
    moveDuck(res);
  };

  // 开始游戏逻辑
  const startGame = async () => {
    // 物理所 正常活动过程中 如果活动已结束
    const eventTime = new Date(phyInfo?.eventInfo?.gmtEndTime).getTime();
    const currentTime = new Date().getTime();
    if (source && phyInfo?.status === 1 && currentTime >= eventTime) {
      setDuckGameEventHandle();
      clearInterval(isEventOverId);
      return;
    }
    setIsStartClick(true);
    setTimeout(() => {
      setIsStartClick(false);
    }, 500);
    // 如果游戏正在进行中，则直接返回，不执行任何操作
    if (isGameInProgress || !isOverGame) {
      return;
    }
    if (!duckInit?.id) {
      return;
    }
    if (strategyList?.length === foods?.length) {
      try {
        // 设置游戏进行中状态为 true
        setIsGameInProgress(true);
        setMove(true);
        setIsOverGame(false);
        if (strategyList?.length === 0) {
          return;
        }
        const timeout = 10000; // 超时时间为 10s
        const startTime = Date.now();
        const res = await setFoodsStrategy({
          id: duckInit?.id,
          strategy: strategyList,
          mode: AIModel ? 'AI' : '',
        });
        if (Object.values(res)?.length === 0) {
          const checkFoodsStrategy = async () => {
            const getResponse = await getFoodsStrategy({
              id: duckInit?.id,
              strategy: strategyList,
              mode: AIModel ? 'AI' : '',
            });
            if (Object.values(getResponse)?.length !== 0) {
              handleStrategyList(getResponse);
              clearTimeout(timer); // 清除定时器
            } else if (Date.now() - startTime >= timeout) {
              emitter.emit('tipOpen');
              setIsGameInProgress(false);
              clearTimeout(timer); // 清除定时器
            } else {
              timer = setTimeout(checkFoodsStrategy, 300);
            }
          };
          let timer = setTimeout(checkFoodsStrategy, 300); // 初次调用
        } else {
          handleStrategyList(res);
        }
      } catch (error) {
        reStart();
      } finally {
        // 无论是否成功执行，都要重置游戏进行中状态
        setTimeout(() => {
          setIsOverGame(true);
        }, 3000);
      }
    } else {
      setTipOpen(true);
      setTimeout(() => {
        setTipOpen(false);
      }, 2000);
    }
  };

  const checkEatFood = (duck1EatList, foodEatenxy) => {
    const result = containsDot(duck1EatList, foodEatenxy);
    const indexFood = result.index;
    const isEatFood = result?.found;
    return { isEatFood, indexFood };
  };

  const containsDot = (array, dot) => {
    for (let i = 0; i < array.length; i++) {
      if (array[i]?.[0] === dot?.[0] && array[i]?.[1] === dot?.[1]) {
        return { found: true, index: i };
      }
    }
    return { found: false, index: -1 };
  };

  let moveSpeed = 10;

  // 鸭子移动
  const moveDuck = (res) => {
    return new Promise((resolve) => {
      const newTrail = [...res?.self?.trajectory];
      setDuckPosition1({ x: 0, y: 0 });
      duckNum = 1;
      duckNum2 = 1;
      let index = 0;
      let path1 = [];
      let path2 = [];
      const move = () => {
        if (index < newTrail.length) {
          selfMove(index, res, path1);
          offMove(index, res, path2);
          index++;
        } else {
          setTimeout(() => {
            setDuck1Over(true);
            setDuck2Over(true);
            resolve(); // 解决 Promise
          }, 10);
          clearInterval(animationTimerSelf);
        }
      };
      animationTimerSelf = setInterval(move, moveSpeed); // 调整这里的时间间隔
    });
  };

  const offMove = (index, res, path) => {
    const newTrail = [...res?.opp?.trajectory];
    const newPosition = newTrail[index];
    setDuckPosition2({
      x: newPosition?.[0],
      y: newPosition?.[1],
    });
    path.push(newPosition);
    setDuckPath2([...path]);

    // 鸭子坐标
    const duckX = newPosition?.[0];
    const duckY = newPosition?.[1];
    const updatedFoods = [...foods];
    // 找出鸭子走的坐标和食物坐标重叠的点
    const foodEaten = updatedFoods.find(
      (food) => food[0] === duckX && food[1] === duckY,
    );
    // 找出鸭子和走的坐标的点的索引
    const foodIndex = updatedFoods.findIndex(
      (food) => food[0] === duckX && food[1] === duckY,
    );

    // 重叠点的x y坐标
    const foodEatenxy = [foodEaten?.[0], foodEaten?.[1]];

    const duck2EatList = [...res?.opp?.foodEatenList];
    // 判断 吃的食物是否包含重叠点
    // 如果是重叠点  并且没有被鸭子1标记  并且  是我应该吃的食物坐标 则进行自增标记

    const { isEatFood, indexFood } = checkEatFood(duck2EatList, foodEatenxy);
    const isMarkIndex = indexFood + 1 === duckNum2;
    if (
      foodEaten &&
      !updatedFoods[foodIndex].eat1 &&
      isEatFood &&
      !updatedFoods[foodIndex].eat2 &&
      isMarkIndex
    ) {
      updatedFoods[foodIndex].eat2 = true;
      updatedFoods[foodIndex].eatNums2 = duckNum2;
      duckNum2++;
      setFoods(updatedFoods);
    }
  };

  const selfMove = (index, res, path) => {
    const newTrail = [...res?.self?.trajectory];
    const newPosition = newTrail[index];
    setDuckPosition1({
      x: newPosition?.[0],
      y: newPosition?.[1],
    });
    path.push(newPosition);
    setDuckPath([...path]);

    const duckX = newPosition?.[0];
    const duckY = newPosition?.[1];
    const updatedFoods = [...foods];

    // 如果食物坐标和位置坐标重叠  &&  并且这个坐标包含在我的吃的坐标  则将这个食物打为已吃
    const foodEaten = updatedFoods.find(
      (food) => food[0] === duckX && food[1] === duckY,
    );
    const foodIndex = updatedFoods.findIndex(
      (food) => food[0] === duckX && food[1] === duckY,
    );

    const foodEatenxy = [foodEaten?.[0], foodEaten?.[1]];

    const duck1EatList = [...res?.self?.foodEatenList];
    //  先经过但不是先吃  应该使用食物索引 是否等于我的标记数字duckNum++
    //  比如 食物索引为 0  那它的标记就应该为1  如何食物索引为3  它就不应该标记为 1
    const { isEatFood, indexFood } = checkEatFood(duck1EatList, foodEatenxy);
    const isMarkIndex = indexFood + 1 === duckNum;
    if (
      foodEaten &&
      !updatedFoods[foodIndex].eat2 &&
      isEatFood &&
      !updatedFoods[foodIndex].eat1 &&
      isMarkIndex
    ) {
      updatedFoods[foodIndex].eat1 = true;
      updatedFoods[foodIndex].eatNums1 = duckNum;
      duckNum++;
      setFoods(updatedFoods);
    }
  };

  // 重新开始游戏
  const reStart = (isRestart = true) => {
    setMove(false);
    setDuckPosition1({ x: duck1X, y: duck1Y });
    setDuckPosition2({ x: duck2X, y: duck2Y });
    setFoods([]);
    setEatingFood(false);
    setIsGameInProgress(false);
    if (isRestart) getDuckInit();
    setDuckPath([]);
    setDuckPath2([]);
    setStrategyList([]);
    setLinePath([[0, 0]]); // 清空鼠标连接线
    setEatingFood(false);
    num = 0;
    duckNum = 1;
    duckNum2 = 1;
    clearInterval(animationTimerSelf);
    clearInterval(animationTimerOpp);
    setGameOver(false);
    setDuck2Over(false);
    setDuck1Over(false);
  };

  // 修改 handleFoodClick 函数为单击事件处理程序，用于添加选择食物的逻辑
  // 点击食物
  const handleFoodClick = (index, x, y) => {
    const updatedPathCoordinates = [...pathCoordinatesLine];
    const list = [...strategyList];
    const updatedFoods = [...foods];

    if (updatedFoods[index].clicked) {
      // 如果食物已经被选择，不执行任何操作
      return;
    }

    updatedFoods[index].clicked = true;
    updatedFoods[index].times = num + 1;
    num++;
    list.push(index);
    updatedPathCoordinates.push([x, y]);

    setLinePath(updatedPathCoordinates);
    setStrategyList([...list]);
    setFoods(updatedFoods);
  };

  // 处理食物双击事件取消选择
  const handleFoodDoubleClick = (index, x, y) => {
    const updatedPathCoordinates = [...pathCoordinatesLine];
    const list = [...strategyList];
    const updatedFoods = [...foods];
    const indexToRemove = list.indexOf(index);
    if (indexToRemove !== -1) {
      list.splice(indexToRemove, 1);
      // 更新比取消选择索引大的食物的次序\
      updatedFoods.forEach((up) => {
        if (up.times > updatedFoods[index].times) {
          up.times--;
        }
      });
      // 取消选择
      updatedFoods[index].clicked = false;
      updatedFoods[index].times = null;
      num--;

      // 取消选择时，从路径坐标中移除相应的坐标  食物连线
      const coordinateToRemove = updatedPathCoordinates.find(
        (coordinate) => coordinate[0] === x && coordinate[1] === y,
      );
      const indexToRemove2 = updatedPathCoordinates.indexOf(coordinateToRemove);

      if (indexToRemove2 !== -1) {
        updatedPathCoordinates.splice(indexToRemove2, 1);
      }
    }
    setLinePath(updatedPathCoordinates);
    setStrategyList([...list]);
    setFoods(updatedFoods);
  };

  function generateSmoothPath(coordinateList, gap = 5) {
    if (!coordinateList || coordinateList?.length === 0) {
      return ''; // 如果坐标数组为空，则返回空字符串
    }
    const foodCoordinates = [...foodsInit];

    // 验证坐标列表中的每个坐标点是否有效
    for (const point of coordinateList) {
      // 检查每个坐标点是否是一个有效的数组，并且包含两个数字值
      if (
        !Array.isArray(point) ||
        point.length !== 2 ||
        isNaN(point[0]) ||
        isNaN(point[1])
      ) {
        return ''; // 如果有任何一个坐标点无效，则返回空字符串
      }
    }

    // 构建路径字符串
    let pathString = `M ${coordinateList[0][0]} ${coordinateList[0][1]}`; // 将起始点设为第一个坐标点

    for (let i = 1; i < coordinateList.length; i += gap) {
      const point = coordinateList[i];

      // 检查路径点是否与食物位置重合
      const foodCollision = foodCoordinates.find(
        (food) => food?.[0] === point?.[0] && food?.[1] === point?.[1],
      );

      if (foodCollision) {
        // 如果路径点与食物位置重合，直接将路径点调整到食物位置
        pathString += ` L ${foodCollision[0]} ${foodCollision[1]}`;
      } else {
        // 否则，继续使用原始的路径点
        pathString += ` L${point?.[0]} ${point?.[1]}`;
      }
    }

    return pathString;
  }

  const EatFoodsRender = (
    <>
      <Spin spinning={loading}>
        <div
          className={styles.game_container}
          style={{
            width: 320,
            height: 320,
            marginBottom: pkModel ? convertPxToRem(50) : '',
          }}
          ref={parentRef}
        >
          {isGameInProgress && !pkModel && (
            <div className={styled.foodLoading}>
              {newHand ? (
                <>
                  鸭小白思考中<div className={styled.dot}>...</div>
                </>
              ) : (
                <>
                  AI鸭思考中<div className={styled.dot}>...</div>
                </>
              )}
            </div>
          )}

          {(eatingFood || gameOver) && (
            <div>
              <div className={styles.startDotRed}>
                <img src="/duck/start_red.png" />
              </div>

              <div className={styles.startDotBlue}>
                <img
                  src="/duck/start_blue.png"
                  style={{
                    left: 302,
                    top: 286,
                  }}
                />
              </div>
            </div>
          )}
          {/* todo 食物和后端返回的点都是px 没有自适应  要自适应的话 就一起自适应 */}
          {foods?.map((food, index) => (
            <div
              key={index}
              className={`${styles.food}`}
              onClick={() => handleFoodClick(index, food[0], food[1])}
              onDoubleClick={() =>
                handleFoodDoubleClick(index, food[0], food[1])
              }
              style={{
                left: food[0] - 10,
                top: food[1] - 10,
                pointerEvents: gameOver || Pking ? 'none' : 'auto',
              }}
            >
              {!gameOver && (
                <>
                  {eatingFood ? (
                    <>
                      {food?.eat1 || food?.eat2 ? (
                        <div>
                          {food?.eat1 ? (
                            <div className={styles.eat1Circle}>
                              {food?.eatNums1}
                            </div>
                          ) : (
                            <div className={styles.eat2Circle}>
                              {food?.eatNums2}
                            </div>
                          )}
                        </div>
                      ) : (
                        <img src={'/duck/bread.png'} className={styles.bread} />
                      )}
                    </>
                  ) : (
                    <img className={styles.bread} src={'/duck/bread.png'} />
                  )}
                </>
              )}

              {gameOver && (
                <div>
                  {food?.eat1 ? (
                    <div className={styles.eat1Circle}>{food?.eatNums1}</div>
                  ) : (
                    <div className={styles.eat2Circle}>{food?.eatNums2}</div>
                  )}
                </div>
              )}

              {!gameOver && !eatingFood && (
                <>
                  {food.clicked ? (
                    <div className={styles.clicked}>{food?.times}</div>
                  ) : null}
                </>
              )}
            </div>
          ))}
          {/* 我的鸭 */}
          <div
            className={`${styles.duck1} ${eatingFood || gameOver ? styles.eating : styles.moving
              }`}
            style={{
              left:
                eatingFood || gameOver
                  ? `${duckPosition1.x - 20}px`
                  : convertPxToRem(`${duckPosition1.x}`),
              top:
                eatingFood || gameOver
                  ? `${duckPosition1.y - 45}px`
                  : convertPxToRem(`${duckPosition1.y}`),
            }}
          >
            <div
              className={
                pkModel ? 'animate__animated animate__bounceInDown' : ''
              }
            >
              <img id="duck1Img" src={'/duck/my.png'} />
            </div>
          </div>

          {!gameOver ? (
            <svg
              style={{
                width: '100%',
                height: '100%',
              }}
              className={styles['duck-trail']}
            >
              <path
                d={generateSmoothPath(duckPath)}
                fill="none"
                stroke="#E67187"
                strokeWidth="2"
                strokeLinejoin="round" // 设置转折处为圆滑
                strokeLinecap="round" // 设置线段末端为圆形，使线段更柔和
              />
            </svg>
          ) : (
            <svg
              // viewBox={viewBox}
              style={{
                width: '100%',
                height: '100%',
              }}
              className={styles['duck-trail']}
            >
              <path
                d={generateSmoothPath(duckPath, 10)}
                fill="none"
                stroke="#E67187"
                strokeWidth="2"
                strokeLinejoin="round" // 设置转折处为圆滑
                strokeLinecap="round" // 设置线段末端为圆形，使线段更柔和
              />
            </svg>
          )}

          {/* 机器鸭 */}
          {pkModel ? (
            <>
              <div
                className={`${styles.duckPK} ${eatingFood ? styles.eating : styles.duckPos
                  }`}
                style={{
                  left:
                    eatingFood || gameOver ? `${duckPosition2.x - 30}px` : 290,
                  top:
                    eatingFood || gameOver ? `${duckPosition2.y - 50}px` : 278,
                }}
              >
                <div className="animate__animated animate__fadeInBottomRight">
                  <div
                    className={
                      styles[
                      !isNumberString(pkInfo?.opp?.username) &&
                        pkInfo?.opp?.username?.length > 3
                        ? 'name_bg'
                        : 'name_bg_short'
                      ]
                    }
                  >
                    {pkInfo?.opp?.username}
                  </div>
                  <img src={'/duck/pk_duck.png'} />
                </div>
              </div>
            </>
          ) : (
            <div
              className={`${styles.duck2} ${eatingFood ? styles.eating : styles.duckPos
                }`}
              style={{
                left:
                  eatingFood || gameOver ? `${duckPosition2.x - 30}px` : 290,
                top: eatingFood || gameOver ? `${duckPosition2.y - 50}px` : 278,
              }}
            >
              <img src={newHand ? '/duck/newduck.png' : '/duck/ai_duck.png'} />
            </div>
          )}

          {!gameOver ? (
            <svg
              preserveAspectRatio="xMidYMid meet"
              className={styles['duck-trail2']}
            >
              <path
                d={generateSmoothPath(duckPath2)}
                fill="none"
                stroke="#FEFBCE"
                strokeWidth="2"
                strokeDashoffset="0" // 定义虚线的起始偏移量
                strokeLinejoin="round" // 设置转折处为圆滑
                strokeLinecap="round" // 设置线条末端为圆形，使线条更柔和
              />
            </svg>
          ) : (
            <svg
              preserveAspectRatio="xMidYMid meet"
              className={styles['duck-trail2']}
            >
              <path
                d={generateSmoothPath(duckPath2, 10)}
                fill="none"
                stroke="#FEFBCE"
                strokeWidth="2"
                strokeDashoffset="0" // 定义虚线的起始偏移量
                strokeLinejoin="round" // 设置转折处为圆滑
                strokeLinecap="round" // 设置线条末端为圆形，使线条更柔和
              />
            </svg>
          )}
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
                    refX="26"
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
                    d={`M${pathCoordinatesLine[index - 1][0]},${pathCoordinatesLine[index - 1][1]
                      } L${coords[0]},${coords[1]}`}
                    fill="none"
                    stroke="#E67187"
                    strokeWidth="1"
                    markerEnd={`url(#arrowheadLine-${index})`}
                  />
                )}
              </g>
            ))}
          </svg>
        </div>
      </Spin>
    </>
  );

  // 对话
  const newRenderTalkContent = (
    <div className={styles.footerText}>
      {/* 已解锁 */}
      {gameInfo?.unlockAI && (
        <>
          <div className={styles.text} style={{ marginBottom: 6 }}>
            已解锁AI鸭！
          </div>
          <img
            onClick={() => {
              eatingFood ? '' : handleAIModelClick();
            }}
            className={styles.xiaobaiToAIBtn}
            src={
              eatingFood
                ? '/duck/gray_with_ai.png'
                : '/duck/withAIPlay_footer.png'
            }
          />
        </>
      )}
      {/* 老师未解锁  */}
      {gameInfo?.AILockReason === 1 && (
        <>
          {
            // 未打赢10局
            gameInfo?.gamesPlayed < 10 ? (
              <>
                <div className={styles.text} style={{ marginBottom: 6 }}>
                  已打赢鸭小白
                  <span
                    style={{
                      color: '#fc4649',
                    }}
                  >
                    {gameInfo?.gamesPlayed}
                  </span>
                  局！
                </div>
                {/* 10只鸭子 玩一局鸭子是黄鸭子 剩下的是普通鸭子 */}
                <div style={{ display: 'flex', gap: 2 }}>
                  {Array.from({ length: 10 }).map((_, index) => {
                    const isSpecialDuck = index < (gameInfo?.gamesPlayed || 0);
                    return (
                      <img
                        className={
                          styles[isSpecialDuck ? 'jumpDuck' : 'grayDuck']
                        }
                        key={index}
                        src={
                          isSpecialDuck
                            ? '/duck/yellow_duck.png'
                            : '/duck/gray_duck.png'
                        }
                      />
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                {/* 打赢了1o局 */}
                <>
                  <div className={styles.text} style={{ marginBottom: 6 }}>
                    已打赢鸭小白
                    <span
                      style={{
                        color: '#fc4649',
                      }}
                    >
                      10
                    </span>
                    局！
                  </div>
                  <div style={{ marginTop: 0 }} className={styles.pk_text_tip}>
                    待老师解锁后可以和AI鸭比赛
                  </div>
                </>
              </>
            )
          }
        </>
      )}

      {/* 老师解锁 但是局数不足 */}
      {gameInfo?.AILockReason === 2 && (
        <>
          <div className={styles.text}>
            再赢
            <span
              style={{
                color: '#fc4649',
              }}
            >
              {10 - gameInfo?.gamesPlayed || 0}
            </span>
            局可以解锁AI鸭！
          </div>
          {/* 10只鸭子 玩一局鸭子是黄鸭子 剩下的是普通鸭子 */}
          <div style={{ display: 'flex', gap: 2 }}>
            {Array.from({ length: 10 }).map((_, index) => {
              const isSpecialDuck = index < (gameInfo?.gamesPlayed || 0);
              return (
                <img
                  className={styles[isSpecialDuck ? 'jumpDuck' : 'grayDuck']}
                  key={index}
                  src={
                    isSpecialDuck
                      ? '/duck/yellow_duck.png'
                      : '/duck/gray_duck.png'
                  }
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );

  // 对话
  // AI 鸭说话
  const AITalkContent = (
    <>
      <div className={styles.footerText}>
        {/* 只有AI更新成功 查看结果的时候显示AI更新成功 */}
        {!isShowAIUpdateText ? (
          <div
            className={styles.text}
            style={{
              display: 'flex',
            }}
          >
            再赢
            <div
              style={{
                color: '#fc4649',
              }}
              className={styles.gamesPlay}
            >
              {10 - havePlays}
            </div>
            局，AI就会更新！
          </div>
        ) : (
          <div className={styles.text}>AI更新成功！</div>
        )}
        {/* 10只鸭子 玩一局鸭子是黄鸭子 剩下的是普通鸭子 */}
        <div style={{ display: 'flex', gap: 2 }}>
          {Array.from({ length: 10 }).map((_, index) => {
            // 0 < 0 10只灰色
            const isSpecialDuck = index < havePlays;
            // AI更新成功10只黄色
            return (
              <img
                key={index}
                className={
                  styles[
                  isSpecialDuck || isShowAIUpdateText
                    ? 'jumpDuck'
                    : 'grayDuck'
                  ]
                }
                src={
                  isSpecialDuck || isShowAIUpdateText
                    ? '/duck/yellow_duck.png'
                    : '/duck/gray_duck.png'
                }
              />
            );
          })}
        </div>
        <div className={styles.AINumber}>
          AI更新次数：
          <div className={styles.AI_text}>
            {Math.floor(gameInfo?.gamesPlayed / 10)}
          </div>
        </div>
        {/* 物理所暂时隐藏 */}
        {/* 进入AI鸭  当老师未解锁对战的时候  没有第三行dom结构  否则正常显示 */}
        {!source && gameInfo?.PKLockReason !== 1 && (
          <>
            {Math.floor(gameInfo?.gamesPlayed / 10) > 1 ? (
              <div style={{ fontSize: 0 }}>
                <img
                  onClick={() => {
                    handlePkClick();
                    reStart(false);
                    setEnterPk(true);
                  }}
                  className={styles.withPKBtn}
                  src="/duck/withAIClick.png"
                />
              </div>
            ) : (
              <div className={styles.pk_text_tip}>
                再更新1次就能参与AI对战啦～
              </div>
            )}
          </>
        )}
      </div>
    </>
  );

  const boardImg = newHand
    ? '/duck/duck_board.png'
    : pkModel
      ? '/duck/pkBoard.png'
      : '/duck/ai_board.png';

  // 鸭小白模式
  const GameRender = (
    <>
      <div
        className={styles.board}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div className={styles.fixedBg}>
          <div className={styles.gray_bg}>
            <div
              className={styles.newBoardImg}
              style={{ backgroundImage: `url(${boardImg})` }}
            >
              {/* 模式切换按钮 */}
              {/* 解锁了AI之后才有 */}
              {gameInfo?.unlockAI && (
                <img
                  src="/duck/change_model.png"
                  className={styles.changeModelbg}
                  onClick={() => {
                    setChangeModelHandle(true);
                  }}
                  style={{
                    pointerEvents: eatingFood || isPking ? 'none' : 'unset',
                  }}
                />
              )}

              <img
                style={{
                  pointerEvents: eatingFood || isPking ? 'none' : 'unset',
                }}
                onClick={backHome}
                src="/duck/home.png"
              />
            </div>
            <div className={styles.score_img}>
              <div className={styles.scorebg}>
                <div
                  className={styles.score_text}
                  style={{
                    marginLeft: convertPxToRem(10),
                  }}
                >
                  {gameInfo?.points || 0}
                </div>
              </div>

              <div className={styles.ratebg}>
                <div
                  className={styles.score_text}
                  style={{ marginLeft: convertPxToRem(30) }}
                >
                  {gameInfo?.winRate || 0}
                </div>
              </div>

              {/* 排行 */}
              <div
                style={{
                  pointerEvents: moving || isPking ? 'none' : 'unset',
                }}
                className={styles.rankScore}
                onClick={() => {
                  setShowRank(true);
                  handleRankList();
                }}
              >
                <div
                  className={styles.score_text}
                  style={{
                    marginLeft: convertPxToRem(10),
                  }}
                >
                  {gameInfo?.ranking || 0}
                </div>
              </div>
            </div>
          </div>
          {/* AI对战中 */}
          {Pking && !gameOver && (
            <div className="animate__animated animate__bounceInLeft">
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <div className={styles.pking_head}>
                  <div className={styles.dot}>...</div>
                </div>
              </div>
            </div>
          )}
          {/* 规则点击位置 */}
          <>
            {pkModel ? (
              <div
                className={styles.pkImg}
                onClick={() => {
                  getDuckPKLogFunc();
                  setPkRecord(true);
                }}
                style={{
                  visibility: 'hidden',
                }}
              >
                {/* 对战记录 */}
              </div>
            ) : (
              <div
                className={styles.rule}
                style={{
                  pointerEvents: eatingFood ? 'none' : 'unset',
                  visibility: AIModel ? 'hidden' : 'unset',
                }}
                onClick={() => {
                  setRuleModal(true);
                }}
                ref={ruleRef}
              />
            )}
          </>
        </div>
        {/* 内容区域 */}
        {pkModel ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {isEnterPk ? (
              <div>
                {Pking && <div>{EatFoodsRender}</div>}

                <GlobalModal isOpen={!Pking}>
                  {!matchSuccess ? (
                    // 匹配中
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 15,
                      }}
                    >
                      <div className={styles.matching_bg}>
                        <div className={styles.match_circle}>
                          <div className={styles.reverse_spinner}></div>
                        </div>

                        <div
                          className={styles.matching_textImg}
                          style={{
                            display: 'flex',
                            position: 'absolute',
                            top: 5,
                          }}
                        >
                          <div className={styles.loadingDot}>...</div>
                        </div>
                        <div
                          className={styles.myNameWave}
                          style={{
                            width:
                              !isNumberString(gameInfo?.username) &&
                                gameInfo?.username?.length > 3
                                ? '87%'
                                : '80%',
                          }}
                        >
                          <div className={styles.nameContent}>
                            <div className={styles.myAI}>我的AI</div>
                            <div className={styles.myName}>
                              {gameInfo?.username}
                            </div>
                          </div>
                        </div>
                        <div className={styles.waveContent}>
                          <div className={styles.wave}>
                            <div></div>
                            <div></div>
                            <div></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // 匹配成功
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 15,
                      }}
                    >
                      <div className="animate__animated animate__bounceInDown">
                        <div className={styles.matching_bg_suc}>
                          <div
                            style={{
                              position: 'absolute',
                            }}
                            className="animate__animated animate__bounceInUp"
                          >
                            <img src="/duck/vs_suc.png" />
                          </div>

                          <div
                            style={{
                              position: 'absolute',
                              top: 5,
                            }}
                          >
                            <div className={styles.matching_textImgSuc}></div>
                            <div className={styles.countdown_text}>
                              <span
                                style={{
                                  color: '#FDE86D',
                                }}
                              >
                                {countdown}
                              </span>
                              秒后进入游戏
                            </div>
                          </div>
                          <div
                            className={styles.myNameWave}
                            style={{
                              width:
                                !isNumberString(gameInfo?.username) &&
                                  gameInfo?.username?.length > 3
                                  ? '87%'
                                  : '80%',
                            }}
                          >
                            <div className={styles.nameContent}>
                              <div className={styles.myAI}>我的AI</div>
                              <div className={styles.myName}>
                                {gameInfo?.username}
                              </div>
                            </div>
                            <div
                              className={styles.nameContent}
                              style={{
                                alignItems: 'flex-end',
                              }}
                            >
                              <div
                                className={styles.myAI}
                                style={{
                                  background: '#6392CE',
                                }}
                              >
                                对手AI
                              </div>
                              <div className={styles.myName}>
                                {duckPKOpp?.matchUser?.username}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </GlobalModal>
              </div>
            ) : (
              <div className="animate__animated animate__zoomInDown">
                <div
                  className={styles.pk_bg}
                  onClick={() => {
                    setEnterPk(true);
                  }}
                >
                  <img
                    src="/duck/sword.png"
                    className="animate__animated animate__backInDown"
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {/* 规则 */}
            {EatFoodsRender}
          </div>
        )}

        {/* 底部 */}
      </div>
      {!pkModel ? (
        <div className={styles.footer}>
          {gameInfo && (
            <>
              {newHand ? (
                <>
                  <div className={styles.dialog_xiaobai}>
                    {isOpenTip && (
                      <img className={styles.unEat} src="/duck/unChoose.png" />
                    )}
                    <img
                      className={styles.aitip_xiaobai}
                      src="/duck/xiaobaiduck.png"
                    />
                    <div>{newRenderTalkContent}</div>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.dialogAI}>
                    <img
                      className={styles.aitip_duck}
                      src="/duck/aitip_duck.png"
                    />
                    {isOpenTip && (
                      <img
                        className={styles.unEat}
                        style={{ right: source ? -10 : 10 }}
                        src="/duck/unChoose.png"
                      />
                    )}

                    <div>{AITalkContent}</div>
                  </div>
                </>
              )}
            </>
          )}

          {/* 游戏结束 */}
          {gameOver ? (
            <div className={styles.restart}>
              {/* 再玩一局 */}
              <img onClick={reStart} src="/duck/reStart.png" />
            </div>
          ) : (
            <>
              {eatingFood ? (
                <div
                  className={styles.playing}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <img src="/duck/playing.png" />
                  <div
                    style={{
                      paddingBottom: 15,
                    }}
                    className={styles.dot}
                  >
                    ...
                  </div>
                </div>
              ) : (
                // 开始游戏
                <div
                  style={{
                    pointerEvents: infoLoadingStatus ? 'none' : 'unset',
                  }}
                  className={styles[isStartClick ? 'start_click' : 'start']}
                >
                  <img onClick={startGame} src="/duck/start.png" />
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <>
          {Pking && (
            <div className={styles.PKFooterOut}>
              {/* 继续AI对战 */}
              <div className="animate__animated animate__fadeInUp">
                <div>
                  {pkModel && gameOver && (
                    <div className={styles.pkBtn}>
                      {gameInfo?.unlockTraining &&
                        <div
                          className={styles.ai_train_Btn}
                          onClick={() => {
                            handleTrainClick();
                          }}
                        >
                          {/* AI训练 */}
                          <img src="/duck/ai_train.png" />
                        </div>
                      }
                      <div
                        className={styles.reWithPK}
                        onClick={() => {
                          rePKHandle();
                        }}
                      >
                        <img src="/duck/reWithPK.png" />
                      </div>
                    </div>
                  )}
                  <div className={styles.PKFooter}>
                    <div>
                      <div className={styles.my}>我的AI</div>
                      <div className={styles.text} style={{ marginBottom: 2 }}>
                        对战积分：{pkInfo?.self?.PKPoints}
                      </div>
                      <div className={styles.text}>
                        胜率：{pkInfo?.self?.PKWinrate}
                      </div>
                    </div>
                    <div>
                      <img className={styles.vsImg} src="/duck/vs.png" />
                    </div>
                    <div>
                      <div className={styles.opp}>对手AI</div>
                      <div className={styles.text} style={{ marginBottom: 2 }}>
                        对战积分：{pkInfo?.opp?.PKPoints}
                      </div>
                      <div className={styles.text}>
                        胜率：{pkInfo?.opp?.PKWinrate}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );

  const aiModelImageSrc = !gameInfo?.unlockAI // 未解锁
    ? '/duck/ai_lock.png'
    : '/duck/ai_unLock.png';

  const pkImageSrc = !gameInfo?.unlockPK // 未解锁
    ? '/duck/pk_lock.png'
    : '/duck/pk_unLock.png';

  const trainImageSrc = !gameInfo?.unlockTraining // 未解锁
    ? '/duck/train_Change_unlock.png'
    : '/duck/train_unlock.png';

  const waterImg =
    !newHand && !AIModel ? '/duck/home_water.png' : '/duck/game_water.png';
  const enterGame = newHand || AIModel || pkModel || trainModel;

  return (
    <Layout
      hasTabBar={false}
      havsNavBar={!enterGame}
      haveBack={null}
      title="AI 鸭"
    >
      {ModalRender}
      <TipModal />
      <Modals
        isOpen={modalsOpen}
        closeModal={() => {
          setModalsOpen(false);
        }}
        modalType={modalsType}
        content={modalContent}
      />
      <>
        <div
          id="AIDUCK"
          className={styles.main}
          style={{
            height: enterGame ? '100vh' : `calc(${containerHeight}px - 1.2rem)`,
          }}
        >
          {loginState === '' || infoLoading ? (
            <Loading />
          ) : (
            <>
              {!infoLoading && loginState !== '' && (
                <>
                  {
                    loginState ? (
                      <div style={{ position: 'relative', height: '100%' }} >
                        {/* 对战记录面板 */}
                        {pkRecord && (
                          <>
                            <div className={styles.record_bg}>
                              <img
                                src="/duck/record_back.png"
                                onClick={() => {
                                  setPkRecord(false);
                                }}
                                className={styles.backImg}
                              />
                              <div className={styles.record_text}>
                                <img src="/duck/record_text.png" />
                              </div>
                              <div className={styles.record_head}>
                                <div className={styles.head}>时间</div>
                                <div
                                  className={styles.head}
                                  style={{ width: '30%', paddingLeft: 19 }}
                                >
                                  结果
                                </div>
                                <div className={styles.head}>对手</div>
                                <div className={styles.head}>积分</div>
                                <div
                                  className={styles.head}
                                  style={{
                                    paddingRight: 5,
                                  }}
                                >
                                  操作
                                </div>
                              </div>
                              <div
                                style={{
                                  maxHeight: '100%',
                                  overflowY: 'auto',
                                  paddingBottom: convertPxToRem(40),
                                }}
                              >
                                {recordList?.map((item, index) => {
                                  return (
                                    <div key={index} className={styles.content}>
                                      <div className={styles.text}>
                                        {item.playTime}
                                      </div>
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
                                      <div className={styles.text}>
                                        {item.opp}
                                      </div>
                                      <div className={styles.text}>
                                        {item.points}
                                      </div>
                                      <div
                                        className={styles.see}
                                        onClick={() => {
                                          handleSeeResult(item.id);
                                        }}
                                      >
                                        查看结果
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        )}

                        <GlobalModal isOpen={seeResult}>
                          <RenderReuslt />
                        </GlobalModal>
                        {trainModel ? (
                          <>
                            <AITrain
                              setTrainModelFun={() => {
                                replaceUrl('model', '');
                                setTrainModel(false);
                              }}
                              unlock={gameInfo?.unlockTraining}
                              handleConPK={handleConPK}
                            />
                          </>
                        ) : (
                          <>
                            <div
                              className={styles.water_bg}
                              style={{
                                backgroundImage: `url(${waterImg})`,
                              }}
                            >
                              {/* 游戏模式选择 */}
                              {!enterGame ? (
                                <>
                                  {!createModal && (
                                    <>
                                      <img
                                        className={styles.runDuck}
                                        src="/duck/run_duck.png"
                                      />
                                      {/* 头部 */}
                                      <div className={styles.info_div}>
                                        <div
                                          style={{ display: 'flex' }}
                                          onClick={() => {
                                            // setUserInfoModal(true);
                                            showConfetti(true, 36);
                                          }}
                                        >
                                          <img
                                            className={styles.img1}
                                            src="/duck/photo.png"
                                          ></img>
                                          <div className={styles.name}>
                                            {gameInfo?.username}
                                          </div>
                                        </div>
                                        {/* <div>
                            <img
                              className={styles.img2}
                              onClick={() => {
                                setShowRank(true);
                              }}
                              src="/duck/rank_btn.png"
                            />
                          </div> */}
                                      </div>
                                      {/* 游戏模式选择 */}
                                      {!infoLoading && (
                                        <div
                                          style={{
                                            display: 'flex',
                                            width: '100%',
                                            height: '100%',
                                            justifyContent: 'center',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                          }}
                                        >
                                          <div
                                            style={{
                                              display: 'flex',
                                              gap: 16,
                                              flexDirection: 'column',
                                            }}
                                          >
                                            {/* 新手模式 */}
                                            <img
                                              onClick={handleNewHandModleClick}
                                              className={styles.newImg}
                                              src={
                                                !gameInfo?.unlockBeginner
                                                  ? '/duck/lock_xiaobai.png'
                                                  : '/duck/xiaobai.png'
                                              }
                                            />
                                            <img
                                              onClick={handleAIModelClick}
                                              className={styles.newImg}
                                              src={aiModelImageSrc}
                                            />
                                            {!source && (
                                              <img
                                                onClick={handlePkClick}
                                                className={styles.newImg}
                                                src={pkImageSrc}
                                              />
                                            )}
                                            {!source && (
                                              <img
                                                onClick={handleTrainClick}
                                                className={styles.newImg}
                                                src={trainImageSrc}
                                              />
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </>
                              ) : (
                                <>{GameRender}</>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className={styles.unLogin}>
                        <div
                          className={styles.unLoginBtn}
                          onClick={() => {
                            signIn();
                          }}
                        />
                      </div>
                    )}
                </>
              )}
            </>
          )}
        </div>
      </>
    </Layout >
  );
};

export default AIGame;
