const rawDataHead = document.querySelector('#raw-data-head');
const rawDataTable = document.querySelector('#raw-data-table');
const cleanDataHead = document.querySelector('#clean-data-head');
const cleanDataTable = document.querySelector('#clean-data-table');
const runDemoButton = document.querySelector('#run-live-demo');
const csvUpload = document.querySelector('#csv-upload');
const demoStatus = document.querySelector('#live-demo-status');
const rowsMetric = document.querySelector('#live-revenue');
const columnsMetric = document.querySelector('#live-forecast');
const relationshipMetric = document.querySelector('#live-anomaly');
const aiQualityScore = document.querySelector('#ai-quality-score');
const aiInsights = document.querySelector('#ai-insights');
const dashboardCanvas = document.querySelector('#dataset-dashboard-chart');
const dashboardBars = document.querySelector('#dataset-dashboard-bars');
const dashboardChartTitle = document.querySelector('#dashboard-chart-title');
const dashboardChartSummary = document.querySelector('#dashboard-chart-summary');
const chartTopSegment = document.querySelector('#chart-top-segment');
const chartVisibleTotal = document.querySelector('#chart-visible-total');
const chartKpiTotal = document.querySelector('#chart-kpi-total');
const chartKpiAverage = document.querySelector('#chart-kpi-average');
const chartKpiShare = document.querySelector('#chart-kpi-share');
const segmentShareChart = document.querySelector('#segment-share-chart');
const qualityGaugeChart = document.querySelector('#quality-gauge-chart');
const monthlyTrendChart = document.querySelector('#monthly-trend-chart');
const segmentShareSummary = document.querySelector('#segment-share-summary');
const qualityGaugeSummary = document.querySelector('#quality-gauge-summary');
const monthlyTrendSummary = document.querySelector('#monthly-trend-summary');
const compareYearSelect = document.querySelector('#compare-year-select');
const compareMeasureSelect = document.querySelector('#compare-measure-select');
const compareCategorySelect = document.querySelector('#compare-category-select');
const compareChartTitle = document.querySelector('#compare-chart-title');
const compareChartSummary = document.querySelector('#compare-chart-summary');
const yearComparisonChart = document.querySelector('#year-comparison-chart');
const segmentComparisonChart = document.querySelector('#segment-comparison-chart');
const yearComparisonSummary = document.querySelector('#year-comparison-summary');
const segmentComparisonSummary = document.querySelector('#segment-comparison-summary');
const compareBestPeriod = document.querySelector('#compare-best-period');
const compareWeakPeriod = document.querySelector('#compare-weak-period');
const compareGrowthRate = document.querySelector('#compare-growth-rate');
const compareFocusNote = document.querySelector('#compare-focus-note');
const modelForecast = document.querySelector('#model-forecast');
const modelAnomalies = document.querySelector('#model-anomalies');
const modelConfidence = document.querySelector('#model-confidence');
const decisionReadiness = document.querySelector('#decision-readiness');
const decisionOpportunity = document.querySelector('#decision-opportunity');
const decisionRisk = document.querySelector('#decision-risk');
const decisionAction = document.querySelector('#decision-action');
const decisionTopDriver = document.querySelector('#decision-top-driver');
const decisionWeakArea = document.querySelector('#decision-weak-area');
const decisionTrendSignal = document.querySelector('#decision-trend-signal');
const decisionNote = document.querySelector('#decision-note');
const qualityCompleteness = document.querySelector('#quality-completeness');
const qualityDuplicates = document.querySelector('#quality-duplicates');
const qualityModelReady = document.querySelector('#quality-model-ready');
const pbiLatestMonth = document.querySelector('#pbi-latest-month');
const pbiMonthlyKpi = document.querySelector('#pbi-monthly-kpi');
const pbiMomChange = document.querySelector('#pbi-mom-change');
const pbiAverageMonthly = document.querySelector('#pbi-average-monthly');
const datasetRelationshipCount = document.querySelector('#dataset-relationship-count');
const datasetRelationshipSummary = document.querySelector('#dataset-relationship-summary');
const analysisFiles = document.querySelector('#analysis-files');
const analysisShape = document.querySelector('#analysis-shape');
const analysisChartReady = document.querySelector('#analysis-chart-ready');
const columnIdentitySummary = document.querySelector('#column-identity-summary');
const columnIdentityList = document.querySelector('#column-identity-list');
const workflowButtons = document.querySelectorAll('[data-stage-button]');
const workflowPanels = document.querySelectorAll('[data-stage-panel]');
const analysisLoadingOverlay = document.querySelector('#analysis-loading-overlay');
const analysisLoadingTitle = document.querySelector('#analysis-loading-title');
const analysisLoadingDetail = document.querySelector('#analysis-loading-detail');

const MAX_BROWSER_ROWS = 3000;
const MAX_HEADER_SCAN_ROWS = 20;
const MAX_RELATIONSHIP_VALUES = 1200;

const sampleCsv = `order_id,date,category,quantity,unit_price,region
 A-1001 ,2026/01/05,laptop,2,54000,South
A-1002,06-01-2026,Mobile,1,28500,West
A-1003,2026-01-07,Laptop,,62000,South
A-1002,06-01-2026,Mobile,1,28500,West
A-1004,2026-02-02,Accessories,5,1200,North
A-1005,bad-date,Tablet,3,18000,East
A-1006,2026-02-09,Mobile,4,29200,West`;

const sampleDataset = {
  name: 'sample_sales.csv',
  ...parseCsv(sampleCsv),
};
let activeDataset = sampleDataset;
let activeDatasets = [sampleDataset];
let activeCleaned = null;
let activeAnalysis = null;
let activeDatasetRelationships = [];

function updateStatus(message) {
  if (demoStatus) demoStatus.textContent = message;
}

function nextFrame() {
  return new Promise(resolve => window.requestAnimationFrame(() => resolve()));
}

async function showAnalysisLoading(title, detail) {
  if (analysisLoadingTitle) analysisLoadingTitle.textContent = title;
  if (analysisLoadingDetail) analysisLoadingDetail.textContent = detail;
  if (analysisLoadingOverlay) analysisLoadingOverlay.hidden = false;
  document.body.classList.add('is-analysis-loading');
  await nextFrame();
  await nextFrame();
}

function hideAnalysisLoading() {
  if (analysisLoadingOverlay) analysisLoadingOverlay.hidden = true;
  document.body.classList.remove('is-analysis-loading');
}

function setWorkflowStage(stage) {
  workflowButtons.forEach(button => {
    const isActive = button.dataset.stageButton === stage;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-selected', String(isActive));
  });

  workflowPanels.forEach(panel => {
    panel.hidden = panel.dataset.stagePanel !== stage;
  });
}

function isGeneratedEmptyHeader(header) {
  const normalizedHeader = String(header ?? '').trim();
  return !normalizedHeader || /^(unnamed:\s*\d+|__empty|empty)(?:[_\s-]?\d+)?$/i.test(normalizedHeader);
}

function makeUniqueHeader(header, usedHeaders) {
  const baseHeader = header || 'Column';
  const currentCount = usedHeaders.get(baseHeader) || 0;
  usedHeaders.set(baseHeader, currentCount + 1);
  return currentCount ? `${baseHeader} ${currentCount + 1}` : baseHeader;
}

function normalizeCell(value) {
  return String(value ?? '').trim();
}

function isMostlyNumeric(values) {
  const usefulValues = values.filter(Boolean);
  if (!usefulValues.length) return false;
  const numericCount = usefulValues.filter(value => Number.isFinite(Number(value.replace(/,/g, '')))).length;
  return numericCount / usefulValues.length >= 0.7;
}

function scoreHeaderRow(row, nextRows = []) {
  const values = row.map(normalizeCell);
  const usefulValues = values.filter(value => value && !isGeneratedEmptyHeader(value));
  if (!usefulValues.length) return 0;

  const uniqueRatio = new Set(usefulValues.map(value => value.toLowerCase())).size / usefulValues.length;
  const textRatio = usefulValues.filter(value => /[a-z]/i.test(value)).length / usefulValues.length;
  const generatedPenalty = values.filter(isGeneratedEmptyHeader).length * 0.35;
  const numericPenalty = isMostlyNumeric(usefulValues) ? 1.5 : 0;
  const width = Math.max(values.length, 1);
  const followingValueCount = nextRows.slice(0, 3).reduce((total, nextRow) => (
    total + values.reduce((rowTotal, _, index) => rowTotal + (normalizeCell(nextRow[index]) ? 1 : 0), 0)
  ), 0);
  const dataSupport = Math.min(2, followingValueCount / width);

  return (usefulValues.length * 1.2) + (uniqueRatio * 2) + (textRatio * 2) + dataSupport - generatedPenalty - numericPenalty;
}

function detectHeaderRow(rows) {
  const nonEmptyRows = rows.filter(row => row.some(value => normalizeCell(value)));
  const candidates = nonEmptyRows.slice(0, 12).map((row, index, candidateRows) => ({
    index,
    score: scoreHeaderRow(row, candidateRows.slice(index + 1)),
  }));

  if (!candidates.length) return { rawHeaders: [], rawRows: [] };

  const bestCandidate = candidates.reduce((best, candidate) => (
    candidate.score > best.score ? candidate : best
  ), candidates[0]);
  const firstCandidate = candidates[0];
  const firstHasGeneratedHeaders = nonEmptyRows[0].some(isGeneratedEmptyHeader);
  const headerIndex = bestCandidate.index > 0
    && (bestCandidate.score >= firstCandidate.score + 1 || firstHasGeneratedHeaders)
    ? bestCandidate.index
    : 0;

  return {
    rawHeaders: nonEmptyRows[headerIndex],
    rawRows: nonEmptyRows.slice(headerIndex + 1),
  };
}

