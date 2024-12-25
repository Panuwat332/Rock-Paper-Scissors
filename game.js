const config = {
  type: Phaser.AUTO,
  width: 1200,
  height: 900,
  backgroundColor: '#87CEEB',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);

function preload() {
  this.load.image('rock', '/img/rock.png');
  this.load.image('paper', '/img/paper.png');
  this.load.image('scissors', '/img/scissors.png');

  this.load.audio('bgm','/sound/bgm.mp3');
  this.load.audio('onPoint','/sound/onpoint.mp3');
  this.load.audio('onClick','/sound/click.mp3');
  this.load.audio('hit','/sound/enemyhit.mp3');
  this.load.audio('enemyhit','/sound/hit.mp3');
  
  this.load.spritesheet('heart', '/img/heart.png', {
    frameWidth: 500,
    frameHeight: 500,
  });
  this.load.spritesheet('slimeAnim', '/img/slime1.png', {
    frameWidth: 900,
    frameHeight: 900,
  });
  this.load.spritesheet('slimeAnim2', '/img/slime2.png', {
    frameWidth: 900,
    frameHeight: 900,
  });
  this.load.spritesheet('lBoss', '/img/boss.png', {
    frameWidth: 900,
    frameHeight: 900,
  });
  this.load.spritesheet('backgroundAnim', '/img/background.png', {
    frameWidth: 1200,  
    frameHeight: 900,  
  });
}

let playerChoice = null;
let computerChoice = null;
let resultText;
let gameState = 'playerTurn';

function create() {
  this.bgm = this.sound.add('bgm', { volume: 0.5, loop: true });
  this.bgm.play();
  this.hit = this.sound.add('hit', { volume: 0.7});
  this.enemyhit = this.sound.add('enemyhit', { volume: 0.7});
  this.onClick= this.sound.add('onClick', { volume: 0.5 });
  this.onPoint = this.sound.add('onPoint', { volume: 0.3 });

  this.anims.create({
    key: 'backgroundLoop',
    frames: this.anims.generateFrameNumbers('backgroundAnim', { start: 0, end: 25 }),
    frameRate: 6,
    repeat: -1,
  });
  this.anims.create({
    key: 'slimeIdle',
    frames: this.anims.generateFrameNumbers('slimeAnim', { start: 0, end: 1 }),
    frameRate: 2,
    repeat: -1,
  });
  this.anims.create({
    key: 'slimeIdle2',
    frames: this.anims.generateFrameNumbers('slimeAnim2', { start: 0, end: 1 }),
    frameRate: 2,
    repeat: -1,
  });
  this.anims.create({
    key: 'lBoss',
    frames: this.anims.generateFrameNumbers('lBoss', { start: 0, end: 1 }),
    frameRate: 2,
    repeat: -1,
  });
  this.anims.create({
    key: 'heartanim',
    frames: this.anims.generateFrameNumbers('heart', { start: 0, end: 2 }),
    frameRate: 4,
    repeat: -1,
  });
  

  const background = this.add.sprite(600, 450, 'backgroundAnim');
  background.play('backgroundLoop');

  const rock = this.add.image(400, 700, 'rock').setInteractive();
  const paper = this.add.image(600, 700, 'paper').setInteractive();
  const scissors = this.add.image(800, 700, 'scissors').setScale(0.25);
  scissors.setInteractive();

  this.enemies = [
    { name: 'Slime', HP: 2, spriteKey: 'slimeAnim', scale: 0.46 },
    { name: 'Big Slime', HP: 1, spriteKey: 'slimeAnim2', scale: 0.6 },
    { name: 'Boss', HP: 4, spriteKey: 'lBoss', scale: 0.6 },
  ];
  this.currentEnemyIndex = 0;

  // สร้างศัตรูตัวแรก
  this.enemyHP = this.enemies[0].HP;
  this.enemycurrentHP = this.enemyHP;
  this.enemyhearts = [];
  for (let i = 0; i < this.enemyHP; i++) {
    const heart = this.add.sprite(850 + i * 40, 200, 'heart').setScale(0.17);
    heart.play('heartanim');
    this.enemyhearts.push(heart);
  }

  this.enemySprite = this.add
    .sprite(600, 350, this.enemies[0].spriteKey)
    .setScale(this.enemies[0].scale);
  this.enemySprite.play('slimeIdle');

  rock.setScale(0.1);
  paper.setScale(0.22);
  rock.on('pointerdown', () => handlePlayerChoice('rock', this));
  paper.on('pointerdown', () => handlePlayerChoice('paper', this));
  scissors.on('pointerdown', () => handlePlayerChoice('scissors', this));

  rock.on('pointerover', () => {
    rock.setScale(0.12);
    this.onPoint.play();
  });
  rock.on('pointerout', () => rock.setScale(0.1));
  paper.on('pointerover', () => {
    paper.setScale(0.24);
    this.onPoint.play();
  });
  paper.on('pointerout', () => paper.setScale(0.22));
  scissors.on('pointerover', () => {
    scissors.setScale(0.28);
    this.onPoint.play();
  });
  scissors.on('pointerout', () => scissors.setScale(0.25));

  rock.on('pointerdown', () => {
    this.onClick.play();
    handlePlayerChoice('rock', this);
  });
  paper.on('pointerdown', () => {
    this.onClick.play();
    handlePlayerChoice('paper', this);
  });
  scissors.on('pointerdown', () => {
    this.onClick.play();
    handlePlayerChoice('scissors', this);
  });

  resultText = this.add.text(600, 620, '', {
    fontSize: '25px',
    color: '#000',
  }).setOrigin(0.5);

  this.playerHP = 6;
  this.playerhearts = [];
  this.currentHp = this.playerHP;
  for (let i = 0; i < this.playerHP; i++) {
    const heart = this.add.sprite(73 + i * 45, 62, 'heart').setScale(0.17);
    heart.play('heartanim');
    this.playerhearts.push(heart);
  }
  this.turnCount = 0;
  this.specialTurnCount = 0;

  // แสดง Turn Count บนหน้าจอ
  this.turnText = this.add.text(600, 50, `รอบที่: ${this.turnCount}`, {
    fontSize: '28px',
    color: '#000',
    fontStyle: 'bold',
  }).setOrigin(0.5);
}

