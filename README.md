# Hacker News Article Order Validation

This project is a Node.js script using Playwright to scrape the latest 100 articles from the Hacker News "Newest" section and validate their chronological order based on visual timestamps and API data. It generates an HTML report summarizing the validation results, including screenshots of each page scraped.

## Features

- **Visual Order Validation**: The script checks whether the articles are visually ordered based on the timestamps displayed on the Hacker News website.
- **API Data Validation**: It fetches timestamps from the Hacker News API to ensure articles are chronologically ordered based on actual post times.
- **Screenshot Capture**: Each page loaded is saved as a screenshot to help visualize the validation process.
- **HTML Report**: A detailed report is generated with the results of both visual and API validation, along with screenshots of each page scraped.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Generated Report](#generated-report)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [Future Enhancements](#future-enhancements)
- [License](#license)

## Installation

1. **Clone the repository**:

    ```bash
    git clone https://github.com/titomazzetta/hacker-news-order-validation.git
    cd hacker-news-order-validation
    ```

2. **Install dependencies**:

    Use npm to install the necessary Node.js packages, including Playwright:

    ```bash
    npm install
    ```

3. **Install Playwright browsers**:

    Playwright requires browser binaries to execute tests. Install them with the following command:

    ```bash
    npx playwright install
    ```

## Usage

1. **Run the script**:

    To execute the script and validate the order of articles on Hacker News, run the following command:

    ```bash
    node hacker-news-scraper.js
    ```

    This command will open a browser, scrape the "Newest" page on Hacker News, and validate the article order based on both visual timestamps and API data.

2. **Output**:
   - **Screenshots**: The script captures a screenshot of each page it scrapes, saved as `screenshot-page-X.png` in the project directory.
   - **HTML Report**: An `report.html` file is generated, containing the results of the visual and API validation checks.

## Generated Report

The script generates an `report.html` file containing:
- **Number of Articles Checked**: The total number of articles validated (up to 100).
- **Visual Check Results**: Whether the articles are ordered correctly based on the timestamps shown on the webpage.
- **API Check Results**: Whether the articles are ordered correctly based on the actual post times retrieved from the Hacker News API.
- **Execution Time**: Total time taken to run the script.
- **Screenshots**: Each page screenshot is displayed in the report for reference.

### Example Report:

```html
<html>
  <head>
    <title>Hacker News Article Order Test Report</title>
  </head>
  <body>
    <h1>Hacker News Article Order Test Report (First 100 Articles)</h1>
    <p>Number of Articles Checked: 100</p>
    <p>Visual Check Passed: Yes</p>
    <p>API Check Passed: No</p>
    <p>Total Execution Time: 35.45 seconds</p>
    <h2>Screenshots</h2>
    <!-- Screenshots displayed here -->
  </body>
</html>

## Project Structure

```plaintext
.
├── node_modules/               # Node.js packages
├── screenshots/                # Captured screenshots for each page
├── hacker-news-scraper.js       # Main Playwright script
├── package.json                # Project dependencies and metadata
├── report.html                 # Generated HTML report with validation results
└── README.md                   # Project documentation

## Technologies Used

- **Node.js**: JavaScript runtime for executing the script.
- **Playwright**: Automation tool for browser interaction, data scraping, and screenshot capture.
- **Hacker News API**: Used to retrieve Unix timestamps for articles for validation against visual timestamps.

## Future Enhancements

- **Parallel API Requests**: Improve performance by fetching API data for articles in parallel instead of sequentially.
- **Error Handling**: Enhance error handling to better manage failed API requests and network issues.
- **Interactive Report**: Add interactivity to the HTML report, such as expandable sections and more detailed metrics.
- **Browser Compatibility**: Extend support to headless browsers for faster execution and more automated deployment environments.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
