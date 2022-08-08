const puppeteer = require("puppeteer");
const { Telegraf } = require("telegraf");
const fs = require("fs");
const { format } = require("date-fns");
const pt = require("date-fns/locale/pt");
require("dotenv").config();

const STATE = "PA";
const CITY = "4717"; // 4717 - JACUNDA
const URL =
  "https://venda-imoveis.caixa.gov.br/sistema/busca-imovel.asp?sltTipoBusca=imoveis";

const bot = new Telegraf(process.env.BOT_TOKEN);
const chatId = process.env.CHAT_ID;

bot.start((ctx) => {
  console.log(ctx.from.id);
  ctx.reply(ctx.chat.id);
});
bot.launch();

async function start() {
  // const browser = await puppeteer.launch({
  //   headless: false,
  //   executablePath:
  //     "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  // });
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.goto(URL);
  await page.select("#cmb_estado", STATE);
  await page.waitForSelector(`option[value="${CITY}"]`);
  await page.select("#cmb_cidade", CITY);
  await page.waitForTimeout(1000);
  const nextButton = await page.$x("//button[contains(text(), ' Próximo')]");
  await nextButton[0].click();
  const nextButton2 = await page.$x("//button[contains(text(), ' Próximo')]");
  await nextButton2[1].click();
  await page.waitForSelector("span > b");
  const auctions = await page.$x("//b[contains(text(), 'Imóvel em disputa')]");

  if (auctions.length) {
    await page.evaluate((element) => {
      element.scrollIntoView();
    }, auctions[0]);
    const nameImage = `${new Date().getTime()}.png`;
    const pathImage = `${__dirname}/screenshots/${nameImage}`;
    await page.screenshot({
      path: pathImage,
    });

    await bot.telegram.sendPhoto(chatId, { source: pathImage });
    await bot.telegram.sendMessage(
      chatId,
      `Uma nova casa está sendo anunciada!!! Busca realizada em ${format(
        new Date(),
        "PPPP",
        {
          locale: pt,
        }
      )}`
    );
    fs.unlinkSync(pathImage);
  }

  await browser.close();
}

start();