function update() {}

function handlePlayerChoice(choice, scene) {
  if (gameState !== 'playerTurn') return;
  playerChoice = choice;

  gameState = 'computerTurn';

  scene.time.delayedCall(500, handleComputerChoice, [scene], scene);
}

function handleComputerChoice(scene) {
  const choices = ['rock', 'paper', 'scissors'];
  computerChoice = choices[Math.floor(Math.random() * choices.length)];

  createChoicePopup(scene, playerChoice, computerChoice, () => {
    const result = calculateResult(playerChoice, computerChoice, scene);
    scene.time.delayedCall(1, startNextTurn, [scene], scene);
  });
}

function calculateResult(player, computer, scene) {
  let result;
  if (player === computer) {
    result = 'เสมอ!';
  } else if (
    (player === 'rock' && computer === 'scissors') ||
    (player === 'paper' && computer === 'rock') ||
    (player === 'scissors' && computer === 'paper')
  ) {
    scene.time.delayedCall(500, () => loseHP(1, scene));
    result = 'คุณชนะ!';
  } else {
    scene.time.delayedCall(500, () => losePlayerHP(1, scene));
    result = 'คุณแพ้!';
  }
  return result;
}

function startNextTurn(scene) {
  playerChoice = null;
  computerChoice = null;
  resultText.setText('');
  gameState = 'playerTurn';

  scene.turnCount += 1;
  // อัปเดตข้อความ Turn Count
  scene.turnText.setText(`รอบที่: ${scene.turnCount}`);

  if (scene.currentEnemyIndex === 1) {
    scene.specialTurnCount += 1;

    // ตรวจสอบเงื่อนไขว่าผู้เล่นแพ้
    if (scene.specialTurnCount > 3) {
      resultText.setText('คุณแพ้! ศัตรูตัวนี้เก่งเกินไป!');
      gameState = 'gameOver';
      scene.time.delayedCall(1, () => createEndGamePopup(scene, 'lose'), scene);
      return;
    }
  }
}

