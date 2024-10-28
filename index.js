

const { chromium } = require("playwright");
const fs = require('fs');
const { performance } = require('perf_hooks');
const scriptStartTime = performance.now();
async function sortHackerNewsArticles() {
  console.time('Script Execution Time');

  // Launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Go to Hacker News
  await page.goto("https://news.ycombinator.com/newest");

  const articles = [];

  let pageNumber = 1; // Track pages for screenshot names
  while (articles.length < 100) {
    console.log(`Fetching page ${pageNumber}...`);
    
    // Extract article data from the current page
    const pageArticles = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.athing'));
      return rows.map(row => {
        const id = row.id;
        const title = row.querySelector('.titleline a').textContent;
        const ageElement = row.nextElementSibling.querySelector('.age');
        const age = ageElement ? ageElement.textContent : '';
        return { id, title, age };
      });
    });

    articles.push(...pageArticles);

    // Capture a screenshot for each page loaded
    await page.screenshot({ path: `screenshot-page-${pageNumber}.png` });
    console.log(`Captured screenshot-page-${pageNumber}.png`);

    // Click on 'More' link to go to next page
    const moreLink = await page.$('a.morelink');
    if (moreLink && articles.length < 100) {
      await moreLink.click(); // Playwright will wait automatically for the navigation
      pageNumber++;
    } else {
      break;
    }
  }

  // Limit to first 100 articles
  const first100Articles = articles.slice(0, 100);
  const numberOfArticles = first100Articles.length; // Capture the count

  // Utility function to convert age strings to minutes
  function ageToMinutes(ageString) {
    const parts = ageString.trim().split(' ');
    const value = parseFloat(parts[0]);
    const unit = parts[1];

    if (isNaN(value)) return 0;

    if (unit.startsWith('minute')) {
      return value;
    } else if (unit.startsWith('hour')) {
      return value * 60;
    } else if (unit.startsWith('day')) {
      return value * 60 * 24;
    } else if (unit.startsWith('month')) {
      return value * 60 * 24 * 30; // approximate
    } else if (unit.startsWith('year')) {
      return value * 60 * 24 * 365; // approximate
    } else {
      return 0;
    }
  }

  // Function to compare visual order
  function compareVisualOrder(articles) {
    console.log("Checking visual order based on timestamps on the page:");
    let isVisuallySorted = true;

    for (let i = 0; i < articles.length - 1; i++) {
      const checkNumber = i + 1;
      const currentArticle = articles[i];
      const nextArticle = articles[i + 1];

      // Convert age strings to minutes
      const currentAgeMinutes = ageToMinutes(currentArticle.age);
      const nextAgeMinutes = ageToMinutes(nextArticle.age);

      const diffMinutes = currentAgeMinutes - nextAgeMinutes;

      const currentTitle = `"${currentArticle.title.split(' ').slice(0, 3).join(' ')}..."`;
      const nextTitle = `"${nextArticle.title.split(' ').slice(0, 3).join(' ')}..."`;

      if (diffMinutes < 0) {
        // Correct order: current article is newer than the next one
        console.log(`VISUAL CHECK #${checkNumber}: ${currentTitle} was posted ${Math.abs(diffMinutes)} minutes before ${nextTitle}`);
      } else if (diffMinutes === 0) {
        // Articles have the same timestamp
        console.log(`VISUAL CHECK #${checkNumber}: ${currentTitle} was posted before or at the same time as ${nextTitle}`);
      } else {
        // Incorrect order: current article is older than the next one
        isVisuallySorted = false;
        console.log(`VISUAL CHECK FAILURE #${checkNumber}: ${currentTitle} is ${diffMinutes} minutes older than ${nextTitle}`);
      }
    }

    if (isVisuallySorted) {
      console.log("All articles are in correct visual order based on the timestamps on the page.");
    } else {
      console.log("Some articles are out of order based on the visual timestamps on the page.");
    }

    return isVisuallySorted;
  }

  // Function to fetch API data with retry mechanism
  async function fetchWithRetry(url, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch');
        return await response.json();
      } catch (error) {
        if (i === retries - 1) {
          console.error(`Failed to fetch after ${retries} attempts: ${url}`);
          throw error;
        }
        console.log(`Retrying... (${i + 1}/${retries})`);
        await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
      }
    }
  }

  // Function to fetch API data
  async function fetchAPIData(articles) {
    // Fetch Unix timestamps for all articles
    const idToUnixTime = {};

    const fetchPromises = articles.map(article => {
      return fetchWithRetry(`https://hacker-news.firebaseio.com/v0/item/${article.id}.json`)
        .then(data => {
          idToUnixTime[article.id] = data.time;
        })
        .catch(error => {
          console.error(`Error fetching data for article ID ${article.id}:`, error.message);
        });
    });

    await Promise.all(fetchPromises);
    return idToUnixTime;
  }

  // Function to compare API order
  function compareAPIOrder(articles, idToUnixTime) {
    console.log("Checking API timestamps for chronological order:");
    let isChronologicallySorted = true;

    for (let i = 0; i < articles.length - 1; i++) {
      const checkNumber = i + 1;
      const currentArticle = articles[i];
      const nextArticle = articles[i + 1];

      const currentUnixTime = idToUnixTime[currentArticle.id];
      const nextUnixTime = idToUnixTime[nextArticle.id];

      if (currentUnixTime === undefined || nextUnixTime === undefined) {
        console.log(`Skipping comparison for articles with missing data: ${currentArticle.id}, ${nextArticle.id}`);
        continue;
      }

      const timeDiffSeconds = currentUnixTime - nextUnixTime;

      const currentTitle = `"${currentArticle.title.split(' ').slice(0, 3).join(' ')}..."`;
      const nextTitle = `"${nextArticle.title.split(' ').slice(0, 3).join(' ')}..."`;

      if (timeDiffSeconds > 0) {
        // Correct order: current article is newer than the next one
        console.log(`API CHECK #${checkNumber}: ${currentTitle} was posted ${timeDiffSeconds} seconds before ${nextTitle}`);
      } else if (timeDiffSeconds === 0) {
        // Articles have the same timestamp
        console.log(`API CHECK #${checkNumber}: ${currentTitle} was posted at the same time as ${nextTitle}`);
      } else {
        // Incorrect order: current article is older than the next one
        isChronologicallySorted = false;
        console.log(`API CHECK FAILURE #${checkNumber}: ${currentTitle} is ${Math.abs(timeDiffSeconds)} seconds older than ${nextTitle}`);
      }
    }

    if (isChronologicallySorted) {
      console.log("All articles are in correct chronological order based on the API timestamps.");
    } else {
      console.log("Some articles are out of order based on the API timestamps.");
    }

    return isChronologicallySorted;
  }

  // Compare visual order
  const visuallySorted = compareVisualOrder(first100Articles);

  // Fetch API data
  const idToUnixTime = await fetchAPIData(first100Articles);

  // Compare API order
  const chronologicallySorted = compareAPIOrder(first100Articles, idToUnixTime);

  // Generate HTML report

  const visualCheckResult = visuallySorted ? 'Yes' : 'No';
  const apiCheckResult = chronologicallySorted ? 'Yes' : 'No';
  // Calculate execution time if you have it
  const executionTime = ((performance.now() - scriptStartTime) / 1000).toFixed(2); // in seconds
  

  function generateHTMLReport(visuallySorted, chronologicallySorted) {
    const html = `
    <html>
      <head>
        <title>Hacker News Article Order Test Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; }
          p { font-size: 16px; }
          .result { font-weight: bold; }
          .pass { color: green; }
          .fail { color: red; }
          .screenshot { max-width: 100%; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>Hacker News Article Order Test Report (First 100 Articles)</h1>
        <p>Number of Articles Checked: ${numberOfArticles}</p>
        <p>Visual Check Passed: <span class="result ${visuallySorted ? 'pass' : 'fail'}">${visualCheckResult}</span></p>
        <p>API Check Passed: <span class="result ${chronologicallySorted ? 'pass' : 'fail'}">${apiCheckResult}</span></p>
        <p>Total Execution Time: ${executionTime} seconds</p>
        <h2>Screenshots</h2>
        ${Array.from({ length: pageNumber }, (_, i) => `
          <div>
            <p>Screenshot Page ${i + 1}</p>
            <img src="screenshot-page-${i + 1}.png" alt="Screenshot Page ${i + 1}" class="screenshot"/>
          </div>
        `).join('')}
      </body>
    </html>
  `;
    fs.writeFileSync('report.html', html);
    console.log('Report saved to report.html');
  }

  generateHTMLReport(visuallySorted, chronologicallySorted);

  // Show final result with the number of articles checked
  if (visuallySorted && chronologicallySorted && numberOfArticles === 100) {
    console.log(`Both visual and API checks passed. The ${numberOfArticles} articles checked are in correct chronological order.`);
  } else {
    console.log(`Some checks failed. Only ${numberOfArticles} articles were checked. Please review the console logs for details.`);
  }

  // Close browser
  await browser.close();

  console.timeEnd('Script Execution Time');
}

(async () => {
  await sortHackerNewsArticles();
})();
