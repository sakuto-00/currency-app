
const fromCurrency = document.getElementById("fromCurrency");
const toCurrency = document.getElementById("toCurrency");
const amountInput = document.getElementById("amount");
const result = document.getElementById("result");
const rateInfo = document.getElementById("rate");
const updatedInfo = document.getElementById("updated");
const status = document.getElementById("status");
const swapButton = document.getElementById("swapButton");
const clearButton = document.getElementById("clearButton");

const convertTab = document.getElementById("convertTab");
const calculatorTab = document.getElementById("calculatorTab");
const convertPanel = document.getElementById("convertPanel");
const calculatorPanel = document.getElementById("calculatorPanel");

const calculatorCurrency = document.getElementById("calculatorCurrency");
const calculatorExpression = document.getElementById("calculatorExpression");
const calculatorResult = document.getElementById("calculatorResult");
const calculatorYen = document.getElementById("calculatorYen");
const calculatorRate = document.getElementById("calculatorRate");

let currentRate = null;
let calculatorRateValue = null;
let calculatorBase = "USD";

let calcDisplay = "0";
let calcFirstValue = null;
let calcOperator = null;
let calcWaitingForNumber = false;
let calcExpression = "0";
let calcFinished = false;

// 数値を通貨形式で表示
function formatCurrency(value, currency) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(value);
}

// 通貨変換
function convert() {
  const amount = Number(amountInput.value);

  if (
    amountInput.value.trim() === "" ||
    !Number.isFinite(amount) ||
    amount < 0 ||
    currentRate === null
  ) {
    result.textContent = "---";
    return;
  }

  result.textContent = formatCurrency(
    amount * currentRate,
    toCurrency.value
  );
}

// 為替レート取得
async function fetchRate(from, to) {
  if (from === to) {
    return { rate: 1, date: "同じ通貨" };
  }

  const response = await fetch(
    `https://api.frankfurter.dev/v2/rate/${from.toLowerCase()}/${to.toLowerCase()}`
  );

  if (!response.ok) {
    throw new Error("為替レートを取得できませんでした");
  }

  const data = await response.json();

  return {
    rate: data.rate,
    date: data.date
  };
}

// 通貨変換画面のレート取得
async function getExchangeRate() {
  const from = fromCurrency.value;
  const to = toCurrency.value;

  status.textContent = "";
  rateInfo.textContent = "為替レートを取得しています...";
  updatedInfo.textContent = "";
  currentRate = null;
  result.textContent = "---";

  try {
    const data = await fetchRate(from, to);
    currentRate = data.rate;

    rateInfo.textContent =
      `1 ${from} = ${new Intl.NumberFormat("ja-JP", {
        maximumFractionDigits: 5
      }).format(data.rate)} ${to}`;

    updatedInfo.textContent =
      data.date === "同じ通貨" ? data.date : `基準日：${data.date}`;

    convert();
  } catch (error) {
    rateInfo.textContent = "為替レートを取得できませんでした";
    status.textContent = "通信環境を確認して、もう一度お試しください。";
    console.error(error);
  }
}

// 電卓画面の為替レート取得
async function getCalculatorRate() {
  const currency = calculatorCurrency.value;

  calculatorBase = currency;
  calculatorRateValue = null;
  calculatorYen.textContent = "為替レートを取得しています...";
  calculatorRate.textContent = "";

  try {
    const data = await fetchRate(currency, "JPY");

    // 取得中に通貨が変更されていたら古い結果を使わない
    if (calculatorCurrency.value !== currency) return;

    calculatorRateValue = data.rate;
    updateCalculatorDisplay();

    calculatorRate.textContent =
      `1 ${currency} = ${new Intl.NumberFormat("ja-JP", {
        maximumFractionDigits: 5
      }).format(data.rate)} JPY / 基準日：${data.date}`;
  } catch (error) {
    if (calculatorCurrency.value !== currency) return;

    calculatorYen.textContent = "為替レートを取得できませんでした";
    calculatorRate.textContent = "通信環境を確認してください。";
    console.error(error);
  }
}

// 電卓表示更新
function updateCalculatorDisplay() {
  calculatorExpression.textContent = calcExpression;
  calculatorResult.textContent = calcDisplay;

  const value = Number(calcDisplay);

  if (calculatorRateValue === null || !Number.isFinite(value)) {
    calculatorYen.textContent = "---";
    return;
  }

  calculatorYen.textContent = formatCurrency(
    value * calculatorRateValue,
    "JPY"
  );
}