function normalizeTableRows(rawHeaders, rawRows) {
  const limitedRows = rawRows.slice(0, MAX_BROWSER_ROWS);
  const usedHeaders = new Map();
  const columns = rawHeaders
    .map((header, index) => {
      const values = limitedRows.map(row => row[index] ?? '');
      const hasValue = values.some(value => String(value ?? '').trim() !== '');
      const generatedHeader = isGeneratedEmptyHeader(header);

      if (generatedHeader && !hasValue) return null;

      const cleanHeader = generatedHeader
        ? `Column ${index + 1}`
        : String(header ?? '').trim();

      return {
        index,
        header: makeUniqueHeader(cleanHeader, usedHeaders),
      };
    })
    .filter(Boolean);

  const headers = columns.map(column => column.header);
  const records = limitedRows.map(values => columns.reduce((record, column) => {
    record[column.header] = values[column.index] || '';
    return record;
  }, {}));

  return {
    headers,
    records,
    totalRows: rawRows.length,
    isLimited: rawRows.length > limitedRows.length,
  };
}

function normalizeRecordDataset(records) {
  const limitedRecords = records.slice(0, MAX_BROWSER_ROWS);
  const rawHeaders = Array.from(new Set(records.flatMap(record => Object.keys(record))));
  const usedHeaders = new Map();
  const columns = rawHeaders
    .map(header => {
      const values = limitedRecords.map(record => record[header] ?? '');
      const hasValue = values.some(value => String(value ?? '').trim() !== '');
      const generatedHeader = isGeneratedEmptyHeader(header);

      if (generatedHeader && !hasValue) return null;

      const displayHeader = generatedHeader ? 'Column' : String(header ?? '').trim();
      return {
        source: header,
        header: makeUniqueHeader(displayHeader, usedHeaders),
      };
    })
    .filter(Boolean);

  const headers = columns.map(column => column.header);
  return {
    headers,
    records: limitedRecords.map(record => columns.reduce((normalizedRecord, column) => {
      normalizedRecord[column.header] = record[column.source] ?? '';
      return normalizedRecord;
    }, {})),
    totalRows: records.length,
    isLimited: records.length > limitedRecords.length,
  };
}

function parseDelimited(text, delimiter = ',') {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"' && nextChar === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') index += 1;
      row.push(cell);
      if (row.some(value => value.trim() !== '')) rows.push(row);
      if (rows.length >= MAX_BROWSER_ROWS + MAX_HEADER_SCAN_ROWS) break;
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some(value => value.trim() !== '')) rows.push(row);

  const { rawHeaders, rawRows } = detectHeaderRow(rows);
  return normalizeTableRows(rawHeaders, rawRows);
}

function parseCsv(text) {
  return parseDelimited(text, ',');
}

function parseTsv(text) {
  return parseDelimited(text, '\t');
}

function normalizeJsonRecord(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value).reduce((record, [key, item]) => {
      record[key] = item && typeof item === 'object' ? JSON.stringify(item) : item ?? '';
      return record;
    }, {});
  }

  return { value: value ?? '' };
}

function parseJsonDataset(text) {
  const parsed = JSON.parse(text);
  const rows = Array.isArray(parsed)
    ? parsed
    : Object.values(parsed).find(value => Array.isArray(value)) || [parsed];
  const records = rows.map(normalizeJsonRecord);
  return normalizeRecordDataset(records);
}

function parseExcelDataset(workbook) {
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const sheetRange = window.XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
  const totalRows = Math.max(0, sheetRange.e.r - sheetRange.s.r);
  sheetRange.e.r = Math.min(sheetRange.e.r, sheetRange.s.r + MAX_BROWSER_ROWS + MAX_HEADER_SCAN_ROWS);
  const rows = window.XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    range: window.XLSX.utils.encode_range(sheetRange),
  });
  const { rawHeaders, rawRows } = detectHeaderRow(rows);
  return {
    ...normalizeTableRows(rawHeaders, rawRows),
    totalRows,
    isLimited: totalRows > MAX_BROWSER_ROWS,
  };
}

function combineDatasets(datasets) {
  if (datasets.length === 1) return datasets[0];

  const sourceHeader = 'Source Dataset';
  const headers = Array.from(new Set([
    sourceHeader,
    ...datasets.flatMap(dataset => dataset.headers),
  ]));

  const records = datasets.flatMap(dataset => dataset.records.map(record => headers.reduce((combinedRecord, header) => {
    combinedRecord[header] = header === sourceHeader ? dataset.name : record[header] || '';
    return combinedRecord;
  }, {})));

  return {
    name: `${datasets.length} uploaded datasets`,
    headers,
    records,
    totalRows: datasets.reduce((total, dataset) => total + (dataset.totalRows || dataset.records.length), 0),
    isLimited: datasets.some(dataset => dataset.isLimited),
  };
}

function readAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || '').replace(/^\uFEFF/, ''));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsText(file);
  });
}

function readAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsArrayBuffer(file);
  });
}

async function readDataFile(file) {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.json')) {
    return {
      name: file.name,
      ...parseJsonDataset(await readAsText(file)),
    };
  }

  if (fileName.endsWith('.tsv')) {
    return {
      name: file.name,
      ...parseTsv(await readAsText(file)),
    };
  }

  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    if (!window.XLSX) {
      throw new Error('Excel parser is not available');
    }

    const workbook = window.XLSX.read(await readAsArrayBuffer(file), { type: 'array' });
    return {
      name: file.name,
      ...parseExcelDataset(workbook),
    };
  }

  return {
    name: file.name,
    ...parseCsv(await readAsText(file)),
  };
}

function normalizeValue(value) {
  return String(value ?? '').trim();
}