function loseHP(amount, scene) {
  scene.enemycurrentHP -= amount;
  if (scene.enemycurrentHP < 0) {
    scene.enemycurrentHP = 0;
  }

  // อัปเดตหัวใจของศัตรู
  scene.enemyhearts.forEach((heart, index) => {
    heart.setVisible(index < scene.enemycurrentHP);
    scene.enemyhit.play(); // เล่นเสียงเมื่อโดนโจมตี
  });

  scene.cameras.main.shake(300, 0.004);

  if (scene.enemycurrentHP === 0) {
    if (scene.currentEnemyIndex < scene.enemies.length - 1) {
      scene.currentEnemyIndex++;
      loadNextEnemy(scene); // เปลี่ยนศัตรู
    } else {
      resultText.setText('🎉 คุณชนะเกมนี้! 🎉');
      gameState = 'gameOver';
      scene.time.delayedCall(1, () => createEndGamePopup(scene, 'win'), scene);
    }
  }
}
2
function losePlayerHP(amount, scene) {
  scene.currentHp -= amount;

  if (scene.currentHp < 0) {
    scene.currentHp = 0;
  }

  scene.playerhearts.forEach((heart, index) => {
    heart.setVisible(index < scene.currentHp);
  });

  if (scene.currentHp === 0) {
    resultText.setText('คุณแพ้เกมนี้!');
    gameState = 'gameOver';
  }
  this.turnCount = 0;
}

function createChoicePopup(scene, playerChoice, computerChoice, callback) {
  const popupBackground = scene.add.rectangle(600, 450, 500, 400, 0x000000).setAlpha(0.8);
  
  const popupTitle = scene.add.text(600, 300, 'ผลการเลือก', {
    fontSize: '28px',
    color: '#fff',
  }).setOrigin(0.5);

  const playerLabel = scene.add.text(450, 360, 'คุณเลือก:', {
    fontSize: '22px',
    color: '#fff',
  }).setOrigin(0.5);

  const playerSprite = scene.add.image(450, 420, playerChoice).setScale(0.2);

  const computerLabel = scene.add.text(750, 360, 'มอนเตอร์:', {
    fontSize: '22px',
    color: '#fff',
  }).setOrigin(0.5);

  const computerSprite = scene.add.image(750, 420, computerChoice).setScale(0.2);

  const closeButton = scene.add.text(600, 550, 'ตกลง', {
    fontSize: '24px',
    color: '#fff',
    backgroundColor: '#ff0000',
    padding: 10,
  }).setInteractive().setOrigin(0.5);

  closeButton.on('pointerdown', () => {
    popupBackground.destroy();
    popupTitle.destroy();
    playerLabel.destroy();
    playerSprite.destroy();
    computerLabel.destroy();
    computerSprite.destroy();
    closeButton.destroy();
    
    if (callback) callback();
  });
}

function losePlayerHP(amount, scene) {
  scene.currentHp -= amount;

  if (scene.currentHp < 0) {
    scene.currentHp = 0;
  }

  scene.playerhearts.forEach((heart, index) => {
    heart.setVisible(index < scene.currentHp);
    scene.hit.play();
  });

  scene.cameras.main.shake(300, 0.01);
  addRedBorder(scene);

  if (scene.currentHp === 0) {
    resultText.setText('คุณแพ้เกมนี้!');
    gameState = 'gameOver';
    scene.time.delayedCall(1, () => createEndGamePopup(scene, 'lose'), scene);
  }
}

function createEndGamePopup(scene, result) {
  const popupBackground = scene.add.rectangle(600, 450, 600, 400, 0x000000).setAlpha(0.8);      
  const popupText = result === 'win' 
    ? '🎉 คุณชนะ! 🎉'
    : '😭 คุณแพ้! 😭';

  const resultMessage = scene.add.text(600, 400, popupText, {
    fontSize: '40px',
    color: '#fff',
    fontStyle: 'bold',
  }).setOrigin(0.5);

  const restartButton = scene.add.text(600, 500, 'เริ่มใหม่', {
    fontSize: '32px',
    color: '#ffffff',
    backgroundColor: '#ff0000',
    padding: { left: 10, right: 10, top: 5, bottom: 5 },
  }).setOrigin(0.5).setInteractive();

  restartButton.on('pointerdown', () => {
    popupBackground.destroy();
    resultMessage.destroy();
    restartButton.destroy();
    resetGame(scene);
  });
}