// 数字入力
function inputNumber(value) {
  if (calcWaitingForNumber || calcFinished) {
    calcDisplay = value === "." ? "0." : value;
    calcWaitingForNumber = false;
    calcFinished = false;
  } else if (value === ".") {
    if (!calcDisplay.includes(".")) {
      calcDisplay += ".";
    }
  } else {
    calcDisplay =
      calcDisplay === "0" ? value : calcDisplay + value;
  }

  updateCalculatorDisplay();
}

// 四則演算
function calculate(first, second, operator) {
  switch (operator) {
    case "+":
      return first + second;
    case "−":
      return first - second;
    case "×":
      return first * second;
    case "÷":
      if (second === 0) {
        throw new Error("0では割れません");
      }
      return first / second;
    default:
      return second;
  }
}

// 演算子入力
function inputOperator(operator) {
  const inputValue = Number(calcDisplay);

  if (calcOperator && !calcWaitingForNumber) {
    try {
      calcFirstValue = calculate(
        calcFirstValue,
        inputValue,
        calcOperator
      );
      calcDisplay = String(Number(calcFirstValue.toPrecision(12)));
    } catch (error) {
      calcDisplay = "エラー";
      calcExpression = "0では割れません";
      calcOperator = null;
      updateCalculatorDisplay();
      return;
    }
  } else {
    calcFirstValue = inputValue;
  }

  calcOperator = operator;
  calcWaitingForNumber = true;
  calcFinished = false;
  calcExpression = `${calcDisplay} ${operator}`;

  updateCalculatorDisplay();
}

// 計算実行
function calculateResult() {
  if (calcOperator === null || calcWaitingForNumber) return;

  try {
    const secondValue = Number(calcDisplay);
    const firstValue = calcFirstValue;
    const operator = calcOperator;

    const answer = calculate(firstValue, secondValue, operator);

    if (!Number.isFinite(answer)) {
      throw new Error("計算できません");
    }

    const formattedAnswer = Number(answer.toPrecision(12));

    calcExpression =
      `${firstValue} ${operator} ${secondValue} =`;

    calcDisplay = String(formattedAnswer);
    calcFirstValue = null;
    calcOperator = null;
    calcWaitingForNumber = true;
    calcFinished = true;

    updateCalculatorDisplay();
  } catch (error) {
    calcDisplay = "エラー";
    calcExpression = error.message;
    calcOperator = null;
    updateCalculatorDisplay();
  }
}

// 全消去
function clearCalculator() {
  calcDisplay = "0";
  calcFirstValue = null;
  calcOperator = null;
  calcWaitingForNumber = false;
  calcFinished = false;
  calcExpression = "0";

  updateCalculatorDisplay();
}

// 1文字削除
function backspaceCalculator() {
  if (calcWaitingForNumber || calcFinished) return;

  calcDisplay =
    calcDisplay.length <= 1
      ? "0"
      : calcDisplay.slice(0, -1);

  if (calcDisplay === "-") calcDisplay = "0";

  updateCalculatorDisplay();
}

// 電卓ボタンの操作
document.querySelectorAll(".calc-key").forEach(button => {
  button.addEventListener("click", () => {
    const value = button.dataset.value;
    const action = button.dataset.action;

    if (action === "clear") {
      clearCalculator();
    } else if (action === "backspace") {
      backspaceCalculator();
    } else if (action === "equals") {
      calculateResult();
    } else if (["+", "−", "×", "÷"].includes(value)) {
      inputOperator(value);
    } else {
      inputNumber(value);
    }
  });
});

// タブ切り替え
function showPanel(panel) {
  const isCalculator = panel === "calculator";

  convertPanel.hidden = isCalculator;
  calculatorPanel.hidden = !isCalculator;

  convertTab.classList.toggle("active", !isCalculator);
  calculatorTab.classList.toggle("active", isCalculator);

  if (isCalculator && calculatorRateValue === null) {
    getCalculatorRate();
  }
}

convertTab.addEventListener("click", () => showPanel("convert"));
calculatorTab.addEventListener("click", () => showPanel("calculator"));

// 通貨変換のイベント
amountInput.addEventListener("input", convert);

fromCurrency.addEventListener("change", getExchangeRate);
toCurrency.addEventListener("change", getExchangeRate);

swapButton.addEventListener("click", () => {
  const temp = fromCurrency.value;
  fromCurrency.value = toCurrency.value;
  toCurrency.value = temp;
  getExchangeRate();
});

clearButton.addEventListener("click", () => {
  amountInput.value = "";
  convert();
  amountInput.focus();
});

// 電卓の通貨変更
calculatorCurrency.addEventListener("change", getCalculatorRate);

// 初回起動
getExchangeRate();
updateCalculatorDisplay();