function parseNumber(value) {
  const normalized = normalizeValue(value).replace(/[$,%\s]/g, '').replace(/,/g, '');
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeKey(value) {
  return normalizeValue(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function columnValueSet(dataset, header) {
  return new Set(dataset.records
    .map(record => normalizeKey(record[header]))
    .filter(Boolean));
}

function detectDatasetRelationships(datasets) {
  if (datasets.length < 2) return [];

  const relationships = [];

  for (let leftIndex = 0; leftIndex < datasets.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < datasets.length; rightIndex += 1) {
      const leftDataset = datasets[leftIndex];
      const rightDataset = datasets[rightIndex];
      const rightHeaderMap = rightDataset.headers.reduce((map, header) => {
        map.set(normalizeKey(header), header);
        return map;
      }, new Map());

      leftDataset.headers.forEach(leftHeader => {
        const rightHeader = rightHeaderMap.get(normalizeKey(leftHeader));
        if (!rightHeader) return;

        const leftValues = columnValueSet(leftDataset, leftHeader);
        const rightValues = columnValueSet(rightDataset, rightHeader);
        const smallestSetSize = Math.min(leftValues.size, rightValues.size);
        const overlapCount = [...leftValues].filter(value => rightValues.has(value)).length;
        const confidence = smallestSetSize ? Math.round((overlapCount / smallestSetSize) * 100) : 0;

        relationships.push({
          leftDataset: leftDataset.name,
          rightDataset: rightDataset.name,
          leftHeader,
          rightHeader,
          overlapCount,
          confidence,
        });
      });
    }
  }

  return relationships
    .filter(relationship => relationship.overlapCount > 0 || relationship.confidence > 0)
    .sort((first, second) => second.confidence - first.confidence || second.overlapCount - first.overlapCount);
}

function parseDateValue(value) {
  const normalized = normalizeValue(value);
  const dateParts = normalized.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  const dateValue = dateParts
    ? `${dateParts[3]}-${dateParts[2]}-${dateParts[1]}`
    : normalized.replace(/\//g, '-');
  const parsed = new Date(dateValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function titleCase(value) {
  const cleanValue = normalizeValue(value).toLowerCase();
  return cleanValue ? cleanValue.charAt(0).toUpperCase() + cleanValue.slice(1) : '';
}

function inferColumnTypes(headers, records) {
  return headers.reduce((types, header) => {
    const values = records.map(record => normalizeValue(record[header])).filter(Boolean);
    const numericCount = values.filter(value => parseNumber(value) !== null).length;
    const dateCount = values.filter(value => parseDateValue(value) !== null).length;

    if (values.length && numericCount / values.length >= 0.7) {
      types[header] = 'number';
    } else if (values.length && dateCount / values.length >= 0.7) {
      types[header] = 'date';
    } else {
      types[header] = 'category';
    }

    return types;
  }, {});
}

function identifyColumnRole(header, type, records) {
  const normalizedHeader = header.toLowerCase();
  const values = records.map(record => normalizeValue(record[header])).filter(Boolean);
  const uniqueCount = new Set(values.map(value => value.toLowerCase())).size;
  const uniqueRatio = values.length ? uniqueCount / values.length : 0;

  if (/id$|_id|code|key|uuid|number|no$/i.test(normalizedHeader) && uniqueRatio > 0.65) {
    return {
      role: 'Identifier',
    };
  }

  if (type === 'date' || /date|month|year|time|period/i.test(normalizedHeader)) {
    return {
      role: 'Date / Time',
    };
  }

  if (/revenue|sales|amount|total|value|profit|income|cost|spend/i.test(normalizedHeader)) {
    return {
      role: 'Business Measure',
    };
  }

  if (/price|rate|unit[_\s-]?price/i.test(normalizedHeader)) {
    return {
      role: 'Price / Rate',
    };
  }

  if (/qty|quantity|units?|volume/i.test(normalizedHeader)) {
    return {
      role: 'Quantity',
    };
  }

  if (/region|city|state|country|location|market|zone/i.test(normalizedHeader)) {
    return {
      role: 'Location Segment',
    };
  }

  if (/category|type|segment|product|department|team|status|channel/i.test(normalizedHeader)) {
    return {
      role: 'Category Segment',
    };
  }

  if (type === 'number') {
    return {
      role: 'Numeric Field',
    };
  }

  if (type === 'category') {
    return {
      role: uniqueRatio > 0.75 ? 'Text / Detail' : 'Category Segment',
    };
  }

  return {
    role: 'General Field',
  };
}

function profileColumn(header, type, records) {
  const values = records.map(record => normalizeValue(record[header]));
  const filledValues = values.filter(Boolean);
  const uniqueValues = new Set(filledValues.map(value => value.toLowerCase()));
  const fillRate = Math.round((filledValues.length / Math.max(1, values.length)) * 100);

  if (type === 'number') {
    const numericValues = filledValues
      .map(parseNumber)
      .filter(value => Number.isFinite(value));
    if (!numericValues.length) {
      return `No usable numeric values found. Fill rate ${fillRate}%, unique values ${uniqueValues.size}.`;
    }

    const total = numericValues.reduce((sum, value) => sum + value, 0);
    const average = total / numericValues.length;
    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);
    return `Rows ${numericValues.length}, total ${formatCompactNumber(total)}, avg ${formatCompactNumber(average)}, min ${formatCompactNumber(min)}, max ${formatCompactNumber(max)}.`;
  }

  if (type === 'date') {
    const dateValues = filledValues
      .map(parseDateValue)
      .filter(Boolean)
      .sort((left, right) => left - right);
    if (!dateValues.length) {
      return `No usable dates found. Fill rate ${fillRate}%, unique values ${uniqueValues.size}.`;
    }

    const firstDate = dateValues[0].toISOString().slice(0, 10);
    const lastDate = dateValues[dateValues.length - 1].toISOString().slice(0, 10);
    return `Date range ${firstDate} to ${lastDate}. Fill rate ${fillRate}%, ${uniqueValues.size} unique values.`;
  }

  const counts = filledValues.reduce((summary, value) => {
    const label = titleCase(value) || 'Unknown';
    summary[label] = (summary[label] || 0) + 1;
    return summary;
  }, {});
  const topValue = Object.entries(counts).sort((left, right) => right[1] - left[1])[0];

  return topValue
    ? `Top value "${topValue[0]}" appears ${topValue[1]} times. Fill rate ${fillRate}%, ${uniqueValues.size} unique values.`
    : `No useful values found. Fill rate ${fillRate}%, ${uniqueValues.size} unique values.`;
}

function cleanDataset(dataset) {
  const types = inferColumnTypes(dataset.headers, dataset.records);
  const seenRows = new Set();
  let duplicateCount = 0;
  let missingCount = 0;

  const cleanedRecords = dataset.records.map(record => {
    const normalizedRecord = {};
    const rowSignature = dataset.headers.map(header => normalizeValue(record[header]).toLowerCase()).join('|');
    const isDuplicate = seenRows.has(rowSignature);

    if (isDuplicate) duplicateCount += 1;
    seenRows.add(rowSignature);

    dataset.headers.forEach(header => {
      const value = normalizeValue(record[header]);
      if (!value) missingCount += 1;

      if (types[header] === 'number') {
        normalizedRecord[header] = parseNumber(value);
      } else if (types[header] === 'date') {
        const parsedDate = parseDateValue(value);
        normalizedRecord[header] = parsedDate ? parsedDate.toISOString().slice(0, 10) : '';
      } else {
        normalizedRecord[header] = titleCase(value);
      }
    });

    normalizedRecord.__status = isDuplicate ? 'Duplicate removed' : 'Cleaned';
    normalizedRecord.__usable = !isDuplicate;
    return normalizedRecord;
  });

  const quantityColumn = dataset.headers.find(header =>
    types[header] === 'number' && /qty|quantity|units?/i.test(header)
  );
  const priceColumn = dataset.headers.find(header =>
    types[header] === 'number' && /price|rate|amount|value/i.test(header)
  );
  const analysisHeaders = [...dataset.headers];

  if (quantityColumn && priceColumn) {
    cleanedRecords.forEach(record => {
      record['Estimated Revenue'] = Number.isFinite(record[quantityColumn]) && Number.isFinite(record[priceColumn])
        ? record[quantityColumn] * record[priceColumn]
        : null;
    });
    types['Estimated Revenue'] = 'number';
    analysisHeaders.push('Estimated Revenue');
  }

  return {
    analysisHeaders,
    types,
    cleanedRecords,
    duplicateCount,
    missingCount,
  };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderTable(headElement, bodyElement, headers, records, status = false) {
  if (!headElement || !bodyElement) return;

  const visibleHeaders = headers.slice(0, 5);
  headElement.innerHTML = visibleHeaders.map(header => `<th>${escapeHtml(header)}</th>`).join('');
  if (status) headElement.innerHTML += '<th>Status</th>';

  if (!records.length) {
    const message = status ? 'Upload a data file or analyze the sample to generate cleaned output.' : 'No rows available.';
    bodyElement.innerHTML = `<tr><td colspan="${visibleHeaders.length + (status ? 1 : 0)}">${message}</td></tr>`;
    return;
  }

  bodyElement.innerHTML = records.slice(0, 6).map(record => `
    <tr>
      ${visibleHeaders.map(header => `<td>${escapeHtml(record[header] ?? '-')}</td>`).join('')}
      ${status ? `<td>${escapeHtml(record.__status)}</td>` : ''}
    </tr>
  `).join('');
}

function renderColumnIdentities(dataset, cleaned) {
  if (!columnIdentityList || !columnIdentitySummary) return;

  const identityItems = dataset.headers.map(header => {
    const type = cleaned.types[header] || 'category';
    const identity = identifyColumnRole(header, type, dataset.records);
    const profile = profileColumn(header, type, dataset.records);
    return {
      header,
      type,
      profile,
      ...identity,
    };
  });

  const importantCount = identityItems.filter(item =>
    /Identifier|Date|Measure|Segment|Quantity|Price|Numeric/.test(item.role)
  ).length;

  columnIdentitySummary.textContent = `${identityItems.length} columns profiled, ${importantCount} useful for analysis.`;
  columnIdentityList.innerHTML = identityItems.map(item => `
    <article class="column-identity-item">
      <div>
        <strong>${escapeHtml(item.header)}</strong>
        <span>${escapeHtml(item.role)} | ${escapeHtml(item.type)}</span>
      </div>
      <p>${escapeHtml(item.profile)}</p>
    </article>
  `).join('');
}

function correlation(xValues, yValues) {
  const pairs = xValues
    .map((value, index) => [value, yValues[index]])
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));

  if (pairs.length < 2) return 0;

  const xAverage = pairs.reduce((total, [x]) => total + x, 0) / pairs.length;
  const yAverage = pairs.reduce((total, [, y]) => total + y, 0) / pairs.length;
  const numerator = pairs.reduce((total, [x, y]) => total + (x - xAverage) * (y - yAverage), 0);
  const xVariance = pairs.reduce((total, [x]) => total + (x - xAverage) ** 2, 0);
  const yVariance = pairs.reduce((total, [, y]) => total + (y - yAverage) ** 2, 0);

  return xVariance && yVariance ? numerator / Math.sqrt(xVariance * yVariance) : 0;
}

function linearRegression(values) {
  const points = values
    .map((value, index) => ({ x: index + 1, y: value }))
    .filter(point => Number.isFinite(point.y));

  if (points.length < 2) {
    return { forecast: null, slope: 0, confidence: 0 };
  }

  const xAverage = points.reduce((total, point) => total + point.x, 0) / points.length;
  const yAverage = points.reduce((total, point) => total + point.y, 0) / points.length;
  const numerator = points.reduce((total, point) => total + (point.x - xAverage) * (point.y - yAverage), 0);
  const denominator = points.reduce((total, point) => total + (point.x - xAverage) ** 2, 0);
  const slope = denominator ? numerator / denominator : 0;
  const intercept = yAverage - slope * xAverage;
  const forecast = intercept + slope * (points.length + 1);
  const residuals = points.map(point => Math.abs(point.y - (intercept + slope * point.x)));
  const averageResidual = residuals.reduce((total, value) => total + value, 0) / residuals.length;
  const confidence = Math.max(0, Math.min(95, Math.round(95 - (averageResidual / Math.max(1, yAverage)) * 100)));

  return { forecast, slope, confidence };
}

function detectAnomalies(values) {
  const cleanValues = values.filter(value => Number.isFinite(value));
  if (cleanValues.length < 3) return [];

  const average = cleanValues.reduce((total, value) => total + value, 0) / cleanValues.length;
  const variance = cleanValues.reduce((total, value) => total + (value - average) ** 2, 0) / cleanValues.length;
  const standardDeviation = Math.sqrt(variance);

  if (!standardDeviation) return [];

  return cleanValues
    .map((value, index) => ({ index, value, zScore: Math.abs((value - average) / standardDeviation) }))
    .filter(point => point.zScore >= 1.6);
}

function columnUniqueRatio(records, column) {
  const values = records.map(record => normalizeValue(record[column])).filter(Boolean);
  if (!values.length) return 0;
  return new Set(values.map(value => value.toLowerCase())).size / values.length;
}

function isIdentifierColumn(column, records) {
  const normalizedColumn = column.toLowerCase();
  const uniqueRatio = columnUniqueRatio(records, column);
  return /(^id$|_id$|id_|order|invoice|uuid|code|key|serial|number|^no$)/i.test(normalizedColumn) && uniqueRatio > 0.55;
}

function isUsefulCategoryColumn(column, records) {
  const normalizedColumn = column.toLowerCase();
  const values = records.map(record => normalizeValue(record[column])).filter(Boolean);
  const uniqueCount = new Set(values.map(value => value.toLowerCase())).size;
  const semanticCategory = /category|segment|region|city|state|country|product|department|team|status|channel|market|zone|type|brand|customer_group/i.test(normalizedColumn);

  if (!values.length || uniqueCount <= 1) return false;
  if (isIdentifierColumn(column, records)) return false;
  if (semanticCategory) return uniqueCount <= Math.max(30, records.length * .8);
  return uniqueCount <= Math.min(30, Math.max(3, records.length * .45));
}

function chooseCategoryColumn(categoryColumns, records) {
  return categoryColumns
    .filter(column => isUsefulCategoryColumn(column, records))
    .sort((left, right) => {
      const score = column => {
        const normalizedColumn = column.toLowerCase();
        let value = 0;
        if (/category|segment|region|product|customer_group|channel|status|market/i.test(normalizedColumn)) value += 30;
        if (/city|state|country|zone|department|team|brand|type/i.test(normalizedColumn)) value += 20;
        value += Math.max(0, 20 - Math.round(columnUniqueRatio(records, column) * 20));
        return value;
      };
      return score(right) - score(left);
    })[0] || null;
}

function chooseBusinessMeasure(numericColumns) {
  const score = column => {
    const normalizedColumn = column.toLowerCase();
    let value = 0;
    if (/estimated.*(revenue|sales|value)|estimated revenue/i.test(normalizedColumn)) value += 100;
    if (/revenue|sales|amount|net_sales|gross_sales/i.test(normalizedColumn)) value += 90;
    if (/profit|margin|income/i.test(normalizedColumn)) value += 80;
    if (/total|value|spend|cost/i.test(normalizedColumn)) value += 65;
    if (/quantity|qty|units|count/i.test(normalizedColumn)) value += 30;
    if (/price|rate|unit_price/i.test(normalizedColumn)) value += 20;
    if (/id|code|key|number|no/i.test(normalizedColumn)) value -= 100;
    return value;
  };

  return numericColumns
    .filter(column => score(column) > -50)
    .sort((left, right) => score(right) - score(left))[0] || numericColumns[0];
}

function formatCompactNumber(value) {
  if (!Number.isFinite(value)) return '--';
  if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toFixed(value % 1 ? 1 : 0);
}

function formatDropdownLabel(value) {
  return String(value || '').replace(/[_-]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}

function prepareCanvas(canvas) {
  const fallbackWidth = Number(canvas.getAttribute('width')) || canvas.width || 320;
  const fallbackHeight = Number(canvas.getAttribute('height')) || canvas.height || 220;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width || fallbackWidth));
  const height = Math.max(1, Math.round(rect.height || fallbackHeight));
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const targetWidth = Math.round(width * pixelRatio);
  const targetHeight = Math.round(height * pixelRatio);

  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }

  canvas.dataset.logicalWidth = String(width);
  canvas.dataset.logicalHeight = String(height);

  const context = canvas.getContext('2d');
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  return { context, width, height };
}

function canvasLogicalWidth(canvas) {
  return Number(canvas?.dataset.logicalWidth) || Number(canvas?.getAttribute('width')) || canvas?.width || 0;
}

function canvasLogicalHeight(canvas) {
  return Number(canvas?.dataset.logicalHeight) || Number(canvas?.getAttribute('height')) || canvas?.height || 0;
}

function setSelectOptions(select, options, selectedValue, fallbackLabel) {
  if (!select) return;
  select.innerHTML = '';

  if (!options.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = fallbackLabel;
    select.append(option);
    select.disabled = true;
    return;
  }

  select.disabled = false;
  options.forEach(value => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = formatDropdownLabel(value);
    option.selected = value === selectedValue;
    select.append(option);
  });
}

