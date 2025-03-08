/**
 * 贪吃蛇游戏 JavaScript 主逻辑
 * 
 * 这个文件包含了游戏的所有功能实现，包括：
 * - 初始化游戏
 * - 绘制游戏界面
 * - 处理游戏逻辑
 * - 处理用户输入
 * - 游戏状态管理
 */

// 当DOM完全加载后执行游戏初始化
document.addEventListener('DOMContentLoaded', () => {
    // ==================== DOM元素获取 ====================
    const canvas = document.getElementById('gameCanvas');     // 游戏画布
    const ctx = canvas.getContext('2d');                      // 画布上下文
    const scoreElement = document.getElementById('score');    // 当前分数显示元素
    const highScoreElement = document.getElementById('highScore'); // 最高分显示元素
    const finalScoreElement = document.getElementById('finalScore'); // 游戏结束时分数显示
    const gameOverElement = document.getElementById('gameOver'); // 游戏结束覆盖层
    const startButton = document.getElementById('startButton'); // 开始按钮
    const pauseButton = document.getElementById('pauseButton'); // 暂停按钮
    const restartButton = document.getElementById('restartButton'); // 重新开始按钮

    // ==================== 游戏常量 ====================
    const GRID_SIZE = 20;                            // 网格大小（像素）
    const GRID_COUNT = canvas.width / GRID_SIZE;     // 网格数量（每行/列）
    const GAME_SPEED = 150;                          // 游戏速度（毫秒/帧）

    // ==================== 游戏变量 ====================
    let snake = [];                 // 蛇身体，数组中每个元素表示一个蛇的身体部分
    let direction = 'right';        // 当前移动方向
    let nextDirection = 'right';    // 下一帧的移动方向（用于防止在一帧内连续转向导致自身碰撞）
    let food = {};                  // 食物位置
    let score = 0;                  // 当前分数
    let highScore = localStorage.getItem('snakeHighScore') || 0; // 最高分，从本地存储获取
    let gameInterval;               // 游戏主循环计时器
    let isPaused = false;           // 游戏是否暂停
    let isGameOver = false;         // 游戏是否结束
    let isGameStarted = false;      // 游戏是否已经开始

    /**
     * 游戏初始化函数
     * 重置所有游戏状态并准备开始新游戏
     */
    function initGame() {
        // 初始化蛇，默认长度为3，位于游戏区域的左中部，朝右移动
        snake = [
            {x: 6, y: 10},  // 蛇头
            {x: 5, y: 10},  // 蛇身
            {x: 4, y: 10}   // 蛇尾
        ];
        direction = 'right';        // 初始方向向右
        nextDirection = 'right';    // 下一帧方向也向右
        score = 0;                  // 重置分数
        scoreElement.textContent = score; // 更新分数显示
        highScoreElement.textContent = highScore; // 显示最高分
        generateFood();             // 生成第一个食物
        drawGame();                 // 绘制初始游戏状态
        isGameOver = false;         // 重置游戏结束状态
        gameOverElement.style.display = 'none'; // 隐藏游戏结束覆盖层
    }

    /**
     * 生成食物函数
     * 随机在游戏区域生成食物，确保不会出现在蛇身上
     */
    function generateFood() {
        let overlapping;
        do {
            // 假设不重叠
            overlapping = false;
            
            // 随机生成食物坐标
            food = {
                x: Math.floor(Math.random() * GRID_COUNT),
                y: Math.floor(Math.random() * GRID_COUNT)
            };
            
            // 检查食物是否与蛇身体重叠
            for (let segment of snake) {
                if (segment.x === food.x && segment.y === food.y) {
                    overlapping = true;
                    break;
                }
            }
        } while (overlapping); // 如果重叠，继续生成新的食物位置
    }

    /**
     * 绘制游戏函数
     * 负责绘制整个游戏界面，包括网格、蛇和食物
     */
    function drawGame() {
        // 清除画布，使用浅灰色背景
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 绘制网格线
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= GRID_COUNT; i++) {
            // 垂直线
            ctx.beginPath();
            ctx.moveTo(i * GRID_SIZE, 0);
            ctx.lineTo(i * GRID_SIZE, canvas.height);
            ctx.stroke();

            // 水平线
            ctx.beginPath();
            ctx.moveTo(0, i * GRID_SIZE);
            ctx.lineTo(canvas.width, i * GRID_SIZE);
            ctx.stroke();
        }

        // 绘制蛇
        snake.forEach((segment, index) => {
            // 蛇头和蛇身使用不同的绿色
            if (index === 0) {
                ctx.fillStyle = '#2ecc71'; // 浅绿色蛇头
            } else {
                ctx.fillStyle = '#27ae60'; // 深绿色蛇身
            }
            // 绘制蛇的身体部分
            ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            
            // 给蛇添加边框，增强视觉效果
            ctx.strokeStyle = '#145a32';
            ctx.lineWidth = 1;
            ctx.strokeRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            
            // 给蛇头添加眼睛，增加游戏趣味性
            if (index === 0) {
                ctx.fillStyle = '#000';
                // 根据蛇的移动方向，调整眼睛位置
                const eyeSize = GRID_SIZE / 8;
                if (direction === 'right') {
                    ctx.fillRect((segment.x + 0.75) * GRID_SIZE, (segment.y + 0.3) * GRID_SIZE, eyeSize, eyeSize);
                    ctx.fillRect((segment.x + 0.75) * GRID_SIZE, (segment.y + 0.7) * GRID_SIZE, eyeSize, eyeSize);
                } else if (direction === 'left') {
                    ctx.fillRect((segment.x + 0.25) * GRID_SIZE, (segment.y + 0.3) * GRID_SIZE, eyeSize, eyeSize);
                    ctx.fillRect((segment.x + 0.25) * GRID_SIZE, (segment.y + 0.7) * GRID_SIZE, eyeSize, eyeSize);
                } else if (direction === 'up') {
                    ctx.fillRect((segment.x + 0.3) * GRID_SIZE, (segment.y + 0.25) * GRID_SIZE, eyeSize, eyeSize);
                    ctx.fillRect((segment.x + 0.7) * GRID_SIZE, (segment.y + 0.25) * GRID_SIZE, eyeSize, eyeSize);
                } else if (direction === 'down') {
                    ctx.fillRect((segment.x + 0.3) * GRID_SIZE, (segment.y + 0.75) * GRID_SIZE, eyeSize, eyeSize);
                    ctx.fillRect((segment.x + 0.7) * GRID_SIZE, (segment.y + 0.75) * GRID_SIZE, eyeSize, eyeSize);
                }
            }
        });

        // 绘制食物（红色圆形）
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        const centerX = (food.x + 0.5) * GRID_SIZE;
        const centerY = (food.y + 0.5) * GRID_SIZE;
        const radius = GRID_SIZE / 2;
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 食物上的高光效果，增加立体感
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(centerX - radius / 3, centerY - radius / 3, radius / 4, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * 更新游戏状态函数
     * 游戏的主循环，负责更新蛇的位置、检查碰撞和食物吃取
     */
    function updateGame() {
        // 更新方向（将预定的下一帧方向应用到当前）
        direction = nextDirection;
        
        // 根据当前方向，计算蛇头的新位置
        const head = {
            x: snake[0].x,
            y: snake[0].y
        };
        
        // 根据方向更新蛇头位置
        switch (direction) {
            case 'right':
                head.x++;            // 向右移动一格
                break;
            case 'left':
                head.x--;            // 向左移动一格
                break;
            case 'up':
                head.y--;            // 向上移动一格
                break;
            case 'down':
                head.y++;            // 向下移动一格
                break;
        }
        
        // 检查是否碰撞（墙壁或自身）
        if (checkCollision(head)) {
            gameOver();             // 发生碰撞，游戏结束
            return;
        }
        
        // 将新的蛇头添加到数组最前面（蛇向前移动）
        snake.unshift(head);
        
        // 检查是否吃到食物
        if (head.x === food.x && head.y === food.y) {
            // 吃到食物，加分
            score += 10;
            scoreElement.textContent = score;
            
            // 更新最高分（如果当前分数更高）
            if (score > highScore) {
                highScore = score;
                highScoreElement.textContent = highScore;
                localStorage.setItem('snakeHighScore', highScore); // 保存最高分到本地存储
            }
            
            // 生成新的食物
            generateFood();
        } else {
            // 没吃到食物，移除蛇尾（保持蛇长度不变）
            snake.pop();
        }
        
        // 重新绘制游戏界面
        drawGame();
    }
    
    /**
     * 碰撞检测函数
     * 检查蛇头是否碰到墙壁或自身
     * @param {Object} head - 蛇头对象，包含x和y坐标
     * @returns {boolean} - 如果发生碰撞返回true，否则返回false
     */
    function checkCollision(head) {
        // 检查是否撞墙（超出游戏区域边界）
        if (head.x < 0 || head.x >= GRID_COUNT || head.y < 0 || head.y >= GRID_COUNT) {
            return true;
        }
        
        // 检查是否撞到自己（蛇头碰到蛇身）
        // 注意：只检查蛇身，不检查蛇头（因为蛇头是新位置，还未添加到snake数组中）
        for (let i = 0; i < snake.length; i++) {
            if (snake[i].x === head.x && snake[i].y === head.y) {
                return true;
            }
        }
        
        // 没有发生碰撞
        return false;
    }
    
    /**
     * 游戏结束处理函数
     * 停止游戏循环，显示游戏结束界面
     */
    function gameOver() {
        clearInterval(gameInterval);   // 清除游戏主循环
        isGameOver = true;             // 设置游戏结束状态
        isGameStarted = false;         // 重置游戏开始状态
        finalScoreElement.textContent = score; // 显示最终分数
        gameOverElement.style.display = 'flex'; // 显示游戏结束覆盖层
    }
    
    /**
     * 开始游戏函数
     * 初始化并启动游戏
     */
    function startGame() {
        if (!isGameStarted) {
            initGame();                // 初始化游戏状态
            gameInterval = setInterval(updateGame, GAME_SPEED); // 设置游戏主循环
            isGameStarted = true;      // 设置游戏已开始状态
            isPaused = false;          // 确保游戏不是暂停状态
        }
    }
    
    /**
     * 暂停/继续游戏函数
     * 根据当前游戏状态切换暂停/继续
     */
    function togglePause() {
        // 如果游戏未开始或已结束，忽略暂停/继续操作
        if (!isGameStarted || isGameOver) return;
        
        if (isPaused) {
            // 如果当前是暂停状态，继续游戏
            gameInterval = setInterval(updateGame, GAME_SPEED);
            pauseButton.textContent = '暂停游戏';
        } else {
            // 如果当前是运行状态，暂停游戏
            clearInterval(gameInterval);
            pauseButton.textContent = '继续游戏';
        }
        
        // 切换暂停状态
        isPaused = !isPaused;
    }
    
    /**
     * 按键事件处理函数
     * 处理键盘输入以控制蛇的移动方向
     * @param {KeyboardEvent} e - 键盘事件对象
     */
    function handleKeyPress(e) {
        // 如果游戏结束或未开始，忽略按键输入
        if (isGameOver || !isGameStarted) return;
        
        // 根据按键设置下一帧的移动方向
        switch (e.key) {
            case 'ArrowUp':    // 上箭头键
            case 'w':          // W键
            case 'W':
                // 如果当前不是向下移动，才允许向上（防止180度转向导致自身碰撞）
                if (direction !== 'down') nextDirection = 'up';
                break;
            case 'ArrowDown':  // 下箭头键
            case 's':          // S键
            case 'S':
                // 如果当前不是向上移动，才允许向下
                if (direction !== 'up') nextDirection = 'down';
                break;
            case 'ArrowLeft':  // 左箭头键
            case 'a':          // A键
            case 'A':
                // 如果当前不是向右移动，才允许向左
                if (direction !== 'right') nextDirection = 'left';
                break;
            case 'ArrowRight': // 右箭头键
            case 'd':          // D键
            case 'D':
                // 如果当前不是向左移动，才允许向右
                if (direction !== 'left') nextDirection = 'right';
                break;
            case ' ':          // 空格键用于暂停/继续游戏
                togglePause();
                break;
        }
    }
    
    // ==================== 事件监听器绑定 ====================
    // 绑定键盘事件监听器
    document.addEventListener('keydown', handleKeyPress);
    // 绑定按钮点击事件
    startButton.addEventListener('click', startGame);
    pauseButton.addEventListener('click', togglePause);
    restartButton.addEventListener('click', startGame);
    
    // ==================== 初始化操作 ====================
    // 初始化显示最高分
    highScoreElement.textContent = highScore;
    
    // 初始绘制游戏界面（等待用户点击开始）
    initGame();
}); 