function loadNextEnemy(scene) {
  // ลบ sprite ของศัตรูตัวเก่า
  if (scene.enemySprite) {
    scene.enemySprite.destroy();
  }

  // ลบหัวใจของศัตรูตัวเก่า
  if (scene.enemyhearts.length > 0) {
    scene.enemyhearts.forEach((heart) => heart.destroy());
    scene.enemyhearts = []; // รีเซ็ตอาร์เรย์หัวใจ
  }

  // รีเซ็ตข้อมูลศัตรูใหม่
  const nextEnemy = scene.enemies[scene.currentEnemyIndex];
  scene.enemyHP = nextEnemy.HP;
  scene.enemycurrentHP = nextEnemy.HP;

  // สร้างหัวใจของศัตรูใหม่
  for (let i = 0; i < scene.enemyHP; i++) {
    const heart = scene.add.sprite(850 + i * 40, 200, 'heart').setScale(0.17);
    heart.play('heartanim');
    scene.enemyhearts.push(heart);
  }

  // สร้าง sprite ของศัตรูใหม่
  scene.enemySprite = scene.add
    .sprite(600, 350, nextEnemy.spriteKey)
    .setScale(nextEnemy.scale);

  // ตั้งค่าการเล่นอนิเมชันของศัตรู
  if (scene.currentEnemyIndex === 1) {
    scene.enemySprite.play('slimeIdle2'); // สำหรับศัตรูตัวที่สอง
  } else if (scene.currentEnemyIndex === 2) {
    scene.enemySprite.play('lBoss'); // สำหรับบอส
  } else {
    scene.enemySprite.play('slimeIdle'); // สำหรับศัตรูตัวแรก
  }

  scene.turnCount = 0;
  scene.turnText.setText(`รอบที่: ${scene.turnCount}`);
  // รีเซ็ตตัวนับเทิร์นพิเศษเมื่อถึงศัตรูตัวที่สอง
  if (scene.currentEnemyIndex === 1) {
    scene.specialTurnCount = 0;
  }

  
}

function resetGame(scene) {
  // ลบศัตรูเดิม
  if (scene.enemySprite) {
    scene.enemySprite.destroy();
  }
  if (scene.enemyhearts) {
    scene.enemyhearts.forEach((heart) => heart.destroy());
  }

  // รีเซ็ตตัวแปรสำหรับศัตรู
  scene.currentEnemyIndex = 0;
  const firstEnemy = scene.enemies[scene.currentEnemyIndex];
  scene.enemyHP = firstEnemy.HP;
  scene.enemycurrentHP = firstEnemy.HP;

  // สร้างหัวใจใหม่
  scene.enemyhearts = [];
  for (let i = 0; i < firstEnemy.HP; i++) {
    const heart = scene.add.sprite(850 + i * 40, 200, 'heart').setScale(0.17);
    heart.play('heartanim');
    scene.enemyhearts.push(heart);
  }

  // สร้างศัตรูใหม่
  scene.enemySprite = scene.add
    .sprite(600, 350, firstEnemy.spriteKey)
    .setScale(firstEnemy.scale);
  scene.enemySprite.play('slimeIdle');

  // รีเซ็ตหัวใจของผู้เล่น
  scene.currentHp = scene.playerHP;
  scene.playerhearts.forEach((heart) => heart.setVisible(true));

  // รีเซ็ตตัวนับรอบ
  scene.turnCount = 0;
  scene.specialTurnCount = 0;
  scene.turnText.setText(`รอบที่: ${scene.turnCount}`);

  // รีเซ็ตข้อความและสถานะเกม
  resultText.setText('');
  gameState = 'playerTurn';
}

function addRedBorder(scene) {
  const graphics = scene.add.graphics();
  graphics.fillStyle(0xff0000, 0.5); // สีแดง, ความโปร่งใส 50%
  graphics.fillRect(0, 0, scene.cameras.main.width, scene.cameras.main.height);

  // ลบขอบจอสีแดงหลัง 200 มิลลิวินาที
  scene.time.delayedCall(200, () => {
    graphics.clear();
  });
}