function roundedRect(context, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, Math.abs(height) / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

function buildComparisonData(records, dateColumn, categoryColumn, measureColumn, selectedYear = 'all') {
  const yearlyTotals = {};
  const periodTotals = {};
  const segmentTotals = {};
  const availableYears = new Set();

  records.forEach(record => {
    const measure = record[measureColumn];
    if (!Number.isFinite(measure)) return;

    const parsedDate = dateColumn ? parseDateValue(record[dateColumn]) : null;
    const year = parsedDate ? String(parsedDate.getFullYear()) : 'No date';
    const period = parsedDate ? parsedDate.toISOString().slice(0, 7) : 'No date';
    availableYears.add(year);

    yearlyTotals[year] = (yearlyTotals[year] || 0) + measure;
    periodTotals[period] = (periodTotals[period] || 0) + measure;
    if (selectedYear !== 'all' && year !== selectedYear) return;

    const segment = normalizeValue(record[categoryColumn]) || 'Unknown';
    segmentTotals[segment] = (segmentTotals[segment] || 0) + measure;
  });

  return {
    availableYears: Array.from(availableYears).sort(),
    yearData: Object.entries(yearlyTotals)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([label, value]) => ({ label, value })),
    periodData: Object.entries(periodTotals)
      .filter(([label]) => label !== 'No date')
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([label, value]) => ({ label, value })),
    segmentData: Object.entries(segmentTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, value]) => ({ label, value })),
  };
}

function summarizeTrendData(periodData) {
  if (!periodData.length) {
    return {
      best: null,
      weakest: null,
      movement: null,
      movementText: 'Needs date values',
    };
  }

  const sortedByValue = [...periodData].sort((left, right) => right.value - left.value);
  const first = periodData[0];
  const latest = periodData[periodData.length - 1];
  const movement = first.value ? ((latest.value - first.value) / Math.abs(first.value)) * 100 : null;

  return {
    best: sortedByValue[0],
    weakest: sortedByValue[sortedByValue.length - 1],
    movement,
    movementText: movement === null
      ? 'No base period'
      : `${movement >= 0 ? '+' : ''}${movement.toFixed(1)}% from first to latest period`,
  };
}

function buildMonthlyKpis(records, dateColumn, measureColumn) {
  if (!dateColumn || !measureColumn) {
    return null;
  }

  const monthlyTotals = records.reduce((summary, record) => {
    const parsedDate = parseDateValue(record[dateColumn]);
    const measure = record[measureColumn];
    if (!parsedDate || !Number.isFinite(measure)) return summary;

    const monthKey = parsedDate.toISOString().slice(0, 7);
    summary[monthKey] = (summary[monthKey] || 0) + measure;
    return summary;
  }, {});
  const monthEntries = Object.entries(monthlyTotals).sort(([left], [right]) => left.localeCompare(right));

  if (!monthEntries.length) {
    return null;
  }

  const latest = monthEntries[monthEntries.length - 1];
  const previous = monthEntries[monthEntries.length - 2];
  const average = monthEntries.reduce((total, [, value]) => total + value, 0) / monthEntries.length;
  const momChange = previous && previous[1]
    ? ((latest[1] - previous[1]) / Math.abs(previous[1])) * 100
    : null;

  return {
    average,
    latestMonth: latest[0],
    latestValue: latest[1],
    measureColumn,
    momChange,
    monthlyTotals: monthEntries.map(([month, value]) => ({ month, value })),
  };
}

function buildSegmentStats(records, categoryColumn, measureColumn) {
  if (!categoryColumn || !measureColumn) {
    return {
      items: [],
      top: null,
      bottom: null,
      total: 0,
      topShare: 0,
    };
  }

  const grouped = records.reduce((summary, record) => {
    const key = normalizeValue(record[categoryColumn]) || 'Unknown';
    summary[key] = (summary[key] || 0) + (record[measureColumn] || 0);
    return summary;
  }, {});
  const items = Object.entries(grouped)
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value);
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const top = items[0] || null;
  const bottom = items.length > 1 ? items[items.length - 1] : null;

  return {
    items,
    top,
    bottom,
    total,
    topShare: top && total ? Math.round((top.value / total) * 100) : 0,
  };
}

function buildMissingColumnSummary(records, headers) {
  return headers
    .map(header => ({
      header,
      missing: records.filter(record => !normalizeValue(record[header])).length,
    }))
    .filter(item => item.missing > 0)
    .sort((left, right) => right.missing - left.missing)
    .slice(0, 5);
}

