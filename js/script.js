const form = document.querySelector('.contact-form');
const tableBody = document.querySelector('#submissions-table tbody');
const status = document.querySelector('#submission-status');
const clearButton = document.querySelector('#clear-submissions');

const API_URL = 'http://localhost:8000/api/project-requests';
const STORAGE_KEY = 'visitorProjectRequests';
const USE_API = false;

function getSubmissions() {
  if (USE_API) {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Local storage read error:', error);
    return [];
  }
}

function saveSubmissions(submissions) {
  if (!USE_API) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
  }
}

async function fetchFromAPI() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Failed to fetch submissions');
    return await response.json();
  } catch (error) {
    console.error('API fetch error:', error);
    return [];
  }
}

function renderSubmissions(submissions) {
  if (!tableBody) return;

  tableBody.innerHTML = '';

  if (!submissions || submissions.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="4">No project requests yet.</td>';
    tableBody.appendChild(row);
    return;
  }

  submissions.forEach(item => {
    const projectType = item.project_type || item.projectType || 'Unknown';
    const message = item.message || item.Message || '';
    const messageText = message.length > 50 ? message.substring(0, 50) + '...' : message;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.name || 'Anonymous'}</td>
      <td>${projectType}</td>
      <td>${item.timeline || '-'}</td>
      <td>${messageText}</td>
    `;
    tableBody.appendChild(row);
  });
}

function showStatus(message, type = 'info') {
  if (!status) return;

  status.textContent = message;
  status.hidden = false;
  status.classList.remove('status-success', 'status-error', 'status-info');
  status.classList.add(`status-${type}`);

  clearTimeout(showStatus.timeoutId);
  showStatus.timeoutId = setTimeout(() => {
    status.hidden = true;
  }, 6000);
}

async function submitToAPI(submission) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: submission.name,
        email: submission.email,
        project_type: submission.projectType,
        message: submission.message,
        timeline: submission.timeline || null,
        budget: submission.budget || null,
      }),
    });

    if (!response.ok) throw new Error('Failed to save request');
    return await response.json();
  } catch (error) {
    console.error('API submission error:', error);
    return null;
  }
}

if (form) {
  form.addEventListener('submit', async event => {
    event.preventDefault();

    const formData = new FormData(form);
    const submission = {
      name: formData.get('name'),
      email: formData.get('email'),
      projectType: formData.get('project-type'),
      message: formData.get('message'),
      timeline: formData.get('timeline'),
      budget: formData.get('budget'),
      submittedAt: new Date().toISOString(),
    };

    if (USE_API) {
      const result = await submitToAPI(submission);
      if (result) {
        const submissions = await fetchFromAPI();
        renderSubmissions(submissions);
        showStatus('Project request saved to the database. Thanks! Your request is visible below.', 'success');
      } else {
        showStatus('Unable to reach the backend. Your request was not saved to the database.', 'error');
      }
    } else {
      const submissions = getSubmissions();
      submissions.unshift(submission);
      saveSubmissions(submissions);
      renderSubmissions(submissions);
      showStatus('Project request saved locally. Great! Your request appears below.', 'success');
    }

    form.reset();
  });
}

if (clearButton) {
  clearButton.addEventListener('click', async () => {
    if (USE_API) {
      showStatus('Clear via API not implemented. Refresh to see latest from database.');
    } else {
      localStorage.removeItem(STORAGE_KEY);
      renderSubmissions([]);
      showStatus('Stored project requests cleared.');
    }
  });
}

async function initializeTable() {
  if (USE_API) {
    const submissions = await fetchFromAPI();
    renderSubmissions(submissions);
  } else {
    const submissions = getSubmissions();
    renderSubmissions(submissions);
  }
}

initializeTable();
