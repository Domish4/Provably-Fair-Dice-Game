const crypto = require('crypto');
const readline = require('readline');

// Проверка аргументов командной строки
if (process.argv.length < 5) {
    console.error("Ошибка: Необходимо минимум три набора значений для кубиков, каждый содержащий 6 целых чисел.");
    console.error("Пример: node main.js 2,2,4,4,9,9 6,8,1,1,8,6 7,5,3,7,5,3");
    process.exit(1);
}

const diceSets = process.argv.slice(2).map(arg => arg.split(',').map(Number));

for (const dice of diceSets) {
    if (dice.length !== 6 || dice.some(isNaN)) {
        console.error("Ошибка: Каждый набор должен содержать ровно 6 целых чисел.");
        console.error("Пример: node game.js 2,2,4,4,9,9 6,8,1,1,8,6 7,5,3,7,5,3");
        process.exit(1);
    }
}


function generateSecureKey() {
    return crypto.randomBytes(32).toString('hex'); // 256-битный ключ
}


function fairRandom(userNumber, max) {
    const key = generateSecureKey();
    const computerNumber = crypto.randomInt(max);


    const hmac = crypto.createHmac('sha3-256', key).update(computerNumber.toString()).digest('hex');
    console.log(`HMAC: ${hmac}`);


    const userInput = parseInt(userNumber, 10);
    if (isNaN(userInput) || userInput < 0 || userInput >= max) {
        console.error(`Ошибка: Введите целое число в диапазоне от 0 до ${max - 1}`);
        return;
    }

    const result = (userInput + computerNumber) % max;
    console.log(`Ваше число: ${userInput}, Число компьютера: ${computerNumber}`);
    console.log(`Использованный ключ: ${key}`);
    console.log(`Результат: ${result}`);
}

function calculateWinProbabilities(diceSets) {
    const probabilities = [];

    for (let i = 0; i < diceSets.length; i++) {
        const row = [];
        for (let j = 0; j < diceSets.length; j++) {
            if (i === j) {
                row.push(0.5); // Вероятность ничьи для одного и того же кубика
            } else {
                const wins = compareDice(diceSets[i], diceSets[j]);
                row.push(wins);
            }
        }
        probabilities.push(row);
    }

    return probabilities;
}


function compareDice(dice1, dice2) {
    let wins1 = 0;
    let wins2 = 0;

    for (let value1 of dice1) {
        for (let value2 of dice2) {
            if (value1 > value2) {
                wins1++;
            } else if (value2 > value1) {
                wins2++;
            }
        }
    }

    return wins1 / (wins1 + wins2);
}

// Основная игра
async function playGame() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    function askQuestion(query) {
        return new Promise(resolve => rl.question(query, resolve));
    }

    console.log("Welcome to the Generalized Dice Game!");

    while (true) {
        console.log("\nMenu:");
        diceSets.forEach((dice, index) => {
            console.log(`${index + 1}: Dice [${dice.join(', ')}]`);
        });
        console.log("H: Help");
        console.log("E: Exit");

        const choice = await askQuestion("Select an option: ");

        if (choice.toUpperCase() === 'E') {
            console.log("Спасибо за игру!");
            rl.close();
            break;
        } else if (choice.toUpperCase() === 'H') {
            console.log("\nПомощь:");
            console.log("Вероятности выигрыша для каждой пары кубиков:");

            const probabilities = calculateWinProbabilities(diceSets);

            // Печать таблицы вероятностей
            let header = '        ';
            for (let i = 0; i < diceSets.length; i++) {
                header += `Dice ${i + 1}   `;
            }
            console.log(header);

            for (let i = 0; i < probabilities.length; i++) {
                let row = `Dice ${i + 1} `;
                for (let j = 0; j < probabilities[i].length; j++) {
                    row += `  ${probabilities[i][j].toFixed(2)}  `;
                }
                console.log(row);
            }
        } else {
            const diceIndex = parseInt(choice) - 1;

            if (isNaN(diceIndex) || diceIndex < 0 || diceIndex >= diceSets.length) {
                console.log("Ошибка: неверный выбор. Попробуйте снова.");
                continue;
            }

            console.log(`Вы выбрали кубик: [${diceSets[diceIndex].join(', ')}]`);

            const userNumber = await askQuestion(`Введите ваше число (от 0 до 5): `);
            fairRandom(userNumber, 6);
        }
    }
}

playGame();