function buildDecisionSummary(analysis, cleaned) {
  const segment = analysis.segmentStats;
  const monthly = analysis.monthlyKpis;
  const trendDirection = monthly?.momChange === null || !monthly
    ? 'stable'
    : monthly.momChange > 3
      ? 'up'
      : monthly.momChange < -3
        ? 'down'
        : 'flat';
  const qualityBlockers = [];

  if (cleaned.missingCount) qualityBlockers.push(`${cleaned.missingCount} blank cells`);
  if (cleaned.duplicateCount) qualityBlockers.push(`${cleaned.duplicateCount} duplicate rows`);
  if (!analysis.businessMeasure) qualityBlockers.push('no numeric business measure');
  if (!analysis.firstCategory) qualityBlockers.push('no segment/category field');
  if (!analysis.dateColumns.length) qualityBlockers.push('no usable date field');

  const recommendedAction = (() => {
    if ((analysis.analysisConfidence || 0) < 45) {
      return 'Use this as a data-quality profile only; add clearer date, segment, and business measure columns for decision analysis.';
    }
    if (!analysis.businessMeasure || !analysis.firstCategory) {
      return 'Add or rename business measure and segment columns before using the result for decisions.';
    }
    if (analysis.qualityScore < 65) {
      return 'Clean the quality blockers first, then rerun analysis before planning.';
    }
    if (trendDirection === 'down') {
      return 'Investigate the latest drop and compare weak segments before scaling effort.';
    }
    if (segment.topShare >= 50) {
      return 'Review dependency on the top segment and check if growth is concentrated too heavily.';
    }
    return 'Use the top and weak segment comparison to prioritize dashboard follow-up.';
  })();

  return {
    headline: segment.top
      ? `${segment.top.label} leads ${analysis.businessMeasure} with ${formatCompactNumber(segment.top.value)}.`
      : 'No reliable business driver detected yet.',
    weakArea: segment.bottom
      ? `${segment.bottom.label} is lowest at ${formatCompactNumber(segment.bottom.value)}.`
      : 'Weak area needs more segment data.',
    concentration: segment.top
      ? `${segment.top.label} contributes ${segment.topShare}% of visible value.`
      : 'No concentration signal available.',
    trend: monthly
      ? `${monthly.latestMonth} is ${formatCompactNumber(monthly.latestValue)}${monthly.momChange === null ? '' : ` (${monthly.momChange >= 0 ? '+' : ''}${monthly.momChange.toFixed(1)}% MoM)`}.`
      : 'Trend needs one date column and one numeric measure.',
    quality: qualityBlockers.length ? qualityBlockers.join(', ') : 'No major quality blocker found.',
    recommendedAction,
  };
}

function analyzeDataset(dataset, cleaned) {
  const usableRecords = cleaned.cleanedRecords.filter(record => record.__usable);
  const analysisHeaders = cleaned.analysisHeaders || dataset.headers;
  const numericColumns = analysisHeaders.filter(header =>
    cleaned.types[header] === 'number' && !isIdentifierColumn(header, usableRecords)
  );
  const rawCategoryColumns = analysisHeaders.filter(header => cleaned.types[header] === 'category');
  const categoryColumns = rawCategoryColumns.filter(header => isUsefulCategoryColumn(header, usableRecords));
  const dateColumns = analysisHeaders.filter(header => cleaned.types[header] === 'date');
  const firstNumeric = numericColumns[0];
  const firstCategory = chooseCategoryColumn(rawCategoryColumns, usableRecords);
  const businessMeasure = chooseBusinessMeasure(numericColumns);
  let topRelationship = '-';
  let chartData = [];
  let modelResult = { forecast: null, slope: 0, confidence: 0 };
  let anomalies = [];
  const monthlyKpis = buildMonthlyKpis(usableRecords, dateColumns[0], businessMeasure);
  const segmentStats = buildSegmentStats(usableRecords, firstCategory, businessMeasure);
  const missingColumnSummary = buildMissingColumnSummary(dataset.records, dataset.headers);

  if (numericColumns.length >= 2) {
    const relationships = [];
    for (let i = 0; i < numericColumns.length; i += 1) {
      for (let j = i + 1; j < numericColumns.length; j += 1) {
        const left = numericColumns[i];
        const right = numericColumns[j];
        relationships.push({
          label: `${left} vs ${right}`,
          score: Math.abs(correlation(
            usableRecords.map(record => record[left]),
            usableRecords.map(record => record[right]),
          )),
        });
      }
    }
    const strongest = relationships.sort((a, b) => b.score - a.score)[0];
    if (strongest) topRelationship = `${strongest.label} (${strongest.score.toFixed(2)})`;
  }

  if (firstCategory && businessMeasure) {
    chartData = segmentStats.items
      .slice(0, 6)
      .map(item => ({ label: item.label, value: item.value }));
    if (topRelationship === '-') topRelationship = `${firstCategory} by ${businessMeasure}`;
  }

  if (businessMeasure) {
    const numericValues = usableRecords
      .map(record => record[businessMeasure])
      .filter(value => Number.isFinite(value));
    modelResult = linearRegression(numericValues);
    anomalies = detectAnomalies(numericValues);
  }

  const totalMissingCells = cleaned.missingCount;
  const totalCells = Math.max(1, dataset.records.length * dataset.headers.length);
  const completeness = Math.round(((totalCells - totalMissingCells) / totalCells) * 100);
  const duplicateRate = Math.round((cleaned.duplicateCount / Math.max(1, dataset.records.length)) * 100);
  const qualityScore = Math.max(0, Math.round(
    100 - ((cleaned.duplicateCount + totalMissingCells) / Math.max(1, dataset.records.length + dataset.headers.length)) * 35,
  ));
  const modelReadyScore = Math.round(
    Math.min(1, numericColumns.length / 2) * 35 +
    Math.min(1, categoryColumns.length) * 25 +
    Math.min(1, usableRecords.length / 10) * 25 +
    Math.min(1, completeness / 100) * 15,
  );
  const decisionReadinessScore = Math.round((qualityScore * .45) + (modelReadyScore * .35) + ((100 - duplicateRate) * .2));
  const analysisConfidence = Math.round(
    Math.min(1, usableRecords.length / 20) * 25 +
    Math.min(1, numericColumns.length / 2) * 25 +
    Math.min(1, categoryColumns.length) * 20 +
    Math.min(1, dateColumns.length) * 15 +
    Math.min(1, qualityScore / 100) * 15,
  );
  const decisionSummary = buildDecisionSummary({
    analysisConfidence,
    businessMeasure,
    dateColumns,
    firstCategory,
    monthlyKpis,
    qualityScore,
    segmentStats,
  }, cleaned);

  return {
    chartData,
    dateColumns,
    firstCategory,
    firstNumeric,
    businessMeasure,
    numericColumns,
    categoryColumns,
    qualityScore,
    topRelationship,
    usableRecords,
    modelResult,
    anomalies,
    completeness,
    duplicateRate,
    modelReadyScore,
    decisionReadinessScore,
    analysisConfidence,
    monthlyKpis,
    segmentStats,
    missingColumnSummary,
    decisionSummary,
  };
}

function drawDashboard(chartData) {
  const topItem = chartData[0];
  const totalValue = chartData.reduce((total, item) => total + item.value, 0);
  if (dashboardChartTitle) dashboardChartTitle.textContent = topItem ? `${topItem.label} leads the dataset` : 'Top categories by selected value';
  if (dashboardChartSummary) {
    dashboardChartSummary.textContent = topItem
      ? `${topItem.label} contributes ${Math.round((topItem.value / Math.max(totalValue, 1)) * 100)}% of the visible chart total.`
      : 'Upload data with at least one category and one numeric field to build charts.';
  }
  if (chartTopSegment) chartTopSegment.textContent = topItem ? topItem.label : '--';
  if (chartVisibleTotal) chartVisibleTotal.textContent = chartData.length ? formatCompactNumber(totalValue) : '--';
  if (chartKpiTotal) chartKpiTotal.textContent = chartData.length ? formatCompactNumber(totalValue) : '--';
  if (chartKpiAverage) chartKpiAverage.textContent = chartData.length ? formatCompactNumber(totalValue / chartData.length) : '--';
  if (chartKpiShare) {
    chartKpiShare.textContent = topItem
      ? `${Math.round((topItem.value / Math.max(totalValue, 1)) * 100)}%`
      : '--';
  }

  if (dashboardBars) {
    const maxValue = Math.max(...chartData.map(item => item.value), 1);
    dashboardBars.innerHTML = chartData.length
      ? chartData.map((item, index) => `
        <div class="dashboard-bar-row">
          <span><b>${index + 1}</b>${escapeHtml(item.label.slice(0, 16))}</span>
          <div class="dashboard-bar-track">
            <div class="dashboard-bar-fill" style="--bar-index:${index};width:${Math.max(4, (item.value / maxValue) * 100)}%"></div>
          </div>
          <strong>${formatCompactNumber(item.value)}</strong>
        </div>
      `).join('')
      : '<div class="dashboard-empty-state">Charts appear after upload.</div>';
  }

  if (!dashboardCanvas) return;

  const { context, width, height } = prepareCanvas(dashboardCanvas);
  const padding = 42;
  const chartBottom = height - 42;
  const chartTop = 54;
  const chartHeight = chartBottom - chartTop;
  const maxValue = Math.max(...chartData.map(item => item.value), 1);

  context.clearRect(0, 0, width, height);
  const backgroundGradient = context.createLinearGradient(0, 0, width, height);
  backgroundGradient.addColorStop(0, 'rgba(15,23,42,.96)');
  backgroundGradient.addColorStop(.5, 'rgba(8,47,73,.72)');
  backgroundGradient.addColorStop(1, 'rgba(2,6,23,.98)');
  context.fillStyle = backgroundGradient;
  roundedRect(context, 0, 0, width, height, 18);
  context.fill();

  context.fillStyle = '#e2e8f0';
  context.font = '700 15px Segoe UI, sans-serif';
  context.fillText(chartData.length ? 'Segment Performance' : 'Upload data to build chart', padding, 28);
  context.fillStyle = '#94a3b8';
  context.font = '12px Segoe UI, sans-serif';
  context.fillText(chartData.length ? 'Auto-selected category vs business measure' : 'Category and numeric columns are required', padding, 46);

  context.strokeStyle = 'rgba(148,163,184,.16)';
  context.lineWidth = 1;
  for (let line = 0; line <= 4; line += 1) {
    const y = chartTop + (chartHeight / 4) * line;
    context.beginPath();
    context.moveTo(padding, y);
    context.lineTo(width - padding, y);
    context.stroke();
    context.fillStyle = '#64748b';
    context.font = '10px Segoe UI, sans-serif';
    context.textAlign = 'right';
    context.fillText(formatCompactNumber(maxValue - ((maxValue / 4) * line)), padding - 8, y + 3);
  }

  if (!chartData.length) {
    context.textAlign = 'start';
    return;
  }

  const barGap = 16;
  const barWidth = Math.min(54, (width - padding * 2 - barGap * (chartData.length - 1)) / chartData.length);
  const totalBarsWidth = barWidth * chartData.length + barGap * (chartData.length - 1);
  const startX = (width - totalBarsWidth) / 2;
  const trendPoints = [];

  chartData.forEach((item, index) => {
    const barHeight = Math.max(8, (chartHeight * item.value) / maxValue);
    const x = startX + index * (barWidth + barGap);
    const y = chartBottom - barHeight;
    const gradient = context.createLinearGradient(0, y, 0, height - padding);
    gradient.addColorStop(0, index % 2 ? '#a7f3d0' : '#38bdf8');
    gradient.addColorStop(.55, index % 2 ? '#10b981' : '#2563eb');
    gradient.addColorStop(1, '#0f172a');

    context.shadowColor = 'rgba(34,211,238,.28)';
    context.shadowBlur = 16;
    context.fillStyle = gradient;
    roundedRect(context, x, y, barWidth, barHeight, 12);
    context.fill();
    context.shadowBlur = 0;

    context.fillStyle = '#94a3b8';
    context.font = '11px Segoe UI, sans-serif';
    context.textAlign = 'center';
    context.fillText(item.label.slice(0, 9), x + barWidth / 2, height - 16);

    context.fillStyle = '#e2e8f0';
    context.font = '700 11px Segoe UI, sans-serif';
    context.fillText(formatCompactNumber(item.value), x + barWidth / 2, Math.max(68, y - 8));
    trendPoints.push({ x: x + barWidth / 2, y });
  });

  context.beginPath();
  trendPoints.forEach((point, index) => {
    if (index === 0) context.moveTo(point.x, point.y - 10);
    else context.lineTo(point.x, point.y - 10);
  });
  context.strokeStyle = '#facc15';
  context.lineWidth = 3;
  context.stroke();

  trendPoints.forEach(point => {
    context.beginPath();
    context.arc(point.x, point.y - 10, 4, 0, Math.PI * 2);
    context.fillStyle = '#facc15';
    context.fill();
    context.strokeStyle = 'rgba(250,204,21,.35)';
    context.lineWidth = 6;
    context.stroke();
  });

  context.textAlign = 'start';
}

