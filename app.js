
const fromCurrency = document.getElementById("fromCurrency");
const toCurrency = document.getElementById("toCurrency");
const amountInput = document.getElementById("amount");
const result = document.getElementById("result");
const rateInfo = document.getElementById("rate");
const updatedInfo = document.getElementById("updated");
const status = document.getElementById("status");
const swapButton = document.getElementById("swapButton");

let currentRate = null;

// 金額を換算して画面に表示
function convert() {
  const amount = Number(amountInput.value);

  if (amountInput.value.trim() === "" || !Number.isFinite(amount) || amount < 0) {
    result.textContent = "---";
    return;
  }

  if (currentRate === null) {
    result.textContent = "---";
    return;
  }

  const converted = amount * currentRate;

  result.textContent = new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: toCurrency.value,
    maximumFractionDigits: 2
  }).format(converted);
}

// APIから為替レートを取得
async function getExchangeRate() {
  const from = fromCurrency.value.toLowerCase();
  const to = toCurrency.value.toLowerCase();

  status.textContent = "";
  rateInfo.textContent = "為替レートを取得しています...";
  updatedInfo.textContent = "";
  result.textContent = "---";

  if (from === to) {
    currentRate = 1;
    rateInfo.textContent = `1 ${from.toUpperCase()} = 1 ${to.toUpperCase()}`;
    updatedInfo.textContent = "同じ通貨";
    convert();
    return;
  }

  try {
    const response = await fetch(
      `https://api.frankfurter.dev/v2/rate/${from}/${to}`
    );

    if (!response.ok) {
      throw new Error("為替レートを取得できませんでした");
    }

    const data = await response.json();

    currentRate = data.rate;

    rateInfo.textContent =
      `1 ${data.base} = ${new Intl.NumberFormat("ja-JP", {
        maximumFractionDigits: 5
      }).format(data.rate)} ${data.quote}`;

    updatedInfo.textContent = `基準日：${data.date}`;

    convert();

  } catch (error) {
    currentRate = null;
    result.textContent = "---";
    rateInfo.textContent = "為替レートを取得できませんでした";
    status.textContent = "通信環境を確認して、もう一度お試しください。";
    console.error(error);
  }
}

// 金額入力時
amountInput.addEventListener("input", convert);

// 通貨変更時
fromCurrency.addEventListener("change", getExchangeRate);
toCurrency.addEventListener("change", getExchangeRate);

// 通貨の入れ替え
swapButton.addEventListener("click", () => {
  const temp = fromCurrency.value;
  fromCurrency.value = toCurrency.value;
  toCurrency.value = temp;

  getExchangeRate();
});

// 初回起動
getExchangeRate();

const clearButton = document.getElementById("clearButton");

clearButton.addEventListener("click", () => {
  amountInput.value = "";
  convert();
  amountInput.focus();
});
