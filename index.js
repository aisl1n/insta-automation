const puppeteer = require("puppeteer");
const fs = require("fs");
require("dotenv").config();
const path = require("path");

(async () => {
  // Iniciar o navegador
  const browser = await puppeteer.launch({ headless: false }); // Headless false para ver a automação em ação
  const page = await browser.newPage();

  // Navegar até a página de login do Instagram
  await page.goto("https://www.instagram.com/accounts/login/", { waitUntil: "networkidle2" });

  // Esperar pelos campos de login e senha
  await page.waitForSelector('input[name="username"]');
  await page.waitForSelector('input[name="password"]');

  // Preencher os campos de login
  await page.type('input[name="username"]', process.env.INSTA_USER, { delay: 50 });
  await page.type('input[name="password"]', process.env.INSTA_PASSWORD, { delay: 50 });

  // Clicar no botão de login
  await page.click('button[type="submit"]');

  // Esperar a página carregar após o login
  await page.waitForNavigation({ waitUntil: "networkidle2" });

  // Navegar até os stories
  await page.goto("https://www.instagram.com/stories/certoatacadoevarejo/", { waitUntil: "networkidle2" });

  // Clica no botão de ver story
  const botaoVerStory = await page.waitForSelector("::-p-xpath(//div[contains(text(), 'Ver story')])");
  await botaoVerStory.click();

  await new Promise((resolve) => setTimeout(resolve, 2000));

  const ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  };

  const captureStoryScreenshot = async (index) => {
    const storyElement = await page.$("section > div"); // Seletor que identifica o story
    if (storyElement) {
      // Define o caminho da pasta e o nome do arquivo
      const dirPath = path.join(__dirname, "mercados/certoAtacado");
      const filePath = path.join(dirPath, `story_${index}.png`);

      // Garante que a pasta exista
      ensureDirectoryExists(dirPath);

      // Captura o screenshot e salva na pasta
      await storyElement.screenshot({ path: filePath });
      console.log(`Screenshot do story ${index} capturada em ${filePath}!`);
    } else {
      console.log("Elemento do story não encontrado.");
    }
  };

  let index = 1;
  while (true) {
    // Esperar 1 segundo para o próximo story
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Capturar o screenshot do story atual
    await captureStoryScreenshot(index);

    // Verificar se há a seta de próximo story
    const nextButton = await page.waitForSelector("::-p-xpath(//*[@aria-label='Avançar'])");

    if (nextButton.isVisible()) {
      // Clicar na seta de próximo story
      await nextButton.click();
      index++;
    } else {
      // Sair do loop se não houver mais stories
      console.log("Não há mais stories.");
      break;
    }
  }

  // Fechar o navegador
  await browser.close();
})();
