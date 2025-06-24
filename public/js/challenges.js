console.log('Challenges script loaded');

const editors = {};

async function loadChallenges() {
    console.log(`Loading challenges for ${topic}`);
    const challengeList = document.getElementById('challenge-list');
    challengeList.innerHTML = '<li>Loading...</li>';
    try {
        const response = await fetch(`/api/questions/challenges/data/${topic}`, {
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });
        console.log('Challenges response status:', response.status, 'URL:', `/api/questions/challenges/data/${topic}`);
        if (!response.ok) {
            if (response.status === 401) {
                challengeList.innerHTML = '<li>Please log in to view challenges</li>';
                return;
            }
            if (response.status === 404) {
                challengeList.innerHTML = '<li>Challenges endpoint not found. Please check server routes.</li>';
                console.error('404 Error: Check if /api/questions/challenges/data/:topic is defined');
                return;
            }
            throw new Error('Failed to fetch challenges');
        }
        const challenges = await response.json();
        console.log('Challenges fetched:', challenges);
        challengeList.innerHTML = '';
        if (challenges.length === 0) {
            challengeList.innerHTML = '<li>No challenges found for this topic</li>';
            return;
        }

        const sections = {};
        challenges.forEach(c => {
            if (!sections[c.section]) sections[c.section] = [];
            sections[c.section].push(c);
        });

        Object.keys(sections).sort((a, b) => a - b).forEach(section => {
            const sectionDiv = document.createElement('div');
            sectionDiv.innerHTML = `<h4>Section ${section}: ${section == 1 ? 'Basics' : section == 2 ? 'Intermediate' : section == 3 ? 'Advanced' : section == 4 ? 'Expert' : 'Master'}</h4>`;
            const ul = document.createElement('ul');
            sections[section].forEach((c, index) => {
                const isCompleted = c.completedBy.includes(getUserId());
                const globalIndex = `${section}-${index}`;
                li.innerHTML = `
                    <div class="question-header">
                        <span onclick="toggleChallenge(${globalIndex})">${c.title}</span>
                        <input type="checkbox" id="complete-${c._id}" ${isCompleted ? 'checked' : ''} onchange="markCompleted('${c._id}')">
                        <label for="complete-${c._id}">Complete</label>
                    </div>
                    <div class="challenge-details" id="challenge-${globalIndex}" style="display: none;">
                        <p>${c.description}</p>
                        <p><strong>Expected Output:</strong> ${c.expectedOutput}</p>
                        <textarea id="code-${globalIndex}">${c.sampleQuery}</textarea>
                        <button onclick="runQuery('${globalIndex}')">Run Query</button>
                        <div id="result-${globalIndex}" class="query-result" style="display: none;"></div>
                        <div id="error-${globalIndex}" class="query-error" style="display: none;"></div>
                    </div>
                `;
                ul.appendChild(li);
                setTimeout(() => {
                    editors[globalIndex] = CodeMirror.fromTextArea(document.getElementById(`code-${globalIndex}`), {
                        mode: 'sql',
                        theme: 'default',
                        lineNumbers: true
                    });
                }, 0);
            });
            sectionDiv.appendChild(ul);
            challengeList.appendChild(sectionDiv);
        });

        await updateProgress(challenges.length);
    } catch (err) {
        console.error('Error fetching challenges:', err.message);
        challengeList.innerHTML = '<li>Error loading challenges: ' + err.message + '</li>';
    }
}

function toggleChallenge(index) {
    console.log(`Toggling challenge ${index}`);
    const challengeDiv = document.getElementById(`challenge-${index}`);
    challengeDiv.style.display = challengeDiv.style.display === 'none' ? 'block' : 'none';
}

async function markCompleted(challengeId) {
    console.log(`Marking challenge ${challengeId} as completed`);
    try {
        const response = await fetch('/api/questions/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ challengeId, topic }),
        });
        if (!response.ok) throw new Error('Failed to mark as completed');
        const data = await response.json();
        document.getElementById('progress-bar').value = data.progress;
        document.getElementById('progress-text').textContent = `Progress: ${Math.round(data.progress)}%`;
    } catch (err) {
        console.error('Error marking completed:', err.message);
        alert('Error marking challenge as completed');
    }
}

function runQuery(index) {
    console.log(`Running query ${index}`);
    const query = editors[index].getValue();
    const resultDiv = document.getElementById(`result-${index}`);
    const errorDiv = document.getElementById(`error-${index}`);
    resultDiv.style.display = 'none';
    errorDiv.style.display = 'none';
    try {
        if (query.toLowerCase().includes('select')) {
            resultDiv.textContent = 'Mock Result: Retrieved data successfully';
            resultDiv.style.display = 'block';
        } else {
            throw new Error('Invalid query');
        }
    } catch (err) {
        errorDiv.textContent = `Error: ${err.message}`;
        errorDiv.style.display = 'block';
    }
}

async function updateProgress(totalChallenges) {
    try {
        const response = await fetch(`/api/questions/progress/${topic}`, {
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch progress');
        const data = await response.json();
        document.getElementById('progress-bar').value = data.progress;
        document.getElementById('progress-text').textContent = `Progress: ${Math.round(data.progress)}%`;
    } catch (err) {
        console.error('Error fetching progress:', err.message);
    }
}

// Initialize
loadChallenges();