function clearMiniChart(canvas, title) {
  if (!canvas) return null;

  const { context, width, height } = prepareCanvas(canvas);
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#020617';
  roundedRect(context, 0, 0, width, height, 14);
  context.fill();
  context.fillStyle = '#94a3b8';
  context.font = '700 12px Segoe UI, sans-serif';
  context.fillText(title, 18, 24);
  return context;
}

function drawSegmentShareChart(chartData) {
  const context = clearMiniChart(segmentShareChart, 'Top segment share');
  if (!context) return;

  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const topItem = chartData[0];
  if (!topItem || !total) {
    if (segmentShareSummary) segmentShareSummary.textContent = 'Needs a category and numeric field.';
    context.fillStyle = '#64748b';
    context.fillText('No segment chart yet', 18, 96);
    return;
  }

  const chartWidth = canvasLogicalWidth(segmentShareChart);
  const centerX = chartWidth / 2;
  const centerY = 104;
  const radius = 54;
  const colors = ['#38bdf8', '#22c55e', '#facc15', '#60a5fa', '#a7f3d0', '#94a3b8'];
  let startAngle = -Math.PI / 2;

  chartData.forEach((item, index) => {
    const angle = (item.value / total) * Math.PI * 2;
    context.beginPath();
    context.moveTo(centerX, centerY);
    context.arc(centerX, centerY, radius, startAngle, startAngle + angle);
    context.closePath();
    context.fillStyle = colors[index % colors.length];
    context.fill();
    startAngle += angle;
  });

  context.beginPath();
  context.arc(centerX, centerY, 30, 0, Math.PI * 2);
  context.fillStyle = '#020617';
  context.fill();

  const topShare = Math.round((topItem.value / total) * 100);
  context.fillStyle = '#e2e8f0';
  context.font = '800 22px Segoe UI, sans-serif';
  context.textAlign = 'center';
  context.fillText(`${topShare}%`, centerX, centerY + 7);
  context.textAlign = 'start';
  if (segmentShareSummary) segmentShareSummary.textContent = `${topItem.label} is ${topShare}% of visible value.`;
}

function drawQualityGauge(analysis) {
  const context = clearMiniChart(qualityGaugeChart, 'Quality score');
  if (!context) return;

  const score = Math.max(0, Math.min(100, analysis.qualityScore || 0));
  const chartWidth = canvasLogicalWidth(qualityGaugeChart);
  const centerX = chartWidth / 2;
  const centerY = 128;
  const radius = 64;
  const startAngle = Math.PI;
  const endAngle = Math.PI * 2;
  const scoreAngle = startAngle + (score / 100) * Math.PI;

  context.lineWidth = 16;
  context.beginPath();
  context.arc(centerX, centerY, radius, startAngle, endAngle);
  context.strokeStyle = 'rgba(148,163,184,.22)';
  context.stroke();

  context.beginPath();
  context.arc(centerX, centerY, radius, startAngle, scoreAngle);
  context.strokeStyle = score >= 80 ? '#22c55e' : score >= 60 ? '#facc15' : '#f97316';
  context.stroke();

  context.fillStyle = '#e2e8f0';
  context.font = '800 28px Segoe UI, sans-serif';
  context.textAlign = 'center';
  context.fillText(`${score}`, centerX, centerY - 8);
  context.fillStyle = '#94a3b8';
  context.font = '12px Segoe UI, sans-serif';
  context.fillText('out of 100', centerX, centerY + 14);
  context.textAlign = 'start';
  if (qualityGaugeSummary) qualityGaugeSummary.textContent = `${analysis.completeness}% complete, ${analysis.duplicateRate}% duplicate rate.`;
}

