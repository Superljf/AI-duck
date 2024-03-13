import React, { useEffect, useRef, useState } from 'react';
import styles from './index.less'; // 导入样式文件
import { Layout } from '@/components/Layouts';
import {
	getDuckGameInfo,
	getDuckGameRanking,
	getDuckInitialValue,
	setDuckGameUserInfo,
	setFoodsStrategy,
} from '@/services/common';
import bread from '@/assets/icons/bread.png';
import duck2 from '@/assets/icons/duck2.png';
import duck_no from '@/assets/icons/duck_no.png';
import duck1 from '@/assets/icons/duck1.png';
import myPng from '@/assets/icons/my.png';
import oppPng from '@/assets/icons/opp.png';
import GlobalModal from '@/components/GlobalModal';
import { Input, Spin, message } from 'antd';
import { useAuth } from '@/hooks';

let num = 0;
let duckNum = 1;
let duckNum2 = 1;

/* 
	后端随机返回7个坐标点  前端进行循环出坐标点食物 
	我方点出顺序坐标 发送给后端 
	点击开始游戏  走后端给出的坐标点 
	需要两个按钮  重新开始按钮  开始游戏按钮  
	结果输赢显示  eg：我方赢  
*/

function DuckGame() {
	const { isLoginState, actions } = useAuth();
	const duck1X = -25;
	const duck1Y = -60;

	const duck2X = 360;
	const duck2Y = 264;

	const [foods, setFoods] = useState([]);
	const [duckPosition1, setDuckPosition1] = useState({ x: duck1X, y: duck1Y });
	const [duckPosition2, setDuckPosition2] = useState({ x: duck2X, y: duck2Y });

	const [eatingFood, setEatingFood] = useState(false);
	const [duckPath, setDuckPath] = useState([]);
	const [duckPath2, setDuckPath2] = useState([]);

	// 策略Index  传给后台
	const [strategyList, setStrategyList] = useState([]);

	const [duckInit, setDuckInit] = useState({});

	const [result, setResult] = useState({});
	const [foodsInit, setFoodsInit] = useState([]);

	const [startX, setStartX] = useState(0); // 起点坐标 x
	const [startY, setStartY] = useState(0); // 起点坐标 y
	const [endX, setEndX] = useState(null); // 终点坐标 x
	const [endY, setEndY] = useState(null); // 终点坐标 y

	const [isHiddenLine, setIsHiddenLine] = useState(false);
	const [isOpenTip, setTipOpen] = useState(false);

	const [gameOver, setGameOver] = useState(false);
	const [duck1Over, setDuck1Over] = useState(false);
	const [duck2Over, setDuck2Over] = useState(false);
	const [resultShow, setResultShow] = useState(false);

	const [newHand, setNewHand] = useState(false);
	const [AIModel, setAIModel] = useState(false);
	const [lockTip, setlockTip] = useState(false);

	//  连线逻辑
	const [pathCoordinatesLine, setLinePath] = useState([]);
	const [rankList, setRankList] = useState();
	const [showRank, setShowRank] = useState(false);

	const [loading, setLoading] = useState(false);
	const [gameInfo, setGameInfo] = useState(null);
	const [infoLoading, setInfoLoading] = useState(false);
	const [userName, setName] = useState('');
	const [nameTip, setNameTip] = useState(null);
	// 鸭子正在移动
	const [moving, setMove] = useState(false);

	useEffect(() => {
		// 获取游戏用户信息
		getDuckGameInfoHandle(true);
	}, []);

	// 进入游戏的时候
	const getDuckGameInfoHandle = async (needLoading = false, isNewHand = true) => {
		try {
			setInfoLoading(needLoading);
			const res = await getDuckGameInfo({
				mode: isNewHand ? '' : 'AI',
			});
			setGameInfo(res);
		} catch (error) {
		} finally {
			setInfoLoading(false);
		}
	};

	// 返回首页事件
	const backHome = () => {
		setNewHand(false);
		setAIModel(false);
		if (!gameInfo?.unlockAI) {
			getDuckGameInfoHandle(false, newHand);
		}
	};

	// 游戏结束
	useEffect(() => {
		if (duck2Over && duck1Over) {
			setGameOver(true);
			getDuckGameInfoHandle(false, newHand);
			setMove(false);
			setTimeout(() => {
				setResultShow(true);
			}, 100);
		}
	}, [duck1Over, duck2Over]);

	// 获取父元素的位置信息

	const parentRef = useRef(null); // 使用 useRef 创建父元素的引用

	useEffect(() => {
		// 监听鼠标移动事件，并计算相对于父元素的偏移量
		const parentElement = parentRef.current; // 获取父元素引用
		const handleMouseMove = (e) => {
			const parentRect = parentElement.getBoundingClientRect();
			const offsetX = e.clientX - parentRect.left;
			const offsetY = e.clientY - parentRect.top;
			setEndX(offsetX);
			setEndY(offsetY);
		};
		// 鼠标进入父元素时开始监听鼠标移动事件
		const handleMouseEnter = () => {
			window.addEventListener('mousemove', handleMouseMove);
			setIsHiddenLine(false);
		};

		// 鼠标离开父元素时停止监听鼠标移动事件
		const handleMouseLeave = () => {
			setIsHiddenLine(true);
			window.removeEventListener('mousemove', handleMouseMove);
		};

		if (parentElement) {
			parentElement.addEventListener('mouseenter', handleMouseEnter);
			parentElement.addEventListener('mouseleave', handleMouseLeave);
		}

		// 销毁
		return () => {
			if (parentElement) {
				parentElement.removeEventListener('mouseenter', handleMouseEnter);
				parentElement.removeEventListener('mouseleave', handleMouseLeave);
			}
			window.removeEventListener('mousemove', handleMouseMove);
		};
	}, [parentRef, parentRef.current, showRank]);

	// 点击下一个食物时，更新起点坐标为该食物的坐标
	const handleClickNextFood = (foodX, foodY) => {
		setStartX(foodX);
		setStartY(foodY);
	};

	useEffect(() => {
		getDuckInit();
		return () => {
			num = null;
			duckNum = null;
			duckNum2 = null;
		};
	}, []);

	const getDuckInit = async () => {
		try {
			setLoading(true);
			const data = await getDuckInitialValue();
			setDuckInit(data);
			setDuckPosition1({
				x: data?.duckStart?.self?.[0] + duck1X,
				y: data?.duckStart?.self?.[1] + duck1Y,
			});
			setDuckPosition2({ x: duck2X, y: duck2Y });
			const newFoods = JSON.parse(JSON.stringify(data?.foods));
			setFoods(newFoods);
			const newFoodInit = JSON.parse(JSON.stringify(data?.foods));
			setFoodsInit(newFoodInit);
			setStartX(0);
			setStartY(0);
			setLinePath([[data?.duckStart?.self?.[0], data?.duckStart?.self?.[1]]]);
		} catch (error) {
		} finally {
			setLoading(false);
		}
	};

	const [isGameInProgress, setIsGameInProgress] = useState(false);

	// 开始游戏逻辑
	const startGame = async () => {
		// 如果游戏正在进行中，则直接返回，不执行任何操作
		if (isGameInProgress) {
			return;
		}
		if (strategyList?.length === foods?.length) {
			try {
				// 设置游戏进行中状态为 true
				setIsGameInProgress(true);
				const res = await setFoodsStrategy({
					id: duckInit?.id,
					strategy: strategyList,
					mode: AIModel ? 'AI' : '',
				});
				setResult(res);
				setEatingFood(true);
				setMove(true);
				setIsHiddenLine(true); // 隐藏鼠标线
				setLinePath([]); // 清空鼠标连接线
				setGameOver(false);
				setDuck2Over(false);
				setDuck1Over(false);
				// 使用 Promise.all() 来等待两个函数同时开始
				await Promise.all([moveDuck(res), moveDuckOpp(res)]);
			} catch (error) {
				message.error('网络错误，请重试');
				reStart();
			} finally {
				// 无论是否成功执行，都要重置游戏进行中状态
				setIsGameInProgress(false);
			}
		} else {
			setTipOpen(true);
		}
	};

	// 重新开始游戏
	const reStart = () => {
		setDuckPosition1({ x: duck1X, y: duck1Y });
		setDuckPosition2({ x: duck2X, y: duck2Y });
		setFoods([]);
		getDuckInit();
		setDuckPath([]);
		setDuckPath2([]);
		setStrategyList([]);
		setEatingFood(false);
		num = 0;
		duckNum = 1;
		duckNum2 = 1;
		setGameOver(false);
		setDuck2Over(false);
		setDuck1Over(false);
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

			// 如果取消选择后，仍有选中的食物，则将起点坐标设置为剩余已选食物中顺序最大的食物的坐标
			if (list.length > 0) {
				const maxTimesFood = updatedPathCoordinates[updatedPathCoordinates?.length - 1];

				handleClickNextFood(maxTimesFood[0], maxTimesFood[1] - 2);
			} else {
				// 如果没有剩余已选食物，则将起点坐标设置为默认值
				handleClickNextFood(pathCoordinatesLine[0]?.[0], pathCoordinatesLine[0]?.[1]);
			}
		}
		setLinePath(updatedPathCoordinates);
		setStrategyList([...list]);
		setFoods(updatedFoods);
	};

	// 修改 handleFoodClick 函数为单击事件处理程序，用于添加选择食物的逻辑
	const handleFoodClick = (index, x, y) => {
		const updatedPathCoordinates = [...pathCoordinatesLine];
		const list = [...strategyList];
		const updatedFoods = [...foods];

		if (updatedFoods[index].clicked) {
			// 如果食物已经被选择，不执行任何操作
			return;
		}

		handleClickNextFood(x, y - 2);
		updatedFoods[index].clicked = true;
		updatedFoods[index].times = num + 1;
		num++;
		list.push(index);
		updatedPathCoordinates.push([x, y]);

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
			if (!Array.isArray(point) || point.length !== 2 || isNaN(point[0]) || isNaN(point[1])) {
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
				pathString += ` L ${point?.[0]} ${point?.[1]}`;
			}
		}

		return pathString;
	}

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

	const moveDuck = (res) => {
		return new Promise((resolve) => {
			const newTrail = [...res?.self?.trajectory];
			setDuckPosition1({ x: 0, y: 0 });
			duckNum = 1;

			let index = 0;
			const path = [];
			const move = () => {
				if (index < newTrail.length) {
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

					index++;
					requestAnimationFrame(move);
				} else {
					setTimeout(() => {
						setDuck1Over(true);
						resolve(); // 解决 Promise
					}, 10);
				}
			};

			requestAnimationFrame(move);
		});
	};

	// 使用 requestAnimationFrame：考虑使用 requestAnimationFrame 来代替 setInterval，它能够更好地利用浏览器的刷新频率，提供更流畅的动画效果。
	const moveDuckOpp = (res) => {
		return new Promise((resolve) => {
			const newTrail = [...res?.opp?.trajectory];
			let index2 = 0;

			duckNum2 = 1;
			const path2 = [];
			const move = () => {
				if (index2 < newTrail.length) {
					const newPosition = newTrail[index2];
					setDuckPosition2({
						x: newPosition?.[0],
						y: newPosition?.[1],
					});

					path2.push(newPosition);
					setDuckPath2([...path2]);

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
					index2++;
					requestAnimationFrame(move);
				} else {
					setTimeout(() => {
						setDuck2Over(true);
						resolve(); // 解决 Promise
					}, 20);
				}
			};

			requestAnimationFrame(move);
		});
	};

	const viewBox = '0 0 384 350';

	const handleAIModelClick = () => {
		if (!gameInfo?.unlockAI) {
			setlockTip(true);
			return;
		}
		reStart();
		setAIModel(true);
		getDuckGameInfoHandle(false, false);
	};

	const handleRankList = async () => {
		try {
			const res = await getDuckGameRanking({
				mode: AIModel ? 'AI' : '',
			});
			setRankList(res);
		} catch (error) {}
	};

	useEffect(() => {
		// 在初次进入游戏调用排行榜
		if (AIModel || newHand) {
			handleRankList();
		}
	}, [AIModel, newHand]);

	// 排行榜
	const RankList = () => {
		const rankImg = ['', '/duck/no_1.png', '/duck/no_2.png', '/duck/no_3.png'];
		const myData = rankList?.filter((item) => item.isSelf === true)?.[0];
		return (
			<div
				className={styles.rank_bg}
				style={{
					backgroundImage: newHand
						? 'url("/duck/newHand_rank_bg.png")'
						: 'url("/duck/ai_bg.png")',
				}}
			>
				<div
					onClick={() => {
						// reStart();
						setShowRank(false);
					}}
					className={styles.backImg}
				>
					<img src="/duck/back.png" />
				</div>
				<div
					style={{
						marginRight: 6,
						display: 'flex',
						flexDirection: 'column',
						height: '100%',
						paddingBottom: 46,
					}}
				>
					<div className={styles.list_bg}>
						<div className={styles.rankWidth}>排名</div>
						<div className={styles.rankWidth}>玩家</div>
						<div className={styles.rankWidth}>胜率</div>
						<div className={styles.rankWidth}>积分</div>
					</div>
					<div className={styles.rankList_bg}>
						{rankList?.slice(0, 10)?.map((item, index) => {
							return (
								<div key={index}>
									<div className={styles.list} style={{ margin: 0 }} key={index}>
										<div className={styles.rank}>
											{item?.ranking > 3 ? (
												<span>{item?.ranking}</span>
											) : (
												<img src={rankImg[item.ranking]} />
											)}
										</div>
										<div className={styles.text}>{item.username}</div>
										<div className={styles.text}>{item.winRate}</div>
										<div className={styles.text}> {item.points}</div>
									</div>
								</div>
							);
						})}
					</div>
					{/* 我的排名 */}
					{rankList?.length > 0 && (
						<div>
							<div
								className={`${styles.myBg} ${styles.list} `}
								style={{ marginRight: 15 }}
							>
								<img
									style={{
										width: 38,
										height: 38,
										position: 'absolute',
										left: 0,
										top: 0,
									}}
									src="/duck/my.png"
								/>
								<div className={styles.rank}>
									<span style={{ fontSize: 22 }}>{myData?.ranking}</span>
								</div>
								<div className={styles.text}>{myData?.username}</div>
								<div className={styles.text}>{myData?.winRate}</div>
								<div className={styles.text}> {myData?.points}</div>
							</div>
							<div className={styles.excess} style={{ marginRight: 15 }}>
								您的积分超过了{myData?.excess}的玩家！
							</div>
						</div>
					)}
				</div>
			</div>
		);
	};

	// 创建用户
	const createName = async () => {
		if (!userName) {
			setNameTip('请输入账号名！');
			return;
		} else {
			const res = await setDuckGameUserInfo({
				username: userName,
			});
			if (!res?.status) {
				setNameTip('该玩家昵称已被使用！');
				return;
			}
			message.success({
				content: '账号创建成功！',
				style: {
					marginTop: '25vh',
					marginRight: '40vh',
				},
				duration: 1,
			});
			getDuckGameInfoHandle(false, true);
		}
	};

	const aiModelImageSrc = !gameInfo?.unlockAI ? '/duck/lockAI.png' : '/duck/unlockAi.png';

	const preloadImages = [
		'/duck/click.png',
		'/duck/tipBg.png',
		'/duck/tipBtn.png',
		'/duck/win.png',
		'/duck/lose.png',
		'/duck/konwBtn.png',
		'/duck/rePlayBtn.png',
		'/duck/newHand_rank_bg.png',
		'/duck/ai_bg.png',
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
	return (
		<Layout isGray={true}>
			<GlobalModal isOpen={lockTip}>
				<div className={styles.tipImg} style={{ padding: '0px 30px' }}>
					<div
						className={styles.btnText}
						style={{
							fontSize: 18,
							marginTop: 50,
							textAlign: 'center',
							fontWeight: 'normal',
							lineHeight: '28px',
						}}
					>
						<div>
							您在“新手模式”已赢得
							<span style={{ color: '#fc4649' }}>{gameInfo?.gamesPlayed || 0}</span>
							局比赛，
						</div>
						<div>
							再赢
							<span style={{ color: '#fc4649', fontSize: 20, fontWeight: 'bold' }}>
								{10 - gameInfo?.gamesPlayed || 0}
							</span>
							局比赛，即可解锁“AI模式”
						</div>
					</div>
					<div
						className={styles.tipBtn}
						style={{ marginTop: 30 }}
						onClick={() => {
							setlockTip(false);
						}}
					>
						我知道了
					</div>
				</div>
			</GlobalModal>
			<GlobalModal isOpen={isOpenTip}>
				<div className={styles.tipImg}>
					<div
						className={styles.btnText}
						style={{
							fontSize: 18,
							marginTop: 40,
							textAlign: 'center',
							fontWeight: 'normal',
							lineHeight: '28px',
							letterSpacing: '2px',
						}}
					>
						开始比赛前，请先制定我方鸭子夺食的顺序
					</div>
					<div
						className={styles.tipBtn}
						onClick={() => {
							setTipOpen(false);
						}}
					>
						选择夺食顺序
					</div>
				</div>
			</GlobalModal>

			<GlobalModal isOpen={resultShow}>
				{result?.self?.foodCounts > result?.opp?.foodCounts ? (
					<div>
						<>
							{/* 第一次解锁 */}
							{result?.gameStatus?.isFirstTime ? (
								<div className={styles.successImg}>
									<div
										className={styles.resultText}
										style={{ letterSpacing: 0, marginTop: 190 }}
									>
										恭喜您，已获得10局比赛胜利
									</div>
									<div
										className={styles.resultText}
										style={{ letterSpacing: 0, marginTop: 0, marginBottom: 30 }}
									>
										成功解锁“AI模式”
									</div>
									<div style={{ display: 'flex', gap: 6 }}>
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
								<div className={styles.winImg}>
									<div className={styles.resultText}>恭喜您，获得比赛胜利！</div>
									<div className={styles.resultText2}>
										本局游戏获取食物
										<span style={{ color: '#fb282c' }}>
											{result?.self?.foodCounts}
										</span>
										个
									</div>
									<div style={{ display: 'flex', gap: 6 }}>
										<div
											className={styles.knowBtn}
											onClick={() => {
												setResultShow(false);
											}}
										/>
										<div
											className={styles.resultReplayBtn}
											onClick={() => {
												setResultShow(false);
												reStart();
											}}
										/>
									</div>
								</div>
							)}
						</>
					</div>
				) : (
					<div className={styles.loseImg}>
						<div className={styles.resultText}>很遗憾，比赛失败了！</div>
						<div className={styles.resultText2}>
							本局游戏获取食物
							<span style={{ color: '#fb282c' }}>{result?.self?.foodCounts}</span>个
						</div>
						<div style={{ display: 'flex', gap: 6 }}>
							<div
								className={styles.knowBtn}
								onClick={() => {
									setResultShow(false);
								}}
							/>
							<div
								className={styles.resultReplayBtn}
								onClick={() => {
									setResultShow(false);
									reStart();
								}}
							/>
						</div>
					</div>
				)}
			</GlobalModal>
			<div className={styles.bg}>
				<div className={styles.game_div}>
					{/* 游戏左侧界面
					 */}
					{!isLoginState ? (
						<div className={styles.unLogin}>
							<div className={styles.unLogin_bg}>
								<img
									onClick={() => {
										actions.signIn();
									}}
									src="/duck/unLoginBtn.png"
								/>
							</div>
						</div>
					) : (
						<>
							{showRank ? (
								<RankList />
							) : (
								<Spin spinning={infoLoading}>
									<div className={styles.water_div}>
										{!infoLoading && (
											<>
												{/* 无用户名 */}
												{!gameInfo?.username ? (
													<div
														style={{
															width: '467px',
															height: '100%',
															paddingTop: 80,
														}}
													>
														<div className={styles.create_bg}>
															<div style={{ marginTop: 100 }}>
																<Input
																	onChange={(e) => {
																		setName(e.target.value);
																		setNameTip(null);
																	}}
																	placeholder="请输入玩家昵称"
																	style={{
																		width: 256,
																		height: 40,
																		border: '1px solid #FCBE5B',
																		borderRadius: 4,
																	}}
																/>
															</div>
															{nameTip && (
																<div className={styles.nameTip}>
																	{nameTip}
																</div>
															)}

															<div
																onClick={createName}
																className={styles.createBtn}
															/>
														</div>
													</div>
												) : (
													<>
														{!newHand && !AIModel ? (
															<>
																<div
																	style={{
																		display: 'flex',
																		width: '100%',
																		height: 'auto',
																		justifyContent: 'center',
																		flexDirection: 'column',
																		alignItems: 'center',
																		paddingTop: 60,
																	}}
																>
																	<img
																		src="/duck/choose.png"
																		style={{
																			width: 127,
																			height: 28,
																			marginBottom: 38,
																		}}
																	/>
																	<div
																		style={{
																			display: 'flex',
																			gap: 24,
																		}}
																	>
																		{/* 新手模式 */}
																		<img
																			onClick={() => {
																				reStart();
																				setNewHand(true);
																				getDuckGameInfoHandle(
																					false,
																					true,
																				);
																			}}
																			className={
																				styles.newImg
																			}
																			src="/duck/newHand.png"
																		/>
																		<img
																			onClick={
																				handleAIModelClick
																			}
																			className={
																				styles.newImg
																			}
																			src={aiModelImageSrc}
																		/>
																	</div>
																</div>
															</>
														) : (
															<>
																{!eatingFood ? (
																	<div className={styles.footer}>
																		{/* 返回首页 */}
																		<img
																			onClick={backHome}
																			src="/duck/home.png"
																		/>
																		<div
																			className={
																				styles.startBtn
																			}
																			onClick={startGame}
																		/>
																	</div>
																) : gameOver ? (
																	<div className={styles.footer}>
																		<img
																			onClick={backHome}
																			src="/duck/home.png"
																		/>
																		<div
																			className={
																				styles.rePlayBtn
																			}
																			onClick={reStart}
																		/>
																	</div>
																) : (
																	<div
																		className={styles.playing}
																		style={{
																			display: 'flex',
																			alignItems: 'center',
																		}}
																	>
																		<div>比赛进行中</div>
																		<div
																			style={{
																				paddingBottom: 15,
																			}}
																			className={styles.dot}
																		>
																			...
																		</div>
																	</div>
																)}
																<>
																	<div
																		className={
																			styles[
																				newHand
																					? 'newHand_bg'
																					: 'aiModel_bg'
																			]
																		}
																	>
																		<div
																			className={
																				styles.score_img
																			}
																		>
																			<div
																				style={{
																					position:
																						'relative',
																				}}
																			>
																				<img src="/duck/score.png" />
																				<div
																					className={
																						styles.score_text
																					}
																					style={{
																						right: 15,
																					}}
																				>
																					{gameInfo?.points ||
																						0}
																				</div>
																			</div>

																			<div
																				style={{
																					position:
																						'relative',
																				}}
																			>
																				<img src="/duck/rate.png" />
																				<div
																					className={
																						styles.score_text
																					}
																				>
																					{gameInfo?.winRate ||
																						0}
																				</div>
																			</div>

																			{/* 排行 */}
																			<div
																				style={{
																					position:
																						'relative',
																					cursor: 'pointer',
																					pointerEvents:
																						moving
																							? 'none'
																							: 'unset',
																				}}
																				onClick={() => {
																					setShowRank(
																						true,
																					);
																					handleRankList();
																				}}
																			>
																				<img
																					style={{
																						width: 99,
																					}}
																					src="/duck/rank.png"
																				/>
																				<div
																					className={
																						styles.score_text
																					}
																					style={{
																						right: 35,
																					}}
																				>
																					{gameInfo?.ranking ||
																						0}
																				</div>
																			</div>
																		</div>
																	</div>
																	<Spin spinning={loading}>
																		<div
																			className={
																				styles.game_container
																			}
																			ref={parentRef}
																		>
																			{(eatingFood ||
																				gameOver) && (
																				<div>
																					<div
																						style={{
																							left: `-13px`,
																							top: `-29px`,
																						}}
																						className={
																							styles.startDot
																						}
																					>
																						<img
																							style={{
																								width: 28,
																								height: 34,
																							}}
																							src="/duck/start_red.png"
																						/>
																					</div>

																					<div
																						style={{
																							left: `368px`,
																							top: `301px`,
																						}}
																						className={
																							styles.startDot
																						}
																					>
																						<img
																							style={{
																								width: 28,
																								height: 34,
																							}}
																							src="/duck/start_blue.png"
																						/>
																					</div>
																				</div>
																			)}
																			{foods?.map(
																				(food, index) => (
																					<div
																						key={index}
																						className={`${styles.food}`}
																						onClick={() =>
																							handleFoodClick(
																								index,
																								food[0],
																								food[1],
																							)
																						}
																						onDoubleClick={() =>
																							handleFoodDoubleClick(
																								index,
																								food[0],
																								food[1],
																							)
																						}
																						// 将食物的位置都减去10
																						style={{
																							left: `${
																								food[0] -
																								10
																							}px`,
																							top: `${
																								food[1] -
																								10
																							}px`,
																							pointerEvents:
																								gameOver
																									? 'none'
																									: 'auto',
																						}}
																					>
																						{!gameOver && (
																							<>
																								{eatingFood ? (
																									<>
																										{food?.eat1 ||
																										food?.eat2 ? (
																											<div>
																												{food?.eat1 ? (
																													<div
																														className={
																															styles.eat1Circle
																														}
																													>
																														{
																															food?.eatNums1
																														}
																													</div>
																												) : (
																													<div
																														className={
																															styles.eat2Circle
																														}
																													>
																														{
																															food?.eatNums2
																														}
																													</div>
																												)}
																											</div>
																										) : (
																											<img
																												src={
																													bread
																												}
																												style={{
																													width: 22,
																													height: 22,
																												}}
																											/>
																										)}
																									</>
																								) : (
																									<img
																										className={
																											styles.bread
																										}
																										src={
																											bread
																										}
																										style={{
																											width: 22,
																											height: 22,
																										}}
																									/>
																								)}
																							</>
																						)}

																						{gameOver && (
																							<div>
																								{food?.eat1 ? (
																									<div
																										className={
																											styles.eat1Circle
																										}
																									>
																										{
																											food?.eatNums1
																										}
																									</div>
																								) : (
																									<div
																										className={
																											styles.eat2Circle
																										}
																									>
																										{
																											food?.eatNums2
																										}
																									</div>
																								)}
																							</div>
																						)}

																						{!gameOver &&
																							!eatingFood && (
																								<>
																									{food.clicked ? (
																										<div
																											className={
																												styles.clicked
																											}
																										>
																											{
																												food?.times
																											}
																										</div>
																									) : null}
																								</>
																							)}
																					</div>
																				),
																			)}
																			{/* 我的鸭 */}
																			<div
																				className={`${
																					styles.duck1
																				} ${
																					eatingFood
																						? styles.eating
																						: styles.moving
																				}`}
																				style={{
																					left: eatingFood
																						? `${
																								duckPosition1.x -
																								20
																						  }px`
																						: `${duckPosition1.x}px`,
																					top: eatingFood
																						? `${
																								duckPosition1.y -
																								60
																						  }px`
																						: `${duckPosition1.y}px`,
																				}}
																			>
																				<img
																					src={myPng}
																					style={{
																						width: 36,
																						height: 22,
																					}}
																				/>
																				<img
																					id="duck1Img"
																					src={duck1}
																					style={{
																						width: 37,
																						height: 37,
																					}}
																				/>
																			</div>
																			{!gameOver ? (
																				<svg
																					viewBox={
																						viewBox
																					}
																					className={
																						styles[
																							'duck-trail'
																						]
																					}
																				>
																					<path
																						d={generateSmoothPath(
																							duckPath,
																						)}
																						fill="none"
																						stroke="#E67187"
																						strokeWidth="2"
																						strokeLinejoin="round" // 设置转折处为圆滑
																						strokeLinecap="round" // 设置线段末端为圆形，使线段更柔和
																					/>
																				</svg>
																			) : (
																				<svg
																					viewBox={
																						viewBox
																					}
																					className={
																						styles[
																							'duck-trail'
																						]
																					}
																				>
																					<path
																						d={generateSmoothPath(
																							duckPath,
																							10,
																						)}
																						fill="none"
																						stroke="#E67187"
																						strokeWidth="2"
																						strokeLinejoin="round" // 设置转折处为圆滑
																						strokeLinecap="round" // 设置线段末端为圆形，使线段更柔和
																					/>
																				</svg>
																			)}

																			{/* 机器鸭 */}
																			<div
																				className={`${
																					styles.duck2
																				} ${
																					eatingFood
																						? styles.eating
																						: ''
																				}`}
																				style={{
																					left: eatingFood
																						? `${
																								duckPosition2.x -
																								10
																						  }px`
																						: `${duckPosition2.x}px`,
																					top: eatingFood
																						? `${
																								duckPosition2.y -
																								70
																						  }px`
																						: `${duckPosition2.y}px`,
																				}}
																			>
																				<img
																					src={oppPng}
																					style={{
																						width: 36,
																						height: 22,
																					}}
																				/>
																				<img
																					src={duck2}
																					style={{
																						width: 37,
																						height: 37,
																					}}
																				/>
																			</div>

																			{!gameOver ? (
																				<svg
																					viewBox={
																						viewBox
																					}
																					className={
																						styles[
																							'duck-trail2'
																						]
																					}
																				>
																					<path
																						d={generateSmoothPath(
																							duckPath2,
																						)}
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
																					viewBox={
																						viewBox
																					}
																					className={
																						styles[
																							'duck-trail2'
																						]
																					}
																				>
																					<path
																						d={generateSmoothPath(
																							duckPath2,
																							10,
																						)}
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
																				viewBox={viewBox}
																				className={
																					styles[
																						'duck-trail2'
																					]
																				}
																				style={{
																					zIndex: 1,
																				}}
																			>
																				{pathCoordinatesLine.map(
																					(
																						coords,
																						index,
																					) => (
																						<g
																							key={
																								index
																							}
																						>
																							{index >
																								0 && (
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
																							{index >
																								0 && (
																								<path
																									d={`M${
																										pathCoordinatesLine[
																											index -
																												1
																										][0]
																									},${
																										pathCoordinatesLine[
																											index -
																												1
																										][1]
																									} L${
																										coords[0]
																									},${
																										coords[1]
																									}`}
																									fill="none"
																									stroke="#E67187"
																									strokeWidth="1"
																									markerEnd={`url(#arrowheadLine-${index})`}
																								/>
																							)}
																						</g>
																					),
																				)}
																			</svg>
																			{/*跟随鼠标的线     */}
																			{/* 选完之后  隐藏线条 */}
																			{foods?.length > 0 && (
																				<>
																					{!isHiddenLine &&
																						foods?.length !==
																							strategyList?.length && (
																							<svg
																								viewBox={
																									viewBox
																								}
																								className={
																									styles[
																										'duck-trail2'
																									]
																								}
																								style={{
																									zIndex: 1,
																								}}
																							>
																								{/* 箭头线 */}
																								<defs>
																									<marker
																										id="arrowhead"
																										markerWidth="10"
																										markerHeight="7"
																										refX="10"
																										refY="3.5"
																										orient="auto"
																										fill="#E67187"
																									>
																										<polygon points="0 0, 10 3.5, 0 7" />
																									</marker>
																								</defs>
																								<line
																									x1={
																										startX
																									}
																									y1={
																										startY
																									}
																									x2={
																										endX ||
																										startX
																									} // 如果 endX 不存在，则使用 startX
																									y2={
																										endY ||
																										startY
																									} // 如果 endY 不存在，则使用 startY
																									style={{
																										stroke: '#E67187',
																										strokeWidth: 1,
																										markerEnd:
																											'url(#arrowhead)',
																									}}
																								/>
																							</svg>
																						)}
																				</>
																			)}
																		</div>
																	</Spin>
																</>
															</>
														)}
													</>
												)}
											</>
										)}
									</div>
								</Spin>
							)}
						</>
					)}

					{/* 右侧规则描述 */}
					<div style={{ marginLeft: 24, flex: 1, marginTop: 8 }}>
						<div className={styles.object}>
							<div>
								<img src={duck_no} />
							</div>
							<div className={styles.text}>鸭子</div>
						</div>
						<div className={styles.object}>
							<div>
								<img src={bread} />
							</div>
							<div className={styles.text}>食物</div>
						</div>
						<div className={styles.object}>
							<div className={styles.outLine}>
								<div className={styles.line} />
							</div>
							<div className={styles.text}>我方夺食路线</div>
						</div>
						<div className={styles.object}>
							<div className={styles.outLine}>
								<div className={styles.line2} />
							</div>
							<div className={styles.text}>对手夺食路线</div>
						</div>
						<div className={styles.ruleText}>规则：</div>
						<div className={styles.rule1}>
							1、开始比赛前，玩家通过点击食物，确定我方鸭子夺食的先后顺序。
						</div>
						<div className={styles.rule1}>2、双击已选择的点，可以取消选择食物。</div>
						<div className={styles.rule1}>
							3、比赛中，双方鸭子会按预定的顺序争抢食物，所有食物被吃完，游戏结束，获得最多食物的鸭子胜出。
						</div>
						<div className={styles.rule1}>
							4、在“新手模式”中获得10局比赛胜利，即可解锁“AI模式”。
						</div>
					</div>
				</div>
			</div>
		</Layout>
	);
}

export default DuckGame;
