import * as micro from 'micro';
import * as puppeteer from 'puppeteer';
import * as fs from 'mz/fs';

const ID_PARSE = /^\/(\w+)$/;
const FIVE_MINTUE = 5 * 60 * 1000;
const DEFAULT_ERR = 'Invalid id';

function getFilePath(id: string): string {
  return `/tmp/${id}.png`;
}

async function createRankings(id: string, target: string): Promise<boolean> {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();
  page.setViewport({ width: 480, height: 1080, deviceScaleFactor: 1 });

  const url = `https://www.warcraftlogs.com/reports/${id}/#view=rankings&boss=-2&difficulty=0&wipes=2`;
  await page.goto(url, { waitUntil: 'networkidle2' });

  const ele = await page.$('.report-rankings-tab-content');
  if (!ele) return false;

  await ele.screenshot({ path: target });
  browser.close();

  return true;
}

const server = micro.default(async (req, res) => {
  const url = req.url;
  const match = url!.match(ID_PARSE);
  if (!match) return micro.send(res, 400, DEFAULT_ERR);

  const id = match[1];
  const filePath = getFilePath(id);

  if (!(await fs.exists(filePath))) {
    const created = await createRankings(id, filePath);
    if (!created) return micro.send(res, 400, DEFAULT_ERR);

    setTimeout(() => fs.unlink(filePath), FIVE_MINTUE);
  }

  const fileStream = fs.createReadStream(filePath);

  res.setHeader('Content-Type', 'image/png');
  micro.send(res, 200, fileStream);
});

server.listen(3000);

process.on('unhandledRejection', err => {
  console.warn(err);
  process.exit(1);
});