function drawMonthlyTrendChart(analysis) {
  const context = clearMiniChart(monthlyTrendChart, 'Monthly trend');
  if (!context) return;

  const points = analysis.monthlyKpis?.monthlyTotals || [];
  if (points.length < 2) {
    if (monthlyTrendSummary) monthlyTrendSummary.textContent = 'Needs a date column and multiple months.';
    context.fillStyle = '#64748b';
    context.fillText('No monthly trend yet', 18, 96);
    return;
  }

  const values = points.map(point => point.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const left = 26;
  const chartWidth = canvasLogicalWidth(monthlyTrendChart);
  const chartHeight = canvasLogicalHeight(monthlyTrendChart);
  const right = chartWidth - 20;
  const top = 42;
  const bottom = chartHeight - 34;
  const range = Math.max(1, maxValue - minValue);

  context.strokeStyle = 'rgba(148,163,184,.16)';
  context.lineWidth = 1;
  for (let index = 0; index < 3; index += 1) {
    const y = top + ((bottom - top) / 2) * index;
    context.beginPath();
    context.moveTo(left, y);
    context.lineTo(right, y);
    context.stroke();
  }

  context.beginPath();
  points.forEach((point, index) => {
    const x = left + ((right - left) / Math.max(1, points.length - 1)) * index;
    const y = bottom - ((point.value - minValue) / range) * (bottom - top);
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.strokeStyle = '#38bdf8';
  context.lineWidth = 3;
  context.stroke();

  points.forEach((point, index) => {
    const x = left + ((right - left) / Math.max(1, points.length - 1)) * index;
    const y = bottom - ((point.value - minValue) / range) * (bottom - top);
    context.beginPath();
    context.arc(x, y, 4, 0, Math.PI * 2);
    context.fillStyle = '#a7f3d0';
    context.fill();
  });

  if (monthlyTrendSummary) {
    const latest = points[points.length - 1];
    monthlyTrendSummary.textContent = `${latest.month}: ${formatCompactNumber(latest.value)} latest value.`;
  }
}

function drawComparisonBarChart(canvas, data, title, emptyText) {
  if (!canvas) return;

  const { context, width, height } = prepareCanvas(canvas);
  const left = 44;
  const right = width - 22;
  const top = 42;
  const bottom = height - 42;
  const chartHeight = bottom - top;
  const maxValue = Math.max(...data.map(item => item.value), 1);

  context.clearRect(0, 0, width, height);
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, 'rgba(2,6,23,.98)');
  gradient.addColorStop(1, 'rgba(15,23,42,.94)');
  context.fillStyle = gradient;
  roundedRect(context, 0, 0, width, height, 14);
  context.fill();

  context.fillStyle = '#e2e8f0';
  context.font = '800 14px Segoe UI, sans-serif';
  context.fillText(title, 18, 24);

  context.strokeStyle = 'rgba(148,163,184,.16)';
  context.lineWidth = 1;
  for (let line = 0; line <= 3; line += 1) {
    const y = top + (chartHeight / 3) * line;
    context.beginPath();
    context.moveTo(left, y);
    context.lineTo(right, y);
    context.stroke();
  }

  if (!data.length) {
    context.fillStyle = '#64748b';
    context.font = '13px Segoe UI, sans-serif';
    context.fillText(emptyText, 18, height / 2);
    return;
  }

  const gap = Math.max(10, Math.min(18, (right - left) / Math.max(data.length, 1) * .12));
  const barWidth = Math.max(16, Math.min(48, ((right - left) - gap * (data.length - 1)) / data.length));
  const totalWidth = barWidth * data.length + gap * (data.length - 1);
  const startX = left + ((right - left) - totalWidth) / 2;

  data.forEach((item, index) => {
    const barHeight = Math.max(8, (item.value / maxValue) * chartHeight);
    const x = startX + index * (barWidth + gap);
    const y = bottom - barHeight;
    const fill = context.createLinearGradient(0, y, 0, bottom);
    fill.addColorStop(0, index % 2 ? '#22c55e' : '#38bdf8');
    fill.addColorStop(1, index % 2 ? '#064e3b' : '#1d4ed8');

    context.fillStyle = fill;
    roundedRect(context, x, y, barWidth, barHeight, 9);
    context.fill();

    context.fillStyle = '#cbd5e1';
    context.font = '10px Segoe UI, sans-serif';
    context.textAlign = 'center';
    context.fillText(String(item.label).slice(0, 10), x + barWidth / 2, height - 16);

    context.fillStyle = '#f8fafc';
    context.font = '700 10px Segoe UI, sans-serif';
    context.fillText(formatCompactNumber(item.value), x + barWidth / 2, Math.max(38, y - 7));
  });

  context.textAlign = 'start';
}

function drawTrendAreaChart(canvas, data, title, emptyText) {
  if (!canvas) return;

  const { context, width, height } = prepareCanvas(canvas);
  const left = 44;
  const right = width - 24;
  const top = 44;
  const bottom = height - 42;
  const chartHeight = bottom - top;
  const values = data.map(item => item.value);
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = Math.max(1, maxValue - minValue);

  context.clearRect(0, 0, width, height);
  const background = context.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, 'rgba(2,6,23,.98)');
  background.addColorStop(1, 'rgba(8,47,73,.78)');
  context.fillStyle = background;
  roundedRect(context, 0, 0, width, height, 14);
  context.fill();

  context.fillStyle = '#e2e8f0';
  context.font = '800 14px Segoe UI, sans-serif';
  context.fillText(title, 18, 24);

  context.strokeStyle = 'rgba(148,163,184,.16)';
  context.lineWidth = 1;
  for (let line = 0; line <= 3; line += 1) {
    const y = top + (chartHeight / 3) * line;
    context.beginPath();
    context.moveTo(left, y);
    context.lineTo(right, y);
    context.stroke();
  }

  if (data.length < 2) {
    context.fillStyle = '#64748b';
    context.font = '13px Segoe UI, sans-serif';
    context.fillText(emptyText, 18, height / 2);
    return;
  }

  const points = data.map((item, index) => {
    const x = left + ((right - left) / Math.max(1, data.length - 1)) * index;
    const y = bottom - ((item.value - minValue) / range) * chartHeight;
    return { ...item, x, y };
  });

  const fill = context.createLinearGradient(0, top, 0, bottom);
  fill.addColorStop(0, 'rgba(56,189,248,.34)');
  fill.addColorStop(1, 'rgba(56,189,248,.02)');
  context.beginPath();
  points.forEach((point, index) => {
    if (index === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  });
  context.lineTo(points[points.length - 1].x, bottom);
  context.lineTo(points[0].x, bottom);
  context.closePath();
  context.fillStyle = fill;
  context.fill();

  context.beginPath();
  points.forEach((point, index) => {
    if (index === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  });
  context.strokeStyle = '#38bdf8';
  context.lineWidth = 3;
  context.stroke();

  points.forEach((point, index) => {
    context.beginPath();
    context.arc(point.x, point.y, index === points.length - 1 ? 5 : 4, 0, Math.PI * 2);
    context.fillStyle = index === points.length - 1 ? '#facc15' : '#a7f3d0';
    context.fill();
  });

  const first = points[0];
  const latest = points[points.length - 1];
  context.fillStyle = '#cbd5e1';
  context.font = '10px Segoe UI, sans-serif';
  context.textAlign = 'center';
  context.fillText(first.label, first.x, height - 16);
  context.fillText(latest.label, latest.x, height - 16);
  context.fillStyle = '#f8fafc';
  context.font = '800 11px Segoe UI, sans-serif';
  context.fillText(formatCompactNumber(latest.value), latest.x, Math.max(38, latest.y - 9));
  context.textAlign = 'start';
}

function updateCompareControls(analysis) {
  const selectedMeasure = compareMeasureSelect?.value && analysis.numericColumns.includes(compareMeasureSelect.value)
    ? compareMeasureSelect.value
    : analysis.businessMeasure;
  const selectedCategory = compareCategorySelect?.value && analysis.categoryColumns.includes(compareCategorySelect.value)
    ? compareCategorySelect.value
    : analysis.firstCategory;
  const selectedYear = compareYearSelect?.value || 'all';
  const baseComparison = buildComparisonData(
    analysis.usableRecords,
    analysis.dateColumns[0],
    selectedCategory,
    selectedMeasure,
    'all',
  );
  const yearOptions = ['all', ...baseComparison.availableYears.filter(year => year !== 'No date')];
  const safeYear = yearOptions.includes(selectedYear) ? selectedYear : 'all';
  const comparison = buildComparisonData(
    analysis.usableRecords,
    analysis.dateColumns[0],
    selectedCategory,
    selectedMeasure,
    safeYear,
  );

  setSelectOptions(compareMeasureSelect, analysis.numericColumns, selectedMeasure, 'No measure');
  setSelectOptions(compareCategorySelect, analysis.categoryColumns, selectedCategory, 'No segment');
  setSelectOptions(compareYearSelect, yearOptions, safeYear, 'No year');

  const trendSummary = summarizeTrendData(comparison.periodData);

  if (compareChartTitle) {
    compareChartTitle.textContent = selectedMeasure && selectedCategory
      ? `${formatDropdownLabel(selectedMeasure)} trend and ${formatDropdownLabel(selectedCategory)} mix`
      : 'Trend and segment analysis';
  }
  if (compareChartSummary) {
    compareChartSummary.textContent = selectedMeasure && selectedCategory
      ? `Comparing ${analysis.usableRecords.length} clean rows. Use filters to inspect business movement.`
      : 'Needs at least one numeric measure and one category field.';
  }

  drawTrendAreaChart(
    yearComparisonChart,
    comparison.periodData,
    'Period trend',
    'Needs a usable date column',
  );
  drawComparisonBarChart(
    segmentComparisonChart,
    comparison.segmentData,
    safeYear === 'all' ? 'Segment comparison' : `Segment comparison ${safeYear}`,
    'Needs a category and measure',
  );

  if (yearComparisonSummary) {
    yearComparisonSummary.textContent = trendSummary.best
      ? `${trendSummary.movementText}. Best period: ${trendSummary.best.label}.`
      : 'No period trend available.';
  }
  if (segmentComparisonSummary) {
    const bestSegment = comparison.segmentData[0];
    segmentComparisonSummary.textContent = bestSegment
      ? `${bestSegment.label} leads with ${formatCompactNumber(bestSegment.value)}.`
      : 'No segment comparison available.';
  }
  if (compareBestPeriod) compareBestPeriod.textContent = trendSummary.best ? `${trendSummary.best.label}: ${formatCompactNumber(trendSummary.best.value)}` : '--';
  if (compareWeakPeriod) compareWeakPeriod.textContent = trendSummary.weakest ? `${trendSummary.weakest.label}: ${formatCompactNumber(trendSummary.weakest.value)}` : '--';
  if (compareGrowthRate) compareGrowthRate.textContent = trendSummary.movementText;
  if (compareFocusNote) {
    const bestSegment = comparison.segmentData[0];
    compareFocusNote.textContent = bestSegment
      ? `Focus on ${bestSegment.label}; it leads the selected view.`
      : 'Select a segment and measure to find focus area.';
  }
}

function refreshComparisonCharts() {
  if (activeAnalysis) updateCompareControls(activeAnalysis);
}

function redrawActiveCharts() {
  if (!activeAnalysis) return;
  drawDashboard(activeAnalysis.chartData);
  drawResultCharts(activeAnalysis);
}

function drawResultCharts(analysis) {
  drawSegmentShareChart(analysis.chartData);
  drawQualityGauge(analysis);
  drawMonthlyTrendChart(analysis);
  updateCompareControls(analysis);
}

function renderInsights(dataset, cleaned, analysis, datasetRelationships = []) {
  rowsMetric.textContent = `${analysis.usableRecords.length}/${dataset.records.length}`;
  columnsMetric.textContent = String(dataset.headers.length);
  relationshipMetric.textContent = analysis.topRelationship;
  if (analysisFiles) analysisFiles.textContent = activeDatasets.length === 1 ? '1 file' : `${activeDatasets.length} files`;
  if (analysisShape) analysisShape.textContent = `${dataset.records.length} x ${dataset.headers.length}`;
  if (analysisChartReady) analysisChartReady.textContent = analysis.chartData.length ? 'Ready' : 'Limited';
  if (aiQualityScore) aiQualityScore.textContent = `Quality: ${analysis.qualityScore}/100 | Confidence: ${analysis.analysisConfidence}/100`;
  if (modelForecast) {
    modelForecast.textContent = analysis.modelResult.forecast === null
      ? 'Not enough data yet'
      : `Next value: ${formatCompactNumber(analysis.modelResult.forecast)}`;
  }
  if (modelAnomalies) {
    modelAnomalies.textContent = analysis.businessMeasure
      ? `Measure: ${analysis.businessMeasure.replace(/_/g, ' ')} | Outliers: ${analysis.anomalies.length}`
      : `Outliers: ${analysis.anomalies.length}`;
  }
  if (modelConfidence) modelConfidence.textContent = `Reliability: ${analysis.modelResult.confidence}%`;
  if (qualityCompleteness) qualityCompleteness.textContent = `${analysis.completeness}%`;
  if (qualityDuplicates) qualityDuplicates.textContent = `${analysis.duplicateRate}%`;
  if (qualityModelReady) qualityModelReady.textContent = `${analysis.modelReadyScore}%`;
  if (decisionReadiness) decisionReadiness.textContent = `Readiness: ${analysis.decisionReadinessScore}/100 | Confidence: ${analysis.analysisConfidence}/100`;
  if (pbiLatestMonth) pbiLatestMonth.textContent = analysis.monthlyKpis?.latestMonth || '--';
  if (pbiMonthlyKpi) pbiMonthlyKpi.textContent = analysis.monthlyKpis ? formatCompactNumber(analysis.monthlyKpis.latestValue) : '--';
  if (pbiMomChange) {
    pbiMomChange.textContent = analysis.monthlyKpis?.momChange === null || !analysis.monthlyKpis
      ? '--'
      : `${analysis.monthlyKpis.momChange >= 0 ? '+' : ''}${analysis.monthlyKpis.momChange.toFixed(1)}%`;
  }
  if (pbiAverageMonthly) pbiAverageMonthly.textContent = analysis.monthlyKpis ? formatCompactNumber(analysis.monthlyKpis.average) : '--';
  if (datasetRelationshipCount) datasetRelationshipCount.textContent = `${datasetRelationships.length}`;
  if (datasetRelationshipSummary) {
    if (datasetRelationships.length) {
      const topRelationship = datasetRelationships[0];
      datasetRelationshipSummary.textContent = `${topRelationship.leftDataset} and ${topRelationship.rightDataset} share ${topRelationship.leftHeader} with ${topRelationship.confidence}% value overlap.`;
    } else if (activeDatasets.length > 1) {
      datasetRelationshipSummary.textContent = 'No shared key with matching values was found across the uploaded files.';
    } else {
      datasetRelationshipSummary.textContent = 'Upload multiple data files to detect shared keys and value overlap.';
    }
  }

  const topChartItem = analysis.chartData[0];
  if (decisionOpportunity) {
    decisionOpportunity.textContent = analysis.segmentStats.top
      ? `${analysis.segmentStats.top.label} leads with ${formatCompactNumber(analysis.segmentStats.top.value)} and ${analysis.segmentStats.topShare}% share.`
      : 'Add at least one category and one numeric column to identify a strong segment.';
  }
  if (decisionRisk) {
    decisionRisk.textContent = cleaned.missingCount || cleaned.duplicateCount
      ? `${cleaned.missingCount} blank cells and ${cleaned.duplicateCount} duplicate rows may affect decisions.`
      : 'No major quality blocker found in the free scan.';
  }
  if (decisionAction) {
    decisionAction.textContent = analysis.decisionSummary.recommendedAction;
  }
  if (decisionTopDriver) decisionTopDriver.textContent = analysis.decisionSummary.headline;
  if (decisionWeakArea) decisionWeakArea.textContent = analysis.decisionSummary.weakArea;
  if (decisionTrendSignal) decisionTrendSignal.textContent = analysis.decisionSummary.trend;
  if (decisionNote) decisionNote.textContent = analysis.decisionSummary.concentration;

  const missingColumnsText = analysis.missingColumnSummary.length
    ? `Highest missing columns: ${analysis.missingColumnSummary.map(item => `${item.header} (${item.missing})`).join(', ')}.`
    : 'No column has missing values in the free scan.';
  const segmentRows = analysis.segmentStats.items.slice(0, 3).map((item, index) =>
    `${index + 1}. ${item.label}: ${formatCompactNumber(item.value)}`
  );
  const weakRows = analysis.segmentStats.items.slice(-3).reverse().map((item, index) =>
    `${index + 1}. ${item.label}: ${formatCompactNumber(item.value)}`
  );

  const insights = [
    `Executive finding: ${analysis.decisionSummary.headline}`,
    `Trend signal: ${analysis.decisionSummary.trend}`,
    segmentRows.length
      ? `Top drivers by ${analysis.businessMeasure}: ${segmentRows.join(' | ')}.`
      : 'Top drivers need one segment/category column and one numeric measure.',
    weakRows.length
      ? `Weak areas to review: ${weakRows.join(' | ')}.`
      : 'Weak area detection needs multiple segment values.',
    `Quality blocker: ${analysis.decisionSummary.quality}.`,
    missingColumnsText,
    datasetRelationships.length
      ? `Relationship finding: strongest join candidate is ${datasetRelationships[0].leftHeader} between ${datasetRelationships[0].leftDataset} and ${datasetRelationships[0].rightDataset} with ${datasetRelationships[0].confidence}% overlap.`
      : activeDatasets.length > 1
        ? 'Relationship finding: multiple files were analyzed, but no matching shared-key values were detected.'
        : 'Upload multiple data files together to run cross-dataset relationship analysis.',
    `Decision readiness: ${analysis.decisionReadinessScore}/100 with ${analysis.analysisConfidence}/100 confidence from quality, usable rows, and business-ready fields.`,
    analysis.topRelationship === '-'
      ? 'Relationship inside dataset: not enough numeric/category fields for a useful pattern.'
      : `Relationship inside dataset: ${analysis.topRelationship}.`,
    analysis.businessMeasure
      ? `Outlier check: ${analysis.anomalies.length} possible unusual ${analysis.businessMeasure} values found.`
      : 'The preview needs at least one numeric column to run forecasting and anomaly detection.',
    `Recommended decision: ${analysis.decisionSummary.recommendedAction}`,
  ];

  aiInsights.innerHTML = insights.map(insight => `<li>${escapeHtml(insight)}</li>`).join('');
}

function runAnalysis(dataset = activeDataset, datasets = activeDatasets) {
  if (!dataset.headers.length || !dataset.records.length) {
    updateStatus('No data found');
    return;
  }

  activeDataset = dataset;
  activeDatasets = datasets;
  const cleaned = cleanDataset(dataset);
  const analysis = analyzeDataset(dataset, cleaned);
  const datasetRelationships = detectDatasetRelationships(datasets);
  activeCleaned = cleaned;
  activeAnalysis = analysis;
  activeDatasetRelationships = datasetRelationships;

  renderTable(rawDataHead, rawDataTable, dataset.headers, dataset.records);
  renderTable(cleanDataHead, cleanDataTable, cleaned.analysisHeaders || dataset.headers, cleaned.cleanedRecords, true);
  renderColumnIdentities(dataset, cleaned);
  renderInsights(dataset, cleaned, analysis, datasetRelationships);
  drawDashboard(analysis.chartData);
  drawResultCharts(analysis);

  updateStatus('Preview generated');
  runDemoButton.textContent = 'Analyze Sample';
}

if (rawDataTable && cleanDataTable) {
  renderTable(rawDataHead, rawDataTable, activeDataset.headers, activeDataset.records);
  renderTable(cleanDataHead, cleanDataTable, activeDataset.headers, [], true);
  runAnalysis(activeDataset, activeDatasets);
  setWorkflowStage('upload');

  const resetUploadInput = () => {
    if (csvUpload) csvUpload.value = '';
  };

  runDemoButton.addEventListener('click', () => {
    activeDatasets = [sampleDataset];
    runAnalysis(sampleDataset, activeDatasets);
    updateStatus('Sample preview generated');
    setWorkflowStage('clean');
  });
  csvUpload?.addEventListener('change', async event => {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      resetUploadInput();
      return;
    }

    updateStatus('Reading data files');
    if (analysisFiles) analysisFiles.textContent = files.length === 1 ? 'Reading 1 file' : `Reading ${files.length} files`;
    if (analysisShape) analysisShape.textContent = 'Working...';
    if (analysisChartReady) analysisChartReady.textContent = 'Preparing';

    try {
      await showAnalysisLoading(
        'Reading data',
        files.length === 1
          ? `Reading ${files[0].name}. Large files are sampled for browser preview.`
          : `Reading ${files.length} files. Large files are sampled for browser preview.`,
      );
      const uploadedDatasets = (await Promise.all(files.map(readDataFile)))
        .filter(dataset => dataset.headers.length && dataset.records.length);

      if (!uploadedDatasets.length) {
        updateStatus('No data found');
        resetUploadInput();
        hideAnalysisLoading();
        return;
      }

      if (analysisLoadingTitle) analysisLoadingTitle.textContent = 'Building preview';
      if (analysisLoadingDetail) analysisLoadingDetail.textContent = 'Cleaning rows, detecting columns, and preparing charts.';
      await nextFrame();

      const combinedDataset = combineDatasets(uploadedDatasets);
      runAnalysis(combinedDataset, uploadedDatasets);
      updateStatus(uploadedDatasets.length === 1
        ? `Previewed ${uploadedDatasets[0].name}`
        : `Previewed ${uploadedDatasets.length} datasets`);
      setWorkflowStage('clean');
      resetUploadInput();
      hideAnalysisLoading();
    } catch (error) {
      updateStatus('Could not generate preview');
      resetUploadInput();
      hideAnalysisLoading();
    }
  });

  workflowButtons.forEach(button => {
    button.addEventListener('click', () => {
      const stage = button.dataset.stageButton || 'upload';
      setWorkflowStage(stage);
      if (stage === 'chart') {
        window.requestAnimationFrame(redrawActiveCharts);
      }
      if (stage === 'upload') {
        resetUploadInput();
        csvUpload?.click();
      }
    });
  });

  [compareYearSelect, compareMeasureSelect, compareCategorySelect].forEach(select => {
    select?.addEventListener('change', refreshComparisonCharts);
  });

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(redrawActiveCharts, 120);
  });
}
